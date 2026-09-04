import { getAll, resetAll, setAll } from '@/services/localStore';
import * as payrollRepo from '@/services/repositories/payrollRepo';
import type { Employment, PayrollLine, Shift, TimeEntry } from '@/services/types';

const USER = 'test_user_1';
const WORKPLACE = 'test_workplace_1';

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}
function isoDateTime(daysFromNow: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

beforeEach(async () => {
  await resetAll();
  await setAll<Employment>('employments', [
    { id: 'emp_test_1', userId: USER, workplaceId: WORKPLACE, roleTitle: 'Tester', hourlyRate: 20, maxWeeklyHours: 20 },
  ]);
});

describe('getWeeklyScheduledHours', () => {
  it('sums confirmed/awaiting/completed shifts within the current week and respects the configured limit', async () => {
    await setAll<Shift>('shifts', [
      { id: 's1', workplaceId: WORKPLACE, roleTitle: 'Tester', date: isoDate(0), startTime: '09:00', endTime: '17:00', assignedUserId: USER, status: 'confirmed' }, // 8h today
      { id: 's2', workplaceId: WORKPLACE, roleTitle: 'Tester', date: isoDate(1), startTime: '09:00', endTime: '13:00', assignedUserId: USER, status: 'awaiting_confirmation' }, // 4h
      { id: 's3', workplaceId: WORKPLACE, roleTitle: 'Tester', date: isoDate(20), startTime: '09:00', endTime: '17:00', assignedUserId: USER, status: 'confirmed' }, // far outside this week
      { id: 's4', workplaceId: WORKPLACE, roleTitle: 'Tester', date: isoDate(0), startTime: '09:00', endTime: '17:00', assignedUserId: 'someone_else', status: 'confirmed' }, // not this user
    ]);

    const summary = await payrollRepo.getWeeklyScheduledHours(USER);
    expect(summary.scheduledHours).toBe(12);
    expect(summary.limit).toBe(20);
    expect(summary.remainingHours).toBe(8);
  });

  it('ignores cancelled shifts', async () => {
    await setAll<Shift>('shifts', [
      { id: 's1', workplaceId: WORKPLACE, roleTitle: 'Tester', date: isoDate(0), startTime: '09:00', endTime: '17:00', assignedUserId: USER, status: 'cancelled' },
    ]);
    const summary = await payrollRepo.getWeeklyScheduledHours(USER);
    expect(summary.scheduledHours).toBe(0);
  });
});

describe('getPayrollSummary', () => {
  it('computes weekly/monthly earnings from clocked time entries at the employment rate', async () => {
    await setAll<TimeEntry>('time_entries', [
      {
        id: 't1',
        userId: USER,
        workplaceId: WORKPLACE,
        clockIn: isoDateTime(0, 9),
        clockOut: isoDateTime(0, 17), // 8h
        breakMinutes: 30,
      },
    ]);

    const summary = await payrollRepo.getPayrollSummary(USER);
    // 8h - 0.5h break = 7.5h * $20/hr = $150
    expect(summary.weeklyEarnings).toBeCloseTo(150);
    expect(summary.monthlyEarnings).toBeCloseTo(150);
    expect(summary.byWorkplace).toEqual([{ workplaceId: WORKPLACE, hours: 7.5, amount: 150 }]);
  });
});

describe('clockIn / clockOut', () => {
  it('refuses a second clock-in while one is already open', async () => {
    await payrollRepo.clockIn({ userId: USER, workplaceId: WORKPLACE });
    await expect(payrollRepo.clockIn({ userId: USER, workplaceId: WORKPLACE })).rejects.toThrow();
  });

  it('clocking out closes the open entry', async () => {
    const entry = await payrollRepo.clockIn({ userId: USER, workplaceId: WORKPLACE });
    const closed = await payrollRepo.clockOut(entry.id, 15);
    expect(closed.clockOut).toBeDefined();
    expect(await payrollRepo.getOpenEntryForUser(USER)).toBeUndefined();
  });
});

describe('runPayroll / markPaid', () => {
  it('turns unpaid time entries into a pending payroll line, then can be marked paid', async () => {
    await setAll<TimeEntry>('time_entries', [
      {
        id: 't1',
        userId: USER,
        workplaceId: WORKPLACE,
        clockIn: isoDateTime(-2, 9),
        clockOut: isoDateTime(-2, 17),
        breakMinutes: 0,
      },
    ]);

    const created = await payrollRepo.runPayroll({
      workplaceId: WORKPLACE,
      periodStart: isoDate(-14),
      periodEnd: isoDate(1),
    });
    expect(created).toHaveLength(1);
    expect(created[0].status).toBe('pending_payment');
    expect(created[0].amount).toBeCloseTo(160); // 8h * $20

    const paid = await payrollRepo.markPaid(created[0].id);
    expect(paid.status).toBe('paid');

    // The collection lazily seeds from services/seedData.ts's demo payroll
    // history on first access (same pattern every repo uses), so this test
    // workplace's new line coexists with that seeded row rather than
    // replacing it.
    const allLines = await getAll<PayrollLine>('payroll_lines', []);
    expect(allLines.filter((l) => l.workplaceId === WORKPLACE)).toHaveLength(1);
  });
});
