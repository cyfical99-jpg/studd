/**
 * Presentational "view-model" shapes for components/home and
 * components/availability — screens map real data from services/repositories
 * into these at render time, so the presentational components stay
 * decoupled from the domain model in services/types.ts. (Originally these
 * doubled as literal mock fixtures too; that fixture data now lives for
 * real in services/seedData.ts.)
 */

export type EmployeeProfile = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
};

export type TodayShift = {
  id: string;
  workplaceName: string;
  roleTitle: string;
  startTime: string;
  endTime: string;
  status: 'awaiting_confirmation' | 'confirmed';
};

export type WeeklyStats = {
  hoursWorked: number;
  hoursLimit: number;
  earningsThisWeek: number;
  earningsChangePct: number;
};

export type OpenShift = {
  id: string;
  workplaceName: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
};

export type UpcomingShift = {
  id: string;
  workplaceName: string;
  weekdayShort: string;
  dayOfMonth: number;
  startTime: string;
  endTime: string;
};

export type TimeRange = { start: string; end: string };

export type DayAvailability = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  label: string;
  available: boolean;
  ranges: TimeRange[];
};

export type AvailabilityPrefs = {
  totalAvailableHoursPerWeek: number;
  targetMinHours: number;
  targetMaxHours: number;
  maxHoursPerShift: number;
  minBreakBetweenShiftsHours: number;
};

export type RolePreference = {
  id: string;
  label: string;
  selected: boolean;
};

export type ProfileWorkPrefs = {
  rolePreferences: RolePreference[];
  maxWeeklyHours: number;
  maxCommuteMiles: number;
  requireMinBreak: boolean;
  preferAfternoonBreaks: boolean;
};
