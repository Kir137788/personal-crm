export type Contact = { id: string; name: string; context: string; phone: string; email: string; notes: string; createdAt: string; updatedAt: string; contactIntervalDays: number | null; reminderEnabledAt: string | null; lastContactAt: string | null; hasNotes: boolean };
export type ContactNote = { id: string; contactId: string; body: string; occurredAt: string | null; legacy: boolean; createdAt: string; updatedAt: string };
export type DueContact = Contact & {dueAt: string; overdueDays: number};
