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
} from "@/lib/types";
import {
  getProgress,
  setProgress,
  markSectionComplete,
  setPhase,
  resetCourseProgress,
  isSectionComplete,
  getFlashCardProgress,
  saveFlashCardProgress,
} from "@/lib/progress";
import { getGamification, awardXP } from "@/lib/gamification";
import {
  getAnnotations,
  getAnnotationsForSurface,
  saveAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from "@/lib/annotations";
import { apiUrl } from "@/lib/api-url";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export class LocalProvider implements DataProvider {
  // ── Content (delegates to local Next.js API routes) ──

  async getCourseSummaries(): Promise<CourseSummary[]> {
    return (await fetchJson<CourseSummary[]>(apiUrl("courses"))) ?? [];
  }

  async getCourseConfig(id: string): Promise<CourseConfig | null> {
    return fetchJson<CourseConfig>(apiUrl(`course/${id}`));
  }

  async getSectionData(courseId: string, sectionId: string): Promise<SectionData | null> {
    return fetchJson<SectionData>(apiUrl(`content/${courseId}/${sectionId}`));
  }

  async hasRecap(courseId: string): Promise<boolean> {
    const data = await fetchJson<{ hasRecap: boolean }>(apiUrl(`recap/${courseId}`));
    return data?.hasRecap ?? false;
  }

  async getRecapSectionIds(courseId: string): Promise<string[]> {
    const data = await fetchJson<{ sectionIds: string[] }>(apiUrl(`recap/${courseId}`));
    return data?.sectionIds ?? [];
  }

  async getRecapData(courseId: string, sectionId: string): Promise<SectionData | null> {
    return fetchJson<SectionData>(apiUrl(`recap/${courseId}/${sectionId}`));
  }

  async getFlashCardDecks(): Promise<FlashCardDeck[]> {
    return (await fetchJson<FlashCardDeck[]>(apiUrl("flashcards"))) ?? [];
  }

  async getFlashCardDeck(id: string): Promise<FlashCardDeck | null> {
    const data = await fetchJson<{ deck: FlashCardDeck }>(apiUrl(`flashcard/${id}`));
    return data?.deck ?? null;
  }

  async getFlashCards(id: string): Promise<FlashCard[]> {
    const data = await fetchJson<{ cards: FlashCard[] }>(apiUrl(`flashcard/${id}`));
    return data?.cards ?? [];
  }

  async getQuizSummaries(): Promise<QuizConfig[]> {
    return (await fetchJson<QuizConfig[]>(apiUrl("quizzes"))) ?? [];
  }

  async getQuizConfig(id: string): Promise<QuizConfig | null> {
    const data = await fetchJson<{ quiz: QuizConfig }>(apiUrl(`quiz/${id}`));
    return data?.quiz ?? null;
  }

  async getQuizQuestions(id: string): Promise<StandaloneQuizQuestion[]> {
    const data = await fetchJson<{ questions: StandaloneQuizQuestion[] }>(apiUrl(`quiz/${id}`));
    return data?.questions ?? [];
  }

  // ── Progress (delegates to localStorage utils) ──

  async getProgress(): Promise<Progress> {
    return getProgress();
  }

  async setProgress(p: Progress): Promise<void> {
    setProgress(p);
  }

  async markSectionComplete(courseId: string, sectionId: string, score: number): Promise<void> {
    markSectionComplete(courseId, sectionId, score);
  }

  async setPhase(
    courseId: string,
    sectionId: string,
    phase: "lesson" | "practice" | "quiz" | "complete"
  ): Promise<void> {
    setPhase(courseId, sectionId, phase);
  }

  async resetCourseProgress(courseId: string): Promise<void> {
    resetCourseProgress(courseId);
  }

  async isSectionComplete(courseId: string, sectionId: string): Promise<boolean> {
    return isSectionComplete(courseId, sectionId);
  }

  async getFlashCardProgress(
    deckId: string
  ): Promise<{ easy: string[]; hard: string[]; unknown: string[] }> {
    return getFlashCardProgress(deckId);
  }

  async saveFlashCardProgress(
    deckId: string,
    easy: string[],
    hard: string[],
    unknown: string[]
  ): Promise<void> {
    saveFlashCardProgress(deckId, easy, hard, unknown);
  }

  // ── Gamification (delegates to localStorage utils) ──

  async getGamification(): Promise<GamificationState> {
    return getGamification();
  }

  async awardXP(amount: number, reason: string): Promise<GamificationState> {
    return awardXP(amount, reason);
  }

  // ── Annotations (delegates to localStorage utils) ──

  async getAnnotations(): Promise<Annotation[]> {
    return getAnnotations();
  }

  async getAnnotationsForSurface(
    courseId: string,
    sectionId: string,
    surface: Annotation["surface"]
  ): Promise<Annotation[]> {
    return getAnnotationsForSurface(courseId, sectionId, surface);
  }

  async saveAnnotation(annotation: Annotation): Promise<void> {
    saveAnnotation(annotation);
  }

  async updateAnnotation(
    id: string,
    changes: Partial<Pick<Annotation, "note" | "color">>
  ): Promise<void> {
    updateAnnotation(id, changes);
  }

  async deleteAnnotation(id: string): Promise<void> {
    deleteAnnotation(id);
  }
}
