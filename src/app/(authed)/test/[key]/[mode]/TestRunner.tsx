"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface ServedQuestion {
  id: string;
  text: string;
  options: { letter: string; text: string }[];
  correctLetter?: string;
}

interface FetchResult {
  key: string;
  mode: "training" | "exam";
  total: number;
  questions: ServedQuestion[];
  answerKey?: Record<string, string>;
  sessionToken?: string;
}

interface GradeDetail {
  id: string;
  correctLetter: string;
  chosen: string | null;
  isCorrect: boolean;
}

interface GradeResult {
  total: number;
  correct: number;
  score: number;
  detail: GradeDetail[];
}

export default function TestRunner({
  subjectKey,
  subjectName,
  mode,
  limit,
}: {
  subjectKey: string;
  subjectName: string;
  mode: "training" | "exam";
  limit?: number;
}) {
  const [data, setData] = useState<FetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ mode });
    if (limit) params.set("limit", String(limit));
    fetch(`/api/test/${subjectKey}?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()) as FetchResult;
      })
      .then(setData)
      .catch(() => setError("Не вдалося завантажити тест."));
  }, [subjectKey, mode, limit]);

  const current = data?.questions[idx];
  const progress = data ? `${idx + 1} / ${data.total}` : "";
  const answered = data ? Object.keys(answers).length : 0;

  function pick(letter: string) {
    if (!current) return;
    if (mode === "training" && revealed[current.id]) return;
    setAnswers((a) => ({ ...a, [current.id]: letter }));
    if (mode === "training") {
      setRevealed((r) => ({ ...r, [current.id]: true }));
    }
  }

  async function submit() {
    if (!data) return;
    if (mode === "training") {
      // grade locally using known correct letters
      const detail: GradeDetail[] = data.questions.map((q) => {
        const correctLetter = q.correctLetter ?? "A";
        const chosen = answers[q.id] ?? null;
        return {
          id: q.id,
          correctLetter,
          chosen,
          isCorrect: chosen === correctLetter,
        };
      });
      const correct = detail.filter((d) => d.isCorrect).length;
      setGrade({
        total: data.total,
        correct,
        score: data.total ? correct / data.total : 0,
        detail,
      });
      return;
    }
    // exam mode: send to server for grading
    setSubmitting(true);
    try {
      const res = await fetch("/api/test/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionToken: data.sessionToken, answers }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setGrade((await res.json()) as GradeResult);
    } catch {
      setError("Не вдалося надіслати відповіді.");
    } finally {
      setSubmitting(false);
    }
  }

  const correctMap = useMemo(() => {
    if (!grade) return {} as Record<string, string>;
    const m: Record<string, string> = {};
    for (const d of grade.detail) m[d.id] = d.correctLetter;
    return m;
  }, [grade]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href={`/subject/${subjectKey}`}
          className="mt-4 inline-block text-sm font-medium underline"
        >
          ← Назад
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-zinc-500">Завантаження…</p>
      </main>
    );
  }

  if (grade && !reviewMode) {
    const pct = Math.round(grade.score * 100);
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Результат — {subjectName}
        </h1>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {grade.correct}{" "}
            <span className="text-zinc-400">/ {grade.total}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {pct}% правильних відповідей
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setReviewMode(true)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Переглянути помилки
          </button>
          <Link
            href={`/test/${subjectKey}/${mode}${limit ? `?limit=${limit}` : ""}`}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Пройти ще раз
          </Link>
          <Link
            href={`/subject/${subjectKey}`}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            До предмета
          </Link>
        </div>
      </main>
    );
  }

  if (grade && reviewMode) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <button
          type="button"
          onClick={() => setReviewMode(false)}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← До результату
        </button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Перегляд відповідей
        </h1>
        <ol className="mt-6 space-y-4">
          {data.questions.map((q, i) => {
            const correct = correctMap[q.id];
            const chosen = answers[q.id];
            return (
              <li
                key={q.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  №{i + 1}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{q.text}</p>
                <ul className="mt-3 space-y-1.5">
                  {q.options.map((o) => {
                    const isCorrect = o.letter === correct;
                    const isChosen = o.letter === chosen;
                    let cls =
                      "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-sm";
                    if (isCorrect) {
                      cls += " border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200";
                    } else if (isChosen) {
                      cls += " border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200";
                    } else {
                      cls += " border-zinc-200 dark:border-zinc-800";
                    }
                    return (
                      <li key={o.letter} className={cls}>
                        <span className="font-mono font-semibold">{o.letter}.</span>
                        <span>{o.text}</span>
                        {isCorrect && (
                          <span className="ml-auto text-xs font-medium">правильна</span>
                        )}
                        {isChosen && !isCorrect && (
                          <span className="ml-auto text-xs font-medium">ваша</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </main>
    );
  }

  if (!current) return null;

  const chosen = answers[current.id];
  const showCorrect = mode === "training" && revealed[current.id];
  const correctLetter = current.correctLetter;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between text-sm">
        <Link
          href={`/subject/${subjectKey}`}
          className="text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← {subjectName}
        </Link>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {mode === "training" ? "Тренування" : "Іспит"} • {progress}
        </span>
      </div>

      <article className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-wide text-zinc-400">
          Запитання {idx + 1}
        </p>
        <p className="mt-2 text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
          {current.text}
        </p>
        <ul className="mt-5 space-y-2">
          {current.options.map((o) => {
            const isChosen = chosen === o.letter;
            const isCorrect = showCorrect && o.letter === correctLetter;
            const isWrongPick = showCorrect && isChosen && !isCorrect;
            let cls =
              "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition";
            if (isCorrect) {
              cls +=
                " border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100";
            } else if (isWrongPick) {
              cls +=
                " border-red-400 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/30 dark:text-red-100";
            } else if (isChosen) {
              cls +=
                " border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-800";
            } else {
              cls +=
                " border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";
            }
            return (
              <li key={o.letter}>
                <button
                  type="button"
                  onClick={() => pick(o.letter)}
                  disabled={mode === "training" && revealed[current.id]}
                  className={cls}
                >
                  <span className="font-mono font-semibold">{o.letter}.</span>
                  <span className="flex-1">{o.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </article>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← Назад
        </button>
        <span className="text-xs text-zinc-500">
          Відповіли: {answered} / {data.total}
        </span>
        {idx < data.total - 1 ? (
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(data.total - 1, i + 1))}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Далі →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? "Перевіряю…" : "Завершити"}
          </button>
        )}
      </div>
    </main>
  );
}
