import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth";
import { getAllQuestions, shuffleArray, type Question } from "@/lib/data";
import { signAnswerKey } from "@/lib/grade";

interface ServedOption {
  letter: string;
  text: string;
}

interface ServedQuestion {
  id: string;
  text: string;
  options: ServedOption[];
  /** present only in training mode so the client can show feedback immediately */
  correctLetter?: string;
}

function shuffleOptions(q: Question): { options: ServedOption[]; correctLetter: string } {
  const shuffled = shuffleArray(q.options);
  const letters = ["A", "B", "C", "D", "E"];
  let newCorrect = "A";
  const remapped = shuffled.map((opt, idx) => {
    const newLetter = letters[idx] ?? opt.letter;
    if (opt.letter === q.correctLetter) newCorrect = newLetter;
    return { letter: newLetter, text: opt.text };
  });
  return { options: remapped, correctLetter: newCorrect };
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ key: string }> },
) {
  return withAuth(async () => {
    const { key } = await ctx.params;
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") === "training" ? "training" : "exam";
    const limitParam = url.searchParams.get("limit");
    const all = getAllQuestions(key);
    if (all.length === 0) {
      return NextResponse.json({ error: "subject_not_found" }, { status: 404 });
    }
    const limit = Math.max(
      1,
      Math.min(Number(limitParam) || all.length, all.length),
    );
    const sampled = shuffleArray(all).slice(0, limit);
    const answerKey: Record<string, string> = {};
    const served: ServedQuestion[] = sampled.map((q) => {
      const { options, correctLetter } = shuffleOptions(q);
      answerKey[q.id] = correctLetter;
      const out: ServedQuestion = { id: q.id, text: q.text, options };
      if (mode === "training") {
        out.correctLetter = correctLetter;
      }
      return out;
    });
    return NextResponse.json({
      key,
      mode,
      total: served.length,
      questions: served,
      answerKey: mode === "training" ? answerKey : undefined,
      // signed token (HMAC) carrying the answer key for grading; opaque to client
      sessionToken: mode === "exam" ? signAnswerKey(answerKey) : undefined,
    });
  });
}
