import { getAll, newId, update, upsert } from '@/services/localStore';
import { seedReleaseRequests, seedShifts } from '@/services/seedData';
import { notifyUser } from '@/services/repositories/notificationsRepo';
import { getWorkplaceById } from '@/services/repositories/workplacesRepo';
import type { Shift, ShiftHistoryEvent, ShiftReleaseRequest } from '@/services/types';

const SHIFTS = 'shifts';
const RELEASE_REQUESTS = 'shift_release_requests';

// ---- Reads -----------------------------------------------------------

export async function getAllShifts(): Promise<Shift[]> {
  return getAll<Shift>(SHIFTS, seedShifts);
}

export async function getForUser(userId: string): Promise<Shift[]> {
  const all = await getAllShifts();
  return all.filter((s) => s.assignedUserId === userId);
}

export async function getForWorkplace(workplaceId: string): Promise<Shift[]> {
  const all = await getAllShifts();
  return all.filter((s) => s.workplaceId === workplaceId);
}

export async function getOpenForWorkplaces(workplaceIds: string[]): Promise<Shift[]> {
  const all = await getAllShifts();
  const set = new Set(workplaceIds);
  return all.filter((s) => s.status === 'published' && s.assignedUserId === null && set.has(s.workplaceId));
}

export async function getReleaseRequestsForWorkplace(workplaceId: string): Promise<
  (ShiftReleaseRequest & { shift: Shift })[]
> {
  const [requests, shifts] = await Promise.all([
    getAll<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests),
    getAllShifts(),
  ]);
  return requests
    .map((r) => {
      const shift = shifts.find((s) => s.id === r.shiftId);
      return shift && shift.workplaceId === workplaceId ? { ...r, shift } : null;
    })
    .filter((r): r is ShiftReleaseRequest & { shift: Shift } => r !== null);
}

// ---- Mutations: manager shift creation ---------------------------------

/** Manager creates a shift directly (outside the AI roster flow). Leaving
 * `assignedUserId` unset publishes it as open for anyone to request. */
export async function createShift(params: {
  workplaceId: string;
  roleTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedUserId?: string;
}): Promise<Shift> {
  const shift: Shift = {
    id: newId('shift'),
    workplaceId: params.workplaceId,
    roleTitle: params.roleTitle,
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    assignedUserId: params.assignedUserId ?? null,
    status: params.assignedUserId ? 'awaiting_confirmation' : 'published',
    confirmationDueAt: params.assignedUserId
      ? new Date(new Date(`${params.date}T${params.startTime}`).getTime() - 60 * 60 * 1000).toISOString()
      : undefined,
  };
  await upsert<Shift>(SHIFTS, seedShifts, shift);

  if (shift.assignedUserId) {
    await notifyUser({
      userId: shift.assignedUserId,
      kind: 'shift_assigned',
      title: 'New shift assigned',
      body: `You've been assigned a ${shift.roleTitle} shift on ${shift.date}.`,
      relatedShiftId: shift.id,
    });
  }
  return shift;
}

// ---- Mutations: confirmation ------------------------------------------

export async function confirmShift(shiftId: string, userId: string): Promise<Shift> {
  const shifts = await getAllShifts();
  const shift = shifts.find((s) => s.id === shiftId);
  if (!shift || shift.assignedUserId !== userId) throw new Error('Shift not found for this user.');
  return update<Shift>(SHIFTS, seedShifts, shiftId, {
    status: 'confirmed',
    confirmationDueAt: undefined,
  });
}

/** Client-side stand-in for a server cron job (see services/notifications.ts's
 * header comment on why this can't be a true always-on server check without
 * Phase 4's backend). Call this on app foreground/session-restore: any shift
 * still `awaiting_confirmation` past its due time flips to
 * `requires_attention` and the manager is notified. */
export async function checkAndEscalateOverdueShifts(): Promise<number> {
  const shifts = await getAllShifts();
  const now = Date.now();
  const overdue = shifts.filter(
    (s) => s.status === 'awaiting_confirmation' && s.confirmationDueAt && new Date(s.confirmationDueAt).getTime() < now
  );

  for (const shift of overdue) {
    await update<Shift>(SHIFTS, seedShifts, shift.id, { status: 'requires_attention' });
    const workplace = await getWorkplaceById(shift.workplaceId);
    if (workplace) {
      await notifyUser({
        userId: workplace.managerId,
        kind: 'shift_escalation',
        title: 'Shift needs attention',
        body: `A ${shift.roleTitle} shift on ${shift.date} was not confirmed in time.`,
        relatedShiftId: shift.id,
      });
    }
  }
  return overdue.length;
}

// ---- Mutations: open-shift requests -----------------------------------

/** An employee requesting a never-assigned open shift the manager already
 * published — still requires the employee's own confirmation afterward
 * (same as any assignment), so the manager retains final say by simply
 * reassigning before that confirmation happens. */
export async function requestOpenShift(shiftId: string, userId: string): Promise<Shift> {
  const shifts = await getAllShifts();
  const shift = shifts.find((s) => s.id === shiftId);
  if (!shift || shift.status !== 'published' || shift.assignedUserId) {
    throw new Error('This shift is no longer open.');
  }
  return update<Shift>(SHIFTS, seedShifts, shiftId, {
    assignedUserId: userId,
    status: 'awaiting_confirmation',
    confirmationDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  });
}

// ---- Mutations: release & replacement workflow (Feature 1) -------------

function historyEvent(actorUserId: string, action: string): ShiftHistoryEvent {
  return { at: new Date().toISOString(), actorUserId, action };
}

/** Step 1: employee asks to release a shift they can't work. */
export async function requestRelease(params: {
  shiftId: string;
  userId: string;
  reason: string;
}): Promise<ShiftReleaseRequest> {
  const shifts = await getAllShifts();
  const shift = shifts.find((s) => s.id === params.shiftId);
  if (!shift || shift.assignedUserId !== params.userId) throw new Error('Shift not found for this user.');

  const request: ShiftReleaseRequest = {
    id: newId('release'),
    shiftId: params.shiftId,
    requestedByUserId: params.userId,
    reason: params.reason,
    status: 'pending_manager_review',
    interestedUserIds: [],
    history: [historyEvent(params.userId, 'Requested to release this shift.')],
    createdAt: new Date().toISOString(),
  };
  await upsert<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests, request);

  const workplace = await getWorkplaceById(shift.workplaceId);
  if (workplace) {
    await notifyUser({
      userId: workplace.managerId,
      kind: 'release_request',
      title: 'Shift release request',
      body: `A team member asked to release their ${shift.roleTitle} shift on ${shift.date}.`,
      relatedShiftId: shift.id,
    });
  }
  return request;
}

/** Step 2 (manager): approve → shift becomes open for other employees to
 * express interest in. The original assignee is NOT removed until a
 * replacement is chosen, so the shift stays covered in the meantime. */
export async function approveRelease(requestId: string, managerId: string): Promise<ShiftReleaseRequest> {
  const requests = await getAll<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests);
  const request = requests.find((r) => r.id === requestId);
  if (!request) throw new Error('Release request not found.');

  return update<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests, requestId, {
    status: 'approved_open_for_claims',
    history: [...request.history, historyEvent(managerId, 'Manager approved the release; now open for claims.')],
  });
}

export async function declineRelease(requestId: string, managerId: string): Promise<ShiftReleaseRequest> {
  const requests = await getAll<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests);
  const request = requests.find((r) => r.id === requestId);
  if (!request) throw new Error('Release request not found.');

  const updated = await update<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests, requestId, {
    status: 'declined',
    history: [...request.history, historyEvent(managerId, 'Manager declined the release request.')],
  });
  await notifyUser({
    userId: request.requestedByUserId,
    kind: 'release_approved', // decision notification either way
    title: 'Release request declined',
    body: "Your manager declined your shift release request — you're still scheduled for it.",
    relatedShiftId: request.shiftId,
  });
  return updated;
}

/** Step 3: another employee expresses interest in an open (released) shift. */
export async function expressInterest(requestId: string, userId: string): Promise<ShiftReleaseRequest> {
  const requests = await getAll<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests);
  const request = requests.find((r) => r.id === requestId);
  if (!request || request.status !== 'approved_open_for_claims') {
    throw new Error('This shift is not open for claims.');
  }
  if (request.interestedUserIds.includes(userId)) return request;

  return update<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests, requestId, {
    interestedUserIds: [...request.interestedUserIds, userId],
    history: [...request.history, historyEvent(userId, 'Expressed interest in taking this shift.')],
  });
}

/** Step 4 (manager): pick the replacement from the interested list — the
 * only way a shift ever changes hands. Updates the shift, closes the
 * request, and notifies both the new assignee and the original requester. */
export async function approveReplacement(params: {
  requestId: string;
  chosenUserId: string;
  managerId: string;
}): Promise<ShiftReleaseRequest> {
  const requests = await getAll<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests);
  const request = requests.find((r) => r.id === params.requestId);
  if (!request || request.status !== 'approved_open_for_claims') {
    throw new Error('This request is not awaiting a replacement decision.');
  }
  if (!request.interestedUserIds.includes(params.chosenUserId)) {
    throw new Error('That employee did not express interest in this shift.');
  }

  await update<Shift>(SHIFTS, seedShifts, request.shiftId, {
    assignedUserId: params.chosenUserId,
    status: 'awaiting_confirmation',
    confirmationDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  });

  const updated = await update<ShiftReleaseRequest>(RELEASE_REQUESTS, seedReleaseRequests, params.requestId, {
    status: 'filled',
    approvedReplacementUserId: params.chosenUserId,
    history: [...request.history, historyEvent(params.managerId, 'Manager approved the replacement.')],
  });

  await notifyUser({
    userId: params.chosenUserId,
    kind: 'replacement_approved',
    title: 'Shift confirmed to you',
    body: 'Your manager approved you for the released shift — please confirm it.',
    relatedShiftId: request.shiftId,
  });
  await notifyUser({
    userId: request.requestedByUserId,
    kind: 'release_approved',
    title: 'Shift covered',
    body: 'Your released shift has been picked up by a teammate.',
    relatedShiftId: request.shiftId,
  });

  return updated;
}
