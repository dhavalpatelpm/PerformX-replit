import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Habit, HabitCategory } from "@/context/HabitsContext";

const NOTIF_IDS_KEY = "@biohack_notif_ids";

// Show notifications when received (works in foreground too)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

// Parse the END time from a time slot string → returns { hour, minute } for notification
function parseNotifTime(slot?: string): { hour: number; minute: number } {
  const DEFAULT = { hour: 21, minute: 0 }; // 9:00 PM for "Anytime"
  if (!slot || slot.toLowerCase() === "anytime") return DEFAULT;

  const parts = slot.split(/\s*[–\-]\s*/);
  const endStr = parts[parts.length - 1]?.trim();
  if (!endStr) return DEFAULT;

  const match = endStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return DEFAULT;

  let hour = parseInt(match[1], 10);
  const min  = parseInt(match[2], 10);
  const mer  = match[3].toUpperCase();

  if (mer === "AM" && hour === 12) hour = 0;
  if (mer === "PM" && hour !== 12) hour += 12;

  // Add 30-min buffer after the end time
  let h = hour, m = min + 30;
  if (m >= 60) { h += 1; m -= 60; }
  h = Math.min(h, 23); // cap at 11 PM
  return { hour: h, minute: m };
}

// Category-specific motivational lines
const CAT_LINES: Record<HabitCategory, string> = {
  Training:  "Every session you skip is a session your competition doesn't.",
  Recovery:  "Recovery is where the real gains happen — don't skip it.",
  Nutrition: "Your body performs exactly as well as you fuel it.",
  Mental:    "A sharp mind is your biggest competitive edge.",
  Personal:  "The relationships you build today compound into tomorrow's opportunities.",
  Work:      "Consistent deep work is the only shortcut that actually works.",
};

function buildNotification(habit: Habit, categoryRatePct: number): { title: string; body: string } {
  const benefit = Math.min(100, Math.round(categoryRatePct + 8 + Math.random() * 7));
  const line    = CAT_LINES[habit.category] ?? "Stay consistent. Every habit compounds.";

  return {
    title: `Still pending — ${habit.name}`,
    body:  `${line} Knock this off and push your ${habit.category} rate from ${Math.round(categoryRatePct)}% to ${benefit}%+.`,
  };
}

export async function scheduleHabitNotifications(
  habits: Habit[],
  todayKey: string,
  getCategoryRatePct: (cat: HabitCategory) => number
): Promise<void> {
  if (Platform.OS === "web") return;

  // Cancel all previously scheduled notifications and start fresh
  await Notifications.cancelAllScheduledNotificationsAsync();

  const idMap: Record<string, string> = {};
  const now = new Date();

  // Day index for today: 0=Mon … 6=Sun
  const dow      = now.getDay();
  const dayIndex = dow === 0 ? 6 : dow - 1;

  const incompleteToday = habits.filter(h => {
    const scheduled = !h.scheduledDays || h.scheduledDays.includes(dayIndex);
    const done      = h.completedDates.includes(todayKey);
    return scheduled && !done;
  });

  for (const habit of incompleteToday) {
    const { hour, minute } = parseNotifTime(habit.timeSlot);

    // Build the trigger date for today at that hour:minute
    const trigger = new Date();
    trigger.setHours(hour, minute, 0, 0);

    // Skip if the time has already passed today
    if (trigger <= now) continue;

    const catRate       = getCategoryRatePct(habit.category);
    const { title, body } = buildNotification(habit, catRate);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger:  { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
      });
      idMap[habit.id] = id;
    } catch {}
  }

  try {
    await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(idMap));
  } catch {}
}

export async function cancelHabitNotification(habitId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const stored = await AsyncStorage.getItem(NOTIF_IDS_KEY);
    if (!stored) return;
    const idMap: Record<string, string> = JSON.parse(stored);
    if (idMap[habitId]) {
      await Notifications.cancelScheduledNotificationAsync(idMap[habitId]);
      delete idMap[habitId];
      await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(idMap));
    }
  } catch {}
}
