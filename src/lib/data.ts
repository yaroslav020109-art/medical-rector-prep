// Import the question bank statically so Next.js bundles it with the server
// build. This works in every runtime (node, edge, serverless) and avoids
// fs.readFileSync, which is unreliable on Vercel because `process.cwd()` in a
// serverless function does not point at the repo root.
import questionsJson from "../../data/questions.json";

export interface QuestionOption {
  letter: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correctLetter: string;
  meta?: Record<string, string>;
}

export interface SubjectSection {
  name: string;
  questions: Question[];
}

export interface Subject {
  key: string;
  name: string;
  sections: SubjectSection[];
}

export interface CourseData {
  course: { key: string; name: string };
  subjects: Subject[];
}

export function getCourseData(): CourseData {
  return questionsJson as CourseData;
}

export function getSubject(key: string): Subject | null {
  const data = getCourseData();
  return data.subjects.find((s) => s.key === key) ?? null;
}

export function getAllQuestions(subjectKey: string): Question[] {
  const subject = getSubject(subjectKey);
  if (!subject) return [];
  return subject.sections.flatMap((s) => s.questions);
}

export function getSubjectSummary() {
  const data = getCourseData();
  return {
    course: data.course,
    subjects: data.subjects.map((s) => ({
      key: s.key,
      name: s.name,
      questionCount: s.sections.reduce((acc, sec) => acc + sec.questions.length, 0),
      sections: s.sections.map((sec) => ({
        name: sec.name,
        questionCount: sec.questions.length,
      })),
    })),
  };
}

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
