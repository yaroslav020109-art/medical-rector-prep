import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession, UnauthorizedError } from "@/lib/auth";
import { generateCodes, listCodes } from "@/lib/device-codes";

export async function GET() {
  try {
    await requireSession("admin");
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }
  const codes = await listCodes();
  return NextResponse.json({ codes });
}

export async function POST(request: NextRequest) {
  try {
    await requireSession("admin");
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const obj = (body ?? {}) as { count?: unknown; label?: unknown };
  const count = typeof obj.count === "number" ? obj.count : 1;
  const label = typeof obj.label === "string" ? obj.label : "";
  const created = await generateCodes(count, label);
  return NextResponse.json({ created });
}
