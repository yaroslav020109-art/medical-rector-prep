"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StoredDeviceCode {
  code: string;
  label: string;
  createdAt: number;
  boundAt: number | null;
  deviceId: string | null;
  lastUsedAt: number | null;
  uses: number;
}

interface Props {
  initialCodes: StoredDeviceCode[];
}

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function shortDevice(id: string | null): string {
  if (!id) return "—";
  return id.length > 14 ? id.slice(0, 6) + "…" + id.slice(-4) : id;
}

export default function CodesPanel({ initialCodes }: Props) {
  const router = useRouter();
  const [codes, setCodes] = useState(initialCodes);
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [justCreated, setJustCreated] = useState<StoredDeviceCode[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/codes");
    if (res.ok) {
      const data = (await res.json()) as { codes: StoredDeviceCode[] };
      setCodes(data.codes);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count, label }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { created: StoredDeviceCode[] };
      setJustCreated(data.created);
      setLabel("");
      await refresh();
    } catch {
      setMsg("Не вдалося згенерувати коди.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRelease(code: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/codes/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "release" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      await refresh();
      setMsg(`Прив'язку коду ${code} скинуто. Код знову вільний для першого входу.`);
    } catch {
      setMsg("Не вдалося звільнити код.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(code: string) {
    if (!confirm(`Видалити код ${code} назавжди?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/codes/${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(String(res.status));
      await refresh();
      setMsg(`Код ${code} видалено.`);
    } catch {
      setMsg("Не вдалося видалити код.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(`Скопійовано в буфер: ${text}`);
    } catch {
      setMsg("Не вдалось скопіювати — у браузера заборона.");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold">Згенерувати нові коди</h2>
        <form onSubmit={handleGenerate} className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto] sm:items-end">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Кількість
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Підпис (необов&apos;язково — для тебе)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={80}
              placeholder="напр. Андрій"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {busy ? "…" : "Згенерувати"}
          </button>
        </form>

        {justCreated && justCreated.length > 0 && (
          <div className="mt-4 rounded-md bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
            <p className="font-medium text-emerald-900 dark:text-emerald-100">
              Створено {justCreated.length} код{justCreated.length === 1 ? "" : justCreated.length < 5 ? "и" : "ів"}:
            </p>
            <ul className="mt-2 space-y-1 font-mono text-sm text-emerald-950 dark:text-emerald-50">
              {justCreated.map((c) => (
                <li key={c.code} className="flex items-center justify-between gap-2">
                  <span>{c.code}</span>
                  <button
                    type="button"
                    onClick={() => copy(c.code)}
                    className="rounded border border-emerald-700/30 bg-white px-2 py-0.5 text-xs font-normal text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-50"
                  >
                    Копіювати
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => copy(justCreated.map((c) => c.code).join("\n"))}
              className="mt-3 text-xs font-medium text-emerald-900 underline dark:text-emerald-100"
            >
              Скопіювати всі одним блоком
            </button>
          </div>
        )}
      </section>

      {msg && (
        <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {msg}
        </p>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Усі коди ({codes.length})</h2>
          <button
            type="button"
            onClick={() => {
              void refresh();
              router.refresh();
            }}
            className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
          >
            Оновити
          </button>
        </div>

        {codes.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Ще немає жодного коду. Згенеруй перший вище.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <th className="px-2 py-2 font-medium">Код</th>
                  <th className="px-2 py-2 font-medium">Підпис</th>
                  <th className="px-2 py-2 font-medium">Прив&apos;язано до</th>
                  <th className="px-2 py-2 font-medium">Створено</th>
                  <th className="px-2 py-2 font-medium">Остання дія</th>
                  <th className="px-2 py-2 font-medium">Уходи</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr
                    key={c.code}
                    className="border-t border-zinc-200 align-top dark:border-zinc-800"
                  >
                    <td className="px-2 py-2 font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span>{c.code}</span>
                        <button
                          type="button"
                          onClick={() => copy(c.code)}
                          className="rounded border border-zinc-300 px-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          title="Копіювати"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2">{c.label || "—"}</td>
                    <td className="px-2 py-2">
                      {c.deviceId ? (
                        <span
                          title={c.deviceId}
                          className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100"
                        >
                          {shortDevice(c.deviceId)}
                        </span>
                      ) : (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          вільний
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-zinc-500 dark:text-zinc-400">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-2 py-2 text-zinc-500 dark:text-zinc-400">
                      {formatDate(c.lastUsedAt)}
                    </td>
                    <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">
                      {c.uses}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {c.deviceId && (
                          <button
                            type="button"
                            onClick={() => handleRelease(c.code)}
                            disabled={busy}
                            className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
                          >
                            Звільнити
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(c.code)}
                          disabled={busy}
                          className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-900 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100"
                        >
                          Видалити
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
