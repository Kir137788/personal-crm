export type ContactGroupView = {
  id: string;
  name: string;
};

export type ContactGroupRow = ContactGroupView & {
  contactId: string;
};

export function attachGroupsToContacts<T extends { id: string }>(
  contacts: T[],
  groupRows: ContactGroupRow[],
): Array<T & { groups: ContactGroupView[] }> {
  const groupsByContact = new Map<string, Map<string, ContactGroupView>>();
  for (const row of groupRows) {
    const groups = groupsByContact.get(row.contactId) ?? new Map();
    groups.set(row.id, { id: row.id, name: row.name });
    groupsByContact.set(row.contactId, groups);
  }

  return contacts.map((contact) => ({
    ...contact,
    groups: [...(groupsByContact.get(contact.id)?.values() ?? [])],
  }));
}
