import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getItemCards,
  getSessionSubject,
  isPrepSection,
} from "@/lib/sessions";
import SessionFlashcards from "../../../SessionFlashcards";

export default async function SessionItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string; block: string; item: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const { subject: subjectKey, block: blockStr, item: itemStr } = await params;
  const sp = await searchParams;
  const subject = getSessionSubject(subjectKey);
  if (!subject) notFound();
  const blockIdx = Number(blockStr);
  const itemIdx = Number(itemStr);
  if (!Number.isInteger(blockIdx) || !Number.isInteger(itemIdx)) notFound();

  const item = getItemCards(subject, blockIdx, itemIdx);
  if (!item) notFound();

  const isCards =
    sp.cards === "1" || sp.cards === "true" || sp.cards === "shuffle";
  if (isCards) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={`/sessions/${subject.key}/${blockIdx}/${itemIdx}`}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← До білету
        </Link>
        <SessionFlashcards
          cards={item.cards.map((c) => ({
            question: c.question,
            answer: c.answer,
            images: c.images,
            parentLabel: item.parentLabel,
          }))}
          shuffle={sp.cards === "shuffle"}
          title={item.parentLabel}
        />
      </main>
    );
  }

  // Browse single ticket / preparation
  let prepImage: string | null = null;
  if (subject.kind === "histology") {
    const sec = subject.data.sections[blockIdx];
    if (sec && isPrepSection(sec)) {
      const p = sec.preparations[itemIdx];
      prepImage = p?.image ?? null;
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/sessions/${subject.key}/${blockIdx}`}
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Назад до розділу
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {item.parentLabel}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/sessions/${subject.key}/${blockIdx}/${itemIdx}?cards=1`}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Флешкартки
        </Link>
        <Link
          href={`/sessions/${subject.key}/${blockIdx}/${itemIdx}?cards=shuffle`}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Флешкартки (перемішати)
        </Link>
      </div>

      {prepImage && (
        <div className="relative mx-auto mt-6 aspect-[4/5] max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
          <Image
            src={prepImage}
            alt={item.parentLabel}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-contain"
          />
        </div>
      )}

      <ol className="mt-6 space-y-3">
        {item.cards.map((c, i) => (
          <li
            key={i}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="font-medium">{c.question}</div>
            {c.answer.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                {c.answer.map((a, ai) => (
                  <li key={ai}>{a}</li>
                ))}
              </ul>
            )}
            {c.images.length > 0 && !prepImage && (
              <div className="mt-2 flex flex-wrap gap-2">
                {c.images.map((src, ii) => (
                  <div
                    key={ii}
                    className="relative h-32 w-32 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
