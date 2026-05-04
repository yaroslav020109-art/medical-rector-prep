import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { countDevices, getSessionEpoch, getSiteLocked } from "@/lib/db";
import AdminControls from "./AdminControls";

export default async function AdminPage() {
  const s = await readSession();
  const epoch = await getSessionEpoch();
  if (!s || s.epoch < epoch) redirect("/admin/login");
  if (s.role !== "admin") redirect("/admin/login");

  const total = await countDevices();
  const locked = await getSiteLocked();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Адміністрування</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Загальна статистика та керування доступом.
      </p>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Унікальних пристроїв, що увійшли за загальним кодом:
        </p>
        <p className="mt-2 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {total}
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          (один пристрій рахується один раз; визначається за відбитком user-agent
          / IP)
        </p>
      </section>

      <AdminControls initialLocked={locked} />
    </main>
  );
}
