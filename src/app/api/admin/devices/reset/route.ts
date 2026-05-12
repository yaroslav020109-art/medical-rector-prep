import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { countDevices, resetDevices } from "@/lib/db";

/**
 * Clears the set of unique device fingerprints that have logged in with the
 * shared/global access code. The counter shown on /admin restarts at 0 and
 * grows again as new logins come in. Active sessions are NOT invalidated —
 * the fingerprint is only stamped at login time, so existing users stay
 * logged in but they will not be re-counted.
 */
export async function POST() {
  return withAuth(async () => {
    await resetDevices();
    const total = await countDevices();
    return NextResponse.json({ ok: true, total });
  }, "admin");
}
