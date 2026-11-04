import { NextResponse } from "next/server";
import { z } from "zod";
import { failure, jsonBody, unavailable } from "@/lib/api-response";
import { groupRepository } from "@/lib/group-repository";
import {
  GroupServiceError,
  createGroup,
  listGroups,
} from "@/lib/group-service";

export const dynamic = "force-dynamic";

const groupInput = z.object({ name: z.string() });

export async function GET() {
  try {
    return NextResponse.json(await listGroups(groupRepository), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  const parsed = groupInput.safeParse(await jsonBody(request));
  if (!parsed.success) return failure(400, "Введите название группы");

  try {
    return NextResponse.json(
      await createGroup(groupRepository, parsed.data.name),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GroupServiceError && error.code === "empty") {
      return failure(400, "Введите название группы");
    }
    if (error instanceof GroupServiceError && error.code === "duplicate") {
      return failure(409, "Группа с таким названием уже существует");
    }
    return unavailable();
  }
}
