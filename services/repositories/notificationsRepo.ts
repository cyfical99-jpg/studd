import { getAll, newId, update, upsert } from '@/services/localStore';
import { seedNotifications } from '@/services/seedData';
import { scheduleLocalNotification } from '@/services/notifications';
import type { NotificationKind, NotificationRecord } from '@/services/types';

const COLLECTION = 'notifications';

export async function getForUser(userId: string): Promise<NotificationRecord[]> {
  const all = await getAll<NotificationRecord>(COLLECTION, seedNotifications);
  return all
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Writes the in-app notification record AND, best-effort, fires a local
 * device notification (see services/notifications.ts) — this works fully
 * without a push server for in-session/foreground demos; a real remote
 * push (server → device while the app is closed) needs Phase 4's backend
 * to be live so it can call the Expo Push API with this user's token. */
export async function notifyUser(params: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  relatedShiftId?: string;
}): Promise<NotificationRecord> {
  const record: NotificationRecord = {
    id: newId('notif'),
    userId: params.userId,
    kind: params.kind,
    title: params.title,
    body: params.body,
    read: false,
    createdAt: new Date().toISOString(),
    relatedShiftId: params.relatedShiftId,
  };
  await upsert<NotificationRecord>(COLLECTION, seedNotifications, record);
  await scheduleLocalNotification({ title: params.title, body: params.body });
  return record;
}

export async function markRead(id: string): Promise<void> {
  await update<NotificationRecord>(COLLECTION, seedNotifications, id, { read: true });
}
