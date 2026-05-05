import Link from "next/link";
import { sessionSummary } from "@/lib/sessions";

export default function SessionsIndexPage() {
  const subjects = sessionSummary();
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/catalog"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← До каталогу
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Білети до сесії
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Структурований матеріал у вигляді флешкарток: питання → подумай → покажи
        відповідь → познач «Знав / Не знав». В кінці — статистика.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {subjects.map((s) => (
          <Link
            key={s.key}
            href={`/sessions/${s.key}`}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{s.name}</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {s.totalTopics} карток
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {s.blocks.map((b, i) => (
                <li key={i} className="truncate">
                  • {b.title}{" "}
                  <span className="text-xs text-zinc-400">({b.topics})</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
              Відкрити →
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
