import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useHabits, Habit, HabitCategory } from "@/context/HabitsContext";

const CATEGORIES: HabitCategory[] = ["Training", "Recovery", "Nutrition", "Mental"];

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Training: "#FF6B35",
  Recovery: "#00B4D8",
  Nutrition: "#00E676",
  Mental: "#B388FF",
};

const CATEGORY_ICONS: Record<HabitCategory, string> = {
  Training: "flame-outline",
  Recovery: "water-outline",
  Nutrition: "leaf-outline",
  Mental: "sparkles-outline",
};

const HABIT_ICONS = [
  "barbell-outline",
  "bicycle-outline",
  "walk-outline",
  "leaf-outline",
  "water-outline",
  "moon-outline",
  "book-outline",
  "heart-outline",
  "flash-outline",
  "body-outline",
  "medkit-outline",
  "trophy-outline",
  "flame-outline",
  "thermometer-outline",
  "bed-outline",
  "nutrition-outline",
  "fitness-outline",
  "stopwatch-outline",
];


function AnimatedHabitRow({ habit }: { habit: Habit }) {
  const { colors } = useTheme();
  const { toggleHabit, getStreak, isCompletedToday } = useHabits();
  const done = isCompletedToday(habit);
  const streak = getStreak(habit);
  const scale = useSharedValue(1);
  const catColor = CATEGORY_COLORS[habit.category];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    toggleHabit(habit.id);
  }, [done, habit.id, toggleHabit]);

  const onPress = useCallback(() => {
    handleToggle();
    scale.value = withSpring(0.94, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
  }, [handleToggle]);

  return (
    <Animated.View style={[animStyle]}>
      <Pressable
        onPress={onPress}
        style={[
          styles.habitRow,
          {
            backgroundColor: colors.card,
            borderColor: done ? catColor + "50" : colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={[styles.habitAccent, { backgroundColor: catColor }]} />
        <View style={[styles.habitIconWrap, { backgroundColor: catColor + "20" }]}>
          <Ionicons
            name={habit.icon as any}
            size={20}
            color={catColor}
          />
        </View>
        <View style={styles.habitInfo}>
          <Text
            style={[
              styles.habitName,
              {
                color: done ? colors.textMuted : colors.text,
                textDecorationLine: done ? "line-through" : "none",
                fontFamily: "Outfit_600SemiBold",
              },
            ]}
          >
            {habit.name}
          </Text>
          <View style={styles.habitMeta}>
            <View style={[styles.catBadge, { backgroundColor: catColor + "20" }]}>
              <Text style={[styles.catBadgeText, { color: catColor, fontFamily: "Outfit_500Medium" }]}>
                {habit.category}
              </Text>
            </View>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color="#FF6B35" />
                <Text style={[styles.streakText, { color: "#FF6B35", fontFamily: "Outfit_700Bold" }]}>
                  {streak}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: done ? catColor : "transparent",
              borderColor: done ? catColor : colors.border,
            },
          ]}
        >
          {done && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AddHabitModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { addHabit } = useHabits();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("Training");
  const [icon, setIcon] = useState("barbell-outline");

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit(name.trim(), category, icon);
    setName("");
    setCategory("Training");
    setIcon("barbell-outline");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
            New Habit
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>
            Habit Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning Run"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, fontFamily: "Outfit_400Regular" },
            ]}
            autoFocus
          />
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Outfit_500Medium", marginTop: 20 }]}>
            Category
          </Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor: category === cat ? CATEGORY_COLORS[cat] + "30" : colors.card,
                    borderColor: category === cat ? CATEGORY_COLORS[cat] : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catBtnText,
                    {
                      color: category === cat ? CATEGORY_COLORS[cat] : colors.textSecondary,
                      fontFamily: "Outfit_600SemiBold",
                    },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Outfit_500Medium", marginTop: 20 }]}>
            Icon
          </Text>
          <View style={styles.iconGrid}>
            {HABIT_ICONS.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: icon === ic ? CATEGORY_COLORS[category] + "30" : colors.card,
                    borderColor: icon === ic ? CATEGORY_COLORS[category] : colors.border,
                  },
                ]}
              >
                <Ionicons name={ic as any} size={22} color={icon === ic ? CATEGORY_COLORS[category] : colors.textSecondary} />
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: CATEGORY_COLORS[category], opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.addBtnText, { fontFamily: "Outfit_700Bold" }]}>Add Habit</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function TodayScreen() {
  const { colors, isDark } = useTheme();
  const { habits, getTodayProgress, isCompletedToday, removeHabit } = useHabits();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | "All">("All");
  const progress = getTodayProgress();
  const completedCount = habits.filter(isCompletedToday).length;

  const filtered = selectedCategory === "All"
    ? habits
    : habits.filter((h) => h.category === selectedCategory);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const handleShare = async () => {
    const lines = habits
      .filter(isCompletedToday)
      .map((h) => `  ${h.name}`)
      .join("\n");
    const msg = `BioHack Daily Check-in\n${new Date().toDateString()}\n\nCompleted ${completedCount}/${habits.length} habits:\n${lines || "  No habits completed yet"}\n\nTracking my gains with BioHack!`;
    try {
      await Share.share({ message: msg });
    } catch {}
  };

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.dayLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>
              {dayName}
            </Text>
            <Text style={[styles.dateLabel, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
              {dateStr}
            </Text>
          </View>
          <Pressable
            onPress={handleShare}
            style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={20} color={colors.tint} />
          </Pressable>
        </View>

        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressLeft}>
            <Text style={[styles.progressTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
              Daily Progress
            </Text>
            <Text style={[styles.progressSub, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
              {completedCount} of {habits.length} habits done
            </Text>
            <View style={[styles.progressBarWrap, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.round(progress * 100)}%` as any,
                    backgroundColor: colors.tint,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPct, { color: colors.tint, fontFamily: "Outfit_800ExtraBold" }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={styles.progressRingWrap}>
            <View style={styles.ringContainer}>
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
                const r = 30;
                const x = 40 + r * Math.cos(angle);
                const y = 40 + r * Math.sin(angle);
                const filled = i < Math.round(progress * 12);
                return (
                  <View
                    key={i}
                    style={{
                      position: "absolute",
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: filled ? colors.tint : colors.border,
                      left: x - 3.5,
                      top: y - 3.5,
                    }}
                  />
                );
              })}
              <Text style={[styles.ringLabel, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
                {completedCount}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catFilterRow}
        >
          {(["All", ...CATEGORIES] as (HabitCategory | "All")[]).map((cat) => {
            const active = selectedCategory === cat;
            const catColor = cat === "All" ? colors.tint : CATEGORY_COLORS[cat];
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? catColor : colors.card,
                    borderColor: active ? catColor : colors.border,
                  },
                ]}
              >
                {cat !== "All" && (
                  <Ionicons
                    name={CATEGORY_ICONS[cat] as any}
                    size={14}
                    color={active ? "#fff" : catColor}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: active ? "#fff" : colors.textSecondary,
                      fontFamily: "Outfit_600SemiBold",
                    },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.habitsList}>
          {filtered.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: "Outfit_500Medium" }]}>
                No habits in this category
              </Text>
            </View>
          ) : (
            filtered.map((habit) => <AnimatedHabitRow key={habit.id} habit={habit} />)
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.fab,
          { bottom: insets.bottom + 76, backgroundColor: colors.tint },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
          style={styles.fabInner}
          hitSlop={8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>

      <AddHabitModal visible={showAddModal} onClose={() => setShowAddModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  dayLabel: { fontSize: 14, marginBottom: 2 },
  dateLabel: { fontSize: 28 },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  progressLeft: { flex: 1 },
  progressTitle: { fontSize: 16, marginBottom: 4 },
  progressSub: { fontSize: 13, marginBottom: 12 },
  progressBarWrap: { height: 6, borderRadius: 3, marginBottom: 8, overflow: "hidden" },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressPct: { fontSize: 22 },
  progressRingWrap: { marginLeft: 16 },
  ringContainer: { width: 80, height: 80, position: "relative", alignItems: "center", justifyContent: "center" },
  ringLabel: { fontSize: 22, zIndex: 1 },
  catFilterRow: { paddingBottom: 16, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13 },
  habitsList: { gap: 10 },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    paddingLeft: 0,
    overflow: "hidden",
  },
  habitAccent: { width: 4, height: "100%", position: "absolute", left: 0, top: 0, bottom: 0 },
  habitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
    marginRight: 12,
  },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 15, marginBottom: 5 },
  habitMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 11 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  streakText: { fontSize: 12 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 20,
    gap: 12,
  },
  emptyText: { fontSize: 15 },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#00E676",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20 },
  modalBody: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  catBtnText: { fontSize: 13 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  addBtnText: { fontSize: 16, color: "#fff" },
});
