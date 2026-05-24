import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/data";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const subject = getSubject(key);
  if (!subject) notFound();
  const total = subject.sections.reduce((acc, s) => acc + s.questions.length, 0);
  const examLimit = Math.min(50, total);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/catalog"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← До каталогу
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{subject.name}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Усього {total} запитань. Виберіть режим:
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href={`/test/${subject.key}/training`}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <h2 className="text-lg font-semibold">Тренування</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Ви бачите правильну відповідь одразу після вибору. Без обмеження часу.
            Запитання та варіанти перемішуються.
          </p>
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Розпочати тренування →
          </p>
        </Link>
        <Link
          href={`/test/${subject.key}/exam?limit=${examLimit}`}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <h2 className="text-lg font-semibold">Іспит</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {examLimit} випадкових запитань. Правильні відповіді показуються лише
            після завершення.
          </p>
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Розпочати іспит →
          </p>
        </Link>
      </div>

      <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          Хочете іспит з усіх {total} запитань? Натисніть{" "}
          <Link
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
            href={`/test/${subject.key}/exam?limit=${total}`}
          >
            тут
          </Link>
          .
        </p>
      </div>

      <Link
        href={`/subject/${subject.key}/list`}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <div>
          <h2 className="text-lg font-semibold">Перелік питань</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Переглянути всі {total} запитань з правильними відповідями.
          </p>
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Переглянути →
          </p>
        </div>
      </Link>
    </main>
  );
}
