import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getSubjectSummary } from "@/lib/data";

export async function GET() {
  return withAuth(() => NextResponse.json(getSubjectSummary()));
}
