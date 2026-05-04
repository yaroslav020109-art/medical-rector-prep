"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        if (res.status === 401) setErr("Невірний код адміністратора.");
        else setErr("Помилка входу.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setErr("Не вдалося підключитися до сервера.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <input
        type="password"
        autoFocus
        autoComplete="off"
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Код адміністратора"
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
      />
      {err && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {err}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !code}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Перевіряю…" : "Увійти"}
      </button>
    </form>
  );
}
