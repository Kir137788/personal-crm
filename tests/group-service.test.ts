import { describe, expect, it } from "vitest";
import {
  GroupServiceError,
  createGroup,
  deleteGroup,
  listGroups,
  renameGroup,
  type GroupRepository,
  type StoredGroup,
} from "@/lib/group-service";

function repository(seed: StoredGroup[] = []): GroupRepository {
  const groups = seed.map((group) => ({ ...group }));
  return {
    async list() {
      return [...groups];
    },
    async findById(id) {
      return groups.find((group) => group.id === id);
    },
    async findByNormalizedName(normalizedName) {
      return groups.find((group) => group.normalizedName === normalizedName);
    },
    async insert(input) {
      const now = new Date("2026-11-04T08:00:00.000Z");
      const group = { id: `group-${groups.length + 1}`, ...input, createdAt: now, updatedAt: now };
      groups.push(group);
      return group;
    },
    async update(id, input) {
      const group = groups.find((candidate) => candidate.id === id);
      if (!group) return undefined;
      Object.assign(group, input, {
        updatedAt: new Date(group.updatedAt.getTime() + 1),
      });
      return group;
    },
    async remove(id) {
      const index = groups.findIndex((group) => group.id === id);
      if (index === -1) return undefined;
      return groups.splice(index, 1)[0];
    },
  };
}

describe("group service: create and list", () => {
  it("scenario: Группа создана", async () => {
    const repo = repository();

    const created = await createGroup(repo, " Теннис ");

    expect(created.name).toBe("Теннис");
    await expect(listGroups(repo)).resolves.toEqual([created]);
  });

  it("scenario: Пустое название", async () => {
    const repo = repository();

    await expect(createGroup(repo, "   ")).rejects.toEqual(
      new GroupServiceError("empty"),
    );
    await expect(listGroups(repo)).resolves.toEqual([]);
  });

  it("scenario: Повторяющееся название", async () => {
    const repo = repository([
      {
        id: "friends",
        name: "Друзья",
        normalizedName: "друзья",
        createdAt: new Date("2026-11-04T08:00:00.000Z"),
        updatedAt: new Date("2026-11-04T08:00:00.000Z"),
      },
    ]);

    await expect(createGroup(repo, " друзья ")).rejects.toEqual(
      new GroupServiceError("duplicate"),
    );
    await expect(listGroups(repo)).resolves.toHaveLength(1);
  });
});

describe("group service: rename", () => {
  const tennis: StoredGroup = {
    id: "tennis",
    name: "Теннис",
    normalizedName: "теннис",
    createdAt: new Date("2026-11-04T08:00:00.000Z"),
    updatedAt: new Date("2026-11-04T08:00:00.000Z"),
  };

  it("scenario: Успешное переименование", async () => {
    const repo = repository([tennis]);

    const renamed = await renameGroup(repo, tennis.id, "Большой теннис");

    expect(renamed).toMatchObject({
      id: tennis.id,
      name: "Большой теннис",
      normalizedName: "большой теннис",
    });
    await expect(listGroups(repo)).resolves.toHaveLength(1);
  });

  it("scenario: Конфликт при переименовании", async () => {
    const repo = repository([
      tennis,
      {
        ...tennis,
        id: "friends",
        name: "Друзья",
        normalizedName: "друзья",
      },
    ]);

    await expect(renameGroup(repo, tennis.id, " ДРУЗЬЯ ")).rejects.toEqual(
      new GroupServiceError("duplicate"),
    );
    await expect(listGroups(repo)).resolves.toMatchObject([
      { id: tennis.id, name: "Теннис" },
      { id: "friends", name: "Друзья" },
    ]);
  });
});

describe("group service: delete", () => {
  it("scenario: Удаление подтверждено", async () => {
    const group: StoredGroup = {
      id: "friends",
      name: "Друзья",
      normalizedName: "друзья",
      createdAt: new Date("2026-11-04T08:00:00.000Z"),
      updatedAt: new Date("2026-11-04T08:00:00.000Z"),
    };
    const repo = repository([group]);
    const contact = {
      id: "contact-1",
      note: "Созвониться в пятницу",
      contactIntervalDays: 30,
    };

    await expect(deleteGroup(repo, group.id)).resolves.toEqual(group);

    await expect(listGroups(repo)).resolves.toEqual([]);
    expect(contact).toEqual({
      id: "contact-1",
      note: "Созвониться в пятницу",
      contactIntervalDays: 30,
    });
  });
});
