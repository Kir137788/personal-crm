export const DAY_MS = 86_400_000;
export function reminderDue(contact: {contactIntervalDays: number | null; lastContactAt: string | Date | null; reminderEnabledAt: string | Date | null}, now: Date) {
  const base = contact.lastContactAt ?? contact.reminderEnabledAt;
  if (!contact.contactIntervalDays || !base) return null;
  const due = new Date(base).getTime() + contact.contactIntervalDays * DAY_MS;
  return {dueAt: new Date(due).toISOString(), overdueDays: now.getTime() > due ? Math.ceil((now.getTime() - due) / DAY_MS) : 0};
}
export function daysLabel(days: number) {
  const mod = days % 100;
  return `${days} ${mod >= 11 && mod <= 14 ? "дней" : days % 10 === 1 ? "день" : days % 10 >= 2 && days % 10 <= 4 ? "дня" : "дней"}`;
}
