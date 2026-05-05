import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionSubject, isPrepSection } from "@/lib/sessions";

export default async function SessionSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: subjectKey } = await params;
  const subject = getSessionSubject(subjectKey);
  if (!subject) notFound();

  let blocks: { title: string; tickets: number; topics: number; isPrep?: boolean }[];
  if (subject.kind === "anatomy") {
    blocks = subject.data.blocks.map((b) => ({
      title: b.title,
      tickets: b.tickets.length,
      topics: b.tickets.reduce((a, t) => a + t.topics.length, 0),
    }));
  } else {
    blocks = subject.data.sections.map((sec) =>
      isPrepSection(sec)
        ? {
            title: sec.title,
            tickets: sec.preparations.length,
            topics: sec.preparations.reduce((a, p) => a + p.items.length, 0),
            isPrep: true,
          }
        : { title: sec.title, tickets: 0, topics: sec.items.length },
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/sessions"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← До білетів
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {subject.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Виберіть модуль / розділ:
      </p>

      <div className="mt-6 grid gap-3">
        {blocks.map((b, i) => (
          <Link
            key={i}
            href={`/sessions/${subject.key}/${i}`}
            className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight">
                {b.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {b.tickets > 0 ? `${b.tickets} ${b.isPrep ? "препаратів" : "білетів"} · ` : ""}
                {b.topics} карток
              </p>
            </div>
            <span className="ml-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
              →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
