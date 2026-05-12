import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserCodeHash, verifyCode } from "@/lib/codes";
import {
  deviceFingerprint,
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";
import {
  getOrCreateDeviceId,
  setDeviceIdCookie,
} from "@/lib/device";
import { validateAndBind } from "@/lib/device-codes";
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

  // Resolve / mint the persistent device identifier first so we can use it
  // both for analytics and for device-bound code validation, and so we can
  // refresh its cookie no matter which code branch wins.
  const { deviceId, isNew: deviceIsNew } = getOrCreateDeviceId(request);
  const fingerprint = deviceFingerprint(request);

  const role = "user" as const;
  let issueSession = false;

  if (verifyCode(code, getUserCodeHash())) {
    // Legacy global user code — works on any device.
    issueSession = true;
  } else {
    // Try device-bound code path.
    const result = await validateAndBind(code, deviceId);
    if (result.status === "ok") {
      issueSession = true;
    } else if (result.status === "device_mismatch") {
      return NextResponse.json(
        { error: "device_mismatch" },
        { status: 403 },
      );
    } else {
      return NextResponse.json({ error: "invalid_code" }, { status: 401 });
    }
  }

  if (!issueSession) {
    // Shouldn't happen given the branches above, but be defensive.
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }

  await upsertDeviceAndCount(fingerprint);
  const token = signSession({
    role,
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
  // Refresh (or first-time set) the persistent device_id cookie so future
  // logins keep the same binding even if the original cookie was nearing
  // expiry.
  void deviceIsNew; // (kept for readability; not used further)
  setDeviceIdCookie(res, deviceId);
  return res;
}
