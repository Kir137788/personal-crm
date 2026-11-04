import type { ContactGroup } from "./types";

export type GroupUiState = {
  groups: ContactGroup[];
  pendingDeleteId: string | null;
  busy: boolean;
  error: string;
};

export type GroupUiAction =
  | { type: "sync"; groups: ContactGroup[] }
  | { type: "request-delete"; id: string }
  | { type: "cancel-delete" }
  | { type: "mutation-started" }
  | { type: "mutation-succeeded"; groups: ContactGroup[] }
  | { type: "mutation-failed"; message: string };

export function initialGroupUiState(groups: ContactGroup[]): GroupUiState {
  return { groups, pendingDeleteId: null, busy: false, error: "" };
}

export function groupUiReducer(
  state: GroupUiState,
  action: GroupUiAction,
): GroupUiState {
  switch (action.type) {
    case "sync":
      return { ...state, groups: action.groups };
    case "request-delete":
      return { ...state, pendingDeleteId: action.id, error: "" };
    case "cancel-delete":
      return { ...state, pendingDeleteId: null, error: "" };
    case "mutation-started":
      return { ...state, busy: true, error: "" };
    case "mutation-succeeded":
      return {
        groups: action.groups,
        pendingDeleteId: null,
        busy: false,
        error: "",
      };
    case "mutation-failed":
      return { ...state, busy: false, error: action.message };
  }
}
