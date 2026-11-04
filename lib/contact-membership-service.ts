export type ContactCreationInput = {
  name: string;
  context: string;
  phone: string;
  email: string;
  notes: string;
};

export type ContactMembershipErrorCode =
  | "unknown_group"
  | "not_found"
  | "conflict";

export class ContactMembershipError extends Error {
  constructor(readonly code: ContactMembershipErrorCode) {
    super(code);
    this.name = "ContactMembershipError";
  }
}

export type ContactMembershipRepository = {
  createContact(
    input: ContactCreationInput,
    groupIds: string[],
  ): Promise<string>;
  replaceGroups(
    contactId: string,
    groupIds: string[],
    updatedAt: string,
  ): Promise<void>;
};

export function uniqueGroupIds(groupIds: string[]) {
  return [...new Set(groupIds)];
}

export function createContactWithGroups(
  repository: ContactMembershipRepository,
  input: ContactCreationInput,
  groupIds: string[],
) {
  return repository.createContact(input, uniqueGroupIds(groupIds));
}

export function replaceContactGroups(
  repository: ContactMembershipRepository,
  contactId: string,
  groupIds: string[],
  updatedAt: string,
) {
  return repository.replaceGroups(
    contactId,
    uniqueGroupIds(groupIds),
    updatedAt,
  );
}
