import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Share,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useHabits, Habit, HabitCategory } from "@/context/HabitsContext";

// ─── Constants ─────────────────────────────────────────────────────────────────
type Period = "daily" | "weekly" | "monthly";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_SHORT    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAYS_HEADER  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const CHART_H = 108;

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Training: "#FF6B35",
  Recovery: "#00B4D8",
  Nutrition: "#00E676",
  Mental:   "#B388FF",
  Personal: "#FF6B9D",
  Work:     "#FFB300",
};

const CATEGORY_ICONS: Record<HabitCategory, string> = {
  Training: "barbell-outline",
  Recovery: "heart-outline",
  Nutrition: "leaf-outline",
  Mental:   "sparkles-outline",
  Personal: "people-outline",
  Work:     "briefcase-outline",
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getDayIndex(dateKey: string): number {
  const dow = new Date(dateKey + "T00:00:00").getDay();
  return dow === 0 ? 6 : dow - 1; // 0=Mon … 6=Sun
}

function addDays(dateKey: string, n: number): string {
  const d = new Date(dateKey + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function getWeekStart(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00");
  const dow = d.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
}

function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function getHabitsForDay(habits: Habit[], dayIndex: number): Habit[] {
  return habits.filter(h => !h.scheduledDays || h.scheduledDays.includes(dayIndex));
}

function formatDateFull(dateKey: string): string {
  return new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatWeekRange(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const s = new Date(weekStart + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}`;
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

type CatStat = { total: number; done: number; color: string; icon: string };

function getCategoryStats(habits: Habit[], dateKeys: string[]): [string, CatStat][] {
  const result: Record<string, CatStat> = {};
  dateKeys.forEach(dk => {
    const di = getDayIndex(dk);
    getHabitsForDay(habits, di).forEach(h => {
      if (!result[h.category]) {
        result[h.category] = { total: 0, done: 0, color: CATEGORY_COLORS[h.category], icon: CATEGORY_ICONS[h.category] };
      }
      result[h.category].total++;
      if (h.completedDates.includes(dk)) result[h.category].done++;
    });
  });
  return Object.entries(result)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].done / b[1].total - a[1].done / a[1].total);
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { colors } = useTheme();
  const { habits } = useHabits();
  const insets = useSafeAreaInsets();

  const todayKey = useMemo(getTodayKey, []);
  const now      = useMemo(() => new Date(), []);

  const [period, setPeriod]               = useState<Period>("daily");
  const [selectedDate, setSelectedDate]   = useState(todayKey);
  const [weekStart, setWeekStart]         = useState(() => getWeekStart(todayKey));
  const [viewYear, setViewYear]           = useState(now.getFullYear());
  const [viewMonth, setViewMonth]         = useState(now.getMonth());
  const [heatSelected, setHeatSelected]   = useState<string | null>(null);

  // Animate all bars together when view changes
  const anim = useRef(new Animated.Value(1)).current;
  const triggerAnim = useCallback(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1, duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim]);

  useEffect(() => { triggerAnim(); }, [period, selectedDate, weekStart, viewYear, viewMonth]);

  // ── Daily data ──────────────────────────────────────────────────────────────
  const daily = useMemo(() => {
    const di  = getDayIndex(selectedDate);
    const sch = getHabitsForDay(habits, di);
    const don = sch.filter(h => h.completedDates.includes(selectedDate));
    const rate = sch.length ? don.length / sch.length : 0;
    return { sch, don, rate, cats: getCategoryStats(habits, [selectedDate]) };
  }, [habits, selectedDate]);

  // ── Weekly data ─────────────────────────────────────────────────────────────
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const weekly = useMemo(() => {
    const days = weekDates.map(dk => {
      if (dk > todayKey) return { dk, rate: -1, done: 0, total: 0 };
      const di  = getDayIndex(dk);
      const sch = getHabitsForDay(habits, di);
      const done = sch.filter(h => h.completedDates.includes(dk)).length;
      return { dk, rate: sch.length ? done / sch.length : 0, done, total: sch.length };
    });
    const past    = days.filter(d => d.rate >= 0 && d.total > 0);
    const avgRate = past.length ? past.reduce((s, d) => s + d.rate, 0) / past.length : 0;
    const totalDone = past.reduce((s, d) => s + d.done, 0);
    const bestDay   = past.reduce<typeof days[0] | null>((b, d) => d.rate > (b?.rate ?? -1) ? d : b, null);
    const pastKeys  = weekDates.filter(dk => dk <= todayKey);
    return { days, avgRate, totalDone, bestDay, cats: getCategoryStats(habits, pastKeys) };
  }, [habits, weekDates, todayKey]);

  // ── Monthly data ────────────────────────────────────────────────────────────
  const monthly = useMemo(() => {
    const total = getDaysInMonth(viewYear, viewMonth);
    const keys  = Array.from({ length: total }, (_, i) => {
      const mo = String(viewMonth + 1).padStart(2, "0");
      const da = String(i + 1).padStart(2, "0");
      return `${viewYear}-${mo}-${da}`;
    });
    const past = keys.filter(k => k <= todayKey);

    const byDate: Record<string, Habit[]> = {};
    habits.forEach(h => h.completedDates.forEach(d => {
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(h);
    }));

    const activeDays  = past.filter(k => (byDate[k]?.length ?? 0) > 0).length;
    const perfectDays = past.filter(k => {
      const di  = getDayIndex(k);
      const sch = getHabitsForDay(habits, di);
      return sch.length > 0 && sch.every(h => h.completedDates.includes(k));
    }).length;

    let streak = 0;
    let ck = todayKey;
    for (let i = 0; i < 365; i++) {
      const di  = getDayIndex(ck);
      const sch = getHabitsForDay(habits, di);
      if (sch.length > 0 && sch.some(h => h.completedDates.includes(ck))) {
        streak++;
      } else if (i > 0) break;
      ck = addDays(ck, -1);
    }

    const rates = past.map(k => {
      const di  = getDayIndex(k);
      const sch = getHabitsForDay(habits, di);
      if (!sch.length) return null;
      return sch.filter(h => h.completedDates.includes(k)).length / sch.length;
    }).filter((r): r is number => r !== null);
    const avgRate = rates.length ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;

    const getIntensity = (dk: string) => {
      const di  = getDayIndex(dk);
      const sch = getHabitsForDay(habits, di);
      if (!sch.length) return 0;
      return sch.filter(h => h.completedDates.includes(dk)).length / sch.length;
    };

    return { keys, past, byDate, activeDays, perfectDays, streak, avgRate, getIntensity, cats: getCategoryStats(habits, past) };
  }, [habits, viewYear, viewMonth, todayKey]);

  const heatCells = useMemo(() => {
    const first = getFirstDayOfMonth(viewYear, viewMonth);
    const total = getDaysInMonth(viewYear, viewMonth);
    const cells: (string | null)[] = Array(first).fill(null);
    for (let d = 1; d <= total; d++) {
      const mo = String(viewMonth + 1).padStart(2, "0");
      const da = String(d).padStart(2, "0");
      cells.push(`${viewYear}-${mo}-${da}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    let msg = "BioHack Stats\n";
    if (period === "daily") {
      msg += `${formatDateFull(selectedDate)}\n${Math.round(daily.rate * 100)}% — ${daily.don.length}/${daily.sch.length} habits done`;
    } else if (period === "weekly") {
      msg += `Week ${formatWeekRange(weekStart)}\nAvg ${Math.round(weekly.avgRate * 100)}% — ${weekly.totalDone} habits completed`;
    } else {
      msg += `${MONTHS_FULL[viewMonth]} ${viewYear}\nActive ${monthly.activeDays} days — Avg ${Math.round(monthly.avgRate * 100)}%`;
    }
    msg += "\n\nTracked with BioHack!";
    try { await Share.share({ message: msg }); } catch {}
  };

  // ── Category bar ─────────────────────────────────────────────────────────────
  const CatBar = ({ cat, stat }: { cat: string; stat: CatStat }) => {
    const pct = stat.total ? Math.round((stat.done / stat.total) * 100) : 0;
    return (
      <View style={styles.catBarRow}>
        <View style={styles.catBarLeft}>
          <Ionicons name={stat.icon as any} size={13} color={stat.color} />
          <Text style={[styles.catBarName, { color: colors.text, fontFamily: "Outfit_500Medium" }]} numberOfLines={1}>
            {cat}
          </Text>
        </View>
        <View style={[styles.catBarTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.catBarFill,
              {
                backgroundColor: stat.color,
                width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${pct}%`] }),
              },
            ]}
          />
        </View>
        <Text style={[styles.catBarPct, { color: colors.textSecondary, fontFamily: "Outfit_700Bold" }]}>
          {pct}%
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: botPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
            Stats
          </Text>
          <Pressable
            onPress={handleShare}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={20} color={colors.tint} />
          </Pressable>
        </View>

        {/* ── Period Pill Selector ── */}
        <View style={[styles.periodRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["daily", "weekly", "monthly"] as Period[]).map(p => (
            <Pressable
              key={p}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeriod(p); }}
              style={[styles.periodBtn, period === p && { backgroundColor: colors.tint }]}
            >
              <Text style={[
                styles.periodBtnText,
                { color: period === p ? "#000" : colors.textSecondary, fontFamily: period === p ? "Outfit_700Bold" : "Outfit_500Medium" },
              ]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ════════════════════════ DAILY ════════════════════════ */}
        {period === "daily" && (
          <>
            <View style={styles.navRow}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDate(d => addDays(d, -1)); }}
                style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>
              <Text style={[styles.navLabel, { color: colors.text, fontFamily: "Outfit_700Bold" }]} numberOfLines={1}>
                {formatDateFull(selectedDate)}
              </Text>
              <Pressable
                onPress={() => { if (selectedDate < todayKey) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDate(d => addDays(d, 1)); } }}
                style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: selectedDate >= todayKey ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* Big progress card */}
            <View style={[styles.bigCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.bigPct, { color: colors.tint, fontFamily: "Outfit_800ExtraBold" }]}>
                {Math.round(daily.rate * 100)}%
              </Text>
              <Text style={[styles.bigSub, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
                {daily.don.length} of {daily.sch.length} habits done
              </Text>
              <View style={[styles.bigBarTrack, { backgroundColor: colors.border }]}>
                <Animated.View
                  style={[
                    styles.bigBarFill,
                    {
                      backgroundColor: colors.tint,
                      width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${Math.round(daily.rate * 100)}%`] }),
                    },
                  ]}
                />
              </View>
              {/* Mini daily summary row */}
              <View style={styles.dailySummaryRow}>
                {[
                  { label: "Scheduled", value: daily.sch.length, icon: "calendar-outline", color: colors.textSecondary },
                  { label: "Completed", value: daily.don.length, icon: "checkmark-circle-outline", color: colors.tint },
                  { label: "Remaining", value: daily.sch.length - daily.don.length, icon: "time-outline", color: "#FF6B35" },
                ].map(s => (
                  <View key={s.label} style={styles.dailyStat}>
                    <Ionicons name={s.icon as any} size={14} color={s.color} />
                    <Text style={[styles.dailyStatVal, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>{s.value}</Text>
                    <Text style={[styles.dailyStatLabel, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Category breakdown */}
            {daily.cats.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
                  Category Breakdown
                </Text>
                {daily.cats.map(([cat, stat]) => <CatBar key={cat} cat={cat} stat={stat} />)}
              </View>
            )}
          </>
        )}

        {/* ════════════════════════ WEEKLY ════════════════════════ */}
        {period === "weekly" && (
          <>
            <View style={styles.navRow}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWeekStart(w => addDays(w, -7)); }}
                style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>
              <Text style={[styles.navLabel, { color: colors.text, fontFamily: "Outfit_700Bold" }]} numberOfLines={1}>
                {formatWeekRange(weekStart)}
              </Text>
              <Pressable
                onPress={() => { if (addDays(weekStart, 7) <= todayKey) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWeekStart(w => addDays(w, 7)); } }}
                style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: addDays(weekStart, 7) > todayKey ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* 3 summary cards */}
            <View style={styles.threeCardRow}>
              {[
                { label: "Avg Rate",  value: `${Math.round(weekly.avgRate * 100)}%`, icon: "trending-up-outline",      color: colors.tint },
                { label: "Completed", value: `${weekly.totalDone}`,                  icon: "checkmark-circle-outline", color: "#FF6B35" },
                { label: "Best Day",  value: weekly.bestDay ? DAY_SHORT[weekDates.indexOf(weekly.bestDay.dk)] : "—", icon: "trophy-outline", color: "#B388FF" },
              ].map(s => (
                <View key={s.label} style={[styles.triCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                  <Text style={[styles.triVal, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>{s.value}</Text>
                  <Text style={[styles.triLabel, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Vertical bar chart */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
                Weekly Overview
              </Text>
              <View style={[styles.barChart, { gap: 6 }]}>
                {weekly.days.map((d, i) => {
                  const isFuture = d.rate < 0;
                  const isTod    = d.dk === todayKey;
                  const rate     = Math.max(0, d.rate);
                  const barClr   = isTod ? colors.tint : colors.tint + "88";
                  return (
                    <View key={d.dk} style={styles.barCol}>
                      <Text style={[styles.barPctTxt, { color: colors.textMuted, fontFamily: "Outfit_500Medium" }]}>
                        {!isFuture && d.total > 0 ? `${Math.round(rate * 100)}%` : ""}
                      </Text>
                      <View style={[styles.barTrackV, { backgroundColor: colors.border }]}>
                        {!isFuture && d.total > 0 && (
                          <Animated.View
                            style={[
                              styles.barFillV,
                              {
                                backgroundColor: barClr,
                                height: anim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, rate * CHART_H],
                                }),
                              },
                            ]}
                          />
                        )}
                      </View>
                      <Text style={[
                        styles.barDayTxt,
                        { color: isTod ? colors.tint : colors.textSecondary, fontFamily: isTod ? "Outfit_700Bold" : "Outfit_500Medium" },
                      ]}>
                        {DAY_SHORT[i]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Category performance */}
            {weekly.cats.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
                  Category Performance
                </Text>
                {weekly.cats.map(([cat, stat]) => <CatBar key={cat} cat={cat} stat={stat} />)}
              </View>
            )}
          </>
        )}

        {/* ════════════════════════ MONTHLY ════════════════════════ */}
        {period === "monthly" && (
          <>
            <View style={styles.navRow}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); }}
                style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>
              <Text style={[styles.navLabel, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
                {MONTHS_FULL[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); }}
                style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* 4 mini stat cards */}
            <View style={styles.fourCardRow}>
              {[
                { label: "Active",   value: `${monthly.activeDays}d`,              icon: "calendar-outline",       color: colors.tint },
                { label: "Perfect",  value: `${monthly.perfectDays}d`,             icon: "trophy-outline",          color: "#FFB300" },
                { label: "Streak",   value: `${monthly.streak}d`,                  icon: "flame-outline",           color: "#FF6B35" },
                { label: "Avg Rate", value: `${Math.round(monthly.avgRate * 100)}%`, icon: "trending-up-outline",  color: "#B388FF" },
              ].map(s => (
                <View key={s.label} style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name={s.icon as any} size={16} color={s.color} />
                  <Text style={[styles.miniVal, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>{s.value}</Text>
                  <Text style={[styles.miniLabel, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Heatmap */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
                Activity Map
              </Text>
              <View style={styles.dayHeaders}>
                {DAYS_HEADER.map(d => (
                  <Text key={d} style={[styles.dayHeader, { color: colors.textMuted, fontFamily: "Outfit_500Medium" }]}>{d}</Text>
                ))}
              </View>
              <View style={styles.heatGrid}>
                {heatCells.map((dk, idx) => {
                  if (!dk) return <View key={`e-${idx}`} style={styles.heatCell} />;
                  const isFuture   = dk > todayKey;
                  const isTod      = dk === todayKey;
                  const intensity  = monthly.getIntensity(dk);
                  const alpha      = Math.round(40 + intensity * 180).toString(16).padStart(2, "0");
                  const bg         = isFuture ? "transparent" : intensity === 0 ? colors.border : colors.tint + alpha;
                  const day        = parseInt(dk.split("-")[2], 10);
                  const isSelected = heatSelected === dk;
                  return (
                    <Pressable
                      key={dk}
                      onPress={() => { if (!isFuture) { setHeatSelected(isSelected ? null : dk); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
                      style={[
                        styles.heatCell,
                        {
                          backgroundColor: bg,
                          borderColor: isSelected ? "#fff" : isTod ? colors.tint : "transparent",
                          borderWidth: isSelected || isTod ? 2 : 0,
                          opacity: isFuture ? 0.15 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.heatDay, {
                        color: intensity > 0.5 ? "#fff" : isTod ? colors.tint : colors.textSecondary,
                        fontFamily: isTod ? "Outfit_700Bold" : "Outfit_400Regular",
                      }]}>
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {/* Legend */}
              <View style={styles.legendRow}>
                <Text style={[styles.legendTxt, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>Less</Text>
                {[0, 0.25, 0.5, 0.75, 1].map(v => {
                  const alpha = Math.round(40 + v * 180).toString(16).padStart(2, "0");
                  return <View key={v} style={[styles.legendDot, { backgroundColor: v === 0 ? colors.border : colors.tint + alpha }]} />;
                })}
                <Text style={[styles.legendTxt, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>More</Text>
              </View>
            </View>

            {/* Selected date detail */}
            {heatSelected && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
                  {new Date(heatSelected + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </Text>
                {(monthly.byDate[heatSelected] || []).length === 0 ? (
                  <Text style={[styles.emptyTxt, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                    No habits completed this day
                  </Text>
                ) : (
                  (monthly.byDate[heatSelected] || []).map(h => (
                    <View key={h.id} style={styles.dayHabitRow}>
                      <View style={[styles.dayDot, { backgroundColor: CATEGORY_COLORS[h.category] }]} />
                      <Text style={[styles.dayHabitName, { color: colors.text, fontFamily: "Outfit_500Medium" }]}>{h.name}</Text>
                      <View style={[styles.dayHabitBadge, { backgroundColor: CATEGORY_COLORS[h.category] + "22" }]}>
                        <Text style={[styles.dayHabitBadgeTxt, { color: CATEGORY_COLORS[h.category], fontFamily: "Outfit_500Medium" }]}>{h.category}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Category performance */}
            {monthly.cats.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
                  Category Performance
                </Text>
                {monthly.cats.map(([cat, stat]) => <CatBar key={cat} cat={cat} stat={stat} />)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontSize: 28 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  // Period selector
  periodRow: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 4, marginBottom: 20, gap: 4 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  periodBtnText: { fontSize: 14 },

  // Nav row
  navRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  navBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  navLabel: { flex: 1, fontSize: 15, textAlign: "center" },

  // Daily big card
  bigCard: { borderRadius: 20, borderWidth: 1, padding: 24, marginBottom: 16, alignItems: "center", gap: 8 },
  bigPct: { fontSize: 60, lineHeight: 68 },
  bigSub: { fontSize: 15 },
  bigBarTrack: { width: "100%", height: 10, borderRadius: 5, overflow: "hidden", marginTop: 4 },
  bigBarFill: { height: "100%", borderRadius: 5 },
  dailySummaryRow: { flexDirection: "row", gap: 0, width: "100%", marginTop: 12 },
  dailyStat: { flex: 1, alignItems: "center", gap: 3 },
  dailyStatVal: { fontSize: 20 },
  dailyStatLabel: { fontSize: 11 },

  // Section card
  sectionCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 16 },

  // Category bar
  catBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catBarLeft: { flexDirection: "row", alignItems: "center", gap: 6, width: 100 },
  catBarName: { fontSize: 12, flexShrink: 1 },
  catBarTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 4 },
  catBarPct: { fontSize: 12, width: 38, textAlign: "right" },

  // 3-card row (weekly summary)
  threeCardRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  triCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  triVal: { fontSize: 22 },
  triLabel: { fontSize: 11, textAlign: "center" },

  // Vertical bar chart
  barChart: { flexDirection: "row", alignItems: "flex-end", height: CHART_H + 42 },
  barCol: { flex: 1, alignItems: "center" },
  barPctTxt: { fontSize: 9, height: 14, marginBottom: 4 },
  barTrackV: { width: "100%", height: CHART_H, borderRadius: 8, overflow: "hidden", justifyContent: "flex-end" },
  barFillV: { width: "100%", borderRadius: 8 },
  barDayTxt: { fontSize: 11, marginTop: 6 },

  // 4-card row (monthly summary)
  fourCardRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  miniCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
  miniVal: { fontSize: 16 },
  miniLabel: { fontSize: 10, textAlign: "center" },

  // Heatmap
  dayHeaders: { flexDirection: "row", marginBottom: 6 },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 11 },
  heatGrid: { flexDirection: "row", flexWrap: "wrap" },
  heatCell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8, padding: 2 },
  heatDay: { fontSize: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, gap: 6 },
  legendTxt: { fontSize: 11 },
  legendDot: { width: 14, height: 14, borderRadius: 3 },

  // Selected date detail
  dayHabitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dayDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dayHabitName: { flex: 1, fontSize: 14 },
  dayHabitBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dayHabitBadgeTxt: { fontSize: 11 },
  emptyTxt: { fontSize: 14 },
});
