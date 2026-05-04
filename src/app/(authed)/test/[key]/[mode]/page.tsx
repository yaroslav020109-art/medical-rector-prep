import { notFound } from "next/navigation";
import { getSubject } from "@/lib/data";
import TestRunner from "./TestRunner";

const MODES = new Set(["training", "exam"]);

export default async function TestPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string; mode: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const { key, mode } = await params;
  if (!MODES.has(mode)) notFound();
  const subject = getSubject(key);
  if (!subject) notFound();
  const sp = await searchParams;
  const limitRaw = Array.isArray(sp.limit) ? sp.limit[0] : sp.limit;
  const limit = limitRaw ? Number(limitRaw) : undefined;

  return (
    <TestRunner
      subjectKey={subject.key}
      subjectName={subject.name}
      mode={mode as "training" | "exam"}
      limit={Number.isFinite(limit) ? limit : undefined}
    />
  );
}
