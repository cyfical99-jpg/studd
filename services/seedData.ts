import { demoHash } from '@/services/demoHash';
import type {
  AvailabilityEntry,
  Employment,
  NotificationRecord,
  PayrollLine,
  Shift,
  ShiftReleaseRequest,
  TimeEntry,
  TimeOffRequest,
  UserAccount,
  Workplace,
} from '@/services/types';

/** All seed dates are relative to whenever the app is first launched, so
 * the demo data stays realistic (a "today" shift, an "upcoming" shift, a
 * past pay period) no matter when this actually runs. */
function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
function isoDate(days: number): string {
  return addDays(days).toISOString().slice(0, 10);
}
function isoDateTime(days: number, hour: number, minute = 0): string {
  const d = addDays(days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const DEMO_MANAGER_EMAIL = 'manager@demo.app';
export const DEMO_EMPLOYEE_EMAIL = 'alex@demo.app';
export const DEMO_PASSWORD = 'demo1234';

export const seedUsers: UserAccount[] = [
  {
    id: 'user_manager_1',
    email: DEMO_MANAGER_EMAIL,
    passwordHash: demoHash(DEMO_PASSWORD),
    name: 'Sarah Jenkins',
    role: 'manager',
    createdAt: isoDateTime(-30, 9),
  },
  {
    id: 'user_emp_alex',
    email: DEMO_EMPLOYEE_EMAIL,
    passwordHash: demoHash(DEMO_PASSWORD),
    name: 'Alex',
    role: 'employee',
    createdAt: isoDateTime(-20, 9),
  },
  {
    id: 'user_emp_david',
    email: 'david@demo.app',
    passwordHash: demoHash(DEMO_PASSWORD),
    name: 'David Chen',
    role: 'employee',
    createdAt: isoDateTime(-18, 9),
  },
  {
    id: 'user_emp_maria',
    email: 'maria@demo.app',
    passwordHash: demoHash(DEMO_PASSWORD),
    name: 'Maria Rodriguez',
    role: 'employee',
    createdAt: isoDateTime(-15, 9),
  },
];

export const seedWorkplaces: Workplace[] = [
  { id: 'wp_cafe_abc', name: 'Cafe ABC', managerId: 'user_manager_1' },
  { id: 'wp_bookstore', name: 'Bookstore Co.', managerId: 'user_manager_1' },
];

export const seedEmployments: Employment[] = [
  { id: 'emp_alex_cafe', userId: 'user_emp_alex', workplaceId: 'wp_cafe_abc', roleTitle: 'Waiter', hourlyRate: 18, maxWeeklyHours: 24 },
  { id: 'emp_alex_bookstore', userId: 'user_emp_alex', workplaceId: 'wp_bookstore', roleTitle: 'Shelf Assistant', hourlyRate: 16, maxWeeklyHours: 24 },
  { id: 'emp_david_cafe', userId: 'user_emp_david', workplaceId: 'wp_cafe_abc', roleTitle: 'Barista', hourlyRate: 19, maxWeeklyHours: 30 },
  { id: 'emp_maria_cafe', userId: 'user_emp_maria', workplaceId: 'wp_cafe_abc', roleTitle: 'Shift Lead', hourlyRate: 22, maxWeeklyHours: 35 },
];

export const seedAvailability: AvailabilityEntry[] = [
  { userId: 'user_emp_alex', day: 'Mon', available: true, ranges: [{ start: '08:00', end: '12:00' }] },
  { userId: 'user_emp_alex', day: 'Tue', available: true, ranges: [{ start: '08:00', end: '17:00' }] },
  { userId: 'user_emp_alex', day: 'Wed', available: false, ranges: [] },
  { userId: 'user_emp_alex', day: 'Thu', available: true, ranges: [{ start: '12:00', end: '22:00' }] },
  { userId: 'user_emp_alex', day: 'Fri', available: true, ranges: [{ start: '08:00', end: '22:00' }] },
  { userId: 'user_emp_alex', day: 'Sat', available: false, ranges: [] },
  { userId: 'user_emp_alex', day: 'Sun', available: false, ranges: [] },
  { userId: 'user_emp_david', day: 'Mon', available: true, ranges: [{ start: '08:00', end: '17:00' }] },
  { userId: 'user_emp_david', day: 'Tue', available: true, ranges: [{ start: '08:00', end: '17:00' }] },
  { userId: 'user_emp_david', day: 'Wed', available: true, ranges: [{ start: '08:00', end: '12:00' }] },
  { userId: 'user_emp_david', day: 'Thu', available: true, ranges: [{ start: '08:00', end: '17:00' }] },
  { userId: 'user_emp_david', day: 'Fri', available: true, ranges: [{ start: '08:00', end: '12:00' }] },
  { userId: 'user_emp_david', day: 'Sat', available: false, ranges: [] },
  { userId: 'user_emp_david', day: 'Sun', available: false, ranges: [] },
  { userId: 'user_emp_maria', day: 'Mon', available: true, ranges: [{ start: '12:00', end: '22:00' }] },
  { userId: 'user_emp_maria', day: 'Tue', available: true, ranges: [{ start: '12:00', end: '22:00' }] },
  { userId: 'user_emp_maria', day: 'Wed', available: true, ranges: [{ start: '12:00', end: '22:00' }] },
  { userId: 'user_emp_maria', day: 'Thu', available: false, ranges: [] },
  { userId: 'user_emp_maria', day: 'Fri', available: true, ranges: [{ start: '12:00', end: '22:00' }] },
  { userId: 'user_emp_maria', day: 'Sat', available: true, ranges: [{ start: '08:00', end: '17:00' }] },
  { userId: 'user_emp_maria', day: 'Sun', available: false, ranges: [] },
];

export const seedShifts: Shift[] = [
  {
    id: 'shift_today_alex',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Waiter',
    date: isoDate(0),
    startTime: '16:00',
    endTime: '21:00',
    assignedUserId: 'user_emp_alex',
    status: 'awaiting_confirmation',
    confirmationDueAt: isoDateTime(0, new Date().getHours() + 2),
  },
  {
    id: 'shift_upcoming_1',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Waiter',
    date: isoDate(3),
    startTime: '09:00',
    endTime: '14:00',
    assignedUserId: 'user_emp_alex',
    status: 'confirmed',
  },
  {
    id: 'shift_upcoming_2',
    workplaceId: 'wp_bookstore',
    roleTitle: 'Shelf Assistant',
    date: isoDate(5),
    startTime: '13:00',
    endTime: '17:00',
    assignedUserId: 'user_emp_alex',
    status: 'confirmed',
  },
  {
    id: 'shift_open_1',
    workplaceId: 'wp_bookstore',
    roleTitle: 'Shelf Assistant',
    date: isoDate(1),
    startTime: '10:00',
    endTime: '14:00',
    assignedUserId: null,
    status: 'published',
  },
  {
    id: 'shift_open_2',
    workplaceId: 'wp_bookstore',
    roleTitle: 'Shelf Assistant',
    date: isoDate(6),
    startTime: '17:00',
    endTime: '22:00',
    assignedUserId: null,
    status: 'published',
  },
  {
    id: 'shift_past_1',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Waiter',
    date: isoDate(-2),
    startTime: '09:00',
    endTime: '15:00',
    assignedUserId: 'user_emp_alex',
    status: 'completed',
  },
  {
    id: 'shift_past_2',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Waiter',
    date: isoDate(-5),
    startTime: '16:00',
    endTime: '21:00',
    assignedUserId: 'user_emp_alex',
    status: 'completed',
  },
  {
    id: 'shift_david_today',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Barista',
    date: isoDate(0),
    startTime: '07:00',
    endTime: '15:00',
    assignedUserId: 'user_emp_david',
    status: 'confirmed',
  },
  {
    id: 'shift_maria_today',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Shift Lead',
    date: isoDate(0),
    startTime: '14:00',
    endTime: '22:00',
    assignedUserId: 'user_emp_maria',
    status: 'confirmed',
  },
  // --- The rest below exist mainly to give the manager demo account
  // (see DEMO_MANAGER_EMAIL) something real to look at in every tab —
  // an overdue shift, a release mid-workflow, an open-for-claims release
  // with an interested replacement, and a fuller week at Cafe ABC.
  {
    id: 'shift_maria_release_candidate',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Shift Lead',
    date: isoDate(2),
    startTime: '14:00',
    endTime: '20:00',
    assignedUserId: 'user_emp_maria',
    status: 'confirmed',
  },
  {
    id: 'shift_alex_open_release',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Waiter',
    date: isoDate(4),
    startTime: '09:00',
    endTime: '13:00',
    assignedUserId: 'user_emp_alex',
    status: 'confirmed',
  },
  {
    id: 'shift_david_upcoming',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Barista',
    date: isoDate(6),
    startTime: '07:00',
    endTime: '15:00',
    assignedUserId: 'user_emp_david',
    status: 'confirmed',
  },
  {
    id: 'shift_david_overdue',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Barista',
    date: isoDate(-1),
    startTime: '07:00',
    endTime: '15:00',
    assignedUserId: 'user_emp_david',
    status: 'requires_attention',
  },
  {
    id: 'shift_past_david_1',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Barista',
    date: isoDate(-3),
    startTime: '07:00',
    endTime: '15:00',
    assignedUserId: 'user_emp_david',
    status: 'completed',
  },
  {
    id: 'shift_past_maria_1',
    workplaceId: 'wp_cafe_abc',
    roleTitle: 'Shift Lead',
    date: isoDate(-4),
    startTime: '14:00',
    endTime: '22:00',
    assignedUserId: 'user_emp_maria',
    status: 'completed',
  },
];

export const seedReleaseRequests: ShiftReleaseRequest[] = [
  {
    id: 'release_pending_1',
    shiftId: 'shift_maria_release_candidate',
    requestedByUserId: 'user_emp_maria',
    reason: "Doctor's appointment I can't reschedule.",
    status: 'pending_manager_review',
    interestedUserIds: [],
    history: [{ at: isoDateTime(-1, 10), actorUserId: 'user_emp_maria', action: 'Requested to release this shift.' }],
    createdAt: isoDateTime(-1, 10),
  },
  {
    id: 'release_open_1',
    shiftId: 'shift_alex_open_release',
    requestedByUserId: 'user_emp_alex',
    reason: 'Clashes with a university seminar I need to attend.',
    status: 'approved_open_for_claims',
    interestedUserIds: ['user_emp_david'],
    history: [
      { at: isoDateTime(-2, 11), actorUserId: 'user_emp_alex', action: 'Requested to release this shift.' },
      { at: isoDateTime(-2, 15), actorUserId: 'user_manager_1', action: 'Manager approved the release; now open for claims.' },
      { at: isoDateTime(-1, 9), actorUserId: 'user_emp_david', action: 'Expressed interest in taking this shift.' },
    ],
    createdAt: isoDateTime(-2, 11),
  },
];

export const seedTimeOffRequests: TimeOffRequest[] = [
  {
    id: 'timeoff_1',
    userId: 'user_emp_alex',
    startDate: isoDate(10),
    endDate: isoDate(12),
    reasonType: 'Study Leave',
    note: 'Final exams for my macroeconomics unit.',
    status: 'pending',
  },
  {
    id: 'timeoff_2',
    userId: 'user_emp_maria',
    startDate: isoDate(15),
    endDate: isoDate(16),
    reasonType: 'Personal',
    note: "Sister's wedding.",
    status: 'pending',
  },
];

export const seedTimeEntries: TimeEntry[] = [
  { id: 'time_1', userId: 'user_emp_alex', workplaceId: 'wp_cafe_abc', shiftId: 'shift_past_1', clockIn: isoDateTime(-2, 9), clockOut: isoDateTime(-2, 15), breakMinutes: 30 },
  { id: 'time_2', userId: 'user_emp_alex', workplaceId: 'wp_cafe_abc', shiftId: 'shift_past_2', clockIn: isoDateTime(-5, 16), clockOut: isoDateTime(-5, 21), breakMinutes: 30 },
  { id: 'time_3', userId: 'user_emp_david', workplaceId: 'wp_cafe_abc', shiftId: 'shift_past_david_1', clockIn: isoDateTime(-3, 7), clockOut: isoDateTime(-3, 15), breakMinutes: 30 },
  { id: 'time_4', userId: 'user_emp_maria', workplaceId: 'wp_cafe_abc', shiftId: 'shift_past_maria_1', clockIn: isoDateTime(-4, 14), clockOut: isoDateTime(-4, 22), breakMinutes: 30 },
];

export const seedPayrollLines: PayrollLine[] = [
  {
    id: 'payroll_1',
    userId: 'user_emp_alex',
    workplaceId: 'wp_cafe_abc',
    periodStart: isoDate(-14),
    periodEnd: isoDate(-7),
    hours: 22,
    hourlyRate: 18,
    amount: 396,
    status: 'paid',
  },
  {
    id: 'payroll_2',
    userId: 'user_emp_david',
    workplaceId: 'wp_cafe_abc',
    periodStart: isoDate(-7),
    periodEnd: isoDate(0),
    hours: 7.5,
    hourlyRate: 19,
    amount: 142.5,
    status: 'pending_payment',
  },
  {
    id: 'payroll_3',
    userId: 'user_emp_maria',
    workplaceId: 'wp_cafe_abc',
    periodStart: isoDate(-7),
    periodEnd: isoDate(0),
    hours: 7.5,
    hourlyRate: 22,
    amount: 165,
    status: 'pending_payment',
  },
];

export const seedNotifications: NotificationRecord[] = [
  {
    id: 'notif_1',
    userId: 'user_emp_alex',
    kind: 'shift_assigned',
    title: 'New shift assigned',
    body: 'You have been assigned a Waiter shift at Cafe ABC today.',
    read: false,
    createdAt: isoDateTime(0, new Date().getHours() - 1),
    relatedShiftId: 'shift_today_alex',
  },
  // Manager-facing (see DEMO_MANAGER_EMAIL) — mirrors what the real
  // repositories would have sent for the requests/escalation seeded above.
  {
    id: 'notif_manager_release',
    userId: 'user_manager_1',
    kind: 'release_request',
    title: 'Shift release request',
    body: `Maria asked to release her Shift Lead shift on ${isoDate(2)}.`,
    read: false,
    createdAt: isoDateTime(-1, 10),
    relatedShiftId: 'shift_maria_release_candidate',
  },
  {
    id: 'notif_manager_escalation',
    userId: 'user_manager_1',
    kind: 'shift_escalation',
    title: 'Shift needs attention',
    body: `A Barista shift on ${isoDate(-1)} was not confirmed in time.`,
    read: false,
    createdAt: isoDateTime(-1, 16),
    relatedShiftId: 'shift_david_overdue',
  },
  {
    id: 'notif_manager_timeoff',
    userId: 'user_manager_1',
    kind: 'time_off_decision',
    title: 'New time-off request',
    body: `A team member requested time off from ${isoDate(10)} to ${isoDate(12)}.`,
    read: false,
    createdAt: isoDateTime(-2, 9),
  },
];
