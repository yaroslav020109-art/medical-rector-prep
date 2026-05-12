"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface QuestionOption {
  letter: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correctLetter: string;
  meta?: Record<string, string>;
}

interface Section {
  name: string;
  questions: Question[];
}

interface Props {
  subjectKey: string;
  subjectName: string;
  sections: Section[];
}

function slugifySection(name: string): string {
  return `section-${name
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)}`;
}

export default function QuestionListClient({
  subjectKey,
  subjectName,
  sections,
}: Props) {
  const [showAnswers, setShowAnswers] = useState(true);
  const [query, setQuery] = useState("");

  const total = useMemo(
    () => sections.reduce((acc, s) => acc + s.questions.length, 0),
    [sections],
  );

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((sec) => ({
        name: sec.name,
        questions: sec.questions.filter((qu) => {
          if (qu.text.toLowerCase().includes(q)) return true;
          for (const opt of qu.options) {
            if (opt.text.toLowerCase().includes(q)) return true;
          }
          return false;
        }),
      }))
      .filter((sec) => sec.questions.length > 0);
  }, [sections, query]);

  const filteredCount = filteredSections.reduce(
    (acc, s) => acc + s.questions.length,
    0,
  );

  const hasMultipleSections = sections.length > 1;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={(e) => setShowAnswers(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
          />
          Показувати правильні відповіді
        </label>
        <div className="flex-1" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук по тексту запитання…"
          className="w-full max-w-xs rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 sm:w-64"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {query ? (
            <>
              Знайдено <strong>{filteredCount}</strong> з {total}
            </>
          ) : (
            <>
              Усього <strong>{total}</strong>
            </>
          )}
        </p>
      </div>

      {hasMultipleSections && (
        <nav className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Теми ({sections.length})
          </p>
          <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {sections.map((sec) => (
              <li key={sec.name} className="truncate text-sm">
                <a
                  href={`#${slugifySection(sec.name)}`}
                  className="text-zinc-700 hover:underline dark:text-zinc-200"
                >
                  • {sec.name}{" "}
                  <span className="text-xs text-zinc-400">
                    ({sec.questions.length})
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {filteredSections.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Нічого не знайдено за запитом «{query}». Спробуй інше слово.
        </p>
      ) : (
        filteredSections.map((sec) => (
          <section
            key={sec.name}
            id={slugifySection(sec.name)}
            className="mt-6 scroll-mt-20"
          >
            {hasMultipleSections && (
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {sec.name}{" "}
                <span className="font-normal lowercase text-zinc-400">
                  · {sec.questions.length} запитань
                </span>
              </h2>
            )}
            <ol className="mt-2 space-y-3">
              {sec.questions.map((qu, idx) => (
                <li
                  key={qu.id}
                  id={qu.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    <span className="mr-2 text-xs font-semibold text-zinc-400">
                      {idx + 1}.
                    </span>
                    {qu.text}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {qu.options.map((opt) => {
                      const isCorrect = opt.letter === qu.correctLetter;
                      const showAsCorrect = showAnswers && isCorrect;
                      return (
                        <li
                          key={opt.letter}
                          className={
                            showAsCorrect
                              ? "rounded-md bg-emerald-50 px-2 py-1 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900/50"
                              : "px-2 py-1 text-zinc-700 dark:text-zinc-300"
                          }
                        >
                          <span
                            className={
                              showAsCorrect
                                ? "mr-2 font-semibold"
                                : "mr-2 font-medium text-zinc-500 dark:text-zinc-400"
                            }
                          >
                            {opt.letter}.
                          </span>
                          {opt.text}
                          {showAsCorrect && (
                            <span className="ml-2 text-xs uppercase tracking-wide">
                              ← правильна
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {qu.meta?.krok && (
                    <p className="mt-2 text-xs text-zinc-400">
                      Джерело: {qu.meta.krok}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))
      )}

      <div className="mt-8">
        <Link
          href={`/subject/${subjectKey}`}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Назад до {subjectName}
        </Link>
      </div>
    </div>
  );
}
