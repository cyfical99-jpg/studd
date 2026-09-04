const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "16:00" -> "4:00 PM" */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayShort(dateIso: string): string {
  return WEEKDAY_SHORT[new Date(dateIso).getDay()];
}

export function dayOfMonth(dateIso: string): number {
  return new Date(dateIso).getDate();
}

/** "Today" / "Tomorrow" / "Friday" — used for open-shift cards. */
export function relativeDayLabel(dateIso: string): string {
  const diffDays = Math.round(
    (new Date(dateIso).getTime() - new Date(todayIso()).getTime()) / 86400000
  );
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  const weekdayFull = new Date(dateIso).toLocaleDateString('en-US', { weekday: 'long' });
  return weekdayFull;
}

export function isToday(dateIso: string): boolean {
  return dateIso === todayIso();
}

export function isFuture(dateIso: string): boolean {
  return dateIso > todayIso();
}

export function isPastOrToday(dateIso: string): boolean {
  return dateIso <= todayIso();
}
