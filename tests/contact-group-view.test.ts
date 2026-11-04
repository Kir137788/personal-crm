import { describe, expect, it } from "vitest";
import { attachGroupsToContacts } from "@/lib/contact-group-view";

describe("contact group view", () => {
  it("scenario: Контакт с группами", () => {
    const result = attachGroupsToContacts(
      [{ id: "contact-1", name: "Анна" }],
      [
        { contactId: "contact-1", id: "friends", name: "Друзья" },
        { contactId: "contact-1", id: "tennis", name: "Теннис" },
        { contactId: "contact-1", id: "tennis", name: "Теннис" },
      ],
    );

    expect(result).toEqual([
      {
        id: "contact-1",
        name: "Анна",
        groups: [
          { id: "friends", name: "Друзья" },
          { id: "tennis", name: "Теннис" },
        ],
      },
    ]);
  });

  it("scenario: Существующий контакт после миграции", () => {
    expect(
      attachGroupsToContacts([{ id: "legacy", name: "Старый контакт" }], []),
    ).toEqual([{ id: "legacy", name: "Старый контакт", groups: [] }]);
  });
});
