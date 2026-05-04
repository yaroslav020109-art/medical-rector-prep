import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserCodeHash, verifyCode } from "@/lib/codes";
import {
  deviceFingerprint,
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";
import { getSessionEpoch, getSiteLocked, upsertDeviceAndCount } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (await getSiteLocked()) {
    return NextResponse.json({ error: "site_locked" }, { status: 403 });
  }
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
  if (!verifyCode(code, getUserCodeHash())) {
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }
  const fingerprint = deviceFingerprint(request);
  await upsertDeviceAndCount(fingerprint);
  const token = signSession({
    role: "user",
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
