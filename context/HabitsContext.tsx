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

export type HabitCategory = "Training" | "Recovery" | "Nutrition" | "Mental";

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  icon: string;
  completedDates: string[];
  createdAt: string;
}

interface HabitsContextValue {
  habits: Habit[];
  todayKey: string;
  toggleHabit: (id: string) => void;
  addHabit: (name: string, category: HabitCategory, icon: string) => void;
  editHabit: (id: string, name: string, category: HabitCategory, icon: string) => void;
  removeHabit: (id: string) => void;
  getStreak: (habit: Habit) => number;
  isCompletedToday: (habit: Habit) => boolean;
  getTodayProgress: () => number;
  getCompletedDays: () => Set<string>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);
const STORAGE_KEY = "@biohack_habits";

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

const DEFAULT_HABITS: Habit[] = [
  {
    id: "1",
    name: "Heavy Compound Lift",
    category: "Training",
    icon: "barbell-outline",
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Cold Shower 3 min",
    category: "Recovery",
    icon: "thermometer-outline",
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "High Protein Meal",
    category: "Nutrition",
    icon: "leaf-outline",
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "10 min Meditation",
    category: "Mental",
    icon: "body-outline",
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "HIIT / Cardio Session",
    category: "Training",
    icon: "flame-outline",
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "8h Sleep Logged",
    category: "Recovery",
    icon: "moon-outline",
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "3L Water Intake",
    category: "Nutrition",
    icon: "water-outline",
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Journaling",
    category: "Mental",
    icon: "book-outline",
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
];

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const todayKey = getTodayKey();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = parsed.map((h: Habit) => ({
              ...h,
              icon: normalizeIcon(h.icon),
            }));
            setHabits(normalized);
          }
        } catch {}
      }
    });
  }, []);

  const persist = useCallback((updated: Habit[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const toggleHabit = useCallback(
    (id: string) => {
      setHabits((prev) => {
        const updated = prev.map((h) => {
          if (h.id !== id) return h;
          const hasToday = h.completedDates.includes(todayKey);
          const completedDates = hasToday
            ? h.completedDates.filter((d) => d !== todayKey)
            : [...h.completedDates, todayKey];
          return { ...h, completedDates };
        });
        persist(updated);
        return updated;
      });
    },
    [todayKey, persist]
  );

  const addHabit = useCallback(
    (name: string, category: HabitCategory, icon: string) => {
      const newHabit: Habit = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        category,
        icon,
        completedDates: [],
        createdAt: new Date().toISOString(),
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
    (id: string, name: string, category: HabitCategory, icon: string) => {
      setHabits((prev) => {
        const updated = prev.map((h) =>
          h.id === id ? { ...h, name, category, icon } : h
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

  const getTodayProgress = useCallback(() => {
    if (!habits.length) return 0;
    const done = habits.filter((h) => h.completedDates.includes(todayKey)).length;
    return done / habits.length;
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
