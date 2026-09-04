import { getAll, resetAll, setAll } from '@/services/localStore';
import * as rosterRepo from '@/services/repositories/rosterRepo';
import type { AvailabilityEntry, Employment, Shift } from '@/services/types';

const WORKPLACE = 'test_workplace_roster';
const EMP_LIMITED = 'user_limited';

function nextMondayIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 1 ? 7 : ((8 - day) % 7) || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

beforeEach(async () => {
  await resetAll();
});

describe('generateDraft (rule-based, not a live AI call)', () => {
  it('never assigns an employee past their own configured weekly limit', async () => {
    await setAll<Employment>('employments', [
      { id: 'emp_limited', userId: EMP_LIMITED, workplaceId: WORKPLACE, roleTitle: 'Tester', hourlyRate: 20, maxWeeklyHours: 4 },
    ]);
    await setAll<AvailabilityEntry>('availability', [
      { userId: EMP_LIMITED, day: 'Mon', available: true, ranges: [{ start: '08:00', end: '22:00' }] },
      { userId: EMP_LIMITED, day: 'Tue', available: true, ranges: [{ start: '08:00', end: '22:00' }] },
      { userId: EMP_LIMITED, day: 'Wed', available: true, ranges: [{ start: '08:00', end: '22:00' }] },
      { userId: EMP_LIMITED, day: 'Thu', available: true, ranges: [{ start: '08:00', end: '22:00' }] },
      { userId: EMP_LIMITED, day: 'Fri', available: true, ranges: [{ start: '08:00', end: '22:00' }] },
      { userId: EMP_LIMITED, day: 'Sat', available: true, ranges: [{ start: '08:00', end: '22:00' }] },
      { userId: EMP_LIMITED, day: 'Sun', available: true, ranges: [{ start: '08:00', end: '22:00' }] },
    ]);

    const draft = await rosterRepo.generateDraft({
      workplaceId: WORKPLACE,
      weekStart: nextMondayIso(),
      roleTitle: 'Tester',
    });

    // Morning is exactly 4h — the employee's whole weekly budget — so
    // exactly one shift should be generated for them, with every other
    // slot left unassigned (no one else could take it in this fixture).
    expect(draft.shifts).toHaveLength(1);
    expect(draft.shifts[0].assignedUserId).toBe(EMP_LIMITED);
    expect(draft.shifts[0].startTime).toBe('08:00');
    expect(draft.status).toBe('draft');
  });

  it('prefers whoever has the fewest hours scheduled so far this week (fair distribution)', async () => {
    await setAll<Employment>('employments', [
      { id: 'emp_a', userId: 'user_a', workplaceId: WORKPLACE, roleTitle: 'Tester', hourlyRate: 20, maxWeeklyHours: 40 },
      { id: 'emp_b', userId: 'user_b', workplaceId: WORKPLACE, roleTitle: 'Tester', hourlyRate: 20, maxWeeklyHours: 40 },
    ]);
    const bothAvailableAllWeek = (userId: string): AvailabilityEntry[] =>
      (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day) => ({
        userId,
        day,
        available: true,
        ranges: [{ start: '08:00', end: '12:00' }],
      }));
    await setAll<AvailabilityEntry>('availability', [
      ...bothAvailableAllWeek('user_a'),
      ...bothAvailableAllWeek('user_b'),
    ]);
    // user_a already has 20h scheduled elsewhere this week; user_b has none.
    const weekStart = nextMondayIso();
    await setAll<Shift>('shifts', [
      {
        id: 'existing',
        workplaceId: WORKPLACE,
        roleTitle: 'Tester',
        date: weekStart,
        startTime: '08:00',
        endTime: '12:00',
        assignedUserId: 'user_a',
        status: 'confirmed',
      },
    ]);
    // Give user_a a big chunk of confirmed hours so they're clearly behind
    // in "fairness" terms for the rest of the week's picks.
    await setAll<Shift>('shifts', [
      ...(await getAll<Shift>('shifts', [])),
      {
        id: 'existing2',
        workplaceId: WORKPLACE,
        roleTitle: 'Tester',
        date: weekStart,
        startTime: '12:00',
        endTime: '20:00',
        assignedUserId: 'user_a',
        status: 'confirmed',
      },
    ]);

    const draft = await rosterRepo.generateDraft({ workplaceId: WORKPLACE, weekStart, roleTitle: 'Tester' });
    const mondaySlot = draft.shifts.find((s) => s.date === weekStart);
    expect(mondaySlot?.assignedUserId).toBe('user_b'); // fewer hours so far
  });
});

describe('publishDraft', () => {
  it('only creates real Shift records once explicitly published, never before', async () => {
    await setAll<Employment>('employments', [
      { id: 'emp_pub', userId: EMP_LIMITED, workplaceId: WORKPLACE, roleTitle: 'Tester', hourlyRate: 20, maxWeeklyHours: 40 },
    ]);
    await setAll<AvailabilityEntry>('availability', [
      { userId: EMP_LIMITED, day: 'Mon', available: true, ranges: [{ start: '08:00', end: '12:00' }] },
    ]);

    const draft = await rosterRepo.generateDraft({
      workplaceId: WORKPLACE,
      weekStart: nextMondayIso(),
      roleTitle: 'Tester',
    });
    expect(draft.shifts.length).toBeGreaterThan(0);

    const shiftsBeforePublish = await getAll<Shift>('shifts', []);
    expect(shiftsBeforePublish.filter((s) => s.createdFromRosterDraftId === draft.id)).toHaveLength(0);

    const published = await rosterRepo.publishDraft(draft.id);
    expect(published.status).toBe('published');

    const shiftsAfterPublish = await getAll<Shift>('shifts', []);
    const createdShifts = shiftsAfterPublish.filter((s) => s.createdFromRosterDraftId === draft.id);
    expect(createdShifts).toHaveLength(draft.shifts.length);
    expect(createdShifts[0].status).toBe('awaiting_confirmation');
  });
});
