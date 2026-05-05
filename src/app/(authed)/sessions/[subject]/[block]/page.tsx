import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getBlockCards,
  getSessionSubject,
  isPrepSection,
} from "@/lib/sessions";
import SessionFlashcards from "../../SessionFlashcards";

export default async function SessionBlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string; block: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const { subject: subjectKey, block: blockStr } = await params;
  const sp = await searchParams;
  const subject = getSessionSubject(subjectKey);
  if (!subject) notFound();
  const blockIdx = Number(blockStr);
  if (!Number.isInteger(blockIdx)) notFound();

  // Cards mode
  const isCards =
    sp.cards === "1" || sp.cards === "true" || sp.cards === "shuffle";
  if (isCards) {
    const cards = getBlockCards(subject, blockIdx);
    if (cards.length === 0) notFound();
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={`/sessions/${subject.key}/${blockIdx}`}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← До розділу
        </Link>
        <SessionFlashcards
          cards={cards.map((c) => ({
            question: c.question,
            answer: c.answer,
            images: c.images,
            parentLabel: c.parentLabel,
          }))}
          shuffle={sp.cards === "shuffle"}
        />
      </main>
    );
  }

  // Browse mode
  if (subject.kind === "anatomy") {
    const block = subject.data.blocks[blockIdx];
    if (!block) notFound();
    const totalTopics = block.tickets.reduce(
      (a, t) => a + t.topics.length,
      0,
    );
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={`/sessions/${subject.key}`}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Назад
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {block.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {block.tickets.length} білетів · {totalTopics} карток
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/sessions/${subject.key}/${blockIdx}?cards=1`}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Флешкартки (по порядку)
          </Link>
          <Link
            href={`/sessions/${subject.key}/${blockIdx}?cards=shuffle`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Флешкартки (перемішати)
          </Link>
        </div>

        <ul className="mt-6 space-y-2">
          {block.tickets.map((t, i) => (
            <li key={i}>
              <Link
                href={`/sessions/${subject.key}/${blockIdx}/${i}`}
                className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-baseline gap-3">
                  <span className="shrink-0 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    №{t.number}
                  </span>
                  <span className="font-medium">{t.title}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t.topics.length} підпитань
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  // histology
  const sec = subject.data.sections[blockIdx];
  if (!sec) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/sessions/${subject.key}`}
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Назад
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{sec.title}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/sessions/${subject.key}/${blockIdx}?cards=1`}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Флешкартки (по порядку)
        </Link>
        <Link
          href={`/sessions/${subject.key}/${blockIdx}?cards=shuffle`}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Флешкартки (перемішати)
        </Link>
      </div>

      {isPrepSection(sec) ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {sec.preparations.map((p, i) => (
            <li key={i}>
              <Link
                href={`/sessions/${subject.key}/${blockIdx}/${i}`}
                className="block overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {p.image && (
                  <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="px-4 py-3">
                  <div className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    №{p.number}
                  </div>
                  <div className="font-medium">{p.name}</div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {p.items.length} карток
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 space-y-2">
          {sec.items.map((it, i) => (
            <li
              key={i}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="font-medium">{it.question}</div>
              {it.answer.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  {it.answer.map((a, ai) => (
                    <li key={ai}>{a}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
