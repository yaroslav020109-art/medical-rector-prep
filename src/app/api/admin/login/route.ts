import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminCodeHash, verifyCode } from "@/lib/codes";
import {
  deviceFingerprint,
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";
import { getSessionEpoch } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const code = (body as { code?: unknown })?.code;
  if (typeof code !== "string" || code.length === 0) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }
  if (!verifyCode(code, getAdminCodeHash())) {
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }
  const fingerprint = deviceFingerprint(request);
  const token = signSession({
    role: "admin",
    device: fingerprint,
    epoch: await getSessionEpoch(),
    issued: Date.now(),
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
