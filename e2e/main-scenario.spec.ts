import { expect, test } from "@playwright/test";

test("main scenario: create a contact, find it and save a conversation note", async ({
  browser,
  page,
  request,
}, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const contactName = `E2E Contact ${suffix}`;
  const note = `E2E conversation note ${suffix}`;
  const baseURL = String(testInfo.project.use.baseURL);

  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Все контакты/ })).toBeVisible();

    await page.getByRole("button", { name: "Добавить контакт" }).click();
    const createContact = page.getByRole("dialog", { name: "Новый контакт" });
    await createContact.getByLabel(/Имя/).fill(contactName);
    await createContact.getByLabel("Откуда знакомы").fill("Playwright e2e");
    await createContact.getByRole("button", { name: "Добавить контакт" }).click();

    await expect(page.getByRole("heading", { name: contactName })).toBeVisible();
    await page.getByRole("button", { name: "Закрыть карточку" }).click();

    await page.getByRole("textbox", { name: "Поиск контактов" }).fill(contactName);
    await page.getByRole("button", { name: new RegExp(contactName) }).click();
    await page.getByLabel("Новая заметка").fill(note);
    await page.getByRole("button", { name: "Добавить заметку" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Заметка добавлена" }),
    ).toContainText("Заметка добавлена");

    await page.getByRole("button", { name: "Закрыть карточку" }).click();
    await page.getByRole("button", { name: new RegExp(contactName) }).click();
    await expect(page.getByText(note, { exact: true })).toBeVisible();

    const secondContext = await browser.newContext();
    try {
      const secondPage = await secondContext.newPage();
      await secondPage.goto(baseURL);
      await secondPage
        .getByRole("textbox", { name: "Поиск контактов" })
        .fill(contactName);
      await secondPage.getByRole("button", { name: new RegExp(contactName) }).click();
      await expect(secondPage.getByText(note, { exact: true })).toBeVisible();
    } finally {
      await secondContext.close();
    }
  } finally {
    const contactsResponse = await request.get("/api/contacts");
    if (contactsResponse.ok()) {
      const contacts = (await contactsResponse.json()) as Array<{
        id: string;
        name: string;
      }>;
      const created = contacts.find((contact) => contact.name === contactName);
      if (created) await request.delete(`/api/contacts/${created.id}`);
    }
  }
});
