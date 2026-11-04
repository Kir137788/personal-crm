import { NextResponse } from "next/server";
import { z } from "zod";
import { failure, jsonBody, unavailable } from "@/lib/api-response";
import { groupRepository } from "@/lib/group-repository";
import {
  GroupServiceError,
  deleteGroup,
  renameGroup,
} from "@/lib/group-service";

const groupInput = z.object({ name: z.string() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return failure(404, "Группа не найдена");

  const parsed = groupInput.safeParse(await jsonBody(request));
  if (!parsed.success) return failure(400, "Введите название группы");

  try {
    return NextResponse.json(
      await renameGroup(groupRepository, id, parsed.data.name),
    );
  } catch (error) {
    if (error instanceof GroupServiceError && error.code === "empty") {
      return failure(400, "Введите название группы");
    }
    if (error instanceof GroupServiceError && error.code === "duplicate") {
      return failure(409, "Группа с таким названием уже существует");
    }
    if (error instanceof GroupServiceError && error.code === "not_found") {
      return failure(404, "Группа не найдена");
    }
    return unavailable();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return failure(404, "Группа не найдена");

  try {
    await deleteGroup(groupRepository, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof GroupServiceError && error.code === "not_found") {
      return failure(404, "Группа не найдена");
    }
    return unavailable();
  }
}
