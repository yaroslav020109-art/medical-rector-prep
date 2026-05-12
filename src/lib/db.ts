import { addToSet, deleteSet, getKV, setKV, setSize } from "./kv-store";

const SETTING_PREFIX = "settings:";
const DEVICES_SET = "devices:fingerprints";
const SESSION_EPOCH_KEY = "session_epoch";
const SITE_LOCKED_KEY = "site_locked";

export async function getSetting(key: string): Promise<string | null> {
  return getKV(SETTING_PREFIX + key);
}

export async function setSetting(key: string, value: string): Promise<void> {
  return setKV(SETTING_PREFIX + key, value);
}

export async function upsertDeviceAndCount(
  fingerprint: string,
): Promise<{ isNew: boolean; total: number }> {
  const { added, size } = await addToSet(DEVICES_SET, fingerprint);
  return { isNew: added, total: size };
}

export async function countDevices(): Promise<number> {
  return setSize(DEVICES_SET);
}

export async function resetDevices(): Promise<void> {
  await deleteSet(DEVICES_SET);
}

export async function bumpSessionEpoch(): Promise<string> {
  const now = String(Date.now());
  await setSetting(SESSION_EPOCH_KEY, now);
  return now;
}

export async function getSessionEpoch(): Promise<number> {
  const v = await getSetting(SESSION_EPOCH_KEY);
  if (v) return Number(v);
  // First-run bootstrap: persist a fresh epoch so subsequent reads are stable.
  return Number(await bumpSessionEpoch());
}

export async function getSiteLocked(): Promise<boolean> {
  return (await getSetting(SITE_LOCKED_KEY)) === "1";
}

export async function setSiteLocked(locked: boolean): Promise<void> {
  await setSetting(SITE_LOCKED_KEY, locked ? "1" : "0");
}
