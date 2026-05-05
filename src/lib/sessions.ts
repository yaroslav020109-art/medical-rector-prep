// Session-exam tickets ("Білети до сесії") — anatomy and histology.
// The JSON file is bundled statically so it works on serverless runtimes.
import sessionsJson from "../../data/session-tickets.json";

export interface SessionItem {
  question: string;
  answer: string[];
  images: string[];
}

export interface AnatomyTopic {
  question: string;
  answer: string[];
  images: string[];
}

export interface AnatomyTicket {
  number: number;
  title: string;
  topics: AnatomyTopic[];
}

export interface AnatomyBlock {
  title: string;
  tickets: AnatomyTicket[];
}

export interface AnatomyData {
  header: string;
  blocks: AnatomyBlock[];
}

export interface HistologyPreparation {
  number: number;
  name: string;
  image: string | null;
  items: SessionItem[];
}

export interface HistologyTheorySection {
  title: string;
  items: SessionItem[];
}

export interface HistologyPrepSection {
  title: string;
  preparations: HistologyPreparation[];
}

export type HistologySection = HistologyTheorySection | HistologyPrepSection;

export interface HistologyData {
  header: string;
  sections: HistologySection[];
}

export type SessionSubject =
  | {
      key: "anatomy-session";
      name: string;
      kind: "anatomy";
      data: AnatomyData;
    }
  | {
      key: "histology-session";
      name: string;
      kind: "histology";
      data: HistologyData;
    };

export interface SessionsRoot {
  subjects: SessionSubject[];
}

export function isPrepSection(
  section: HistologySection,
): section is HistologyPrepSection {
  return "preparations" in section;
}

export function getSessions(): SessionsRoot {
  return sessionsJson as SessionsRoot;
}

export function getSessionSubject(key: string): SessionSubject | null {
  const root = getSessions();
  return root.subjects.find((s) => s.key === key) ?? null;
}

/** Block index → block (anatomy) or section (histology). Returns null if out of range. */
export function getBlock(
  subject: SessionSubject,
  blockIdx: number,
): { title: string; kind: "anatomy" | "histology-theory" | "histology-preparations" } | null {
  if (subject.kind === "anatomy") {
    const b = subject.data.blocks[blockIdx];
    if (!b) return null;
    return { title: b.title, kind: "anatomy" };
  }
  const s = subject.data.sections[blockIdx];
  if (!s) return null;
  return {
    title: s.title,
    kind: isPrepSection(s) ? "histology-preparations" : "histology-theory",
  };
}

/** Get a flat array of "cards" (question + answer + images) for a block. */
export function getBlockCards(
  subject: SessionSubject,
  blockIdx: number,
): {
  question: string;
  answer: string[];
  images: string[];
  parentLabel: string;
}[] {
  if (subject.kind === "anatomy") {
    const b = subject.data.blocks[blockIdx];
    if (!b) return [];
    return b.tickets.flatMap((t) =>
      t.topics.map((tp) => ({
        question: tp.question,
        answer: tp.answer,
        images: tp.images,
        parentLabel: `Білет ${t.number}: ${t.title}`,
      })),
    );
  }
  const s = subject.data.sections[blockIdx];
  if (!s) return [];
  if (isPrepSection(s)) {
    return s.preparations.flatMap((p) =>
      p.items.map((it) => ({
        question: it.question,
        answer: it.answer,
        images: p.image ? [p.image] : it.images,
        parentLabel: `Препарат №${p.number}: ${p.name}`,
      })),
    );
  }
  return s.items.map((it) => ({
    question: it.question,
    answer: it.answer,
    images: it.images,
    parentLabel: s.title,
  }));
}

/** Build cards for a single ticket/preparation. */
export function getItemCards(
  subject: SessionSubject,
  blockIdx: number,
  itemIdx: number,
): {
  parentLabel: string;
  cards: { question: string; answer: string[]; images: string[] }[];
} | null {
  if (subject.kind === "anatomy") {
    const b = subject.data.blocks[blockIdx];
    if (!b) return null;
    const t = b.tickets[itemIdx];
    if (!t) return null;
    return {
      parentLabel: `Білет ${t.number}: ${t.title}`,
      cards: t.topics.map((tp) => ({
        question: tp.question,
        answer: tp.answer,
        images: tp.images,
      })),
    };
  }
  const s = subject.data.sections[blockIdx];
  if (!s) return null;
  if (isPrepSection(s)) {
    const p = s.preparations[itemIdx];
    if (!p) return null;
    return {
      parentLabel: `Препарат №${p.number}: ${p.name}`,
      cards: p.items.map((it) => ({
        question: it.question,
        answer: it.answer,
        images: p.image ? [p.image] : it.images,
      })),
    };
  }
  // theory section: itemIdx not really meaningful (single flat list); treat as page-of-N? skip
  return null;
}

export function sessionSummary() {
  return getSessions().subjects.map((s) => {
    if (s.kind === "anatomy") {
      const blocks = s.data.blocks.map((b) => ({
        title: b.title,
        tickets: b.tickets.length,
        topics: b.tickets.reduce((a, t) => a + t.topics.length, 0),
      }));
      return {
        key: s.key,
        name: s.name,
        kind: s.kind,
        blocks,
        totalTopics: blocks.reduce((a, b) => a + b.topics, 0),
      };
    }
    const blocks = s.data.sections.map((sec) =>
      isPrepSection(sec)
        ? {
            title: sec.title,
            tickets: sec.preparations.length,
            topics: sec.preparations.reduce((a, p) => a + p.items.length, 0),
          }
        : { title: sec.title, tickets: 1, topics: sec.items.length },
    );
    return {
      key: s.key,
      name: s.name,
      kind: s.kind,
      blocks,
      totalTopics: blocks.reduce((a, b) => a + b.topics, 0),
    };
  });
}
