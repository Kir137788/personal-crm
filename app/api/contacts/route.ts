import { NextResponse } from "next/server";
import { contactInput } from "@/lib/validation";
import { getContact, listContacts } from "@/lib/contact-queries";
import { failure, unavailable, jsonBody } from "@/lib/api-response";
import {
  ContactMembershipError,
  createContactWithGroups,
} from "@/lib/contact-membership-service";
import { contactMembershipRepository } from "@/lib/contact-membership-repository";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await listContacts(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return unavailable();
  }
}
export async function POST(request: Request) {
  const parsed = contactInput.safeParse(await jsonBody(request));
  if (!parsed.success) return failure(400, "Проверьте данные контакта");
  try {
    const { groupIds, ...data } = parsed.data;
    const id = await createContactWithGroups(
      contactMembershipRepository,
      data,
      groupIds,
    );
    return NextResponse.json(await getContact(id), { status: 201 });
  } catch (error) {
    if (
      error instanceof ContactMembershipError &&
      error.code === "unknown_group"
    ) {
      return failure(400, "Одна из выбранных групп больше не существует");
    }
    return unavailable();
  }
}
