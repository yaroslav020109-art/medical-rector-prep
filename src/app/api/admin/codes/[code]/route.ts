import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSession, UnauthorizedError } from "@/lib/auth";
import { deleteCode, releaseCode } from "@/lib/device-codes";

async function requireAdminOr401(): Promise<NextResponse | null> {
  try {
    await requireSession("admin");
    return null;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const unauth = await requireAdminOr401();
  if (unauth) return unauth;
  const { code } = await params;
  const ok = await deleteCode(code);
  return NextResponse.json({ ok });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const unauth = await requireAdminOr401();
  if (unauth) return unauth;
  const { code } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const action = (body as { action?: unknown })?.action;
  if (action === "release") {
    const updated = await releaseCode(code);
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ code: updated });
  }
  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
