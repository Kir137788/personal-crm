import { NextResponse } from "next/server";
import { z } from "zod";
import { failure, jsonBody, unavailable } from "@/lib/api-response";
import { getContact } from "@/lib/contact-queries";
import { contactMembershipRepository } from "@/lib/contact-membership-repository";
import {
  ContactMembershipError,
  replaceContactGroups,
} from "@/lib/contact-membership-service";
import { contactGroupsInput } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return failure(404, "Контакт не найден");

  const parsed = contactGroupsInput.safeParse(await jsonBody(request));
  if (!parsed.success) return failure(400, "Проверьте выбранные группы");

  try {
    await replaceContactGroups(
      contactMembershipRepository,
      id,
      parsed.data.groupIds,
      parsed.data.updatedAt,
    );
    return NextResponse.json(await getContact(id));
  } catch (error) {
    if (error instanceof ContactMembershipError) {
      if (error.code === "not_found") return failure(404, "Контакт не найден");
      if (error.code === "conflict") {
        return failure(
          409,
          "Контакт изменён в другом окне. Обновите карточку и повторите.",
        );
      }
      if (error.code === "unknown_group") {
        return failure(400, "Одна из выбранных групп больше не существует");
      }
    }
    return unavailable();
  }
}
