import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Animated,
  PanResponder,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useHabits, Habit, HabitCategory } from "@/context/HabitsContext";
import { useUser } from "@/context/UserContext";

// Alphabetical order (All prepended at render time)
const CATEGORIES: HabitCategory[] = ["Mental", "Nutrition", "Personal", "Recovery", "Training", "Work"];

function parseTimeSlotMinutes(slot?: string): number {
  if (!slot || slot.toLowerCase() === "anytime") return Infinity;
  const start = slot.split(/\s*[–\-]\s*/)[0].trim();
  const match = start.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return Infinity;
  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const mer = match[3].toUpperCase();
  if (mer === "AM" && hrs === 12) hrs = 0;
  if (mer === "PM" && hrs !== 12) hrs += 12;
  return hrs * 60 + mins;
}
const SWIPE_THRESHOLD = 55;
const ACTION_WIDTH = 80;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Mental: "#B388FF",
  Nutrition: "#00E676",
  Personal: "#FF6B9D",
  Recovery: "#00B4D8",
  Training: "#FF6B35",
  Work: "#FFB300",
};

const CATEGORY_ICONS: Record<HabitCategory, string> = {
  Mental: "sparkles-outline",
  Nutrition: "leaf-outline",
  Personal: "heart-outline",
  Recovery: "water-outline",
  Training: "flame-outline",
  Work: "briefcase-outline",
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
  "stopwatch-outline",
  "fitness-outline",
  "footsteps-outline",
  "sunny-outline",
];

function HabitForm({
  name,
  setName,
  category,
  setCategory,
  icon,
  setIcon,
  timeSlot,
  setTimeSlot,
  onSubmit,
  submitLabel,
  colors,
}: {
  name: string;
  setName: (v: string) => void;
  category: HabitCategory;
  setCategory: (v: HabitCategory) => void;
  icon: string;
  setIcon: (v: string) => void;
  timeSlot: string;
  setTimeSlot: (v: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  colors: any;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.modalBody}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
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
        returnKeyType="next"
      />

      <Text style={[styles.label, { color: colors.textSecondary, fontFamily: "Outfit_500Medium", marginTop: 20 }]}>
        Time Slot <Text style={{ color: colors.textMuted, fontFamily: "Outfit_400Regular", fontSize: 12 }}>(optional)</Text>
      </Text>
      <TextInput
        value={timeSlot}
        onChangeText={setTimeSlot}
        placeholder="e.g. 7:00 AM – 8:00 AM or Anytime"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, fontFamily: "Outfit_400Regular" },
        ]}
        returnKeyType="done"
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
                backgroundColor: category === cat ? CATEGORY_COLORS[cat] + "25" : colors.card,
                borderColor: category === cat ? CATEGORY_COLORS[cat] : colors.border,
              },
            ]}
          >
            <Ionicons
              name={CATEGORY_ICONS[cat] as any}
              size={14}
              color={category === cat ? CATEGORY_COLORS[cat] : colors.textMuted}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.catBtnText,
                { color: category === cat ? CATEGORY_COLORS[cat] : colors.textSecondary, fontFamily: "Outfit_600SemiBold" },
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
                backgroundColor: icon === ic ? CATEGORY_COLORS[category] + "25" : colors.card,
                borderColor: icon === ic ? CATEGORY_COLORS[category] : colors.border,
              },
            ]}
          >
            <Ionicons
              name={ic as any}
              size={22}
              color={icon === ic ? CATEGORY_COLORS[category] : colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.submitBtn,
          { backgroundColor: CATEGORY_COLORS[category], opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.submitBtnText, { fontFamily: "Outfit_700Bold" }]}>{submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

function AddHabitModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { addHabit } = useHabits();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("Training");
  const [icon, setIcon] = useState("barbell-outline");
  const [timeSlot, setTimeSlot] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit(name.trim(), category, icon, timeSlot);
    setName("");
    setCategory("Training");
    setIcon("barbell-outline");
    setTimeSlot("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>New Habit</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <HabitForm
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          icon={icon}
          setIcon={setIcon}
          timeSlot={timeSlot}
          setTimeSlot={setTimeSlot}
          onSubmit={handleAdd}
          submitLabel="Add Habit"
          colors={colors}
        />
      </View>
    </Modal>
  );
}

function EditHabitModal({
  habit,
  visible,
  onClose,
}: {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { editHabit } = useHabits();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("Training");
  const [icon, setIcon] = useState("barbell-outline");
  const [timeSlot, setTimeSlot] = useState("");

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setCategory(habit.category);
      setIcon(habit.icon);
      setTimeSlot(habit.timeSlot ?? "");
    }
  }, [habit]);

  const handleSave = () => {
    if (!habit || !name.trim()) return;
    editHabit(habit.id, name.trim(), category, icon, timeSlot);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.modalTitleRow}>
            <View style={[styles.editHeaderDot, { backgroundColor: CATEGORY_COLORS[category] }]} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>Edit Habit</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <HabitForm
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          icon={icon}
          setIcon={setIcon}
          timeSlot={timeSlot}
          setTimeSlot={setTimeSlot}
          onSubmit={handleSave}
          submitLabel="Save Changes"
          colors={colors}
        />
      </View>
    </Modal>
  );
}

function getDaysMissed(habit: Habit, todayKey: string): number {
  if (!habit.completedDates.length) return -1; // never done — no penalty badge
  const sorted = [...habit.completedDates].sort().reverse();
  const lastDate = new Date(sorted[0] + "T00:00:00");
  const todayDate = new Date(todayKey + "T00:00:00");
  return Math.round((todayDate.getTime() - lastDate.getTime()) / 86400000);
}

function SwipeableHabitRow({
  habit,
  selectedDay,
  onEdit,
  onDelete,
  onSwipeActive,
  onSwipeEnd,
}: {
  habit: Habit;
  selectedDay: string;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeActive: () => void;
  onSwipeEnd: () => void;
}) {
  const { colors } = useTheme();
  const { toggleHabit, getStreak, isCompletedOnDate, todayKey } = useHabits();
  const done = isCompletedOnDate(habit, selectedDay);
  const isToday = selectedDay === todayKey;
  const streak = getStreak(habit);
  const catColor = CATEGORY_COLORS[habit.category];

  // Days missed badge — only shown when undone and overdue
  const daysMissed = isToday && !done ? getDaysMissed(habit, todayKey) : 0;
  const showMissedBadge = daysMissed >= 3;
  const missedColor = daysMissed >= 7 ? "#FF3B30" : "#FFB300";

  const translateX = useRef(new Animated.Value(0)).current;
  const snappedOffset = useRef(0);

  // Refs to always hold latest callbacks — avoids stale closure in PanResponder
  const onSwipeActiveRef = useRef(onSwipeActive);
  onSwipeActiveRef.current = onSwipeActive;
  const onSwipeEndRef = useRef(onSwipeEnd);
  onSwipeEndRef.current = onSwipeEnd;

  const snapToValue = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: false,
      damping: 22,
      stiffness: 240,
      mass: 0.7,
    }).start();
  };

  const close = () => {
    snappedOffset.current = 0;
    snapToValue(0);
  };

  const isHorizontal = (gs: any) =>
    Math.abs(gs.dx) > 5 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) => isHorizontal(gs),
      onMoveShouldSetPanResponder: (_, gs) => isHorizontal(gs),
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        onSwipeActiveRef.current?.();
      },
      onPanResponderMove: (_, gs) => {
        const clamped = Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, snappedOffset.current + gs.dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        onSwipeEndRef.current?.();
        const base = snappedOffset.current;

        if (gs.dx < -SWIPE_THRESHOLD && base >= 0) {
          snappedOffset.current = -ACTION_WIDTH;
          snapToValue(-ACTION_WIDTH);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (gs.dx > SWIPE_THRESHOLD && base <= 0) {
          snappedOffset.current = ACTION_WIDTH;
          snapToValue(ACTION_WIDTH);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (gs.dx > SWIPE_THRESHOLD / 2 && base < 0) {
          snappedOffset.current = 0;
          snapToValue(0);
        } else if (gs.dx < -SWIPE_THRESHOLD / 2 && base > 0) {
          snappedOffset.current = 0;
          snapToValue(0);
        } else {
          snapToValue(snappedOffset.current);
        }
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        onSwipeEndRef.current?.();
        snapToValue(snappedOffset.current);
      },
    })
  ).current;

  const handlePress = () => {
    if (snappedOffset.current !== 0) {
      close();
      return;
    }
    if (!isToday) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    toggleHabit(habit.id);
  };

  const handleEdit = () => {
    close();
    setTimeout(onEdit, 250);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    close();
    setTimeout(onDelete, 200);
  };

  return (
    <View style={styles.swipeWrapper}>
      <View style={[styles.actionLeft, { backgroundColor: "#FF8C00", borderRadius: 16 }]}>
        <Pressable onPress={handleEdit} style={styles.actionBtn} hitSlop={8}>
          <Ionicons name="pencil-outline" size={22} color="#fff" />
          <Text style={[styles.actionLabel, { fontFamily: "Outfit_600SemiBold" }]}>Edit</Text>
        </Pressable>
      </View>

      <View style={[styles.actionRight, { backgroundColor: "#FF3B30", borderRadius: 16 }]}>
        <Pressable onPress={handleDelete} style={styles.actionBtn} hitSlop={8}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={[styles.actionLabel, { fontFamily: "Outfit_600SemiBold" }]}>Delete</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[styles.habitRowWrap, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={handlePress}
          style={[
            styles.habitRow,
            {
              backgroundColor: colors.card,
              borderColor: done
                ? catColor + "55"
                : showMissedBadge
                ? missedColor + "70"
                : colors.border,
              borderWidth: showMissedBadge && !done ? 1.5 : 1,
            },
          ]}
        >
          <View style={[styles.habitAccent, { backgroundColor: showMissedBadge && !done ? missedColor : catColor }]} />
          <View style={[styles.habitIconWrap, { backgroundColor: catColor + "20" }]}>
            <Ionicons name={habit.icon as any} size={20} color={catColor} />
          </View>
          <View style={styles.habitInfo}>
            <View style={styles.habitNameRow}>
              <Text
                style={[
                  styles.habitName,
                  {
                    color: done ? colors.textMuted : colors.text,
                    textDecorationLine: done ? "line-through" : "none",
                    fontFamily: "Outfit_600SemiBold",
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {habit.name}
              </Text>
              {showMissedBadge && (
                <View style={[styles.missedBadge, { backgroundColor: missedColor + "22", borderColor: missedColor + "55" }]}>
                  <Ionicons name="alert-circle" size={11} color={missedColor} />
                  <Text style={[styles.missedText, { color: missedColor, fontFamily: "Outfit_700Bold" }]}>
                    {daysMissed}d missed
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.habitMeta}>
              <View style={[styles.catBadge, { backgroundColor: catColor + "20" }]}>
                <Text style={[styles.catBadgeText, { color: catColor, fontFamily: "Outfit_500Medium" }]}>
                  {habit.category}
                </Text>
              </View>
              {!!habit.timeSlot && (
                <View style={styles.timeSlotRow}>
                  <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                  <Text style={[styles.timeSlotText, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                    {habit.timeSlot}
                  </Text>
                </View>
              )}
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
          <Pressable
            onPress={() => {
              if (snappedOffset.current !== 0) { close(); return; }
              Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
              toggleHabit(habit.id);
            }}
            style={[
              styles.checkbox,
              {
                backgroundColor: done ? catColor : "transparent",
                borderColor: done ? catColor : colors.border,
              },
            ]}
            hitSlop={8}
          >
            {done && <Ionicons name="checkmark" size={16} color="#fff" />}
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function TodayScreen() {
  const { colors } = useTheme();
  const { habits, isCompletedOnDate, todayKey, removeHabit } = useHabits();
  const { profile, getInitials } = useUser();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<HabitCategory>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const activeSwipes = useRef(0);

  // Build Mon–Sun for current week
  const weekDays = useMemo(() => {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
    });
  }, []);

  // Day index: 0=Mon … 6=Sun
  const selectedDayIndex = useMemo(() => {
    const dow = new Date(selectedDay + "T00:00:00").getDay();
    return dow === 0 ? 6 : dow - 1;
  }, [selectedDay]);

  // Habits scheduled for the selected day
  const dayHabits = useMemo(
    () => habits.filter((h) => !h.scheduledDays || h.scheduledDays.includes(selectedDayIndex)),
    [habits, selectedDayIndex]
  );

  const completedCount = dayHabits.filter((h) => isCompletedOnDate(h, selectedDay)).length;
  const progress = dayHabits.length ? completedCount / dayHabits.length : 0;

  const filtered = useMemo(() => {
    const list =
      selectedCategories.size === 0
        ? dayHabits
        : dayHabits.filter((h) => selectedCategories.has(h.category));
    return [...list].sort(
      (a, b) => parseTimeSlotMinutes(a.timeSlot) - parseTimeSlotMinutes(b.timeSlot)
    );
  }, [dayHabits, selectedCategories]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSwipeActive = useCallback(() => {
    activeSwipes.current += 1;
    setScrollEnabled(false);
  }, []);

  const handleSwipeEnd = useCallback(() => {
    activeSwipes.current = Math.max(0, activeSwipes.current - 1);
    if (activeSwipes.current === 0) setScrollEnabled(true);
  }, []);

  const today    = new Date();
  const dayName  = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr  = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const hour     = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.name.trim().split(/\s+/)[0] ?? "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {firstName ? (
              <Text style={[styles.greetingLabel, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
                {greeting}, {firstName}
              </Text>
            ) : null}
            <Text style={[styles.dayLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>
              {dayName}
            </Text>
            <Text style={[styles.dateLabel, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
              {dateStr}
            </Text>
          </View>
          <View style={styles.avatarColumn}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/profile-edit"); }}
              style={[styles.avatarCircle, { backgroundColor: colors.tint + "20", borderColor: colors.tint + "60" }]}
              hitSlop={6}
            >
              {profile?.profilePicUri ? (
                <Image source={{ uri: profile.profilePicUri }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.tint, fontFamily: "Outfit_800ExtraBold" }]}>
                  {getInitials()}
                </Text>
              )}
            </Pressable>
            {!!profile?.profession && (
              <Text
                style={[styles.avatarProfession, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}
              >
                {profile.profession}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressLeft}>
            <Text style={[styles.progressTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
              Daily Progress
            </Text>
            <Text style={[styles.progressSub, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
              {completedCount} of {dayHabits.length} habits done
            </Text>
            <View style={[styles.progressBarWrap, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(progress * 100)}%` as any, backgroundColor: colors.tint },
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

        {/* Day of week strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekFilterRow}
        >
          {weekDays.map((dateKey, i) => {
            const isSelected = selectedDay === dateKey;
            const isTod = dateKey === todayKey;
            return (
              <Pressable
                key={dateKey}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDay(dateKey); }}
                style={[
                  styles.weekDayChip,
                  {
                    backgroundColor: isSelected ? colors.tint : colors.card,
                    borderColor: isSelected ? colors.tint : isTod ? colors.tint + "55" : colors.border,
                  },
                ]}
              >
                <Text style={[styles.weekDayName, { color: isSelected ? "#000" : isTod ? colors.tint : colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>
                  {DAY_LABELS[i]}
                </Text>
                <Text style={[styles.weekDayNum, { color: isSelected ? "#000" : isTod ? colors.tint : colors.textMuted, fontFamily: "Outfit_800ExtraBold" }]}>
                  {parseInt(dateKey.split("-")[2], 10)}
                </Text>
                {isTod && !isSelected && (
                  <View style={[styles.weekDayDot, { backgroundColor: colors.tint }]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catFilterRow}
        >
          {(["All", ...CATEGORIES] as (HabitCategory | "All")[]).map((cat) => {
            const isAll    = cat === "All";
            const active   = isAll ? selectedCategories.size === 0 : selectedCategories.has(cat as HabitCategory);
            const catColor = isAll ? colors.tint : CATEGORY_COLORS[cat as HabitCategory];
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (isAll) {
                    setSelectedCategories(new Set());
                  } else {
                    setSelectedCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(cat as HabitCategory)) {
                        next.delete(cat as HabitCategory);
                      } else {
                        next.add(cat as HabitCategory);
                      }
                      return next;
                    });
                  }
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? catColor : colors.card,
                    borderColor: active ? catColor : colors.border,
                  },
                ]}
              >
                {!isAll && (
                  <Ionicons
                    name={CATEGORY_ICONS[cat as HabitCategory] as any}
                    size={13}
                    color={active ? "#fff" : catColor}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? "#fff" : colors.textSecondary, fontFamily: "Outfit_600SemiBold" },
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
            filtered.map((habit) => (
              <SwipeableHabitRow
                key={habit.id}
                habit={habit}
                selectedDay={selectedDay}
                onSwipeActive={handleSwipeActive}
                onSwipeEnd={handleSwipeEnd}
                onEdit={() => setEditingHabit(habit)}
                onDelete={() => removeHabit(habit.id)}
              />
            ))
          )}
        </View>

        {dayHabits.length > 0 && (
          <View style={styles.swipeHint}>
            <View style={styles.swipeHintInner}>
              <Ionicons name="arrow-back-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.swipeHintText, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                Swipe left to delete
              </Text>
            </View>
            <View style={styles.swipeHintInner}>
              <Text style={[styles.swipeHintText, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                Swipe right to edit
              </Text>
              <Ionicons name="arrow-forward-outline" size={14} color={colors.textMuted} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.fab, { bottom: insets.bottom + 76, backgroundColor: colors.tint }]}>
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
      <EditHabitModal
        habit={editingHabit}
        visible={editingHabit !== null}
        onClose={() => setEditingHabit(null)}
      />
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
  greetingLabel: { fontSize: 13, marginBottom: 2 },
  dayLabel: { fontSize: 14, marginBottom: 2 },
  dateLabel: { fontSize: 28 },
  avatarColumn: { alignItems: "flex-end", gap: 4 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  avatarProfession: { fontSize: 11, textAlign: "right" },
  avatarImg:    { width: 44, height: 44, borderRadius: 22 },
  avatarText:   { fontSize: 16 },
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
  ringContainer: {
    width: 80,
    height: 80,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  ringLabel: { fontSize: 22, zIndex: 1 },
  weekFilterRow: { paddingBottom: 12, gap: 8 },
  weekDayChip: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 52,
    gap: 2,
  },
  weekDayName: { fontSize: 11, letterSpacing: 0.4 },
  weekDayNum: { fontSize: 18, lineHeight: 22 },
  weekDayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  catFilterRow: { paddingBottom: 14, gap: 8 },
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

  swipeWrapper: {
    position: "relative",
    height: 76,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    flex: 1,
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 11,
  },
  habitRowWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    height: 76,
    paddingLeft: 0,
    paddingRight: 12,
    overflow: "hidden",
  },
  habitAccent: {
    width: 4,
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  habitIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
    marginRight: 12,
    flexShrink: 0,
  },
  habitInfo: { flex: 1, minWidth: 0 },
  habitNameRow: { flexDirection: "row", alignItems: "center", marginBottom: 5, gap: 8 },
  habitName: { fontSize: 15 },
  missedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
  missedText: { fontSize: 10 },
  habitMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 11 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  streakText: { fontSize: 12 },
  timeSlotRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeSlotText: { fontSize: 11 },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  swipeHint: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  swipeHintInner: { flexDirection: "row", alignItems: "center", gap: 4 },
  swipeHintText: { fontSize: 11 },

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
    shadowOpacity: 0.4,
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
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  editHeaderDot: { width: 10, height: 10, borderRadius: 5 },
  modalTitle: { fontSize: 20 },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { padding: 20, paddingBottom: 48 },
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
    flexDirection: "row",
    alignItems: "center",
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
  submitBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  submitBtnText: { fontSize: 16, color: "#fff" },
});
