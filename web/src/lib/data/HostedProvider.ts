"use client";

import type { DataProvider } from "./DataProvider";
import type {
  CourseSummary,
  CourseConfig,
  SectionData,
  FlashCardDeck,
  FlashCard,
  QuizConfig,
  StandaloneQuizQuestion,
  Progress,
  GamificationState,
  Annotation,
  XPLogEntry,
} from "@/lib/types";
import { defaultGamification } from "@/lib/gamification";

// All requests go through /api/backend/* which is a server-side proxy that injects
// the Auth.js session token as a Bearer header. This keeps JWT cookies invisible to
// client-side JS while still allowing authenticated requests to the backend.
const BACKEND = "/api/backend";

// ── Pure gamification math (mirrors gamification.ts but without localStorage) ──

const XP_PER_LEVEL = 500;
const LOG_MAX_DAYS = 90;

function gamToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function gamDiffDays(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

function gamPruneLog(log: XPLogEntry[]): XPLogEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOG_MAX_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return log.filter((e) => e.date >= cutoffStr);
}

function applyXP(
  state: GamificationState,
  amount: number,
  reason: string
): GamificationState {
  const t = gamToday();
  let newStreak = state.streak;
  let newLongest = state.longestStreak;
  let lastActive = state.lastActiveDate;

  if (lastActive !== t) {
    const diff = lastActive ? gamDiffDays(t, lastActive) : 999;
    newStreak = diff === 1 ? state.streak + 1 : 1;
    newLongest = Math.max(newStreak, state.longestStreak);
    lastActive = t;
  }

  const newXP = state.xp + amount;
  const entry: XPLogEntry = { date: t, amount, reason };
  return {
    streak: newStreak,
    longestStreak: newLongest,
    xp: newXP,
    level: Math.floor(newXP / XP_PER_LEVEL),
    lastActiveDate: lastActive,
    xpLog: gamPruneLog([...state.xpLog, entry]),
  };
}

type ModuleRow = {
  id: string;
  type: "course" | "flashcard_deck" | "quiz";
  title: string;
  subject: string;
  language: string;
  storageKey: string;
  visibility: string;
  createdAt: string;
  publishedAt: string | null;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND}/${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function apiMutate<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T | null> {
  return apiFetch<T>(path, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function fetchBlob(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND}/${path}`);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

// ── Module cache ─────────────────────────────────────────────────────────────
// Keyed by DB module id; fetched once per HostedProvider instance.

let _modulesCache: ModuleRow[] | null = null;

async function getModules(): Promise<ModuleRow[]> {
  if (_modulesCache) return _modulesCache;
  _modulesCache = (await apiFetch<ModuleRow[]>("modules")) ?? [];
  return _modulesCache;
}

function invalidateModuleCache() {
  _modulesCache = null;
}

/** Maps storageKey prefix like "courses/calc3/" → DB module id */
async function moduleIdForStorageKey(prefix: string): Promise<string | null> {
  const modules = await getModules();
  return modules.find((m) => m.storageKey === prefix)?.id ?? null;
}

// ── HostedProvider ────────────────────────────────────────────────────────────

export class HostedProvider implements DataProvider {
  // ── Content reads ──────────────────────────────────────────────────────────

  async getCourseSummaries(): Promise<CourseSummary[]> {
    const modules = await getModules();
    const courses = modules.filter((m) => m.type === "course");
    const summaries = await Promise.all(
      courses.map(async (m) => {
        const config = await apiFetch<CourseConfig>(
          `modules/${m.id}/blob/config.json`
        );
        if (!config) return null;
        const sectionCount = config.chapters.reduce(
          (n, ch) => n + ch.sections.length,
          0
        );
        return {
          id: config.id,
          title: config.title,
          description: config.description,
          subject: config.subject,
          icon: config.icon,
          language: config.language,
          chapterCount: config.chapters.length,
          sectionCount,
        } satisfies CourseSummary;
      })
    );
    return summaries.filter(Boolean) as CourseSummary[];
  }

  async getCourseConfig(id: string): Promise<CourseConfig | null> {
    const modId = await moduleIdForStorageKey(`courses/${id}/`);
    if (!modId) return null;
    return apiFetch<CourseConfig>(`modules/${modId}/blob/config.json`);
  }

  async getSectionData(
    courseId: string,
    sectionId: string
  ): Promise<SectionData | null> {
    const modId = await moduleIdForStorageKey(`courses/${courseId}/`);
    if (!modId) return null;

    const [mdText, problems, quiz] = await Promise.all([
      fetchBlob(`modules/${modId}/blob/sections/${sectionId}.md`),
      apiFetch<{ problems: SectionData["problems"] }>(
        `modules/${modId}/blob/sections/${sectionId}.problems.json`
      ),
      apiFetch<{ questions: SectionData["quiz"] }>(
        `modules/${modId}/blob/sections/${sectionId}.quiz.json`
      ),
    ]);

    if (!mdText) return null;
    return {
      lessonMarkdown: mdText,
      problems: problems?.problems ?? [],
      quiz: quiz?.questions ?? [],
    };
  }

  async hasRecap(courseId: string): Promise<boolean> {
    const ids = await this.getRecapSectionIds(courseId);
    return ids.length > 0;
  }

  async getRecapSectionIds(courseId: string): Promise<string[]> {
    const config = await this.getCourseConfig(courseId);
    if (!config) return [];
    const modId = await moduleIdForStorageKey(`courses/${courseId}/`);
    if (!modId) return [];
    // Check which sections have recap markdown blobs
    const checks = await Promise.all(
      config.chapters.flatMap((ch) =>
        ch.sections.map(async (s) => {
          const text = await fetchBlob(
            `modules/${modId}/blob/recap/${s.id}.md`
          );
          return text ? s.id : null;
        })
      )
    );
    return checks.filter(Boolean) as string[];
  }

  async getRecapData(
    courseId: string,
    sectionId: string
  ): Promise<SectionData | null> {
    const modId = await moduleIdForStorageKey(`courses/${courseId}/`);
    if (!modId) return null;

    const [mdText, quiz] = await Promise.all([
      fetchBlob(`modules/${modId}/blob/recap/${sectionId}.md`),
      apiFetch<{ questions: SectionData["quiz"] }>(
        `modules/${modId}/blob/recap/${sectionId}.quiz.json`
      ),
    ]);

    if (!mdText) return null;
    return {
      lessonMarkdown: mdText,
      problems: [],
      quiz: quiz?.questions ?? [],
    };
  }

  async getFlashCardDecks(): Promise<FlashCardDeck[]> {
    const modules = await getModules();
    const decks = modules.filter((m) => m.type === "flashcard_deck");
    const results = await Promise.all(
      decks.map(async (m) => {
        const config = await apiFetch<Omit<FlashCardDeck, "cardCount"> & { cards?: FlashCard[] }>(
          `modules/${m.id}/blob/config.json`
        );
        if (!config) return null;
        const cards = await apiFetch<FlashCard[]>(`modules/${m.id}/blob/cards.json`);
        return { ...config, cardCount: cards?.length ?? 0 } as FlashCardDeck;
      })
    );
    return results.filter(Boolean) as FlashCardDeck[];
  }

  async getFlashCardDeck(id: string): Promise<FlashCardDeck | null> {
    const modId = await moduleIdForStorageKey(`flashcards/${id}/`);
    if (!modId) return null;
    const config = await apiFetch<Omit<FlashCardDeck, "cardCount">>(
      `modules/${modId}/blob/config.json`
    );
    if (!config) return null;
    const cards = await apiFetch<FlashCard[]>(`modules/${modId}/blob/cards.json`);
    return { ...config, cardCount: cards?.length ?? 0 };
  }

  async getFlashCards(id: string): Promise<FlashCard[]> {
    const modId = await moduleIdForStorageKey(`flashcards/${id}/`);
    if (!modId) return [];
    return (await apiFetch<FlashCard[]>(`modules/${modId}/blob/cards.json`)) ?? [];
  }

  async getQuizSummaries(): Promise<QuizConfig[]> {
    const modules = await getModules();
    const quizzes = modules.filter((m) => m.type === "quiz");
    const results = await Promise.all(
      quizzes.map(async (m) => {
        const config = await apiFetch<Omit<QuizConfig, "questionCount">>(
          `modules/${m.id}/blob/config.json`
        );
        if (!config) return null;
        const questions = await apiFetch<StandaloneQuizQuestion[]>(
          `modules/${m.id}/blob/questions.json`
        );
        return { ...config, questionCount: questions?.length ?? 0 } as QuizConfig;
      })
    );
    return results.filter(Boolean) as QuizConfig[];
  }

  async getQuizConfig(id: string): Promise<QuizConfig | null> {
    const modId = await moduleIdForStorageKey(`quizzes/${id}/`);
    if (!modId) return null;
    const config = await apiFetch<Omit<QuizConfig, "questionCount">>(
      `modules/${modId}/blob/config.json`
    );
    if (!config) return null;
    const questions = await apiFetch<StandaloneQuizQuestion[]>(
      `modules/${modId}/blob/questions.json`
    );
    return { ...config, questionCount: questions?.length ?? 0 };
  }

  async getQuizQuestions(id: string): Promise<StandaloneQuizQuestion[]> {
    const modId = await moduleIdForStorageKey(`quizzes/${id}/`);
    if (!modId) return [];
    return (
      (await apiFetch<StandaloneQuizQuestion[]>(
        `modules/${modId}/blob/questions.json`
      )) ?? []
    );
  }

  // ── Progress ────────────────────────────────────────────────────────────────

  private async _getCourseModuleId(courseId: string): Promise<string | null> {
    return moduleIdForStorageKey(`courses/${courseId}/`);
  }

  async getProgress(): Promise<Progress> {
    // In hosted mode, progress is per-module; this returns a unified Progress object
    // with course progress keyed by courseId and flashcard progress nested under "flashcards".
    const modules = await getModules();
    const result: Progress = {};

    await Promise.all(
      modules.map(async (m) => {
        const raw = await apiFetch<{
          completedSections: string[];
          quizScores: Record<string, number>;
          currentPhase: Record<string, string>;
        }>(`modules/${m.id}/progress`);
        if (!raw) return;

        if (m.type === "course") {
          const contentId = m.storageKey.replace(/^courses\//, "").replace(/\/$/, "");
          result[contentId] = {
            completedSections: raw.completedSections,
            quizScores: raw.quizScores,
            currentPhase: raw.currentPhase as Record<
              string,
              "lesson" | "practice" | "quiz" | "complete"
            >,
          };
        } else if (m.type === "flashcard_deck") {
          const deckId = m.storageKey.replace(/^flashcards\//, "").replace(/\/$/, "");
          if (!result.flashcards) result.flashcards = {};
          // flashcard progress is stored as JSON in completedSections[0] for compatibility
          try {
            const fp = JSON.parse((raw.completedSections[0] as string) ?? "null");
            if (fp) result.flashcards[deckId] = fp;
          } catch {
            // no flashcard progress yet
          }
        }
      })
    );

    return result;
  }

  async setProgress(p: Progress): Promise<void> {
    // Sync all course progress entries
    const entries = Object.entries(p).filter(
      ([k]) => k !== "flashcards" && k !== "gamification"
    );
    await Promise.all(
      entries.map(async ([courseId, cp]) => {
        const modId = await this._getCourseModuleId(courseId);
        if (!modId || !cp) return;
        await apiMutate("PUT", `modules/${modId}/progress`, cp);
      })
    );
  }

  async markSectionComplete(
    courseId: string,
    sectionId: string,
    score: number
  ): Promise<void> {
    const modId = await this._getCourseModuleId(courseId);
    if (!modId) return;

    const current = await apiFetch<{
      completedSections: string[];
      quizScores: Record<string, number>;
      currentPhase: Record<string, string>;
    }>(`modules/${modId}/progress`);

    const completedSections = current?.completedSections ?? [];
    const isNew = !completedSections.includes(sectionId);
    if (isNew) completedSections.push(sectionId);

    const quizScores = { ...(current?.quizScores ?? {}), [sectionId]: score };
    const currentPhase = {
      ...(current?.currentPhase ?? {}),
      [sectionId]: "complete",
    };

    await apiMutate("PUT", `modules/${modId}/progress`, {
      completedSections,
      quizScores,
      currentPhase,
    });

    // Award XP via backend gamification
    if (isNew) await this.awardXP(50, "section-complete");
    if (score >= 70) await this.awardXP(30, "quiz-pass");
  }

  async setPhase(
    courseId: string,
    sectionId: string,
    phase: "lesson" | "practice" | "quiz" | "complete"
  ): Promise<void> {
    const modId = await this._getCourseModuleId(courseId);
    if (!modId) return;

    const current = await apiFetch<{
      currentPhase: Record<string, string>;
    }>(`modules/${modId}/progress`);
    const currentPhase = {
      ...(current?.currentPhase ?? {}),
      [sectionId]: phase,
    };
    await apiMutate("PUT", `modules/${modId}/progress`, { currentPhase });
  }

  async resetCourseProgress(courseId: string): Promise<void> {
    const modId = await this._getCourseModuleId(courseId);
    if (!modId) return;
    await apiMutate("PUT", `modules/${modId}/progress`, {
      completedSections: [],
      quizScores: {},
      currentPhase: {},
    });
  }

  async isSectionComplete(courseId: string, sectionId: string): Promise<boolean> {
    const modId = await this._getCourseModuleId(courseId);
    if (!modId) return false;
    const progress = await apiFetch<{ completedSections: string[] }>(
      `modules/${modId}/progress`
    );
    return progress?.completedSections.includes(sectionId) ?? false;
  }

  async getFlashCardProgress(
    deckId: string
  ): Promise<{ easy: string[]; hard: string[]; unknown: string[] }> {
    const modId = await moduleIdForStorageKey(`flashcards/${deckId}/`);
    if (!modId) return { easy: [], hard: [], unknown: [] };
    const progress = await apiFetch<{ completedSections: string[] }>(
      `modules/${modId}/progress`
    );
    try {
      const fp = JSON.parse((progress?.completedSections[0] as string) ?? "null");
      if (fp) return fp;
    } catch {
      // no progress yet
    }
    return { easy: [], hard: [], unknown: [] };
  }

  async saveFlashCardProgress(
    deckId: string,
    easy: string[],
    hard: string[],
    unknown: string[]
  ): Promise<void> {
    const modId = await moduleIdForStorageKey(`flashcards/${deckId}/`);
    if (!modId) return;
    const fp = JSON.stringify({ easy, hard, unknown });
    await apiMutate("PUT", `modules/${modId}/progress`, {
      completedSections: [fp],
    });
  }

  // ── Gamification ───────────────────────────────────────────────────────────

  async getGamification(): Promise<GamificationState> {
    const gam = await apiFetch<{
      streak: number;
      longestStreak: number;
      xp: number;
      level: number;
      lastActiveDate: string | null;
      xpLog: XPLogEntry[];
    }>("users/me/gamification");

    if (!gam) return defaultGamification();
    return {
      streak: gam.streak,
      longestStreak: gam.longestStreak,
      xp: gam.xp,
      level: gam.level,
      lastActiveDate: gam.lastActiveDate ?? "",
      xpLog: gam.xpLog ?? [],
    };
  }

  async awardXP(amount: number, reason: string): Promise<GamificationState> {
    const current = await this.getGamification();
    const updated = applyXP(current, amount, reason);
    await apiMutate("PUT", "users/me/gamification", {
      streak: updated.streak,
      longestStreak: updated.longestStreak,
      xp: updated.xp,
      level: updated.level,
      lastActiveDate: updated.lastActiveDate || null,
      xpLog: updated.xpLog,
    });
    return updated;
  }

  // ── Annotations ────────────────────────────────────────────────────────────

  async getAnnotations(): Promise<Annotation[]> {
    const modules = await getModules();
    const allAnnotations = await Promise.all(
      modules.map(async (m) => {
        const rows = await apiFetch<BackendAnnotation[]>(
          `modules/${m.id}/annotations`
        );
        return (rows ?? []).map((r) => toAnnotation(r, m.storageKey));
      })
    );
    return allAnnotations.flat();
  }

  async getAnnotationsForSurface(
    courseId: string,
    sectionId: string,
    surface: Annotation["surface"]
  ): Promise<Annotation[]> {
    const modId = await moduleIdForStorageKey(`courses/${courseId}/`);
    if (!modId) return [];
    const rows = await apiFetch<BackendAnnotation[]>(
      `modules/${modId}/annotations`
    );
    return (rows ?? [])
      .filter((r) => r.sectionId === sectionId && r.surface === surface)
      .map((r) => toAnnotation(r, `courses/${courseId}/`));
  }

  async saveAnnotation(annotation: Annotation): Promise<void> {
    const modId = await moduleIdForStorageKey(`courses/${annotation.courseId}/`);
    if (!modId) return;
    await apiMutate("POST", `modules/${modId}/annotations`, {
      sectionId: annotation.sectionId,
      surface: annotation.surface,
      selectedText: annotation.selectedText,
      note: annotation.note,
      color: annotation.color,
      startOffset: annotation.startOffset,
      endOffset: annotation.endOffset,
      prefix: annotation.prefix,
      suffix: annotation.suffix,
    });
  }

  async updateAnnotation(
    id: string,
    changes: Partial<Pick<Annotation, "note" | "color">>
  ): Promise<void> {
    // We need the moduleId for the annotation; find it from the annotations cache
    const all = await this.getAnnotations();
    const annotation = all.find((a) => a.id === id);
    if (!annotation) return;
    const modId = await moduleIdForStorageKey(`courses/${annotation.courseId}/`);
    if (!modId) return;
    await apiMutate("PATCH", `modules/${modId}/annotations/${id}`, changes);
  }

  async deleteAnnotation(id: string): Promise<void> {
    const all = await this.getAnnotations();
    const annotation = all.find((a) => a.id === id);
    if (!annotation) return;
    const modId = await moduleIdForStorageKey(`courses/${annotation.courseId}/`);
    if (!modId) return;
    await apiMutate("DELETE", `modules/${modId}/annotations/${id}`);
  }
}

// ── Backend annotation → Annotation type conversion ──────────────────────────

type BackendAnnotation = {
  id: string;
  sectionId: string;
  surface: string;
  selectedText: string;
  note: string;
  color: string;
  startOffset: number | null;
  endOffset: number | null;
  prefix: string | null;
  suffix: string | null;
  createdAt: string;
};

function toAnnotation(r: BackendAnnotation, storageKey: string): Annotation {
  const courseId = storageKey.replace(/^courses\//, "").replace(/\/$/, "");
  return {
    id: r.id,
    courseId,
    sectionId: r.sectionId,
    surface: r.surface as Annotation["surface"],
    selectedText: r.selectedText,
    note: r.note || undefined,
    color: r.color as Annotation["color"],
    createdAt: new Date(r.createdAt).getTime(),
    startOffset: r.startOffset ?? 0,
    endOffset: r.endOffset ?? 0,
    prefix: r.prefix ?? "",
    suffix: r.suffix ?? "",
  };
}
