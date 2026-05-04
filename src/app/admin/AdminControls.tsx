"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  initialLocked: boolean;
}

export default function AdminControls({ initialLocked }: Props) {
  const router = useRouter();
  const [locked, setLocked] = useState(initialLocked);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function setLockState(next: boolean) {
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/lockdown", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locked: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { locked: boolean };
      setLocked(data.locked);
      setConfirm(false);
      setMsg(
        data.locked
          ? "Сайт заблоковано. Жоден користувач не зможе увійти, доки не натиснеш «Розблокувати»."
          : "Сайт розблоковано. Користувачі знову можуть входити за загальним кодом.",
      );
      router.refresh();
    } catch {
      setMsg("Не вдалося змінити стан сайту. Спробуй ще раз.");
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const cardClass = locked
    ? "mt-6 rounded-2xl border border-red-300 bg-red-50 p-6 shadow-sm dark:border-red-900/60 dark:bg-red-950/30"
    : "mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30";

  const titleClass = locked
    ? "text-base font-semibold text-red-900 dark:text-red-100"
    : "text-base font-semibold text-amber-900 dark:text-amber-100";

  const bodyClass = locked
    ? "mt-1 text-sm text-red-800 dark:text-red-200"
    : "mt-1 text-sm text-amber-800 dark:text-amber-200";

  return (
    <section className={cardClass}>
      <h2 className={titleClass}>
        {locked ? "Сайт зараз ЗАБЛОКОВАНО" : "Заблокувати сайт"}
      </h2>
      <p className={bodyClass}>
        {locked
          ? "Усі активні сесії вибиті, а вхід за загальним кодом повертає 403. Ти зможеш увійти лише в адмінку, поки не розблокуєш сайт."
          : "Закриває сайт повністю: вибиває всі активні сесії і блокує будь-які майбутні логіни за загальним кодом. Ти зможеш заходити в адмінку, але не у тренування/іспит. Розблокувати можна цією ж кнопкою."}
      </p>

      {msg && (
        <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {msg}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {locked ? (
          <button
            type="button"
            onClick={() => setLockState(false)}
            disabled={pending}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
          >
            {pending ? "Розблоковую…" : "Розблокувати сайт"}
          </button>
        ) : !confirm ? (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500"
          >
            Заблокувати сайт
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setLockState(true)}
              disabled={pending}
              className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
            >
              {pending ? "Блокую…" : "Так, заблокувати сайт"}
            </button>
            <button
              type="button"
              onClick={() => setConfirm(false)}
              disabled={pending}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Скасувати
            </button>
          </>
        )}
        <button
          type="button"
          onClick={logout}
          className="ml-auto rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Вийти з адмінки
        </button>
      </div>
    </section>
  );
}
