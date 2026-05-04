import Link from "next/link";

const MONOBANK_JAR =
  process.env.MONOBANK_JAR_URL ?? "https://send.monobank.ua/jar/5EMm6vHGxk";

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/catalog"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← До каталогу
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Підтримати автора
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Якщо цей сайт допоміг тобі підготуватись — можеш закинути будь-яку суму
        у банку. Дякую!
      </p>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Monobank банка</p>
        <p className="mt-1 break-all font-mono text-sm">{MONOBANK_JAR}</p>
        <a
          href={MONOBANK_JAR}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Відкрити банку →
        </a>
      </div>
    </main>
  );
}
