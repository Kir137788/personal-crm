import { describe, expect, it } from "vitest";
import { DAY_MS, daysLabel, reminderDue } from "@/lib/keep-in-touch";
import { reminderInput } from "@/lib/validation";

const now = new Date("2026-11-04T12:00:00.000Z");

describe("keep-in-touch reminder calculation", () => {
  it("does not create a deadline when reminders are disabled", () => {
    expect(
      reminderDue(
        {
          contactIntervalDays: null,
          lastContactAt: now,
          reminderEnabledAt: now,
        },
        now,
      ),
    ).toBeNull();
  });

  it("uses the latest known conversation as the starting point", () => {
    expect(
      reminderDue(
        {
          contactIntervalDays: 7,
          lastContactAt: new Date(now.getTime() - 10 * DAY_MS),
          reminderEnabledAt: now,
        },
        now,
      ),
    ).toEqual({
      dueAt: "2026-11-01T12:00:00.000Z",
      overdueDays: 3,
    });
  });

  it("starts from reminder activation when conversation time is unknown", () => {
    expect(
      reminderDue(
        {
          contactIntervalDays: 7,
          lastContactAt: null,
          reminderEnabledAt: now,
        },
        now,
      ),
    ).toEqual({
      dueAt: "2026-11-11T12:00:00.000Z",
      overdueDays: 0,
    });
  });

  it.each([7, 30, 90, 365])(
    "uses a fixed %i-day interval and a strict deadline boundary",
    (contactIntervalDays) => {
      const lastContactAt = new Date(
        now.getTime() - contactIntervalDays * DAY_MS,
      );
      const atDeadline = reminderDue(
        { contactIntervalDays, lastContactAt, reminderEnabledAt: null },
        now,
      );
      const oneSecondLate = reminderDue(
        { contactIntervalDays, lastContactAt, reminderEnabledAt: null },
        new Date(now.getTime() + 1_000),
      );

      expect(atDeadline?.overdueDays).toBe(0);
      expect(oneSecondLate?.overdueDays).toBe(1);
    },
  );

  it("uses 24-hour days across a daylight-saving transition", () => {
    const lastContactAt = new Date("2026-10-24T12:00:00+02:00");
    expect(
      reminderDue(
        {
          contactIntervalDays: 7,
          lastContactAt,
          reminderEnabledAt: null,
        },
        new Date(lastContactAt.getTime() + 7 * DAY_MS),
      ),
    ).toEqual({
      dueAt: new Date(lastContactAt.getTime() + 7 * DAY_MS).toISOString(),
      overdueDays: 0,
    });
  });

  it.each([
    [1, "1 день"],
    [2, "2 дня"],
    [5, "5 дней"],
    [11, "11 дней"],
    [21, "21 день"],
  ])("formats %i overdue days as %s", (days, label) => {
    expect(daysLabel(days)).toBe(label);
  });

  it("rejects unsupported reminder intervals", () => {
    expect(
      reminderInput.safeParse({
        contactIntervalDays: 8,
        updatedAt: now.toISOString(),
      }).success,
    ).toBe(false);
  });
});
