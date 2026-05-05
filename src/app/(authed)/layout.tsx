import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { getSessionEpoch } from "@/lib/db";
import LogoutButton from "./LogoutButton";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await readSession();
  if (!s || s.epoch < (await getSessionEpoch())) {
    redirect("/");
  }
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <Link
            href="/catalog"
            className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Підготовка до ректорського контролю
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/catalog"
              className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              Тести
            </Link>
            <Link
              href="/sessions"
              className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              Білети
            </Link>
            <Link
              href="/support"
              className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              Підтримати автора
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-zinc-200 bg-white py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
        <Link href="/support" className="hover:underline">
          Підтримати автора
        </Link>
      </footer>
    </div>
  );
}
