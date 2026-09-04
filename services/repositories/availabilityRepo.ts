import { getAll, setAll } from '@/services/localStore';
import { seedAvailability } from '@/services/seedData';
import type { AvailabilityEntry } from '@/services/types';

const COLLECTION = 'availability';

export async function getForUser(userId: string): Promise<AvailabilityEntry[]> {
  const all = await getAll<AvailabilityEntry>(COLLECTION, seedAvailability);
  return all.filter((a) => a.userId === userId);
}

/** Replaces this user's whole week (screens edit all 7 days at once). */
export async function setForUser(userId: string, entries: AvailabilityEntry[]): Promise<void> {
  const all = await getAll<AvailabilityEntry>(COLLECTION, seedAvailability);
  const others = all.filter((a) => a.userId !== userId);
  await setAll(COLLECTION, [...others, ...entries]);
}
