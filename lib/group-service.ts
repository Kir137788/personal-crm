import { GroupNameError, prepareGroupName } from "./contact-groups";

export type StoredGroup = {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GroupRepository = {
  list(): Promise<StoredGroup[]>;
  findById(id: string): Promise<StoredGroup | undefined>;
  findByNormalizedName(normalizedName: string): Promise<StoredGroup | undefined>;
  insert(input: { name: string; normalizedName: string }): Promise<StoredGroup>;
  update(
    id: string,
    input: { name: string; normalizedName: string },
  ): Promise<StoredGroup | undefined>;
  remove(id: string): Promise<StoredGroup | undefined>;
};

export type GroupServiceErrorCode = "empty" | "duplicate" | "not_found";

export class GroupServiceError extends Error {
  constructor(readonly code: GroupServiceErrorCode) {
    super(code);
    this.name = "GroupServiceError";
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function groupName(input: string) {
  try {
    return prepareGroupName(input);
  } catch (error) {
    if (error instanceof GroupNameError) {
      throw new GroupServiceError(error.code);
    }
    throw error;
  }
}

export async function listGroups(repository: GroupRepository) {
  return repository.list();
}

export async function createGroup(
  repository: GroupRepository,
  input: string,
) {
  const prepared = groupName(input);
  if (await repository.findByNormalizedName(prepared.normalizedName)) {
    throw new GroupServiceError("duplicate");
  }

  try {
    return await repository.insert(prepared);
  } catch (error) {
    if (isUniqueViolation(error)) throw new GroupServiceError("duplicate");
    throw error;
  }
}

export async function renameGroup(
  repository: GroupRepository,
  id: string,
  input: string,
) {
  if (!(await repository.findById(id))) {
    throw new GroupServiceError("not_found");
  }

  const prepared = groupName(input);
  const duplicate = await repository.findByNormalizedName(
    prepared.normalizedName,
  );
  if (duplicate && duplicate.id !== id) {
    throw new GroupServiceError("duplicate");
  }

  try {
    const updated = await repository.update(id, prepared);
    if (!updated) throw new GroupServiceError("not_found");
    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) throw new GroupServiceError("duplicate");
    throw error;
  }
}

export async function deleteGroup(repository: GroupRepository, id: string) {
  const deleted = await repository.remove(id);
  if (!deleted) throw new GroupServiceError("not_found");
  return deleted;
}
