import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useHabits, HabitCategory } from "@/context/HabitsContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Training: "#FF6B35",
  Recovery: "#00B4D8",
  Nutrition: "#00E676",
  Mental: "#B388FF",
};

function HeatmapCell({ dateStr, intensity, isToday, isFuture, onPress }: {
  dateStr: string;
  intensity: number;
  isToday: boolean;
  isFuture: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const day = parseInt(dateStr.split("-")[2], 10);

  const bg = useMemo(() => {
    if (isFuture) return "transparent";
    if (intensity === 0) return colors.card;
    const alpha = Math.round(40 + intensity * 180).toString(16).padStart(2, "0");
    return colors.tint + alpha;
  }, [intensity, colors, isFuture]);

  return (
    <Pressable
      onPress={() => !isFuture && onPress()}
      style={[
        styles.cell,
        {
          backgroundColor: bg,
          borderColor: isToday ? colors.tint : "transparent",
          borderWidth: isToday ? 2 : 0,
          opacity: isFuture ? 0.2 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.cellDay,
          {
            color: intensity > 0.5 ? "#fff" : isToday ? colors.tint : colors.textSecondary,
            fontFamily: isToday ? "Outfit_700Bold" : "Outfit_400Regular",
          },
        ]}
      >
        {day}
      </Text>
    </Pressable>
  );
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const { habits, isCompletedToday, getCompletedDays } = useHabits();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const completedDays = getCompletedDays();

  const habitsByDate = useMemo(() => {
    const map: Record<string, typeof habits> = {};
    habits.forEach((h) => {
      h.completedDates.forEach((d) => {
        if (!map[d]) map[d] = [];
        map[d].push(h);
      });
    });
    return map;
  }, [habits]);

  const getIntensity = (dateStr: string) => {
    const done = habitsByDate[dateStr]?.length || 0;
    return habits.length > 0 ? done / habits.length : 0;
  };

  const todayKey = now.toISOString().split("T")[0];

  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (string | null)[] = [...Array(firstDay).fill(null)];
  for (let d = 1; d <= totalDays; d++) {
    const mo = String(viewMonth + 1).padStart(2, "0");
    const da = String(d).padStart(2, "0");
    cells.push(`${viewYear}-${mo}-${da}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goForward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthCompletedDays = cells.filter(d => d && habitsByDate[d]?.length > 0).length;
  const monthPerfectDays = cells.filter(d => d && getIntensity(d) === 1).length;

  const selectedHabits = selectedDate ? (habitsByDate[selectedDate] || []) : [];

  const handleShare = async () => {
    const msg = `BioHack Calendar — ${MONTHS[viewMonth]} ${viewYear}\nActive Days: ${monthCompletedDays}\nPerfect Days: ${monthPerfectDays}\n\nBuilding consistency with BioHack!`;
    try { await Share.share({ message: msg }); } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: botPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
            History
          </Text>
          <Pressable
            onPress={handleShare}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={20} color={colors.tint} />
          </Pressable>
        </View>

        <View style={styles.monthNavRow}>
          <Pressable onPress={goBack} style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
            {MONTHS[viewMonth]} {viewYear}
          </Text>
          <Pressable onPress={goForward} style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={[styles.statsRow, { gap: 10 }]}>
          {[
            { label: "Active Days", value: monthCompletedDays, icon: "calendar-outline", color: colors.tint },
            { label: "Perfect Days", value: monthPerfectDays, icon: "trophy-outline", color: "#FF6B35" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dayHeaders}>
            {DAYS.map((d) => (
              <Text key={d} style={[styles.dayHeader, { color: colors.textMuted, fontFamily: "Outfit_500Medium" }]}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((dateStr, idx) => {
              if (!dateStr) {
                return <View key={`empty-${idx}`} style={styles.cell} />;
              }
              const isFuture = dateStr > todayKey;
              const intensity = getIntensity(dateStr);
              const isToday = dateStr === todayKey;
              return (
                <HeatmapCell
                  key={dateStr}
                  dateStr={dateStr}
                  intensity={intensity}
                  isToday={isToday}
                  isFuture={isFuture}
                  onPress={() => {
                    setSelectedDate(selectedDate === dateStr ? null : dateStr);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <Text style={[styles.legendLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>Less</Text>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => {
              const alpha = Math.round(40 + v * 180).toString(16).padStart(2, "0");
              return (
                <View
                  key={v}
                  style={[
                    styles.legendDot,
                    { backgroundColor: v === 0 ? colors.border : colors.tint + alpha },
                  ]}
                />
              );
            })}
            <Text style={[styles.legendLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>More</Text>
          </View>
        </View>

        {selectedDate && (
          <View style={[styles.dayDetail, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dayDetailTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric"
              })}
            </Text>
            {selectedHabits.length === 0 ? (
              <Text style={[styles.noHabitsText, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                No habits completed this day
              </Text>
            ) : (
              selectedHabits.map((h) => (
                <View key={h.id} style={styles.dayHabitRow}>
                  <View style={[styles.dayHabitDot, { backgroundColor: CATEGORY_COLORS[h.category] }]} />
                  <Text style={[styles.dayHabitName, { color: colors.text, fontFamily: "Outfit_500Medium" }]}>
                    {h.name}
                  </Text>
                  <View style={[styles.dayHabitCat, { backgroundColor: CATEGORY_COLORS[h.category] + "20" }]}>
                    <Text style={[styles.dayHabitCatText, { color: CATEGORY_COLORS[h.category], fontFamily: "Outfit_500Medium" }]}>
                      {h.category}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontSize: 28 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  monthNavRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 18 },
  statsRow: { flexDirection: "row", marginBottom: 16 },
  statCard: { borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center", gap: 6 },
  statValue: { fontSize: 28 },
  statLabel: { fontSize: 12 },
  calendarCard: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1 },
  dayHeaders: { flexDirection: "row", marginBottom: 8 },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 10, padding: 2 },
  cellDay: { fontSize: 13 },
  legendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, gap: 6 },
  legendLabel: { fontSize: 11 },
  legendDot: { width: 16, height: 16, borderRadius: 4 },
  dayDetail: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 10 },
  dayDetailTitle: { fontSize: 16, marginBottom: 4 },
  noHabitsText: { fontSize: 14, textAlign: "center", paddingVertical: 8 },
  dayHabitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dayHabitDot: { width: 8, height: 8, borderRadius: 4 },
  dayHabitName: { flex: 1, fontSize: 14 },
  dayHabitCat: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dayHabitCatText: { fontSize: 11 },
});
