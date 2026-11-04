"use client";

import { useState } from "react";
import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { GroupUiAction, GroupUiState } from "@/lib/group-ui-state";
import type { ContactGroup } from "@/lib/types";

const sortGroups = (groups: ContactGroup[]) =>
  [...groups].sort((left, right) => left.name.localeCompare(right.name, "ru"));

async function groupRequest(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new Error("Нет связи с приложением. Попробуйте ещё раз.");
  }
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(body?.error || "Не удалось сохранить группу");
  return body;
}

export function GroupManager({
  state,
  dispatch,
  onChanged,
}: {
  state: GroupUiState;
  dispatch: React.Dispatch<GroupUiAction>;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function createGroup(event: React.FormEvent) {
    event.preventDefault();
    dispatch({ type: "mutation-started" });
    try {
      const created = (await groupRequest("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      })) as ContactGroup;
      dispatch({
        type: "mutation-succeeded",
        groups: sortGroups([...state.groups, created]),
      });
      setNewName("");
      onChanged();
    } catch (error) {
      dispatch({
        type: "mutation-failed",
        message:
          error instanceof Error ? error.message : "Не удалось создать группу",
      });
    }
  }

  async function renameGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    dispatch({ type: "mutation-started" });
    try {
      const renamed = (await groupRequest(`/api/groups/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editingName }),
      })) as ContactGroup;
      dispatch({
        type: "mutation-succeeded",
        groups: sortGroups(
          state.groups.map((group) =>
            group.id === renamed.id ? renamed : group,
          ),
        ),
      });
      setEditingId(null);
      setEditingName("");
      onChanged();
    } catch (error) {
      dispatch({
        type: "mutation-failed",
        message:
          error instanceof Error
            ? error.message
            : "Не удалось переименовать группу",
      });
    }
  }

  async function removeGroup() {
    const id = state.pendingDeleteId;
    if (!id) return;
    dispatch({ type: "mutation-started" });
    try {
      await groupRequest(`/api/groups/${id}`, { method: "DELETE" });
      dispatch({
        type: "mutation-succeeded",
        groups: state.groups.filter((group) => group.id !== id),
      });
      onChanged();
    } catch (error) {
      dispatch({
        type: "mutation-failed",
        message:
          error instanceof Error ? error.message : "Не удалось удалить группу",
      });
    }
  }

  const pendingDelete = state.groups.find(
    (group) => group.id === state.pendingDeleteId,
  );

  return (
    <div className="group-manager">
      <Button
        variant="outline"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Tags size={16} /> Управление группами
      </Button>
      {open && (
        <section
          className="group-manager-panel"
          aria-label="Управление группами"
        >
          <form className="group-create" onSubmit={createGroup}>
            <label htmlFor="new-group-name">Новая группа</label>
            <div>
              <Input
                id="new-group-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Например, Семья"
                disabled={state.busy}
              />
              <Button disabled={state.busy || !newName.trim()}>
                <Plus size={16} /> Создать
              </Button>
            </div>
          </form>

          {!!state.groups.length && (
            <ul className="group-manager-list">
              {state.groups.map((group) => (
                <li key={group.id}>
                  {editingId === group.id ? (
                    <form onSubmit={renameGroup} className="group-rename">
                      <Input
                        aria-label={`Новое название группы ${group.name}`}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        disabled={state.busy}
                        autoFocus
                      />
                      <Button disabled={state.busy || !editingName.trim()}>
                        Сохранить
                      </Button>
                      <Button
                        variant="ghost"
                        type="button"
                        aria-label="Отменить переименование"
                        disabled={state.busy}
                        onClick={() => setEditingId(null)}
                      >
                        <X size={16} />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <span className="group-badge">{group.name}</span>
                      <span className="group-manager-actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Переименовать группу ${group.name}`}
                          disabled={state.busy}
                          onClick={() => {
                            setEditingId(group.id);
                            setEditingName(group.name);
                          }}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Удалить группу ${group.name}`}
                          disabled={state.busy}
                          onClick={() =>
                            dispatch({ type: "request-delete", id: group.id })
                          }
                        >
                          <Trash2 size={15} />
                        </Button>
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {pendingDelete && (
            <div
              className="group-delete-confirmation"
              role="alertdialog"
              aria-busy={state.busy}
            >
              <strong>Удалить группу «{pendingDelete.name}»?</strong>
              <p>Контакты и их данные останутся на месте.</p>
              <div>
                <Button
                  variant="outline"
                  disabled={state.busy}
                  onClick={() => dispatch({ type: "cancel-delete" })}
                >
                  Отмена
                </Button>
                <Button
                  disabled={state.busy}
                  onClick={() => void removeGroup()}
                >
                  {state.busy ? "Удаляем…" : "Удалить группу"}
                </Button>
              </div>
            </div>
          )}
          {state.error && (
            <p className="form-error" role="alert">
              {state.error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
