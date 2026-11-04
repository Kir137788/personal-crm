import { describe, expect, it } from "vitest";
import { daysLabel } from "@/lib/keep-in-touch";

describe("Vitest setup", () => {
  it("resolves the project alias", () => {
    expect(daysLabel(2)).toBe("2 дня");
  });
});
