import { redirect } from "next/navigation";
import Link from "next/link";
import { readSession } from "@/lib/session";
import { getSessionEpoch } from "@/lib/db";
import { listCodes } from "@/lib/device-codes";
import CodesPanel from "./CodesPanel";

export default async function AdminCodesPage() {
  const s = await readSession();
  const epoch = await getSessionEpoch();
  if (!s || s.epoch < epoch) redirect("/admin/login");
  if (s.role !== "admin") redirect("/admin/login");

  const codes = await listCodes();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Адмінка
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Коди доступу (прив&apos;язка до пристрою)
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Кожен код можна використати безліч разів, але тільки на одному
        пристрої. Якщо законний власник коду змінив пристрій — натисни
        
        «Звільнити», щоб скинути прив&apos;язку.
      </p>

      <CodesPanel initialCodes={codes} />
    </main>
  );
}
