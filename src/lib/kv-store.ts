import { kv } from "@vercel/kv";

/**
 * Thin abstraction over a key/value store.
 *
 * In production (Vercel) it talks to Vercel KV (Upstash Redis under the hood)
 * via the `@vercel/kv` SDK, which auto-reads `KV_REST_API_URL` /
 * `KV_REST_API_TOKEN` from env.
 *
 * In local development, when no KV credentials are configured, we fall back to
 * an in-memory store. State does not survive process restarts in dev — that is
 * fine because real persistence only matters in production. Production code
 * never enters the in-memory branch because the env vars are always set.
 */

const useKV = !!process.env.KV_REST_API_URL;

const memSettings = new Map<string, string>();
const memSets = new Map<string, Set<string>>();

export async function getKV(key: string): Promise<string | null> {
  if (useKV) {
    const v = await kv.get<string>(key);
    return typeof v === "string" ? v : v == null ? null : String(v);
  }
  return memSettings.get(key) ?? null;
}

export async function setKV(key: string, value: string): Promise<void> {
  if (useKV) {
    await kv.set(key, value);
    return;
  }
  memSettings.set(key, value);
}

export async function delKV(key: string): Promise<void> {
  if (useKV) {
    await kv.del(key);
    return;
  }
  memSettings.delete(key);
}

export async function addToSet(
  setKey: string,
  member: string,
): Promise<{ added: boolean; size: number }> {
  if (useKV) {
    const added = await kv.sadd(setKey, member);
    const size = await kv.scard(setKey);
    return { added: Number(added) > 0, size: Number(size) };
  }
  let set = memSets.get(setKey);
  if (!set) {
    set = new Set();
    memSets.set(setKey, set);
  }
  const before = set.size;
  set.add(member);
  return { added: set.size > before, size: set.size };
}

export async function removeFromSet(
  setKey: string,
  member: string,
): Promise<void> {
  if (useKV) {
    await kv.srem(setKey, member);
    return;
  }
  memSets.get(setKey)?.delete(member);
}

export async function getSetMembers(setKey: string): Promise<string[]> {
  if (useKV) {
    const members = await kv.smembers(setKey);
    return Array.isArray(members) ? members.map(String) : [];
  }
  return Array.from(memSets.get(setKey) ?? []);
}

export async function setSize(setKey: string): Promise<number> {
  if (useKV) {
    const n = await kv.scard(setKey);
    return Number(n);
  }
  return (memSets.get(setKey) ?? new Set()).size;
}

export async function deleteSet(setKey: string): Promise<void> {
  if (useKV) {
    await kv.del(setKey);
    return;
  }
  memSets.delete(setKey);
}

// ---------- JSON helpers ----------
//
// Note on @vercel/kv quirk: `kv.get(key)` auto-parses values that *look* like
// JSON. So if we `kv.set(key, JSON.stringify(obj))`, a later `kv.get` will
// return `obj` (already parsed), NOT the JSON string. The previous version of
// these helpers re-fetched via the string-typed `getKV` wrapper and tried to
// `JSON.parse` the result — that double-parse blew up on production KV (but
// not on the in-memory dev stub, which preserves the raw string). We now
// bypass the string wrapper in production and trust the SDK's auto-parse.

export async function getJSON<T>(key: string): Promise<T | null> {
  if (useKV) {
    const v = await kv.get<T>(key);
    // The SDK returns the original type (object, string, number, ...). We
    // only support object/value payloads stored via setJSON, so just hand
    // back what we got.
    return v == null ? null : (v as T);
  }
  const raw = memSettings.get(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  if (useKV) {
    // Pass the raw object: the SDK serializes it. (Passing JSON.stringify-ed
    // values also works because the SDK still auto-parses on read, but it's
    // clearer to pass the original object so the round-trip type matches.)
    await kv.set(key, value as unknown as string);
    return;
  }
  memSettings.set(key, JSON.stringify(value));
}
