import { NextResponse } from "next/server";
import { readSession, type SessionPayload, type SessionRole } from "./session";
import { getSessionEpoch } from "./db";

export class UnauthorizedError extends Error {
  constructor(message = "unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireSession(role?: SessionRole): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) throw new UnauthorizedError();
  if (session.epoch < (await getSessionEpoch()))
    throw new UnauthorizedError("revoked");
  if (role && session.role !== role) {
    if (role === "admin" && session.role !== "admin") {
      throw new UnauthorizedError("forbidden");
    }
  }
  return session;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function withAuth<T>(
  handler: (s: SessionPayload) => Promise<T> | T,
  role?: SessionRole,
): Promise<T | NextResponse> {
  try {
    const s = await requireSession(role);
    return await handler(s);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }
    throw err;
  }
}
