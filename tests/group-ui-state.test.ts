import { describe, expect, it } from "vitest";
import {
  groupUiReducer,
  initialGroupUiState,
} from "@/lib/group-ui-state";

const groups = [
  { id: "friends", name: "Друзья" },
  { id: "tennis", name: "Теннис" },
];

describe("group UI state", () => {
  it("scenario: Удаление отменено", () => {
    const requested = groupUiReducer(initialGroupUiState(groups), {
      type: "request-delete",
      id: "friends",
    });
    const cancelled = groupUiReducer(requested, { type: "cancel-delete" });

    expect(cancelled.groups).toEqual(groups);
    expect(cancelled.pendingDeleteId).toBeNull();
  });

  it("scenario: Ошибка сохранения", () => {
    const failed = groupUiReducer(initialGroupUiState(groups), {
      type: "mutation-failed",
      message: "Не удалось сохранить группу",
    });

    expect(failed.groups).toEqual(groups);
    expect(failed.error).toBe("Не удалось сохранить группу");
    expect(failed.busy).toBe(false);
  });
});
