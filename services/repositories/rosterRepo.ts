import { getAll, newId, setAll, update, upsert } from '@/services/localStore';
import { notifyUser } from '@/services/repositories/notificationsRepo';
import { getForUser as getAvailabilityForUser } from '@/services/repositories/availabilityRepo';
import { getForWorkplace as getShiftsForWorkplace } from '@/services/repositories/shiftsRepo';
import { getEmploymentsForWorkplace } from '@/services/repositories/workplacesRepo';
import type { DaySession, RosterDraft, RosterDraftShift, Shift, TimeRange, Weekday } from '@/services/types';

const COLLECTION = 'roster_drafts';
const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SESSION_TIMES: Record<DaySession, { start: string; end: string; hours: number }> = {
  morning: { start: '08:00', end: '12:00', hours: 4 },
  afternoon: { start: '12:00', end: '17:00', hours: 5 },
  evening: { start: '17:00', end: '22:00', hours: 5 },
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** True if this custom range fully covers the given window — an employee who
 * is only available for PART of a session (e.g. 12:00-14:00 of a 12:00-17:00
 * afternoon slot) shouldn't be assigned the whole thing. */
function rangeCovers(range: TimeRange, windowStart: string, windowEnd: string): boolean {
  return toMinutes(range.start) <= toMinutes(windowStart) && toMinutes(range.end) >= toMinutes(windowEnd);
}

export async function getDraftsForWorkplace(workplaceId: string): Promise<RosterDraft[]> {
  const all = await getAll<RosterDraft>(COLLECTION, []);
  return all.filter((d) => d.workplaceId === workplaceId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDraftById(id: string): Promise<RosterDraft | undefined> {
  const all = await getAll<RosterDraft>(COLLECTION, []);
  return all.find((d) => d.id === id);
}

function dateForWeekday(weekStartIso: string, weekday: Weekday): string {
  const idx = WEEKDAYS.indexOf(weekday);
  const d = new Date(weekStartIso);
  d.setDate(d.getDate() + idx);
  return d.toISOString().slice(0, 10);
}

/**
 * Rule-based roster generator — NOT a live LLM call. It's a deterministic
 * "greedy fair-share" algorithm: for every day/session, assign whichever
 * available, under-their-limit employee currently has the fewest scheduled
 * hours this week, so no one shift ends up hogging every slot.
 *
 * Swapping this for a real AI suggestion later just means replacing this
 * function's body with a call to your backend (never call an LLM API
 * directly from the mobile client — proxy it server-side once Phase 4's
 * backend exists) and keeping the same RosterDraft shape.
 */
export async function generateDraft(params: {
  workplaceId: string;
  weekStart: string; // ISO date, a Monday
  roleTitle: string;
}): Promise<RosterDraft> {
  const [employments, existingShifts] = await Promise.all([
    getEmploymentsForWorkplace(params.workplaceId),
    getShiftsForWorkplace(params.workplaceId),
  ]);

  const availabilityByUser = new Map<string, Awaited<ReturnType<typeof getAvailabilityForUser>>>();
  for (const employment of employments) {
    availabilityByUser.set(employment.userId, await getAvailabilityForUser(employment.userId));
  }

  // Track running hours per user across this generation pass, seeded from
  // whatever they're already scheduled for this week (so we don't blow
  // past their limit purely within the new draft).
  const weekEndExclusive = new Date(params.weekStart);
  weekEndExclusive.setDate(weekEndExclusive.getDate() + 7);
  const hoursSoFar = new Map<string, number>();
  for (const employment of employments) {
    const already = existingShifts
      .filter(
        (s) =>
          s.assignedUserId === employment.userId &&
          s.status !== 'cancelled' &&
          new Date(s.date) >= new Date(params.weekStart) &&
          new Date(s.date) < weekEndExclusive
      )
      .reduce((sum, s) => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        return sum + (eh + em / 60 - (sh + sm / 60));
      }, 0);
    hoursSoFar.set(employment.userId, already);
  }

  const draftShifts: RosterDraftShift[] = [];

  for (const weekday of WEEKDAYS) {
    for (const session of ['morning', 'afternoon', 'evening'] as DaySession[]) {
      const candidates = employments
        .filter((e) => {
          const avail = availabilityByUser.get(e.userId) ?? [];
          const day = avail.find((a) => a.day === weekday);
          const { start, end } = SESSION_TIMES[session];
          if (!day?.available || !day.ranges.some((r) => rangeCovers(r, start, end))) return false;
          const projected = (hoursSoFar.get(e.userId) ?? 0) + SESSION_TIMES[session].hours;
          return projected <= e.maxWeeklyHours;
        })
        .sort((a, b) => (hoursSoFar.get(a.userId) ?? 0) - (hoursSoFar.get(b.userId) ?? 0));

      const chosen = candidates[0];
      if (!chosen) continue; // left unassigned — manager can fill it manually

      hoursSoFar.set(chosen.userId, (hoursSoFar.get(chosen.userId) ?? 0) + SESSION_TIMES[session].hours);
      draftShifts.push({
        id: newId('draftshift'),
        workplaceId: params.workplaceId,
        roleTitle: params.roleTitle,
        date: dateForWeekday(params.weekStart, weekday),
        startTime: SESSION_TIMES[session].start,
        endTime: SESSION_TIMES[session].end,
        assignedUserId: chosen.userId,
        aiSuggested: true,
        aiReason: `Available ${weekday.toLowerCase()} ${session} with the fewest hours scheduled so far this week (${(hoursSoFar.get(chosen.userId)! - SESSION_TIMES[session].hours).toFixed(0)}h).`,
      });
    }
  }

  const draft: RosterDraft = {
    id: newId('roster'),
    workplaceId: params.workplaceId,
    weekStart: params.weekStart,
    status: 'draft',
    shifts: draftShifts,
    createdAt: new Date().toISOString(),
  };
  await upsert<RosterDraft>(COLLECTION, [], draft);
  return draft;
}

/** Manager hand-edits (reassign/remove/change time) before approving. */
export async function saveDraftEdits(draftId: string, shifts: RosterDraftShift[]): Promise<RosterDraft> {
  return update<RosterDraft>(COLLECTION, [], draftId, { shifts });
}

/**
 * The ONLY way a draft's shifts become real, employee-facing Shift records
 * — always an explicit manager action, never automatic. Notifies every
 * assigned employee once published.
 */
export async function publishDraft(draftId: string): Promise<RosterDraft> {
  const draft = await getDraftById(draftId);
  if (!draft) throw new Error('Roster draft not found.');
  if (draft.status === 'published') return draft;

  const existingShifts = await getAll<Shift>('shifts', []);
  const newShifts: Shift[] = draft.shifts
    .filter((s) => s.assignedUserId)
    .map((s) => ({
      id: newId('shift'),
      workplaceId: s.workplaceId,
      roleTitle: s.roleTitle,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      assignedUserId: s.assignedUserId,
      status: 'awaiting_confirmation',
      confirmationDueAt: new Date(new Date(`${s.date}T${s.startTime}`).getTime() - 60 * 60 * 1000).toISOString(),
      createdFromRosterDraftId: draft.id,
    }));
  await setAll('shifts', [...existingShifts, ...newShifts]);

  const notifiedUsers = new Set<string>();
  for (const shift of newShifts) {
    if (shift.assignedUserId && !notifiedUsers.has(shift.assignedUserId)) {
      notifiedUsers.add(shift.assignedUserId);
      await notifyUser({
        userId: shift.assignedUserId,
        kind: 'roster_published',
        title: 'New roster published',
        body: `Your schedule for the week of ${draft.weekStart} is ready — please confirm your shifts.`,
      });
    }
  }

  return update<RosterDraft>(COLLECTION, [], draftId, { status: 'published' });
}
