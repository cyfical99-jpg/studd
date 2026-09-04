import { resetAll, upsert } from '@/services/localStore';
import * as shiftsRepo from '@/services/repositories/shiftsRepo';
import * as notificationsRepo from '@/services/repositories/notificationsRepo';
import type { Shift } from '@/services/types';

const ALEX = 'user_emp_alex';
const DAVID = 'user_emp_david';
const MANAGER = 'user_manager_1';

beforeEach(async () => {
  await resetAll();
});

describe('confirmShift', () => {
  it('moves an awaiting shift to confirmed for its assignee', async () => {
    const updated = await shiftsRepo.confirmShift('shift_today_alex', ALEX);
    expect(updated.status).toBe('confirmed');
    expect(updated.confirmationDueAt).toBeUndefined();
  });

  it('rejects confirmation by someone the shift is not assigned to', async () => {
    await expect(shiftsRepo.confirmShift('shift_today_alex', DAVID)).rejects.toThrow();
  });
});

describe('requestOpenShift', () => {
  it('assigns a published open shift and requires confirmation', async () => {
    const updated = await shiftsRepo.requestOpenShift('shift_open_1', DAVID);
    expect(updated.assignedUserId).toBe(DAVID);
    expect(updated.status).toBe('awaiting_confirmation');
  });

  it('refuses to claim a shift that is already assigned', async () => {
    await expect(shiftsRepo.requestOpenShift('shift_today_alex', DAVID)).rejects.toThrow();
  });
});

describe('release & replacement workflow (Feature 1)', () => {
  it('never hands a shift to a new employee without explicit manager approval', async () => {
    // 1. Alex asks to release their confirmed shift.
    const request = await shiftsRepo.requestRelease({
      shiftId: 'shift_upcoming_1',
      userId: ALEX,
      reason: 'Exam clash',
    });
    expect(request.status).toBe('pending_manager_review');

    let shiftBetween = (await shiftsRepo.getAllShifts()).find((s) => s.id === 'shift_upcoming_1')!;
    expect(shiftBetween.assignedUserId).toBe(ALEX); // still Alex's until the manager acts

    // 2. Manager approves the release — opens it for claims, doesn't reassign yet.
    const approved = await shiftsRepo.approveRelease(request.id, MANAGER);
    expect(approved.status).toBe('approved_open_for_claims');
    shiftBetween = (await shiftsRepo.getAllShifts()).find((s) => s.id === 'shift_upcoming_1')!;
    expect(shiftBetween.assignedUserId).toBe(ALEX);

    // 3. David expresses interest — still doesn't reassign anything.
    const withInterest = await shiftsRepo.expressInterest(approved.id, DAVID);
    expect(withInterest.interestedUserIds).toContain(DAVID);
    shiftBetween = (await shiftsRepo.getAllShifts()).find((s) => s.id === 'shift_upcoming_1')!;
    expect(shiftBetween.assignedUserId).toBe(ALEX);

    // 4. Only the manager's explicit approval reassigns the shift.
    const filled = await shiftsRepo.approveReplacement({
      requestId: approved.id,
      chosenUserId: DAVID,
      managerId: MANAGER,
    });
    expect(filled.status).toBe('filled');
    expect(filled.approvedReplacementUserId).toBe(DAVID);

    const finalShift = (await shiftsRepo.getAllShifts()).find((s) => s.id === 'shift_upcoming_1')!;
    expect(finalShift.assignedUserId).toBe(DAVID);
    expect(finalShift.status).toBe('awaiting_confirmation');
  });

  it('rejects approving a replacement who never expressed interest', async () => {
    const request = await shiftsRepo.requestRelease({ shiftId: 'shift_upcoming_1', userId: ALEX, reason: 'x' });
    const approved = await shiftsRepo.approveRelease(request.id, MANAGER);
    await expect(
      shiftsRepo.approveReplacement({ requestId: approved.id, chosenUserId: DAVID, managerId: MANAGER })
    ).rejects.toThrow();
  });

  it('leaves the shift with the original employee when the manager declines', async () => {
    const request = await shiftsRepo.requestRelease({ shiftId: 'shift_upcoming_1', userId: ALEX, reason: 'x' });
    const declined = await shiftsRepo.declineRelease(request.id, MANAGER);
    expect(declined.status).toBe('declined');
    const shift = (await shiftsRepo.getAllShifts()).find((s) => s.id === 'shift_upcoming_1')!;
    expect(shift.assignedUserId).toBe(ALEX);
  });
});

describe('checkAndEscalateOverdueShifts', () => {
  it('flips an overdue awaiting-confirmation shift to requires_attention and notifies the manager', async () => {
    const overdue: Shift = {
      id: 'shift_overdue_test',
      workplaceId: 'wp_cafe_abc',
      roleTitle: 'Waiter',
      date: '2020-01-01',
      startTime: '09:00',
      endTime: '13:00',
      assignedUserId: ALEX,
      status: 'awaiting_confirmation',
      confirmationDueAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h in the past
    };
    await upsert('shifts', [], overdue);

    const count = await shiftsRepo.checkAndEscalateOverdueShifts();
    expect(count).toBeGreaterThanOrEqual(1);

    const updated = (await shiftsRepo.getAllShifts()).find((s) => s.id === 'shift_overdue_test')!;
    expect(updated.status).toBe('requires_attention');

    const managerNotifications = await notificationsRepo.getForUser(MANAGER);
    expect(managerNotifications.some((n) => n.kind === 'shift_escalation')).toBe(true);
  });

  it('leaves shifts within their confirmation window alone', async () => {
    const count = await shiftsRepo.checkAndEscalateOverdueShifts();
    // The only seeded shift with a due date is in the future (see seedData.ts).
    expect(count).toBe(0);
  });
});
