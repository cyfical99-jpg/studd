import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Local (on-device) notifications only. These fire correctly even when the
 * app is backgrounded on a real device/simulator — no server involved.
 *
 * What this does NOT do: send a push while the app is fully closed on
 * *another* user's device (e.g. notifying a manager the instant an
 * employee's confirmation window lapses, if the manager isn't using the
 * app at that moment). That needs a real remote-push round trip — a
 * server holds Expo push tokens and calls the Expo Push API — which
 * requires Phase 4's backend to be live. The plumbing for that
 * (`registerForPushTokenAsync` below) is in place; wire its token to your
 * backend once one exists.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false; // expo-notifications has no web transport
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (permissionRequested) return false;
  permissionRequested = true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Fires "now" — used by notificationsRepo whenever an in-app notification
 * record is created, so the demo feels real without a push server. */
export async function scheduleLocalNotification(params: { title: string; body: string }): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: params.title, body: params.body },
      trigger: null, // fire immediately
    });
  } catch {
    // Never let a notification failure break the underlying data mutation.
  }
}

/** Schedules a reminder to fire at `at` (used for shift-confirmation
 * reminders) — this survives the app being backgrounded on a real device. */
export async function scheduleAt(params: { title: string; body: string; at: Date }): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: params.title, body: params.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: params.at },
    });
  } catch {
    return null;
  }
}

/** Registers this device for real remote push and returns the Expo push
 * token — hand this to your backend once Phase 4 is live so IT can push to
 * this device from a server. Requires a physical device (not a simulator)
 * and an EAS project id at build time; returns null otherwise. */
export async function registerForPushTokenAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  const granted = await ensureNotificationPermission();
  if (!granted) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}
