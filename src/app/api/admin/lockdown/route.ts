import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth";
import { bumpSessionEpoch, getSiteLocked, setSiteLocked } from "@/lib/db";

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const locked = (body as { locked?: unknown })?.locked;
    if (typeof locked !== "boolean") {
      return NextResponse.json({ error: "missing_locked" }, { status: 400 });
    }
    await setSiteLocked(locked);
    // Bumping the epoch invalidates every active session (users + admin), so
    // toggling the lock is also a hard kick.
    const newEpoch = await bumpSessionEpoch();
    return NextResponse.json({
      ok: true,
      locked: await getSiteLocked(),
      newEpoch,
    });
  }, "admin");
}
