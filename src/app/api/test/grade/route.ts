import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth";
import { verifyAnswerKey } from "@/lib/grade";

interface GradeBody {
  sessionToken?: unknown;
  answers?: unknown;
}

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    let body: GradeBody;
    try {
      body = (await request.json()) as GradeBody;
    } catch {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const token = typeof body.sessionToken === "string" ? body.sessionToken : "";
    const answers = body.answers as Record<string, string> | undefined;
    if (!token || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const key = verifyAnswerKey(token);
    if (!key) {
      return NextResponse.json({ error: "invalid_session_token" }, { status: 400 });
    }
    let correct = 0;
    const total = Object.keys(key).length;
    const detail: Array<{ id: string; correctLetter: string; chosen: string | null; isCorrect: boolean }> = [];
    for (const [id, correctLetter] of Object.entries(key)) {
      const chosenRaw = answers[id];
      const chosen = typeof chosenRaw === "string" ? chosenRaw : null;
      const isCorrect = chosen === correctLetter;
      if (isCorrect) correct += 1;
      detail.push({ id, correctLetter, chosen, isCorrect });
    }
    return NextResponse.json({
      total,
      correct,
      score: total > 0 ? correct / total : 0,
      detail,
    });
  });
}
