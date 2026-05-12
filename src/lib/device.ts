/**
 * Persistent device identifier used to bind access codes to a single browser.
 *
 * Strategy: a long-lived first-party `device_id` cookie holding a random UUID.
 * Set once on first interaction with the auth flow and re-set with a fresh
 * `max-age` on every subsequent login so it doesn't expire while in use.
 *
 * This is intentionally distinct from `deviceFingerprint` (IP + UA hash) used
 * for analytics in `session.ts` — the fingerprint is unstable for mobile users
 * whose IP rotates, which is unacceptable for code binding.
 */
import crypto from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const DEVICE_COOKIE = "device_id";
/** 1 year — long enough to span an academic year, browsers may cap to 400d. */
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readDeviceIdFromRequest(req: NextRequest): string | null {
  const v = req.cookies.get(DEVICE_COOKIE)?.value;
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function generateDeviceId(): string {
  // RFC4122 v4-like, but we don't actually need the version bits — we just
  // need a 128-bit random opaque string. Hex is fine.
  return crypto.randomBytes(16).toString("hex");
}

export function setDeviceIdCookie(res: NextResponse, deviceId: string): void {
  res.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
}

/**
 * Read existing device id from the request, or generate a fresh one if absent.
 * The caller is responsible for invoking `setDeviceIdCookie(res, id)` on the
 * response to persist the new id (or refresh the cookie expiry).
 */
export function getOrCreateDeviceId(req: NextRequest): {
  deviceId: string;
  isNew: boolean;
} {
  const existing = readDeviceIdFromRequest(req);
  if (existing) return { deviceId: existing, isNew: false };
  return { deviceId: generateDeviceId(), isNew: true };
}
