/**
 * notifications.ts — BabyBloom PH local notification service
 * Wraps expo-notifications for vaccine reminders, weekly summaries,
 * and milestone nudges. All notifications are local (no server push needed).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Configure how notifications appear when app is in foreground ──────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Identifier helpers ─────────────────────────────────────────────────────────

/** Build deterministic notification IDs so we can cancel them later */
function vaccineNotifId(vaccineCode: string, childId: string, type: '3day' | '1day' | 'day_of') {
  return `vaccine_${childId}_${vaccineCode}_${type}`;
}

function weeklyNotifId() { return 'weekly_summary'; }

function milestoneNotifId(childId: string, ageMonths: number) {
  return `milestone_${childId}_${ageMonths}mo`;
}

// ── Permission request ─────────────────────────────────────────────────────────

/**
 * Request notification permission. Call this during onboarding AFTER the user
 * has seen a friendly explanation card (not a cold system prompt).
 * Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false; // Web doesn't support local push

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check whether notification permission has already been granted.
 */
export async function hasPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── Vaccine reminders ─────────────────────────────────────────────────────────

export interface VaccineReminderParams {
  vaccineCode: string;   // used as stable ID, e.g. 'Penta1'
  vaccineName: string;   // display name in notification body
  nextDueDate: string;   // ISO date YYYY-MM-DD
  childId: string;
  childName: string;
}

/**
 * Schedule 3 local notifications for an upcoming vaccine:
 *  - 3 days before due date
 *  - 1 day before due date
 *  - On the due date (9 AM)
 * Safe to call multiple times — cancels previous set first.
 */
export async function scheduleVaccineReminder(params: VaccineReminderParams): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    if (!(await hasPermission())) return;

    const { vaccineCode, vaccineName, nextDueDate, childId, childName } = params;
    const due = new Date(nextDueDate + 'T09:00:00');
    const now = new Date();

    // Cancel any existing reminders for this vaccine first
    await cancelVaccineReminder(vaccineCode, childId);

    const schedule: Array<{ type: '3day' | '1day' | 'day_of'; date: Date; body: string }> = [
      {
        type: '3day',
        date: new Date(due.getTime() - 3 * 24 * 60 * 60 * 1000),
        body: `${childName}'s ${vaccineName} vaccine is due in 3 days. Book your clinic visit! 💉`,
      },
      {
        type: '1day',
        date: new Date(due.getTime() - 1 * 24 * 60 * 60 * 1000),
        body: `Reminder: ${childName}'s ${vaccineName} vaccine is due tomorrow. 💉`,
      },
      {
        type: 'day_of',
        date: due,
        body: `Today is ${childName}'s ${vaccineName} vaccine day! Stay strong, it's just a tiny pinch. 💪🍼`,
      },
    ];

    for (const item of schedule) {
      if (item.date <= now) continue; // Skip past dates
      await Notifications.scheduleNotificationAsync({
        identifier: vaccineNotifId(vaccineCode, childId, item.type),
        content: {
          title: '💉 BabyBloom Vaccine Reminder',
          body:  item.body,
          sound: true,
          data:  { type: 'vaccine', vaccineCode, childId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.date,
        },
      });
    }
  } catch (err) {
    console.warn('[notifications] scheduleVaccineReminder failed:', err);
  }
}

/**
 * Cancel all scheduled vaccine notifications for a specific vaccine + child.
 */
export async function cancelVaccineReminder(vaccineCode: string, childId: string): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    await Promise.all([
      Notifications.cancelScheduledNotificationAsync(vaccineNotifId(vaccineCode, childId, '3day')),
      Notifications.cancelScheduledNotificationAsync(vaccineNotifId(vaccineCode, childId, '1day')),
      Notifications.cancelScheduledNotificationAsync(vaccineNotifId(vaccineCode, childId, 'day_of')),
    ]);
  } catch (err) {
    console.warn('[notifications] cancelVaccineReminder failed:', err);
  }
}

// ── Weekly summary ────────────────────────────────────────────────────────────

/**
 * Schedule a recurring weekly Sunday 7 PM summary nudge.
 * Cancels any existing weekly summary first.
 */
export async function scheduleWeeklySummary(childName: string): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    if (!(await hasPermission())) return;

    await Notifications.cancelScheduledNotificationAsync(weeklyNotifId());

    await Notifications.scheduleNotificationAsync({
      identifier: weeklyNotifId(),
      content: {
        title: '📋 BabyBloom Weekly Check-in',
        body:  `How was ${childName}'s week? Log this week's summary in BabyBloom. 🍼`,
        sound: true,
        data:  { type: 'weekly_summary' },
      },
      trigger: {
        type:    Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,    // Sunday (1 = Sunday in Expo's 1-indexed system)
        hour:    19,   // 7 PM PHT
        minute:  0,
      },
    });
  } catch (err) {
    console.warn('[notifications] scheduleWeeklySummary failed:', err);
  }
}

// ── Milestone nudge ───────────────────────────────────────────────────────────

/**
 * Schedule a one-time milestone nudge notification for the child's next
 * monthly age milestone (fires at 9 AM on that day).
 * E.g., when baby turns 3 months old.
 */
export async function scheduleMilestoneNudge(
  childId: string,
  childName: string,
  birthday: string,
  ageMonths: number,
): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    if (!(await hasPermission())) return;

    // Calculate the date when child turns ageMonths old
    const bday  = new Date(birthday);
    const nudge = new Date(bday);
    nudge.setMonth(nudge.getMonth() + ageMonths);
    nudge.setHours(9, 0, 0, 0);

    if (nudge <= new Date()) return; // Already past

    await Notifications.scheduleNotificationAsync({
      identifier: milestoneNotifId(childId, ageMonths),
      content: {
        title: '🌟 BabyBloom Milestone',
        body:  `${childName} is ${ageMonths} months old today! Tap to see expected milestones for this age. 🎉`,
        sound: true,
        data:  { type: 'milestone', childId, ageMonths },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nudge,
      },
    });
  } catch (err) {
    console.warn('[notifications] scheduleMilestoneNudge failed:', err);
  }
}

/**
 * Schedule milestone nudges for all upcoming month birthdays
 * up to 24 months.
 */
export async function scheduleAllMilestoneNudges(
  childId: string,
  childName: string,
  birthday: string,
): Promise<void> {
  const ageMonths = Math.floor(
    (Date.now() - new Date(birthday).getTime()) / (30.44 * 24 * 60 * 60 * 1000),
  );
  // Schedule nudges for the next 6 upcoming milestones (up to 24 months)
  for (let m = ageMonths + 1; m <= Math.min(ageMonths + 6, 24); m++) {
    await scheduleMilestoneNudge(childId, childName, birthday, m);
  }
}
