import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Підготовка до ректорського контролю",
  description:
    "Тести з біології, гістології та анатомії для підготовки до ректорського контролю.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" className="h-full antialiased">
      <body className="min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
