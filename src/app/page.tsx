import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { getSessionEpoch } from "@/lib/db";
import LoginForm from "./LoginForm";

export default async function Home() {
  const s = await readSession();
  if (s && s.epoch >= (await getSessionEpoch()) && s.role === "user") {
    redirect("/catalog");
  }
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Підготовка до ректорського контролю
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Доступ за персональним кодом.
        </p>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Немає коду? Запитайте у автора.
        </p>
      </div>
    </main>
  );
}
