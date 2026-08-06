import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: { status?: number }) {
  return NextResponse.json({ ok: true, data }, { status: init?.status ?? 200 });
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { message, details } }, { status });
}
