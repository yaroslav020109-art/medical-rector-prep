import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubject } from "@/lib/data";
import QuestionListClient from "./QuestionListClient";

export default async function SubjectQuestionsPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const subject = getSubject(key);
  if (!subject) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/subject/${subject.key}`}
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← {subject.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Перелік питань · {subject.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Усі запитання дисципліни з правильними відповідями. Це довідник, не
        тест — режими «Тренування» та «Іспит» залишаються на сторінці дисципліни.
      </p>

      <QuestionListClient
        subjectKey={subject.key}
        subjectName={subject.name}
        sections={subject.sections}
      />
    </main>
  );
}
