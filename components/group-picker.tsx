import type { ContactGroup } from "@/lib/types";

export function GroupBadges({ groups }: { groups: ContactGroup[] }) {
  if (!groups.length) return null;
  return (
    <span className="group-badges" aria-label="Группы контакта">
      {groups.map((group) => (
        <span className="group-badge" key={group.id}>
          {group.name}
        </span>
      ))}
    </span>
  );
}

export function GroupPicker({
  groups,
  selected,
  onChange,
  disabled = false,
}: {
  groups: ContactGroup[];
  selected: string[];
  onChange: (groupIds: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(id: string, checked: boolean) {
    onChange(
      checked
        ? [...new Set([...selected, id])]
        : selected.filter((groupId) => groupId !== id),
    );
  }

  return (
    <fieldset className="group-picker" disabled={disabled}>
      <legend>Группы</legend>
      {!groups.length ? (
        <p>Сначала создайте группу в списке контактов.</p>
      ) : (
        <div className="group-picker-options">
          {groups.map((group) => (
            <label key={group.id}>
              <input
                type="checkbox"
                checked={selected.includes(group.id)}
                onChange={(event) => toggle(group.id, event.target.checked)}
              />
              <span>{group.name}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
