import { getAll, newId, setAll, update, upsert } from '@/services/localStore';
import { seedPayrollLines, seedTimeEntries } from '@/services/seedData';
import { getForUser as getShiftsForUser, getForWorkplace as getShiftsForWorkplace } from '@/services/repositories/shiftsRepo';
import { getEmploymentsForUser, getEmploymentsForWorkplace } from '@/services/repositories/workplacesRepo';
import type { Employment, PayrollLine, Shift, TimeEntry } from '@/services/types';

const TIME_ENTRIES = 'time_entries';
const PAYROLL_LINES = 'payroll_lines';

// ---- Time clock --------------------------------------------------------

export async function getEntriesForUser(userId: string): Promise<TimeEntry[]> {
  const all = await getAll<TimeEntry>(TIME_ENTRIES, seedTimeEntries);
  return all.filter((e) => e.userId === userId);
}

export async function getOpenEntryForUser(userId: string): Promise<TimeEntry | undefined> {
  const entries = await getEntriesForUser(userId);
  return entries.find((e) => !e.clockOut);
}

export async function clockIn(params: { userId: string; workplaceId: string; shiftId?: string }): Promise<TimeEntry> {
  const existing = await getOpenEntryForUser(params.userId);
  if (existing) throw new Error('Already clocked in — clock out first.');

  const entry: TimeEntry = {
    id: newId('time'),
    userId: params.userId,
    workplaceId: params.workplaceId,
    shiftId: params.shiftId,
    clockIn: new Date().toISOString(),
    breakMinutes: 0,
  };
  await upsert<TimeEntry>(TIME_ENTRIES, seedTimeEntries, entry);
  return entry;
}

export async function clockOut(entryId: string, breakMinutes = 0): Promise<TimeEntry> {
  return update<TimeEntry>(TIME_ENTRIES, seedTimeEntries, entryId, {
    clockOut: new Date().toISOString(),
    breakMinutes,
  });
}

function entryHours(entry: TimeEntry): number {
  if (!entry.clockOut) return 0;
  const ms = new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime();
  return Math.max(0, ms / 3600000 - entry.breakMinutes / 60);
}

function shiftHours(shift: Shift): number {
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  return Math.max(0, eh + em / 60 - (sh + sm / 60));
}

// ---- Week/month helpers -------------------------------------------------

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function isWithin(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

// ---- The user's configured tracking limit -----------------------------
// A single limit the user sets once (see app/profile-edit.tsx). Modeled on
// Employment.maxWeeklyHours for now — all of a user's employments are kept
// in sync to that one value rather than adding a separate settings table.
export async function getConfiguredWeeklyLimit(userId: string): Promise<number> {
  const employments = await getEmploymentsForUser(userId);
  return employments[0]?.maxWeeklyHours ?? 24;
}

export async function setConfiguredWeeklyLimit(userId: string, hours: number): Promise<void> {
  const all = await getAll<Employment>('employments', []);
  const next = all.map((e) => (e.userId === userId ? { ...e, maxWeeklyHours: hours } : e));
  await setAll('employments', next);
}

// ---- Hours summaries ----------------------------------------------------

export type WeeklyHoursSummary = {
  scheduledHours: number;
  limit: number;
  remainingHours: number;
};

/** "Scheduled hours" = confirmed/awaiting/completed shifts this week, which
 * is what Feature 2 asks to track against the user's own limit. */
export async function getWeeklyScheduledHours(userId: string, reference = new Date()): Promise<WeeklyHoursSummary> {
  const start = startOfWeek(reference);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const shifts = await getShiftsForUser(userId);
  const scheduledHours = shifts
    .filter((s) => s.status !== 'cancelled' && isWithin(s.date, start, end))
    .reduce((sum, s) => sum + shiftHours(s), 0);

  const limit = await getConfiguredWeeklyLimit(userId);
  return { scheduledHours, limit, remainingHours: Math.max(0, limit - scheduledHours) };
}

/** For a manager deciding whether to assign more hours to someone. */
export async function getWeeklyScheduledHoursForWorkplace(workplaceId: string, reference = new Date()) {
  const start = startOfWeek(reference);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const [shifts, employments] = await Promise.all([
    getShiftsForWorkplace(workplaceId),
    getEmploymentsForWorkplace(workplaceId),
  ]);

  return employments.map((employment) => {
    const hours = shifts
      .filter(
        (s) => s.assignedUserId === employment.userId && s.status !== 'cancelled' && isWithin(s.date, start, end)
      )
      .reduce((sum, s) => sum + shiftHours(s), 0);
    return { employment, scheduledHours: hours, wouldExceedLimit: hours > employment.maxWeeklyHours };
  });
}

// ---- Payroll --------------------------------------------------------

export type PayrollSummary = {
  weeklyEarnings: number;
  monthlyEarnings: number;
  pendingAmount: number;
  paidAmount: number;
  estimatedUpcoming: number;
  byWorkplace: { workplaceId: string; hours: number; amount: number }[];
};

export async function getPayrollSummary(userId: string, reference = new Date()): Promise<PayrollSummary> {
  const [employments, entries, lines, shifts] = await Promise.all([
    getEmploymentsForUser(userId),
    getEntriesForUser(userId),
    getAll<PayrollLine>(PAYROLL_LINES, seedPayrollLines).then((all) => all.filter((l) => l.userId === userId)),
    getShiftsForUser(userId),
  ]);
  const rateFor = (workplaceId: string) => employments.find((e) => e.workplaceId === workplaceId)?.hourlyRate ?? 0;

  const weekStart = startOfWeek(reference);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthStart = startOfMonth(reference);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const weeklyEarnings = entries
    .filter((e) => isWithin(e.clockIn, weekStart, weekEnd))
    .reduce((sum, e) => sum + entryHours(e) * rateFor(e.workplaceId), 0);
  const monthlyEarnings = entries
    .filter((e) => isWithin(e.clockIn, monthStart, monthEnd))
    .reduce((sum, e) => sum + entryHours(e) * rateFor(e.workplaceId), 0);

  const pendingAmount = lines.filter((l) => l.status === 'pending_payment').reduce((s, l) => s + l.amount, 0);
  const paidAmount = lines.filter((l) => l.status === 'paid').reduce((s, l) => s + l.amount, 0);

  const now = new Date();
  const estimatedUpcoming = shifts
    .filter((s) => (s.status === 'confirmed' || s.status === 'awaiting_confirmation') && new Date(s.date) >= now)
    .reduce((sum, s) => sum + shiftHours(s) * rateFor(s.workplaceId), 0);

  const byWorkplaceMap = new Map<string, { hours: number; amount: number }>();
  for (const e of entries) {
    const hrs = entryHours(e);
    const prev = byWorkplaceMap.get(e.workplaceId) ?? { hours: 0, amount: 0 };
    byWorkplaceMap.set(e.workplaceId, { hours: prev.hours + hrs, amount: prev.amount + hrs * rateFor(e.workplaceId) });
  }

  return {
    weeklyEarnings,
    monthlyEarnings,
    pendingAmount,
    paidAmount,
    estimatedUpcoming,
    byWorkplace: Array.from(byWorkplaceMap.entries()).map(([workplaceId, v]) => ({ workplaceId, ...v })),
  };
}

/** Manager action: turns unpaid time entries for a period into payroll
 * lines per employee, ready to mark paid once actually paid outside the app. */
export async function runPayroll(params: {
  workplaceId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<PayrollLine[]> {
  const employments = await getEmploymentsForWorkplace(params.workplaceId);
  const created: PayrollLine[] = [];

  for (const employment of employments) {
    const entries = (await getEntriesForUser(employment.userId)).filter(
      (e) => e.workplaceId === params.workplaceId && e.clockOut && isWithin(e.clockIn, new Date(params.periodStart), new Date(params.periodEnd))
    );
    const hours = entries.reduce((sum, e) => sum + entryHours(e), 0);
    if (hours <= 0) continue;

    const line: PayrollLine = {
      id: newId('payroll'),
      userId: employment.userId,
      workplaceId: params.workplaceId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      hours,
      hourlyRate: employment.hourlyRate,
      amount: hours * employment.hourlyRate,
      status: 'pending_payment',
    };
    await upsert<PayrollLine>(PAYROLL_LINES, seedPayrollLines, line);
    created.push(line);
  }
  return created;
}

export async function markPaid(lineId: string): Promise<PayrollLine> {
  return update<PayrollLine>(PAYROLL_LINES, seedPayrollLines, lineId, { status: 'paid' });
}
