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

export interface Course {
  key: string;
  name: string;
}

export interface Subject {
  key: string;
  name: string;
  courseKey: string;
  sections: SubjectSection[];
}

export interface CourseData {
  /** Ordered list of courses present in the data. */
  courses: Course[];
  /** Back-compat: legacy single-course field. Equal to `courses[0]`. */
  course: Course;
  subjects: Subject[];
}

interface RawCourseData {
  courses?: Course[];
  course?: Course;
  subjects: Array<Omit<Subject, "courseKey"> & { courseKey?: string }>;
}

function normalize(raw: RawCourseData): CourseData {
  const courses: Course[] =
    raw.courses ??
    (raw.course
      ? [raw.course]
      : [{ key: "course-1", name: "Ректорський контроль" }]);
  const defaultCourseKey = courses[0]?.key ?? "course-1";
  const subjects: Subject[] = raw.subjects.map((s) => ({
    key: s.key,
    name: s.name,
    courseKey: s.courseKey ?? defaultCourseKey,
    sections: s.sections,
  }));
  return {
    courses,
    course: raw.course ?? courses[0],
    subjects,
  };
}

const courseData: CourseData = normalize(questionsJson as RawCourseData);

export function getCourseData(): CourseData {
  return courseData;
}

export function getSubject(key: string): Subject | null {
  return courseData.subjects.find((s) => s.key === key) ?? null;
}

export function getAllQuestions(subjectKey: string): Question[] {
  const subject = getSubject(subjectKey);
  if (!subject) return [];
  return subject.sections.flatMap((s) => s.questions);
}

export interface SubjectSummaryItem {
  key: string;
  name: string;
  courseKey: string;
  questionCount: number;
  sections: { name: string; questionCount: number }[];
}

export interface CourseSummary {
  courses: Course[];
  /** Back-compat alias for the first course. */
  course: Course;
  subjects: SubjectSummaryItem[];
}

export function getSubjectSummary(): CourseSummary {
  return {
    courses: courseData.courses,
    course: courseData.course,
    subjects: courseData.subjects.map((s) => ({
      key: s.key,
      name: s.name,
      courseKey: s.courseKey,
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
