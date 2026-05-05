"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export interface Flashcard {
  question: string;
  answer: string[];
  images: string[];
  parentLabel?: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface RunState {
  cards: Flashcard[];
  idx: number;
  revealed: boolean;
  marks: Record<number, "knew" | "didnt">;
  done: boolean;
}

function initialState(cards: Flashcard[], shuffle: boolean): RunState {
  return {
    cards: shuffle ? shuffleArray(cards) : cards,
    idx: 0,
    revealed: false,
    marks: {},
    done: false,
  };
}

export default function SessionFlashcards({
  cards: cardsProp,
  shuffle,
  title,
}: {
  cards: Flashcard[];
  shuffle?: boolean;
  title?: string;
}) {
  const [state, setState] = useState<RunState>(() =>
    initialState(cardsProp, !!shuffle),
  );
  const { cards, idx, revealed, marks, done } = state;
  const total = cards.length;
  const card = cards[idx];

  function setRevealed(v: boolean) {
    setState((s) => ({ ...s, revealed: v }));
  }

  function mark(value: "knew" | "didnt") {
    setState((s) => {
      const newMarks = { ...s.marks, [s.idx]: value };
      const isLast = s.idx + 1 >= s.cards.length;
      return {
        ...s,
        marks: newMarks,
        idx: isLast ? s.idx : s.idx + 1,
        revealed: false,
        done: isLast,
      };
    });
  }

  function restart(onlyDidnt: boolean) {
    setState((s) => {
      let pool: Flashcard[];
      if (onlyDidnt) {
        const indices = Object.entries(s.marks)
          .filter(([, v]) => v === "didnt")
          .map(([k]) => Number(k));
        pool = indices.map((i) => s.cards[i]);
        if (pool.length === 0) return s;
      } else {
        pool = s.cards;
      }
      return initialState(pool, true);
    });
  }

  const stats = useMemo(() => {
    const values = Object.values(marks);
    const knew = values.filter((v) => v === "knew").length;
    const didnt = values.filter((v) => v === "didnt").length;
    return { knew, didnt, answered: knew + didnt };
  }, [marks]);

  if (total === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Карток немає.
        </p>
      </div>
    );
  }

  if (done) {
    const score = stats.answered ? stats.knew / stats.answered : 0;
    return (
      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold tracking-tight">
            {title ? `${title}: ` : ""}Готово
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Знаю:{" "}
            <span className="font-semibold text-emerald-600">{stats.knew}</span>{" "}
            · Не знаю:{" "}
            <span className="font-semibold text-rose-600">{stats.didnt}</span>{" "}
            · Усього: {total}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${Math.round(score * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm">
            Результат: <strong>{Math.round(score * 100)}%</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => restart(false)}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Ще раз (всі картки)
          </button>
          {stats.didnt > 0 && (
            <button
              type="button"
              onClick={() => restart(true)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Тільки те, що не знав ({stats.didnt})
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          {idx + 1} / {total}
        </span>
        <span>
          <span className="text-emerald-600">+{stats.knew}</span>{" "}
          <span className="text-rose-600">−{stats.didnt}</span>
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full bg-zinc-900 transition-all dark:bg-zinc-100"
          style={{ width: `${(idx / total) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {card.parentLabel && (
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {card.parentLabel}
          </p>
        )}
        {card.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {card.images.map((src, i) => (
              <div
                key={i}
                className="relative h-48 w-48 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="192px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-lg font-semibold leading-snug">
          {card.question}
        </p>
        {revealed ? (
          <div className="mt-4 rounded-md bg-zinc-50 p-4 text-sm dark:bg-zinc-950/50">
            {card.answer.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {card.answer.map((a, ai) => (
                  <li key={ai}>{a}</li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">
                (Відповідь у самому формулюванні питання вище.)
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Показати відповідь
          </button>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => mark("didnt")}
            className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950"
          >
            Не знав
          </button>
          <button
            type="button"
            onClick={() => mark("knew")}
            className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950"
          >
            Знав
          </button>
        </div>
      )}
    </div>
  );
}
