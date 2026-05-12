"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        if (res.status === 403) {
          let kind: string | undefined;
          try {
            kind = ((await res.json()) as { error?: string })?.error;
          } catch {
            // ignore
          }
          if (kind === "site_locked") {
            setErr("Сайт тимчасово закрито автором.");
          } else if (kind === "device_mismatch") {
            setErr(
              "Цей код уже використано на іншому пристрої. Зверніться до автора, щоб звільнити прив'язку.",
            );
          } else {
            setErr("Помилка входу. Спробуйте ще раз.");
          }
        } else if (res.status === 401) {
          setErr("Невірний код доступу.");
        } else {
          setErr("Помилка входу. Спробуйте ще раз.");
        }
        return;
      }
      router.push("/catalog");
      router.refresh();
    } catch {
      setErr("Не вдалося підключитися до сервера.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Код доступу
        </label>
        <input
          id="code"
          name="code"
          type="password"
          inputMode="text"
          autoComplete="off"
          autoFocus
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          placeholder="••••••••"
        />
      </div>
      {err && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {err}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || code.length === 0}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Перевіряю…" : "Увійти"}
      </button>
    </form>
  );
}
