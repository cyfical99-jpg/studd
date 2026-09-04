import { getAll, newId, update, upsert } from '@/services/localStore';
import { seedTimeOffRequests } from '@/services/seedData';
import { notifyUser } from '@/services/repositories/notificationsRepo';
import {
  getEmploymentsForUser,
  getEmploymentsForWorkplace,
  getWorkplaceById,
} from '@/services/repositories/workplacesRepo';
import type { TimeOffRequest } from '@/services/types';

const COLLECTION = 'time_off_requests';

export async function getForUser(userId: string): Promise<TimeOffRequest[]> {
  const all = await getAll<TimeOffRequest>(COLLECTION, seedTimeOffRequests);
  return all.filter((r) => r.userId === userId).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function getForWorkplace(workplaceId: string): Promise<TimeOffRequest[]> {
  // A user's time off applies across all their workplaces, but a manager
  // only needs to see requests from people who work for them here.
  const employments = await getEmploymentsForWorkplace(workplaceId);
  const userIds = new Set(employments.map((e) => e.userId));
  const all = await getAll<TimeOffRequest>(COLLECTION, seedTimeOffRequests);
  return all.filter((r) => userIds.has(r.userId)).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function create(params: {
  userId: string;
  startDate: string;
  endDate: string;
  reasonType: string;
  note?: string;
}): Promise<TimeOffRequest> {
  const request: TimeOffRequest = {
    id: newId('timeoff'),
    userId: params.userId,
    startDate: params.startDate,
    endDate: params.endDate,
    reasonType: params.reasonType,
    note: params.note,
    status: 'pending',
  };
  await upsert<TimeOffRequest>(COLLECTION, seedTimeOffRequests, request);

  const employments = await getEmploymentsForUser(params.userId);
  const notified = new Set<string>();
  for (const employment of employments) {
    const workplace = await getWorkplaceById(employment.workplaceId);
    if (workplace && !notified.has(workplace.managerId)) {
      notified.add(workplace.managerId);
      await notifyUser({
        userId: workplace.managerId,
        kind: 'time_off_decision',
        title: 'New time-off request',
        body: `A team member requested time off from ${params.startDate} to ${params.endDate}.`,
      });
    }
  }
  return request;
}

export async function decide(id: string, status: 'approved' | 'declined'): Promise<TimeOffRequest> {
  const updated = await update<TimeOffRequest>(COLLECTION, seedTimeOffRequests, id, { status });
  await notifyUser({
    userId: updated.userId,
    kind: 'time_off_decision',
    title: status === 'approved' ? 'Time off approved' : 'Time off declined',
    body: `Your request for ${updated.startDate} to ${updated.endDate} was ${status}.`,
  });
  return updated;
}
