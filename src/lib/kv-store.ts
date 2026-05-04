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

export async function setSize(setKey: string): Promise<number> {
  if (useKV) {
    const n = await kv.scard(setKey);
    return Number(n);
  }
  return (memSets.get(setKey) ?? new Set()).size;
}
