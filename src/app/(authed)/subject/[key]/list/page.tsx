import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/data";

export default async function QuestionListPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const subject = getSubject(key);
  if (!subject) notFound();

  const allQuestions = subject.sections.flatMap((s) => s.questions);
  const total = allQuestions.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/subject/${key}`}
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← {subject.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Перелік питань — {subject.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Усього {total} запитань
      </p>

      <ol className="mt-6 space-y-4">
        {allQuestions.map((q, i) => (
          <li
            key={q.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              № {i + 1}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
              {q.text}
            </p>
            <ul className="mt-3 space-y-1.5">
              {q.options.map((o) => {
                const isCorrect = o.letter === q.correctLetter;
                return (
                  <li
                    key={o.letter}
                    className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                      isCorrect
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <span className="font-mono font-semibold">{o.letter}.</span>
                    <span>{o.text}</span>
                    {isCorrect && (
                      <span className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        ✓ правильна
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </main>
  );
}
