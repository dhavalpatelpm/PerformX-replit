import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Share,
  Switch,
  Image,
} from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useHabits, HabitCategory } from "@/context/HabitsContext";
import { useUser } from "@/context/UserContext";

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Training: "#FF6B35",
  Recovery: "#00B4D8",
  Nutrition: "#00E676",
  Mental: "#B388FF",
};

const CATEGORY_ICONS: Record<HabitCategory, string> = {
  Training: "barbell-outline",
  Recovery: "water-outline",
  Nutrition: "leaf-outline",
  Mental: "sparkles-outline",
};

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { mon, sun };
}

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function currentMonthPrefix() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

type HabitWithScores = ReturnType<typeof useHabits>["habits"][0] & {
  dailyStreak: number;
  weeklyCount: number;
  weeklyMax: number;
  monthlyCount: number;
  monthlyMax: number;
  done: boolean;
};

const RANK_COLORS = ["#FFB300", "#9E9E9E", "#FF6B35", "#00E676", "#00B4D8"];
const RANK_LABELS = ["1st", "2nd", "3rd", "4th", "5th"];

function WeeklyTopRow({ item, rank }: { item: HabitWithScores; rank: number }) {
  const { colors } = useTheme();
  const catColor = CATEGORY_COLORS[item.category] ?? "#00E676";
  const rankColor = RANK_COLORS[rank] ?? colors.textMuted;
  const pct = Math.min(item.weeklyCount / item.weeklyMax, 1);

  return (
    <View style={[scStyles.wRow, { borderBottomColor: colors.border }]}>
      <Text style={[scStyles.rankBadge, { color: rankColor, fontFamily: "Outfit_800ExtraBold" }]}>
        {RANK_LABELS[rank]}
      </Text>
      <View style={[scStyles.wIcon, { backgroundColor: catColor + "22" }]}>
        <Ionicons name={item.icon as any} size={18} color={catColor} />
      </View>
      <View style={scStyles.wMid}>
        <View style={scStyles.wNameRow}>
          <Text style={[scStyles.wName, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.done && (
            <Ionicons name="checkmark-circle" size={14} color={catColor} />
          )}
        </View>
        <View style={[scStyles.wBar, { backgroundColor: colors.border }]}>
          <View style={[scStyles.wBarFill, { width: `${pct * 100}%` as any, backgroundColor: catColor }]} />
        </View>
      </View>
      <View style={scStyles.wRight}>
        <View style={scStyles.wStatRow}>
          <Ionicons name="calendar-outline" size={12} color={catColor} />
          <Text style={[scStyles.wCount, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
            {item.weeklyCount}
            <Text style={[scStyles.wMax, { color: colors.textMuted }]}>/{item.weeklyMax}</Text>
          </Text>
        </View>
        <View style={scStyles.wStatRow}>
          <Ionicons name="flame" size={11} color="#FF6B35" />
          <Text style={[scStyles.wStreak, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
            {item.dailyStreak}d
          </Text>
        </View>
      </View>
    </View>
  );
}

function MonthlyTopCard({ item, rank }: { item: HabitWithScores; rank: number }) {
  const { colors } = useTheme();
  const catColor = CATEGORY_COLORS[item.category] ?? "#00E676";
  const rankColor = RANK_COLORS[rank] ?? colors.textMuted;
  const pct = Math.min(item.monthlyCount / item.monthlyMax, 1);
  const pctInt = Math.round(pct * 100);

  return (
    <View style={[scStyles.mCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={[catColor + "15", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={scStyles.mTop}>
        <View style={[scStyles.mIcon, { backgroundColor: catColor + "25" }]}>
          <Ionicons name={item.icon as any} size={22} color={catColor} />
        </View>
        <View style={scStyles.mMeta}>
          <Text style={[scStyles.mName, { color: colors.text, fontFamily: "Outfit_700Bold" }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[scStyles.mCategory, { color: catColor, fontFamily: "Outfit_500Medium" }]}>
            {item.category}
          </Text>
        </View>
        <View style={[scStyles.mRankBadge, { borderColor: rankColor + "60" }]}>
          <Text style={[scStyles.mRankText, { color: rankColor, fontFamily: "Outfit_800ExtraBold" }]}>
            #{rank + 1}
          </Text>
        </View>
      </View>

      <View style={scStyles.mStats}>
        <View style={scStyles.mStatItem}>
          <Ionicons name="stats-chart" size={14} color={catColor} />
          <Text style={[scStyles.mStatNum, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
            {item.monthlyCount}
            <Text style={[scStyles.mStatSub, { color: colors.textMuted }]}>/{item.monthlyMax}</Text>
          </Text>
          <Text style={[scStyles.mStatLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
            this month
          </Text>
        </View>
        <View style={[scStyles.mDivider, { backgroundColor: colors.border }]} />
        <View style={scStyles.mStatItem}>
          <Ionicons name="flame" size={14} color="#FF6B35" />
          <Text style={[scStyles.mStatNum, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
            {item.dailyStreak}
          </Text>
          <Text style={[scStyles.mStatLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
            day streak
          </Text>
        </View>
        <View style={[scStyles.mDivider, { backgroundColor: colors.border }]} />
        <View style={scStyles.mStatItem}>
          <Ionicons name="trending-up" size={14} color={catColor} />
          <Text style={[scStyles.mStatNum, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
            {pctInt}
            <Text style={[scStyles.mStatSub, { color: colors.textMuted }]}>%</Text>
          </Text>
          <Text style={[scStyles.mStatLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
            completion
          </Text>
        </View>
      </View>

      <View style={[scStyles.mBarTrack, { backgroundColor: colors.border }]}>
        <View style={[scStyles.mBarFill, { width: `${pct * 100}%` as any, backgroundColor: catColor }]} />
      </View>
      {item.done && (
        <View style={[scStyles.mDonePill, { backgroundColor: catColor + "22" }]}>
          <Ionicons name="checkmark-circle" size={13} color={catColor} />
          <Text style={[scStyles.mDoneText, { color: catColor, fontFamily: "Outfit_600SemiBold" }]}>
            Done today
          </Text>
        </View>
      )}
    </View>
  );
}

const scStyles = StyleSheet.create({
  wRow:      { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  rankBadge: { fontSize: 12, width: 28, textAlign: "center" },
  wIcon:     { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  wMid:      { flex: 1, gap: 6 },
  wNameRow:  { flexDirection: "row", alignItems: "center", gap: 6 },
  wName:     { flex: 1, fontSize: 13 },
  wBar:      { height: 4, borderRadius: 2, overflow: "hidden" },
  wBarFill:  { height: "100%", borderRadius: 2 },
  wRight:    { alignItems: "flex-end", gap: 2 },
  wStatRow:  { flexDirection: "row", alignItems: "center", gap: 3 },
  wCount:    { fontSize: 14 },
  wMax:      { fontSize: 11 },
  wStreak:   { fontSize: 11 },
  mCard:     { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12, overflow: "hidden", gap: 14 },
  mTop:      { flexDirection: "row", alignItems: "center", gap: 12 },
  mIcon:     { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  mMeta:     { flex: 1, gap: 2 },
  mName:     { fontSize: 15 },
  mCategory: { fontSize: 11 },
  mRankBadge:{ borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  mRankText: { fontSize: 13 },
  mStats:    { flexDirection: "row", alignItems: "center" },
  mStatItem: { flex: 1, alignItems: "center", gap: 3 },
  mStatNum:  { fontSize: 20 },
  mStatSub:  { fontSize: 13 },
  mStatLabel:{ fontSize: 10, textAlign: "center" },
  mDivider:  { width: 1, height: 36 },
  mBarTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  mBarFill:  { height: "100%", borderRadius: 3 },
  mDonePill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  mDoneText: { fontSize: 12 },
});

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { habits, todayKey, getStreak, getTodayProgress, getCompletedDays } = useHabits();
  const { profile, getBMI, getInitials } = useUser();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;
  const bmi = getBMI();

  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotifGranted(status === "granted");
    });
  }, []);

  const [previewCountdown, setPreviewCountdown] = useState(0);

  const handleNotifToggle = useCallback(async () => {
    if (Platform.OS === "web") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notifGranted) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifGranted(status === "granted");
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotifGranted(false);
    }
  }, [notifGranted]);

  const handlePreviewNotif = useCallback(async () => {
    if (Platform.OS === "web") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Find an incomplete habit to use as the sample
    const dow = new Date().getDay();
    const di  = dow === 0 ? 6 : dow - 1;
    const todayStr = new Date().toISOString().split("T")[0];
    const sample = habits.find(
      h => (!h.scheduledDays || h.scheduledDays.includes(di)) && !h.completedDates.includes(todayStr)
    ) ?? habits[0];
    if (!sample) return;

    const catMsgs: Record<string, string> = {
      Training: "Every session you skip is a session your competition doesn't.",
      Recovery: "Recovery is where the real gains happen — don't skip it.",
      Nutrition: "Your body performs exactly as well as you fuel it.",
      Mental:   "A sharp mind is your biggest competitive edge.",
      Personal: "The relationships you build today compound into tomorrow.",
      Work:     "Consistent deep work is the only shortcut that works.",
    };

    const trigger = new Date(Date.now() + 5000);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Still pending — ${sample.name}`,
        body:  `${catMsgs[sample.category] ?? "Stay consistent."} Complete this to push your ${sample.category} rate from 45% to 53%+.`,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });

    // Countdown display
    setPreviewCountdown(5);
    const iv = setInterval(() => {
      setPreviewCountdown(c => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
  }, [habits]);

  const completedDays = getCompletedDays();
  const totalActiveDays = completedDays.size;
  const todayProgress = getTodayProgress();

  const longestStreak = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, getStreak(h)), 0);
  }, [habits]);

  const totalCompletions = useMemo(() => {
    return habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  }, [habits]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    habits.forEach((h) => {
      map[h.category] = (map[h.category] || 0) + h.completedDates.length;
    });
    return map;
  }, [habits]);

  const maxCatCount = Math.max(1, ...Object.values(byCategory));

  const handleShare = async () => {
    const msg = `PerformX Stats\nActive Days: ${totalActiveDays} | Total Completions: ${totalCompletions}\nLongest Streak: ${longestStreak} days\n\nMy habits:\n${habits.map(h => `  ${h.name} — ${getStreak(h)} day streak`).join("\n")}\n\nTracking performance with PerformX!`;
    try { await Share.share({ message: msg }); } catch {}
  };

  const { mon, sun } = useMemo(getWeekBounds, []);
  const monthPfx  = useMemo(currentMonthPrefix, []);
  const monthDays = useMemo(daysInCurrentMonth, []);

  const habitsWithScores: HabitWithScores[] = useMemo(() => {
    return habits.map((h) => {
      const dailyStreak  = getStreak(h);
      const done         = h.completedDates.includes(todayKey ?? "");
      const weeklyCount  = h.completedDates.filter((d) => {
        const dt = new Date(d + "T00:00:00");
        return dt >= mon && dt <= sun;
      }).length;
      const weeklyMax    = h.scheduledDays ? h.scheduledDays.length : 7;
      const monthlyCount = h.completedDates.filter((d) => d.startsWith(monthPfx)).length;
      const monthlyMax   = monthDays;
      return { ...h, dailyStreak, done, weeklyCount, weeklyMax, monthlyCount, monthlyMax };
    });
  }, [habits, mon, sun, monthPfx, monthDays]);

  const weeklyTop5  = useMemo(
    () => [...habitsWithScores].sort((a, b) => b.weeklyCount - a.weeklyCount || b.dailyStreak - a.dailyStreak).slice(0, 5),
    [habitsWithScores]
  );
  const monthlyTop3 = useMemo(
    () => [...habitsWithScores].sort((a, b) => b.monthlyCount - a.monthlyCount || b.dailyStreak - a.dailyStreak).slice(0, 3),
    [habitsWithScores]
  );

  return (
    <View style={[pStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[pStyles.scroll, { paddingTop: topPad + 12, paddingBottom: botPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={pStyles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[pStyles.title, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>Stats</Text>
            {profile?.name ? (
              <Text style={[pStyles.profileSubtitle, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                {profile.profession ? `${profile.name} · ${profile.profession}` : profile.name}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/profile-edit"); }}
            style={[pStyles.avatarCircle, { backgroundColor: colors.tint + "20", borderColor: colors.tint + "55" }]}
            hitSlop={6}
          >
            {profile?.profilePicUri ? (
              <Image source={{ uri: profile.profilePicUri }} style={pStyles.avatarImg} />
            ) : (
              <Text style={[pStyles.avatarText, { color: colors.tint, fontFamily: "Outfit_800ExtraBold" }]}>
                {getInitials()}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={[pStyles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient
            colors={isDark ? [colors.tint + "25", "transparent"] : [colors.tint + "18", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[pStyles.heroLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>
            Today's Progress
          </Text>
          <Text style={[pStyles.heroPct, { color: colors.tint, fontFamily: "Outfit_800ExtraBold" }]}>
            {Math.round(todayProgress * 100)}%
          </Text>
          <View style={[pStyles.heroBar, { backgroundColor: colors.border }]}>
            <View style={[pStyles.heroBarFill, { width: `${todayProgress * 100}%` as any, backgroundColor: colors.tint }]} />
          </View>
          <View style={pStyles.heroStats}>
            {[
              { label: "Active Days", value: totalActiveDays, icon: "calendar-outline", color: colors.tint },
              { label: "Completions", value: totalCompletions, icon: "checkmark-circle-outline", color: "#B388FF" },
              { label: "Best Streak", value: longestStreak, icon: "flame-outline", color: "#FF6B35" },
            ].map((s) => (
              <View key={s.label} style={pStyles.heroStat}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
                <Text style={[pStyles.heroStatNum, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
                  {s.value}
                </Text>
                <Text style={[pStyles.heroStatLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {bmi && (
          <>
            <Text style={[pStyles.sectionHead, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
              Body Mass Index
            </Text>
            <View style={[pStyles.bmiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient
                colors={[bmi.color + "20", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={pStyles.bmiTop}>
                <View>
                  <Text style={[pStyles.bmiLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>
                    Your BMI
                  </Text>
                  <Text style={[pStyles.bmiValue, { color: bmi.color, fontFamily: "Outfit_800ExtraBold" }]}>
                    {bmi.value}
                  </Text>
                  <View style={[pStyles.bmiCatPill, { backgroundColor: bmi.color + "22" }]}>
                    <Text style={[pStyles.bmiCatText, { color: bmi.color, fontFamily: "Outfit_700Bold" }]}>
                      {bmi.category}
                    </Text>
                  </View>
                </View>
                <View style={pStyles.bmiDetails}>
                  {[
                    { label: "Weight", value: `${profile?.weightKg} kg`, icon: "scale-outline" },
                    { label: "Height", value: `${profile?.heightCm} cm`, icon: "resize-outline" },
                    { label: "Age",    value: `${profile?.age} yrs`,     icon: "calendar-outline" },
                  ].map(d => (
                    <View key={d.label} style={pStyles.bmiDetailRow}>
                      <Ionicons name={d.icon as any} size={14} color={colors.textMuted} />
                      <Text style={[pStyles.bmiDetailLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>{d.label}</Text>
                      <Text style={[pStyles.bmiDetailVal, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>{d.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {/* BMI scale bar */}
              <View style={pStyles.bmiScaleWrap}>
                <View style={[pStyles.bmiScaleBar, { backgroundColor: colors.border }]}>
                  <View style={[pStyles.bmiUnder,  { backgroundColor: "#00B4D8" }]} />
                  <View style={[pStyles.bmiNormal, { backgroundColor: "#00E676" }]} />
                  <View style={[pStyles.bmiOver,   { backgroundColor: "#FFB300" }]} />
                  <View style={[pStyles.bmiObese,  { backgroundColor: "#FF3B30" }]} />
                  {/* Marker */}
                  <View style={[
                    pStyles.bmiMarker,
                    {
                      left: `${Math.min(Math.max((bmi.value - 10) / 30 * 100, 1), 99)}%` as any,
                      backgroundColor: "#fff",
                    },
                  ]} />
                </View>
                <View style={pStyles.bmiScaleLabels}>
                  {["10", "18.5", "25", "30", "40"].map(l => (
                    <Text key={l} style={[pStyles.bmiScaleLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>{l}</Text>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

        <Text style={[pStyles.sectionHead, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
          By Category
        </Text>
        <View style={[pStyles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["Training", "Recovery", "Nutrition", "Mental"] as HabitCategory[]).map((cat) => {
            const count = byCategory[cat] || 0;
            const pct = count / maxCatCount;
            const catColor = CATEGORY_COLORS[cat];
            return (
              <View key={cat} style={pStyles.catRow}>
                <View style={[pStyles.catIconWrap, { backgroundColor: catColor + "20" }]}>
                  <Ionicons name={CATEGORY_ICONS[cat] as any} size={16} color={catColor} />
                </View>
                <View style={pStyles.catBarWrap}>
                  <View style={pStyles.catBarTop}>
                    <Text style={[pStyles.catName, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>{cat}</Text>
                    <Text style={[pStyles.catCount, { color: colors.textSecondary, fontFamily: "Outfit_700Bold" }]}>{count}</Text>
                  </View>
                  <View style={[pStyles.catBar, { backgroundColor: colors.border }]}>
                    <View style={[pStyles.catBarFill, { width: `${pct * 100}%` as any, backgroundColor: catColor }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[pStyles.sectionHead, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
          Habit Streaks
        </Text>

        <View style={pStyles.monthlyHeader}>
          <Ionicons name="calendar-outline" size={16} color={colors.tint} />
          <Text style={[pStyles.streakBlockTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
            Weekly Top 5
          </Text>
          <Text style={[pStyles.streakBlockSub, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
            this week
          </Text>
        </View>
        <View style={[pStyles.streakBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {weeklyTop5.map((item, i) => (
            <WeeklyTopRow key={item.id} item={item} rank={i} />
          ))}
          {weeklyTop5.length === 0 && (
            <Text style={[pStyles.emptyNote, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
              No habits yet
            </Text>
          )}
        </View>

        <View style={pStyles.streakBlockGap} />

        <View style={pStyles.monthlyHeader}>
          <Ionicons name="stats-chart" size={16} color={colors.tint} />
          <Text style={[pStyles.streakBlockTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
            Monthly Top 3
          </Text>
          <Text style={[pStyles.streakBlockSub, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
            this month
          </Text>
        </View>
        {monthlyTop3.map((item, i) => (
          <MonthlyTopCard key={item.id} item={item} rank={i} />
        ))}
        {monthlyTop3.length === 0 && (
          <Text style={[pStyles.emptyNote, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
            No habits yet
          </Text>
        )}

        <Text style={[pStyles.sectionHead, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
          Settings
        </Text>
        <View style={[pStyles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={pStyles.settingRow}>
            <View style={pStyles.settingLeft}>
              <View style={[pStyles.settingIcon, { backgroundColor: isDark ? "#B388FF" + "20" : "#7C3AED" + "20" }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={isDark ? "#B388FF" : "#7C3AED"} />
              </View>
              <View>
                <Text style={[pStyles.settingName, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>
                  {isDark ? "Dark Mode" : "Light Mode"}
                </Text>
                <Text style={[pStyles.settingDesc, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                  Toggle app appearance
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTheme();
              }}
              trackColor={{ false: colors.border, true: colors.tint + "80" }}
              thumbColor={isDark ? colors.tint : "#F5F7FA"}
              ios_backgroundColor={colors.border}
            />
          </View>
          <View style={[pStyles.divider, { backgroundColor: colors.border }]} />
          <View style={pStyles.settingRow}>
            <View style={pStyles.settingLeft}>
              <View style={[pStyles.settingIcon, { backgroundColor: "#00E676" + "20" }]}>
                <Ionicons name="notifications-outline" size={18} color="#00E676" />
              </View>
              <View>
                <Text style={[pStyles.settingName, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>
                  Nudge Notifications
                </Text>
                <Text style={[pStyles.settingDesc, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                  Reminders with category benefit %
                </Text>
              </View>
            </View>
            <Switch
              value={notifGranted}
              onValueChange={handleNotifToggle}
              trackColor={{ false: colors.border, true: "#00E676" + "80" }}
              thumbColor={notifGranted ? "#00E676" : "#F5F7FA"}
              ios_backgroundColor={colors.border}
            />
          </View>
          <View style={[pStyles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={handlePreviewNotif}
            disabled={previewCountdown > 0 || Platform.OS === "web"}
            style={({ pressed }) => [
              pStyles.settingRow,
              { opacity: pressed || previewCountdown > 0 || Platform.OS === "web" ? 0.5 : 1 },
            ]}
          >
            <View style={pStyles.settingLeft}>
              <View style={[pStyles.settingIcon, { backgroundColor: "#B388FF" + "20" }]}>
                <Ionicons name="send-outline" size={18} color="#B388FF" />
              </View>
              <View>
                <Text style={[pStyles.settingName, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>
                  Preview Notification
                </Text>
                <Text style={[pStyles.settingDesc, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                  {previewCountdown > 0 ? `Arriving in ${previewCountdown}s…` : "Fire a sample nudge in 5 seconds"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <View style={[pStyles.divider, { backgroundColor: colors.border }]} />
          <View style={pStyles.settingRow}>
            <View style={pStyles.settingLeft}>
              <View style={[pStyles.settingIcon, { backgroundColor: "#FF6B35" + "20" }]}>
                <Ionicons name="flame-outline" size={18} color="#FF6B35" />
              </View>
              <View>
                <Text style={[pStyles.settingName, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>
                  Streak Protection
                </Text>
                <Text style={[pStyles.settingDesc, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                  Streaks carry over midnight
                </Text>
              </View>
            </View>
            <View style={[pStyles.activeBadge, { backgroundColor: colors.tint + "20" }]}>
              <Text style={[pStyles.activeBadgeText, { color: colors.tint, fontFamily: "Outfit_600SemiBold" }]}>
                Active
              </Text>
            </View>
          </View>
          <View style={[pStyles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [pStyles.settingRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={pStyles.settingLeft}>
              <View style={[pStyles.settingIcon, { backgroundColor: "#00B4D8" + "20" }]}>
                <Ionicons name="share-social-outline" size={18} color="#00B4D8" />
              </View>
              <View>
                <Text style={[pStyles.settingName, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>
                  Share Progress
                </Text>
                <Text style={[pStyles.settingDesc, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                  Post your stats to social media
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={[pStyles.versionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="flash" size={18} color={colors.tint} />
          <Text style={[pStyles.versionText, { color: colors.textMuted, fontFamily: "Outfit_500Medium" }]}>
            PerformX v1.0 — Built for athletes, ravers & powerlifters
          </Text>
        </View>

        <View style={pStyles.footerBlock}>
          <Text style={[pStyles.footerTagline, { color: colors.tint, fontFamily: "Outfit_800ExtraBold" }]}>
            Fuel it up!
          </Text>
          <Text style={[pStyles.footerCredit, { color: "#FFFFFF", fontFamily: "Outfit_700Bold" }]}>
            Crafted by{" "}
            <Text style={{ fontSize: 20 }}>Dhaval Patel</Text>
          </Text>
          <Text style={pStyles.footerHeart}>{"❤️"}</Text>
          <Text style={[pStyles.footerCredit, { color: "#FFFFFF", fontFamily: "Outfit_700Bold" }]}>
            in Ahmedabad, India
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const pStyles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 28 },
  headerRight: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  heroCard: { borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, overflow: "hidden" },
  heroLabel: { fontSize: 13, marginBottom: 4 },
  heroPct: { fontSize: 48, lineHeight: 56 },
  heroBar: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: 10, marginBottom: 20 },
  heroBarFill: { height: 8, borderRadius: 4 },
  heroStats: { flexDirection: "row" },
  heroStat: { flex: 1, alignItems: "center", gap: 4 },
  heroStatNum: { fontSize: 24 },
  heroStatLabel: { fontSize: 11, textAlign: "center" },
  profileSubtitle: { fontSize: 13, marginTop: 2 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  avatarImg:    { width: 48, height: 48, borderRadius: 24 },
  avatarText:   { fontSize: 18 },
  sectionHead: { fontSize: 18, marginBottom: 12 },
  streakBlock:       { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 0 },
  streakBlockHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  streakBlockTitle:  { fontSize: 15, flex: 1 },
  streakBlockSub:    { fontSize: 12 },
  streakBlockGap:    { height: 16 },
  monthlyHeader:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  emptyNote:         { fontSize: 13, paddingVertical: 12, textAlign: "center" },
  catCard: { borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, gap: 14 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catBarWrap: { flex: 1 },
  catBarTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  catName: { fontSize: 14 },
  catCount: { fontSize: 13 },
  catBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  catBarFill: { height: 6, borderRadius: 3 },
  settingsCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingName: { fontSize: 15, marginBottom: 2 },
  settingDesc: { fontSize: 12 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  activeBadgeText: { fontSize: 12 },
  divider: { height: 1 },
  versionCard: { borderRadius: 14, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  versionText: { fontSize: 13, flex: 1 },
  footerBlock:      { alignItems: "flex-start", paddingTop: 28, paddingBottom: 12, gap: 8 },
  footerTagline:    { fontSize: 32, letterSpacing: -0.5 },
  footerCreditRow:  { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  footerCredit:     { fontSize: 17 },
  footerHeart:      { fontSize: 26 },
  bmiCard: { borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, overflow: "hidden" },
  bmiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  bmiLabel: { fontSize: 13, marginBottom: 4 },
  bmiValue: { fontSize: 48, lineHeight: 56 },
  bmiCatPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start", marginTop: 6 },
  bmiCatText: { fontSize: 13 },
  bmiDetails: { gap: 10, alignItems: "flex-end" },
  bmiDetailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bmiDetailLabel: { fontSize: 12 },
  bmiDetailVal: { fontSize: 13 },
  bmiScaleWrap: { gap: 6 },
  bmiScaleBar: { height: 10, borderRadius: 5, overflow: "hidden", flexDirection: "row", position: "relative" },
  bmiUnder:  { flex: 17 },
  bmiNormal: { flex: 65 },
  bmiOver:   { flex: 50 },
  bmiObese:  { flex: 100 },
  bmiMarker: { position: "absolute", top: -3, width: 4, height: 16, borderRadius: 2 },
  bmiScaleLabels: { flexDirection: "row", justifyContent: "space-between" },
  bmiScaleLabel: { fontSize: 10 },
});
