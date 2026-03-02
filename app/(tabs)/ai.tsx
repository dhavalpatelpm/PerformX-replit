import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useUser, computeBMI } from "@/context/UserContext";
import { useHabits } from "@/context/HabitsContext";
import { getApiUrl } from "@/lib/query-client";

const NEON = "#00E676";

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
};

const QUICK_PROMPTS = [
  "How is my progress today?",
  "Suggest a recovery meal",
  "What is my best streak?",
  "Tips to sleep better",
  "Am I on track this week?",
  "What habit should I add?",
];

function TypingDots() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    const a1 = bounce(d1, 0);
    const a2 = bounce(d2, 160);
    const a3 = bounce(d3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={s.dotsRow}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View key={i} style={[s.dot, { transform: [{ translateY: d }] }]} />
      ))}
    </View>
  );
}

export default function AiScreen() {
  const { colors } = useTheme();
  const { profile } = useUser();
  const { habits, getStreak, todayKey } = useHabits();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const firstName = profile?.name?.split(" ")[0] ?? null;

  const buildContext = useCallback(() => {
    const today = new Date();
    const dayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dateStr = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const todayHabits = habits.filter(h => !h.scheduledDays || h.scheduledDays.includes(dayIdx));
    const completed = todayHabits.filter(h => h.completedDates.includes(todayKey));
    const pct = todayHabits.length > 0 ? Math.round((completed.length / todayHabits.length) * 100) : 0;

    const topStreaks = habits
      .map(h => ({ name: h.name, category: h.category, streak: getStreak(h) }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5);

    const bmi = profile ? computeBMI(profile.weightKg, profile.heightCm) : null;

    return {
      profile: profile
        ? {
            name: profile.name,
            profession: profile.profession,
            age: profile.age,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            bmi: bmi ? `${bmi.value} (${bmi.category})` : "Not set",
          }
        : null,
      todayStats: {
        dayName: dayNames[dayIdx],
        date: dateStr,
        completed: completed.length,
        total: todayHabits.length,
        percentage: pct,
      },
      topStreaks,
      totalHabits: habits.length,
      categories: [...new Set(habits.map(h => h.category))].join(", "),
    };
  }, [habits, profile, todayKey, getStreak]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");

    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", text: trimmed };
    const history = [...messages];
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const url = new URL("/api/ai/chat", getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: history.map(m => ({ role: m.role, text: m.text })),
          context: buildContext(),
        }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: `a_${Date.now()}`,
        role: "ai",
        text: data.reply ?? "I could not generate a response. Please try again.",
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `e_${Date.now()}`, role: "ai", text: "Connection error. Check your internet and try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <View style={s.headerLeft}>
          <View style={s.logoWrap}>
            <Ionicons name="sparkles" size={22} color={NEON} />
          </View>
          <View>
            <Text style={[s.headerTitle, { fontFamily: "Outfit_800ExtraBold" }]}>PerformX AI</Text>
            <Text style={[s.headerSub, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
              Your performance coach
            </Text>
          </View>
        </View>
        {hasMessages && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMessages([]); }}
            style={[s.clearBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Ionicons name="refresh-outline" size={17} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {!hasMessages ? (
          /* ── Empty / Welcome State ── */
          <ScrollView
            contentContainerStyle={s.emptyScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.glowCircle}>
              <Ionicons name="sparkles" size={52} color={NEON} />
            </View>

            <Text style={[s.emptyTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
              Ask me anything
            </Text>
            <Text style={[s.emptySub, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
              {firstName
                ? `I know your habits and stats, ${firstName}.\nLet's optimize your performance.`
                : "Set up your profile to get personalized coaching."}
            </Text>

            {/* Stats snapshot */}
            {(() => {
              const ctx = buildContext();
              const t = ctx.todayStats;
              return (
                <View style={[s.snapshotRow]}>
                  <View style={[s.snapshotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.snapshotVal, { color: NEON, fontFamily: "Outfit_800ExtraBold" }]}>
                      {t.percentage}%
                    </Text>
                    <Text style={[s.snapshotLabel, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
                      Today
                    </Text>
                  </View>
                  <View style={[s.snapshotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.snapshotVal, { color: NEON, fontFamily: "Outfit_800ExtraBold" }]}>
                      {ctx.totalHabits}
                    </Text>
                    <Text style={[s.snapshotLabel, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
                      Habits
                    </Text>
                  </View>
                  <View style={[s.snapshotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.snapshotVal, { color: NEON, fontFamily: "Outfit_800ExtraBold" }]}>
                      {ctx.topStreaks[0]?.streak ?? 0}
                    </Text>
                    <Text style={[s.snapshotLabel, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
                      Best Streak
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Quick prompts */}
            <Text style={[s.promptsLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>
              Try asking
            </Text>
            <View style={s.chipsGrid}>
              {QUICK_PROMPTS.map(p => (
                <Pressable
                  key={p}
                  onPress={() => sendMessage(p)}
                  style={({ pressed }) => [
                    s.chip,
                    { backgroundColor: pressed ? NEON + "25" : NEON + "12", borderColor: NEON + "35" },
                  ]}
                >
                  <Ionicons name="sparkles-outline" size={13} color={NEON} style={{ marginRight: 6 }} />
                  <Text style={[s.chipText, { color: NEON, fontFamily: "Outfit_500Medium" }]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          /* ── Chat Messages ── */
          <FlatList
            data={[...messages].reverse()}
            keyExtractor={m => m.id}
            inverted
            contentContainerStyle={s.messagesList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              isLoading ? (
                <View style={s.aiRow}>
                  <View style={[s.aiAvatar, { backgroundColor: NEON + "20", borderColor: NEON + "40" }]}>
                    <Ionicons name="sparkles" size={13} color={NEON} />
                  </View>
                  <View style={[s.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TypingDots />
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item }) =>
              item.role === "user" ? (
                <View style={s.userRow}>
                  <View style={[s.userBubble]}>
                    <Text style={[s.userText, { fontFamily: "Outfit_500Medium" }]}>{item.text}</Text>
                  </View>
                </View>
              ) : (
                <View style={s.aiRow}>
                  <View style={[s.aiAvatar, { backgroundColor: NEON + "20", borderColor: NEON + "40" }]}>
                    <Ionicons name="sparkles" size={13} color={NEON} />
                  </View>
                  <View style={[s.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.aiText, { color: colors.text, fontFamily: "Outfit_400Regular" }]}>{item.text}</Text>
                  </View>
                </View>
              )
            }
          />
        )}

        {/* Quick chips bar (when chat active) */}
        {hasMessages && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsBarScroll}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_PROMPTS.map(p => (
              <Pressable
                key={p}
                onPress={() => sendMessage(p)}
                style={({ pressed }) => [
                  s.chipBar,
                  { backgroundColor: pressed ? colors.border : colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[s.chipBarText, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={[s.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: botPad + 6 }]}>
          <TextInput
            ref={inputRef}
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, fontFamily: "Outfit_400Regular" }]}
            placeholder="Ask your coach..."
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => sendMessage(input)}
          />
          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            style={({ pressed }) => [
              s.sendBtn,
              {
                backgroundColor: input.trim() && !isLoading ? NEON : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {isLoading ? (
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
            ) : (
              <Ionicons name="send" size={17} color={input.trim() ? "#000" : colors.textSecondary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: NEON + "18",
    borderWidth: 1.5,
    borderColor: NEON + "50",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, color: NEON },
  headerSub: { fontSize: 12, marginTop: 1 },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Empty state */
  emptyScroll: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  glowCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: NEON + "14",
    borderWidth: 1.5,
    borderColor: NEON + "35",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  emptyTitle: { fontSize: 26, marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28 },

  snapshotRow: { flexDirection: "row", gap: 10, marginBottom: 32, width: "100%" },
  snapshotCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  snapshotVal: { fontSize: 22 },
  snapshotLabel: { fontSize: 11, marginTop: 2 },

  promptsLabel: { alignSelf: "flex-start", fontSize: 13, marginBottom: 12 },
  chipsGrid: { width: "100%", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: { fontSize: 13 },

  /* Messages */
  messagesList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },

  userRow: { alignItems: "flex-end" },
  userBubble: {
    backgroundColor: NEON,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 11,
    maxWidth: "80%",
  },
  userText: { color: "#000", fontSize: 14, lineHeight: 21 },

  aiRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aiBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    maxWidth: "80%",
  },
  aiText: { fontSize: 14, lineHeight: 22 },

  typingBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: NEON },

  /* Chips bar */
  chipsBarScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chipBar: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipBarText: { fontSize: 12 },

  /* Input */
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14,
    maxHeight: 110,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
