import { NextResponse } from "next/server";
export const failure = (status: number, error: string) => NextResponse.json({error}, {status});
export const unavailable = () => failure(503, "Не удалось сохранить или загрузить данные. Попробуйте ещё раз.");
export async function jsonBody(request: Request) { try { return await request.json(); } catch { return null; } }
