import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import postgres from "postgres";

const databaseURL = "postgres://postgres@127.0.0.1:5433/personal_crm_e2e";

type ApiContact = {
  id: string;
  name: string;
  updatedAt: string;
  contactIntervalDays: number | null;
};

async function createContact(request: APIRequestContext, name: string) {
  const response = await request.post("/api/contacts", { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()) as ApiContact;
}

async function openContact(page: Page, name: string) {
  const search = page.getByRole("textbox", { name: "Поиск контактов" });
  await search.fill(name);
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

test("reminder frequency has a safe default, persists and rejects unsupported values", async ({
  page,
  request,
}, testInfo) => {
  const name = `E2E Reminder ${Date.now()}-${testInfo.workerIndex}`;
  const contact = await createContact(request, name);

  try {
    await page.goto("/");
    await openContact(page, name);

    const frequency = page.getByLabel("Частота общения");
    await expect(frequency).toHaveValue("");
    await frequency.selectOption("7");
    const savedReminder = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/contacts/${contact.id}/reminder`) &&
        response.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: "Сохранить частоту" }).click();
    expect((await savedReminder).status()).toBe(200);

    await page.getByRole("button", { name: "Закрыть карточку" }).click();
    await openContact(page, name);
    await expect(page.getByLabel("Частота общения")).toHaveValue("7");

    const contacts = (await (
      await request.get("/api/contacts")
    ).json()) as ApiContact[];
    const saved = contacts.find((item) => item.id === contact.id);
    expect(saved?.contactIntervalDays).toBe(7);

    const invalid = await request.patch(
      `/api/contacts/${contact.id}/reminder`,
      {
        data: { contactIntervalDays: 8, updatedAt: saved?.updatedAt },
      },
    );
    expect(invalid.status()).toBe(400);

    const afterInvalid = (await (
      await request.get("/api/contacts")
    ).json()) as ApiContact[];
    expect(
      afterInvalid.find((item) => item.id === contact.id)?.contactIntervalDays,
    ).toBe(7);
  } finally {
    await request.delete(`/api/contacts/${contact.id}`);
  }
});

test("due contacts are sorted, open by keyboard and leave the list after a conversation or disabling reminders", async ({
  page,
  request,
}, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const older = await createContact(request, `E2E Older ${suffix}`);
  const newer = await createContact(request, `E2E Newer ${suffix}`);
  const sql = postgres(databaseURL, { max: 1 });

  try {
    await sql`
      update contacts
      set contact_interval_days = 7,
          reminder_enabled_at = case id
            when ${older.id}::uuid then now() - interval '16 days'
            else now() - interval '8 days'
          end
      where id in (${older.id}::uuid, ${newer.id}::uuid)
    `;

    await page.goto("/");
    const duePanel = page.locator("section.due-panel");
    const duePeople = duePanel.locator(".due-person");
    await expect(duePeople).toHaveCount(2);
    await expect(duePeople.nth(0)).toContainText(older.name);
    await expect(duePeople.nth(1)).toContainText(newer.name);

    await duePeople.nth(0).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: older.name, exact: true }),
    ).toBeVisible();
    await page.getByLabel("Новая заметка").fill("Созвонились и обсудили планы");
    await page.getByRole("button", { name: "Добавить заметку" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Дата общения обновлена",
    );
    await page.getByRole("button", { name: "Закрыть карточку" }).click();
    await expect(duePanel.getByText(older.name)).toHaveCount(0);
    await expect(duePanel.getByText(newer.name)).toBeVisible();

    await duePanel
      .getByRole("button", { name: new RegExp(newer.name) })
      .click();
    await page.getByLabel("Частота общения").selectOption("");
    const disabledReminder = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/contacts/${newer.id}/reminder`) &&
        response.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: "Сохранить частоту" }).click();
    expect((await disabledReminder).status()).toBe(200);
    await page.getByRole("button", { name: "Закрыть карточку" }).click();
    await expect(
      duePanel.getByText("Пока не пора ни с кем связываться"),
    ).toBeVisible();
  } finally {
    await sql.end();
    await request.delete(`/api/contacts/${older.id}`);
    await request.delete(`/api/contacts/${newer.id}`);
  }
});

test("the due block refreshes on time, works on mobile and recovers after a database error", async ({
  page,
  request,
}, testInfo) => {
  const name = `E2E Mobile ${Date.now()}-${testInfo.workerIndex}`;
  const contact = await createContact(request, name);
  const sql = postgres(databaseURL, { max: 1 });
  let notesTableUnavailable = false;

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install({ time: new Date("2026-11-04T12:00:00.000Z") });
    await page.goto("/");
    const duePanel = page.locator("section.due-panel");
    await expect(duePanel.getByText(name)).toHaveCount(0);

    await sql`
      update contacts
      set contact_interval_days = 7,
          reminder_enabled_at = now() - interval '8 days'
      where id = ${contact.id}::uuid
    `;
    await page.clock.fastForward(60_000);
    await expect(duePanel.getByText(name)).toBeVisible();

    await duePanel.getByRole("button", { name: new RegExp(name) }).click();
    await expect(page.getByLabel("Частота общения")).toHaveValue("7");
    await page.getByLabel("Новая заметка").fill("Мобильная проверка");
    await page.getByRole("button", { name: "Добавить заметку" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Дата общения обновлена",
    );

    await page.getByRole("button", { name: "Исправить" }).click();
    await page
      .getByLabel("Исправление заметки")
      .fill("Мобильная проверка уточнена");
    await page.getByRole("button", { name: "Сохранить исправление" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Дата общения не изменилась",
    );
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Закрыть карточку" }).click();

    await sql`alter table contact_notes rename to contact_notes_unavailable_e2e`;
    notesTableUnavailable = true;
    await page.clock.fastForward(60_000);
    await expect(duePanel.getByRole("alert")).toContainText(
      "Не удалось загрузить напоминания",
    );

    await sql`alter table contact_notes_unavailable_e2e rename to contact_notes`;
    notesTableUnavailable = false;
    await duePanel.getByRole("button", { name: "Повторить" }).click();
    await expect(
      duePanel.getByText("Пока не пора ни с кем связываться"),
    ).toBeVisible();
  } finally {
    if (notesTableUnavailable) {
      await sql`alter table contact_notes_unavailable_e2e rename to contact_notes`;
    }
    await sql.end();
    await request.delete(`/api/contacts/${contact.id}`);
  }
});
