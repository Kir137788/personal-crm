import { describe, expect, it } from "vitest";
import { GroupNameError, prepareGroupName } from "@/lib/contact-groups";

describe("contact group names", () => {
  it("scenario: Пустое название", () => {
    expect(() => prepareGroupName("   ")).toThrowError(
      new GroupNameError("empty"),
    );
  });

  it.each([" друзья ", "ДРУЗЬЯ"])(
    "scenario: Повторяющееся название — %s",
    (candidate) => {
      expect(() => prepareGroupName(candidate, ["друзья"])).toThrowError(
        new GroupNameError("duplicate"),
      );
    },
  );
});
