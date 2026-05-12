import Link from "next/link";
import { getSubjectSummary } from "@/lib/data";
import { sessionSummary } from "@/lib/sessions";

export default function CatalogPage() {
  const summary = getSubjectSummary();
  const sessions = sessionSummary();
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Каталог</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Виберіть курс і предмет.
      </p>

      {summary.courses.map((course) => {
        const subjects = summary.subjects.filter(
          (s) => s.courseKey === course.key,
        );
        if (subjects.length === 0) return null;
        return (
          <section key={course.key} className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {course.name}
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <Link
                  key={s.key}
                  href={`/subject/${s.key}`}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {s.name}
                    </h3>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {s.questionCount} запитань
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {s.sections.slice(0, 4).map((sec) => (
                      <li key={sec.name} className="truncate">
                        • {sec.name}{" "}
                        <span className="text-xs text-zinc-400">
                          ({sec.questionCount})
                        </span>
                      </li>
                    ))}
                    {s.sections.length > 4 && (
                      <li className="text-xs italic text-zinc-400">
                        …і ще {s.sections.length - 4} тем
                      </li>
                    )}
                  </ul>
                  <p className="mt-4 text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
                    Розпочати →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Білети до сесії (флешкартки)
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {sessions.map((s) => (
          <Link
            key={s.key}
            href={`/sessions/${s.key}`}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold tracking-tight">{s.name}</h3>
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
              Відкрити білети →
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
