/**
 * Full domain model for the app. Shapes are designed to map 1:1 onto the
 * Postgres schema in supabase/migrations/ so the local-store repositories
 * (services/repositories/*) and a future Supabase-backed implementation can
 * satisfy the exact same interfaces — see services/repositories/README.md.
 */

export type Role = 'employee' | 'manager';

export interface UserAccount {
  id: string;
  email: string;
  /** Demo-only hash (see services/auth.ts). Never store real passwords like this in production. */
  passwordHash: string;
  name: string;
  role: Role;
  createdAt: string;
  /** Local file URI (native) — only meaningful on the device that set it;
   * see services/repositories/profileRepo.ts for the Supabase Storage caveat. */
  avatarUri?: string;
}

export interface Workplace {
  id: string;
  name: string;
  managerId: string;
}

export interface Employment {
  id: string;
  userId: string;
  workplaceId: string;
  roleTitle: string;
  hourlyRate: number;
  /** User-configured tracking limit — NOT a legal/visa compliance claim. */
  maxWeeklyHours: number;
}

/** Kept only for services/repositories/rosterRepo.ts's own generation-slot
 * labeling — no longer how AvailabilityEntry itself is shaped (see below). */
export type DaySession = 'morning' | 'afternoon' | 'evening';
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

/** A same-day time window, "HH:MM" 24-hour, e.g. { start: '12:00', end: '15:00' }.
 * `end` must be after `start` — no overnight (crossing-midnight) ranges yet. */
export interface TimeRange {
  start: string;
  end: string;
}

export interface AvailabilityEntry {
  userId: string;
  day: Weekday;
  available: boolean;
  /** Arbitrary custom windows for this day — e.g. 12:00-15:00 AND
   * 20:00-21:00 on the same day. Replaces the old fixed morning/
   * afternoon/evening blocks so people can set their real hours. */
  ranges: TimeRange[];
}

export type ShiftStatus =
  | 'draft'
  | 'published'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'requires_attention'
  | 'completed'
  | 'cancelled';

export interface Shift {
  id: string;
  workplaceId: string;
  roleTitle: string;
  /** ISO date, e.g. "2026-09-08" */
  date: string;
  startTime: string;
  endTime: string;
  assignedUserId: string | null;
  status: ShiftStatus;
  /** ISO datetime by which the assignee must confirm before escalation. */
  confirmationDueAt?: string;
  createdFromRosterDraftId?: string;
}

export type ReleaseRequestStatus =
  | 'pending_manager_review'
  | 'approved_open_for_claims'
  | 'declined'
  | 'filled';

export interface ShiftHistoryEvent {
  at: string;
  actorUserId: string;
  action: string;
}

export interface ShiftReleaseRequest {
  id: string;
  shiftId: string;
  requestedByUserId: string;
  reason: string;
  status: ReleaseRequestStatus;
  interestedUserIds: string[];
  approvedReplacementUserId?: string;
  history: ShiftHistoryEvent[];
  createdAt: string;
}

export type TimeOffStatus = 'pending' | 'approved' | 'declined';

export interface TimeOffRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reasonType: string;
  note?: string;
  status: TimeOffStatus;
}

export interface TimeEntry {
  id: string;
  userId: string;
  workplaceId: string;
  shiftId?: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
}

export type PayrollLineStatus = 'estimated' | 'pending_payment' | 'paid';

export interface PayrollLine {
  id: string;
  userId: string;
  workplaceId: string;
  periodStart: string;
  periodEnd: string;
  hours: number;
  hourlyRate: number;
  amount: number;
  status: PayrollLineStatus;
}

export type NotificationKind =
  | 'shift_assigned'
  | 'shift_reminder'
  | 'shift_escalation'
  | 'release_request'
  | 'release_approved'
  | 'replacement_approved'
  | 'time_off_decision'
  | 'roster_published';

export interface NotificationRecord {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  relatedShiftId?: string;
}

export type RosterDraftStatus = 'draft' | 'published';

export interface RosterDraftShift {
  id: string;
  workplaceId: string;
  roleTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedUserId: string | null;
  /** True when the rule-based generator picked this assignment, so the UI
   * can badge it — mirrors the mockups' "AI Choice" pill. */
  aiSuggested: boolean;
  aiReason?: string;
}

export interface RosterDraft {
  id: string;
  workplaceId: string;
  weekStart: string;
  status: RosterDraftStatus;
  shifts: RosterDraftShift[];
  createdAt: string;
}
