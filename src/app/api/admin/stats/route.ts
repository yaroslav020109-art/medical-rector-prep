import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { countDevices, getSessionEpoch, getSiteLocked } from "@/lib/db";

export async function GET() {
  return withAuth(async () => {
    return NextResponse.json({
      uniqueDevices: await countDevices(),
      sessionEpoch: await getSessionEpoch(),
      siteLocked: await getSiteLocked(),
    });
  }, "admin");
}
