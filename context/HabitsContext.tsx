import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { scheduleHabitNotifications, cancelHabitNotification } from "@/lib/notifications";

export type HabitCategory = "Training" | "Recovery" | "Nutrition" | "Mental" | "Personal" | "Work";

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  icon: string;
  completedDates: string[];
  createdAt: string;
  scheduledDays?: number[]; // 0=Mon … 6=Sun; undefined = every day
  timeSlot?: string;        // e.g. "7:00 AM – 7:10 AM" or "Anytime"
}

interface HabitsContextValue {
  habits: Habit[];
  todayKey: string;
  toggleHabit: (id: string) => void;
  addHabit: (name: string, category: HabitCategory, icon: string, timeSlot?: string) => void;
  editHabit: (id: string, name: string, category: HabitCategory, icon: string, timeSlot?: string) => void;
  removeHabit: (id: string) => void;
  getStreak: (habit: Habit) => number;
  isCompletedToday: (habit: Habit) => boolean;
  isCompletedOnDate: (habit: Habit, dateKey: string) => boolean;
  getTodayProgress: () => number;
  getCompletedDays: () => Set<string>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);
const STORAGE_KEY = "@biohack_habits";
const SEED_VERSION_KEY = "@biohack_seed_version";
const CURRENT_SEED_VERSION = "v4";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function calcStreak(habit: Habit): number {
  if (!habit.completedDates.length) return 0;
  const sorted = [...habit.completedDates].sort().reverse();
  const today = getTodayKey();
  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = checkDate.toISOString().split("T")[0];
    if (sorted.includes(key)) {
      streak++;
    } else if (i > 0) {
      break;
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

const ICON_NORMALIZE: Record<string, string> = {
  barbell: "barbell-outline",
  thermometer: "thermometer-outline",
  nutrition: "leaf-outline",
  brain: "body-outline",
  flame: "flame-outline",
  moon: "moon-outline",
  water: "water-outline",
  book: "book-outline",
};

function normalizeIcon(icon: string): string {
  return ICON_NORMALIZE[icon] ?? icon;
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function h(
  name: string,
  category: HabitCategory,
  icon: string,
  scheduledDays?: number[],
  timeSlot?: string
): Habit {
  return {
    id: makeId(),
    name,
    category,
    icon,
    completedDates: [],
    createdAt: new Date().toISOString(),
    scheduledDays,
    timeSlot,
  };
}

const T = "6:00 PM – 8:00 PM";   // Training block
const P = "8:00 PM – 9:00 PM";   // Personal block

// All-day habits (repeat every day)
const DAILY_HABITS: Habit[] = [
  // Work
  h("CAT Prep",            "Work", "book-outline",         undefined, "8:00 AM – 12:00 PM"),
  h("Product Management",  "Work", "briefcase-outline",    undefined, "2:00 PM – 6:00 PM"),
  h("Business Analytics",  "Work", "stats-chart-outline",  undefined, "9:00 PM – 11:30 PM"),
  // Recovery
  h("Cold Shower 3 min",   "Recovery", "water-outline",    undefined, "7:30 AM – 7:40 AM"),
  h("8 hrs Sleep",         "Recovery", "moon-outline",     undefined, "12:00 AM – 7:00 AM"),
  // Nutrition
  h("High Protein Meal",   "Nutrition", "restaurant-outline", undefined, "1:00 PM – 2:00 PM"),
  h("3L Water Intake",     "Nutrition", "water-outline",   undefined, "Anytime"),
  // Mental
  h("10 min Meditation",   "Mental", "sparkles-outline",   undefined, "7:00 AM – 7:10 AM"),
  h("Journaling",          "Mental", "pencil-outline",     undefined, "Anytime"),
  // Personal
  h("Networking — Talk with Founders", "Personal", "people-outline",        undefined, P),
  h("Social Media",                    "Personal", "phone-portrait-outline", undefined, P),
  h("Family Time",                     "Personal", "home-outline",           undefined, P),
];

// Training habits scheduled per day (0=Mon … 6=Sun)
const TRAINING_HABITS: Habit[] = [
  // Monday — Chest
  h("Chest Workout",       "Training", "barbell-outline",     [0], T),
  h("Aerobics Activity",   "Training", "bicycle-outline",     [0], T),
  h("HIIT / Cardio Session","Training","flame-outline",        [0], T),
  // Tuesday — Back
  h("Back Workout",        "Training", "barbell-outline",     [1], T),
  h("Activity-1",          "Training", "walk-outline",        [1], T),
  h("HIIT / Cardio Session","Training","flame-outline",        [1], T),
  // Wednesday — Shoulders
  h("Shoulder Workout",    "Training", "barbell-outline",     [2], T),
  h("Zumba",               "Training", "body-outline",        [2], T),
  h("HIIT / Cardio Session","Training","flame-outline",        [2], T),
  // Thursday — Triceps + Core
  h("Triceps + Core Workout","Training","barbell-outline",    [3], T),
  h("Activity-2",          "Training", "walk-outline",        [3], T),
  h("HIIT / Cardio Session","Training","flame-outline",        [3], T),
  // Friday — Biceps + Forearms
  h("Biceps + Forearms Workout","Training","barbell-outline", [4], T),
  h("Activity-3",          "Training", "walk-outline",        [4], T),
  h("HIIT / Cardio Session","Training","flame-outline",        [4], T),
  // Saturday — Legs
  h("Legs Workout",        "Training", "barbell-outline",     [5], T),
  h("Yoga",                "Training", "body-outline",        [5], T),
  h("HIIT / Cardio Session","Training","flame-outline",        [5], T),
  // Sunday — Active Recovery
  h("Recovery + Personality Development","Training","accessibility-outline",[6], T),
];

const DEFAULT_HABITS: Habit[] = [...TRAINING_HABITS, ...DAILY_HABITS];

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [todayKey, setTodayKey] = useState(getTodayKey);

  // Auto-refresh when app comes to foreground (e.g. opened next morning)
  useEffect(() => {
    const refresh = (state: AppStateStatus) => {
      if (state === "active") setTodayKey(getTodayKey());
    };
    const sub = AppState.addEventListener("change", refresh);
    return () => sub.remove();
  }, []);

  // Also tick every minute to catch midnight crossover if app stays open
  useEffect(() => {
    const id = setInterval(() => setTodayKey(getTodayKey()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const seedVersion = await AsyncStorage.getItem(SEED_VERSION_KEY);
        if (seedVersion !== CURRENT_SEED_VERSION) {
          // Fresh seed — replace with new schedule
          const fresh = DEFAULT_HABITS.map(h => ({ ...h, id: makeId() }));
          setHabits(fresh);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          await AsyncStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
        } else {
          const val = await AsyncStorage.getItem(STORAGE_KEY);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHabits(parsed.map((h: Habit) => ({ ...h, icon: normalizeIcon(h.icon) })));
            }
          }
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback((updated: Habit[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  // Schedule nudge notifications for today's incomplete habits
  useEffect(() => {
    const getCategoryRatePct = (category: HabitCategory): number => {
      const dow = new Date().getDay();
      const di  = dow === 0 ? 6 : dow - 1;
      const cat = habits.filter(h => h.category === category && (!h.scheduledDays || h.scheduledDays.includes(di)));
      if (!cat.length) return 0;
      return (cat.filter(h => h.completedDates.includes(todayKey)).length / cat.length) * 100;
    };
    scheduleHabitNotifications(habits, todayKey, getCategoryRatePct).catch(() => {});
  }, [habits, todayKey]);

  const toggleHabit = useCallback(
    (id: string) => {
      setHabits((prev) => {
        const updated = prev.map((h) => {
          if (h.id !== id) return h;
          const hasToday = h.completedDates.includes(todayKey);
          const completedDates = hasToday
            ? h.completedDates.filter((d) => d !== todayKey)
            : [...h.completedDates, todayKey];
          // Cancel the pending nudge immediately when habit is checked off
          if (!hasToday) cancelHabitNotification(id).catch(() => {});
          return { ...h, completedDates };
        });
        persist(updated);
        return updated;
      });
    },
    [todayKey, persist]
  );

  const addHabit = useCallback(
    (name: string, category: HabitCategory, icon: string, timeSlot?: string) => {
      const newHabit: Habit = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        category,
        icon,
        completedDates: [],
        createdAt: new Date().toISOString(),
        timeSlot: timeSlot?.trim() || undefined,
      };
      setHabits((prev) => {
        const updated = [...prev, newHabit];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const editHabit = useCallback(
    (id: string, name: string, category: HabitCategory, icon: string, timeSlot?: string) => {
      setHabits((prev) => {
        const updated = prev.map((h) =>
          h.id === id ? { ...h, name, category, icon, timeSlot: timeSlot?.trim() || undefined } : h
        );
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const removeHabit = useCallback(
    (id: string) => {
      setHabits((prev) => {
        const updated = prev.filter((h) => h.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const getStreak = useCallback((habit: Habit) => calcStreak(habit), []);

  const isCompletedToday = useCallback(
    (habit: Habit) => habit.completedDates.includes(todayKey),
    [todayKey]
  );

  const isCompletedOnDate = useCallback(
    (habit: Habit, dateKey: string) => habit.completedDates.includes(dateKey),
    []
  );

  const getTodayProgress = useCallback(() => {
    const dow = new Date().getDay();
    const dayIndex = dow === 0 ? 6 : dow - 1;
    const todayHabits = habits.filter(
      (h) => !h.scheduledDays || h.scheduledDays.includes(dayIndex)
    );
    if (!todayHabits.length) return 0;
    const done = todayHabits.filter((h) => h.completedDates.includes(todayKey)).length;
    return done / todayHabits.length;
  }, [habits, todayKey]);

  const getCompletedDays = useCallback(() => {
    const days = new Set<string>();
    habits.forEach((h) => h.completedDates.forEach((d) => days.add(d)));
    return days;
  }, [habits]);

  const value = useMemo(
    () => ({
      habits,
      todayKey,
      toggleHabit,
      addHabit,
      editHabit,
      removeHabit,
      getStreak,
      isCompletedToday,
      isCompletedOnDate,
      getTodayProgress,
      getCompletedDays,
    }),
    [
      habits,
      todayKey,
      toggleHabit,
      addHabit,
      editHabit,
      removeHabit,
      getStreak,
      isCompletedToday,
      isCompletedOnDate,
      getTodayProgress,
      getCompletedDays,
    ]
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used within HabitsProvider");
  return ctx;
}
