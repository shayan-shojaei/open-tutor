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

/** Any editable text/JSON artifact, addressed by kind + owning module. */
export type StudioDocRef =
  | { kind: "course-config"; courseId: string }
  | {
      kind: "lesson" | "section-quiz" | "problems" | "recap-lesson" | "recap-quiz";
      courseId: string;
      sectionId: string;
    }
  | { kind: "deck-config" | "cards"; deckId: string }
  | { kind: "quiz-config" | "quiz-questions"; quizId: string };

export type SaveResult =
  | { ok: true; mtime: number }
  | { ok: false; conflict: true; mtime: number };

export type ModuleType = "course" | "flashcards" | "quizzes";

export interface DataProvider {
  // ── Studio (authoring) ──
  /** False in builds that can't write (demo static export, read-only hosted). */
  readonly canEdit: boolean;
  loadStudioDoc(ref: StudioDocRef): Promise<{ data: unknown; mtime: number | null } | null>;
  /** expectedMtime null = create/overwrite unconditionally. */
  saveStudioDoc(ref: StudioDocRef, data: unknown, expectedMtime: number | null): Promise<SaveResult>;
  createModule(type: ModuleType, config: object): Promise<{ ok: boolean; error?: string }>;
  deleteModule(type: ModuleType, id: string): Promise<void>;
  deleteSection(courseId: string, sectionId: string): Promise<void>;
  deleteChapter(courseId: string, chapterId: string): Promise<void>;
  deleteRecap(courseId: string, sectionId: string): Promise<void>;
  uploadCourseImage(courseId: string, file: File): Promise<{ url: string }>;

  // ── Content reads ──
  getCourseSummaries(): Promise<CourseSummary[]>;
  getCourseConfig(id: string): Promise<CourseConfig | null>;
  getSectionData(courseId: string, sectionId: string): Promise<SectionData | null>;
  hasRecap(courseId: string): Promise<boolean>;
  getRecapSectionIds(courseId: string): Promise<string[]>;
  getRecapData(courseId: string, sectionId: string): Promise<SectionData | null>;
  getFlashCardDecks(): Promise<FlashCardDeck[]>;
  getFlashCardDeck(id: string): Promise<FlashCardDeck | null>;
  getFlashCards(id: string): Promise<FlashCard[]>;
  getQuizSummaries(): Promise<QuizConfig[]>;
  getQuizConfig(id: string): Promise<QuizConfig | null>;
  getQuizQuestions(id: string): Promise<StandaloneQuizQuestion[]>;

  // ── Progress ──
  getProgress(): Promise<Progress>;
  setProgress(p: Progress): Promise<void>;
  markSectionComplete(courseId: string, sectionId: string, score: number): Promise<void>;
  setPhase(
    courseId: string,
    sectionId: string,
    phase: "lesson" | "practice" | "quiz" | "complete"
  ): Promise<void>;
  resetCourseProgress(courseId: string): Promise<void>;
  isSectionComplete(courseId: string, sectionId: string): Promise<boolean>;
  getFlashCardProgress(
    deckId: string
  ): Promise<{ easy: string[]; hard: string[]; unknown: string[] }>;
  saveFlashCardProgress(
    deckId: string,
    easy: string[],
    hard: string[],
    unknown: string[]
  ): Promise<void>;

  // ── Gamification ──
  getGamification(): Promise<GamificationState>;
  awardXP(amount: number, reason: string): Promise<GamificationState>;

  // ── Annotations ──
  getAnnotations(): Promise<Annotation[]>;
  getAnnotationsForSurface(
    courseId: string,
    sectionId: string,
    surface: Annotation["surface"]
  ): Promise<Annotation[]>;
  saveAnnotation(annotation: Annotation): Promise<void>;
  updateAnnotation(
    id: string,
    changes: Partial<Pick<Annotation, "note" | "color">>
  ): Promise<void>;
  deleteAnnotation(id: string): Promise<void>;
}
