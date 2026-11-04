import type { ContactGroup } from "./types";

export const ALL_GROUPS = "all";
export const UNGROUPED = "ungrouped";

export type ContactGroupFilter = typeof ALL_GROUPS | typeof UNGROUPED | string;

export type FilterableContact = {
  id: string;
  name: string;
  context: string;
  email: string;
  phone: string;
  groups: ContactGroup[];
};

export function filterContacts<T extends FilterableContact>(
  contacts: T[],
  groupFilter: ContactGroupFilter,
  search: string,
) {
  const query = search.toLocaleLowerCase("ru-RU").trim();
  return contacts.filter((contact) => {
    const inGroup =
      groupFilter === ALL_GROUPS ||
      (groupFilter === UNGROUPED
        ? contact.groups.length === 0
        : contact.groups.some((group) => group.id === groupFilter));
    if (!inGroup) return false;
    if (!query) return true;
    return `${contact.name} ${contact.context} ${contact.email} ${contact.phone}`
      .toLocaleLowerCase("ru-RU")
      .includes(query);
  });
}
