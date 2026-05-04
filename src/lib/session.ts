import crypto from "node:crypto";
import { cookies } from "next/headers";

export type SessionRole = "user" | "admin";

export interface SessionPayload {
  role: SessionRole;
  /** stable device fingerprint for this session */
  device: string;
  /** epoch this token was issued under (revoke-all bumps the global epoch) */
  epoch: number;
  /** unix ms of issuance */
  issued: number;
}

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET environment variable must be set (at least 16 characters)",
    );
  }
  return s;
}

function b64urlEncode(buf: Buffer | string): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signSession(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const body = b64urlEncode(json);
  const mac = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest();
  const sig = b64urlEncode(mac);
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64urlEncode(
    crypto.createHmac("sha256", getSecret()).update(body).digest(),
  );
  // constant-time compare
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const json = b64urlDecode(body).toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (
      typeof payload.role !== "string" ||
      typeof payload.device !== "string" ||
      typeof payload.epoch !== "number" ||
      typeof payload.issued !== "number"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const c = store.get(COOKIE_NAME);
  return verifySession(c?.value ?? null);
}

export async function writeSession(payload: SessionPayload): Promise<void> {
  const token = signSession(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function deviceFingerprint(req: {
  headers: Headers;
  ip?: string;
}): string {
  const ua = req.headers.get("user-agent") ?? "";
  const al = req.headers.get("accept-language") ?? "";
  // x-forwarded-for first hop, else nothing (don't trust client)
  const xff = req.headers.get("x-forwarded-for") ?? req.ip ?? "";
  const ipFirst = xff.split(",")[0].trim();
  const seed = `${ua}|${al}|${ipFirst}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}
