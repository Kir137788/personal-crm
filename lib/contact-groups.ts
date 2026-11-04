export type GroupNameErrorCode = "empty" | "duplicate";

export class GroupNameError extends Error {
  constructor(readonly code: GroupNameErrorCode) {
    super(code);
    this.name = "GroupNameError";
  }
}

export type PreparedGroupName = {
  name: string;
  normalizedName: string;
};

export function normalizeGroupName(name: string) {
  return name.trim().toLocaleLowerCase("ru-RU");
}

export function prepareGroupName(
  input: string,
  existingNormalizedNames: Iterable<string> = [],
): PreparedGroupName {
  const name = input.trim();
  if (!name) throw new GroupNameError("empty");

  const normalizedName = normalizeGroupName(name);
  const existing = new Set(
    Array.from(existingNormalizedNames, normalizeGroupName),
  );
  if (existing.has(normalizedName)) throw new GroupNameError("duplicate");

  return { name, normalizedName };
}
