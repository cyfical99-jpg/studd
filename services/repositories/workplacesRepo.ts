import { getAll, update } from '@/services/localStore';
import { seedEmployments, seedUsers, seedWorkplaces } from '@/services/seedData';
import { USE_SUPABASE } from '@/services/config';
import type { Employment, UserAccount, Workplace } from '@/services/types';
import type { PublicUser } from '@/services/auth';

function toPublic(user: UserAccount): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function getWorkplacesForManager(managerId: string): Promise<Workplace[]> {
  const all = await getAll<Workplace>('workplaces', seedWorkplaces);
  return all.filter((w) => w.managerId === managerId);
}

export async function getEmploymentsForUser(userId: string): Promise<Employment[]> {
  const all = await getAll<Employment>('employments', seedEmployments);
  return all.filter((e) => e.userId === userId);
}

export async function getEmploymentsForWorkplace(workplaceId: string): Promise<Employment[]> {
  const all = await getAll<Employment>('employments', seedEmployments);
  return all.filter((e) => e.workplaceId === workplaceId);
}

export async function getWorkplaceById(id: string): Promise<Workplace | undefined> {
  const all = await getAll<Workplace>('workplaces', seedWorkplaces);
  return all.find((w) => w.id === id);
}

export async function getUserById(id: string): Promise<PublicUser | undefined> {
  const all = await getAll<UserAccount>('users', seedUsers);
  const match = all.find((u) => u.id === id);
  return match ? toPublic(match) : undefined;
}

/** Local-store only for now (see supabase/README.md's "what's live vs still
 * local" section) — the `profiles` table has no avatar column yet and this
 * device-local file URI wouldn't resolve on anyone else's device anyway.
 * Wiring real cross-device photos means Supabase Storage + that column. */
export async function updateAvatar(userId: string, avatarUri: string | null): Promise<PublicUser> {
  if (USE_SUPABASE) {
    throw new Error("Profile picture upload isn't connected to Supabase yet — it only works in local mode for now.");
  }
  const updated = await update<UserAccount>('users', seedUsers, userId, { avatarUri: avatarUri ?? undefined });
  return toPublic(updated);
}

/** Every employee across every workplace this manager runs — the manager's team. */
export async function listTeamForManager(managerId: string): Promise<
  { user: PublicUser; employment: Employment; workplace: Workplace }[]
> {
  const workplaces = await getWorkplacesForManager(managerId);
  const workplaceIds = new Set(workplaces.map((w) => w.id));
  const employments = (await getAll<Employment>('employments', seedEmployments)).filter((e) =>
    workplaceIds.has(e.workplaceId)
  );
  const users = await getAll<UserAccount>('users', seedUsers);

  return employments
    .map((employment) => {
      const user = users.find((u) => u.id === employment.userId);
      const workplace = workplaces.find((w) => w.id === employment.workplaceId);
      if (!user || !workplace) return null;
      return { user: toPublic(user), employment, workplace };
    })
    .filter((row): row is { user: PublicUser; employment: Employment; workplace: Workplace } => row !== null);
}
