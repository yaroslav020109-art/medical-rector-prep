import AdminLoginForm from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold tracking-tight">
          Вхід для адміністратора
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Введіть службовий код.
        </p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
