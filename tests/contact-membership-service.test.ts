import { describe, expect, it } from "vitest";
import {
  ContactMembershipError,
  createContactWithGroups,
  replaceContactGroups,
  type ContactMembershipRepository,
} from "@/lib/contact-membership-service";

describe("contact group membership", () => {
  it("scenario: Новый контакт в нескольких группах", async () => {
    const calls: Array<{ name: string; groupIds: string[] }> = [];
    const repository: ContactMembershipRepository = {
      async createContact(input, groupIds) {
        calls.push({ name: input.name, groupIds });
        return "contact-1";
      },
      async replaceGroups() {
        throw new Error("not implemented in this test");
      },
    };

    await expect(
      createContactWithGroups(
        repository,
        {
          name: "Анна",
          context: "Теннис",
          phone: "",
          email: "",
          notes: "",
        },
        ["friends", "tennis", "friends"],
      ),
    ).resolves.toBe("contact-1");

    expect(calls).toEqual([
      { name: "Анна", groupIds: ["friends", "tennis"] },
    ]);
  });
});

describe("existing contact group membership", () => {
  function repository(knownGroupIds: string[]) {
    let savedGroupIds = ["friends"];
    const value: ContactMembershipRepository = {
      async createContact() {
        throw new Error("not implemented in this test");
      },
      async replaceGroups(_contactId, groupIds, updatedAt) {
        if (updatedAt !== "2026-11-04T08:00:00.000Z") {
          throw new ContactMembershipError("conflict");
        }
        if (groupIds.some((groupId) => !knownGroupIds.includes(groupId))) {
          throw new ContactMembershipError("unknown_group");
        }
        savedGroupIds = [...groupIds];
      },
    };
    return { value, savedGroupIds: () => savedGroupIds };
  }

  it("scenario: Изменение групп существующего контакта", async () => {
    const repo = repository(["friends", "tennis"]);

    await replaceContactGroups(
      repo.value,
      "contact-1",
      ["tennis", "tennis"],
      "2026-11-04T08:00:00.000Z",
    );

    expect(repo.savedGroupIds()).toEqual(["tennis"]);
  });

  it("scenario: Неизвестная группа", async () => {
    const repo = repository(["friends", "tennis"]);

    await expect(
      replaceContactGroups(
        repo.value,
        "contact-1",
        ["tennis", "missing"],
        "2026-11-04T08:00:00.000Z",
      ),
    ).rejects.toEqual(new ContactMembershipError("unknown_group"));
    expect(repo.savedGroupIds()).toEqual(["friends"]);
  });
});
