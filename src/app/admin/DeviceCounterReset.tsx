"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeviceCounterReset({ initialTotal }: { initialTotal: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function doReset() {
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/devices/reset", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      setMsg("Лічильник пристроїв обнулено.");
      setConfirming(false);
      router.refresh();
    } catch {
      setMsg("Не вдалося обнулити лічильник. Спробуй ще раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      {msg && (
        <p className="mb-3 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {msg}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={initialTotal === 0}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Обнулити лічильник
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={doReset}
              disabled={pending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
            >
              {pending ? "Обнуляю…" : "Так, обнулити"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Скасувати
            </button>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Активні сесії залишаться, але кожен повторний логін за загальним
              кодом знову порахується як новий пристрій.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
