/**
 * Device-bound access codes.
 *
 * An admin generates short codes that work like a "personal seat license":
 *   - first time the code is entered on any device, it "binds" to that device
 *     (identified by the persistent `device_id` cookie);
 *   - on the SAME device, the same code can be used unlimited times to log in
 *     (after cookie expiry, after logout, in a new tab, etc.);
 *   - on any OTHER device, the same code is rejected (`device_mismatch`).
 *
 * Admin operations:
 *   - generate codes (single or batch)
 *   - list all codes with binding state
 *   - "release" a code: clears the device binding so it can be re-used on a new
 *     device (e.g. when the legitimate owner changed phone / cleared cookies);
 *   - delete a code permanently.
 *
 * Storage layout in KV:
 *   - `dcode:{CODE}`  →  JSON of `StoredDeviceCode`
 *   - `dcodes:index`  →  set of all known codes (for listing without SCAN)
 */
import crypto from "node:crypto";
import {
  addToSet,
  delKV,
  getJSON,
  getSetMembers,
  removeFromSet,
  setJSON,
} from "./kv-store";

const KEY_PREFIX = "dcode:";
const INDEX_KEY = "dcodes:index";

export interface StoredDeviceCode {
  /** the plain-text code as shown to the admin (e.g. MED-1A2B-3C4D) */
  code: string;
  /** human label, e.g. "Andriy" — purely cosmetic, optional */
  label: string;
  /** unix ms when the code was generated */
  createdAt: number;
  /** unix ms when the code first bound to a device, or null if free */
  boundAt: number | null;
  /** device id the code is bound to, or null if free */
  deviceId: string | null;
  /** unix ms of last successful login with this code, or null */
  lastUsedAt: number | null;
  /** total successful logins with this code */
  uses: number;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion

function randomGroup(len: number): string {
  const bytes = crypto.randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

/** Format: MED-XXXX-YYYY (8 chars from a 32-char alphabet) */
export function generateCodeString(): string {
  return `MED-${randomGroup(4)}-${randomGroup(4)}`;
}

function key(code: string): string {
  return KEY_PREFIX + code;
}

export function isValidCodeFormat(code: string): boolean {
  return /^MED-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

export async function loadCode(code: string): Promise<StoredDeviceCode | null> {
  if (!code) return null;
  return getJSON<StoredDeviceCode>(key(code));
}

export async function saveCode(c: StoredDeviceCode): Promise<void> {
  await setJSON(key(c.code), c);
  await addToSet(INDEX_KEY, c.code);
}

export async function generateCodes(
  count: number,
  label: string,
): Promise<StoredDeviceCode[]> {
  const n = Math.max(1, Math.min(50, count | 0));
  const now = Date.now();
  const out: StoredDeviceCode[] = [];
  for (let i = 0; i < n; i++) {
    // Avoid collisions even though probability is ~10^-12 per code.
    let attempt = 0;
    let code = generateCodeString();
    while (attempt < 5 && (await loadCode(code)) !== null) {
      code = generateCodeString();
      attempt++;
    }
    const c: StoredDeviceCode = {
      code,
      label: label.trim().slice(0, 80),
      createdAt: now,
      boundAt: null,
      deviceId: null,
      lastUsedAt: null,
      uses: 0,
    };
    await saveCode(c);
    out.push(c);
  }
  return out;
}

export async function listCodes(): Promise<StoredDeviceCode[]> {
  const codes = await getSetMembers(INDEX_KEY);
  const records = await Promise.all(codes.map((c) => loadCode(c)));
  const out: StoredDeviceCode[] = [];
  for (const r of records) if (r) out.push(r);
  // newest first
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
}

export interface ValidateResult {
  status: "ok" | "device_mismatch" | "not_found";
  code?: StoredDeviceCode;
}

/**
 * Validate (and bind, if needed) a device-bound code for `deviceId`.
 *
 *  - returns `{ status: "not_found" }` when the code does not exist;
 *  - returns `{ status: "device_mismatch", code }` when the code is bound
 *    to a different device;
 *  - returns `{ status: "ok", code }` after binding (first use) OR after
 *    accepting a same-device subsequent use. The persisted record is updated
 *    with `lastUsedAt` and `uses++`.
 */
export async function validateAndBind(
  rawCode: string,
  deviceId: string,
): Promise<ValidateResult> {
  if (!isValidCodeFormat(rawCode)) return { status: "not_found" };
  const c = await loadCode(rawCode);
  if (!c) return { status: "not_found" };

  const now = Date.now();
  if (c.deviceId == null) {
    c.deviceId = deviceId;
    c.boundAt = now;
  } else if (c.deviceId !== deviceId) {
    return { status: "device_mismatch", code: c };
  }
  c.lastUsedAt = now;
  c.uses += 1;
  await saveCode(c);
  return { status: "ok", code: c };
}

export async function releaseCode(rawCode: string): Promise<StoredDeviceCode | null> {
  const c = await loadCode(rawCode);
  if (!c) return null;
  c.deviceId = null;
  c.boundAt = null;
  await saveCode(c);
  return c;
}

export async function deleteCode(rawCode: string): Promise<boolean> {
  const existed = (await loadCode(rawCode)) !== null;
  if (existed) {
    await delKV(key(rawCode));
    await removeFromSet(INDEX_KEY, rawCode);
  }
  return existed;
}
