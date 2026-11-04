import { describe, expect, it } from "vitest";
import {
  ALL_GROUPS,
  UNGROUPED,
  filterContacts,
  type FilterableContact,
} from "@/lib/contact-filters";

const contacts: FilterableContact[] = [
  {
    id: "anna",
    name: "Анна",
    context: "Теннис",
    email: "anna@example.com",
    phone: "",
    groups: [
      { id: "analysts", name: "Аналитики" },
      { id: "tennis", name: "Теннис" },
    ],
  },
  {
    id: "boris",
    name: "Борис",
    context: "Работа",
    email: "boris@example.com",
    phone: "",
    groups: [{ id: "analysts", name: "Аналитики" }],
  },
  {
    id: "vera",
    name: "Вера",
    context: "Соседи",
    email: "vera@example.com",
    phone: "",
    groups: [],
  },
];

const ids = (items: FilterableContact[]) => items.map((item) => item.id);

describe("contact group filters", () => {
  it("scenario: Фильтр конкретной группы", () => {
    expect(ids(filterContacts(contacts, "analysts", ""))).toEqual([
      "anna",
      "boris",
    ]);
  });

  it("scenario: Фильтр без группы", () => {
    expect(ids(filterContacts(contacts, UNGROUPED, ""))).toEqual(["vera"]);
  });

  it("scenario: Поиск внутри группы", () => {
    expect(ids(filterContacts(contacts, "analysts", "теннис"))).toEqual([
      "anna",
    ]);
  });

  it("scenario: Возврат ко всем контактам", () => {
    expect(ids(filterContacts(contacts, ALL_GROUPS, "анна"))).toEqual(["anna"]);
  });
});
