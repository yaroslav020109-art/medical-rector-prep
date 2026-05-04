import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { getSessionEpoch } from "@/lib/db";

export async function GET() {
  const s = await readSession();
  if (!s || s.epoch < (await getSessionEpoch())) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, role: s.role });
}
