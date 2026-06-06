export interface CourseConfig {
  id: string;
  title: string;
  description: string;
  subject: "math" | "programming" | "general";
  icon: string;
  language: "en" | "fa";
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  sections: SectionMeta[];
}

export interface SectionMeta {
  id: string;
  title: string;
  chapterId: string;
}

export interface Problem {
  id: string;
  statement: string;
  hint?: string;
  solution: string;
  answer: string;
}

export interface QuizQuestion {
  id: string;
  type: "multiple-choice";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SectionData {
  lessonMarkdown: string;
  problems: Problem[];
  quiz: QuizQuestion[];
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  subject: string;
  icon: string;
  language: "en" | "fa";
  chapterCount: number;
  sectionCount: number;
}

export interface CourseProgress {
  completedSections: string[];
  quizScores: Record<string, number>;
  currentPhase: Record<string, "lesson" | "practice" | "quiz" | "complete">;
}

export interface FlashCardProgressMap {
  [deckId: string]: { easy: string[]; hard: string[]; unknown: string[] };
}

export interface XPLogEntry {
  date: string;   // "YYYY-MM-DD"
  amount: number;
  reason: string;
}

export interface GamificationState {
  streak: number;
  longestStreak: number;
  xp: number;
  level: number;
  lastActiveDate: string; // "YYYY-MM-DD"
  xpLog: XPLogEntry[];
}

export interface Progress {
  flashcards?: FlashCardProgressMap;
  gamification?: GamificationState;
  [courseId: string]: CourseProgress | FlashCardProgressMap | GamificationState | undefined;
}

export interface FlashCardDeck {
  id: string;
  title: string;
  description: string;
  subject: "math" | "programming" | "general";
  language: "en" | "fa";
  sourceCourse?: string;
  cardCount: number;
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
}

export interface QuizConfig {
  id: string;
  title: string;
  description: string;
  subject: "math" | "programming" | "general";
  language: "en" | "fa";
  sourceCourse?: string;
  sourceDeck?: string;
  questionType: "multiple-choice" | "written" | "mixed";
  questionCount: number; // calculated at load time, not stored in file
}

export interface Annotation {
  id: string;
  courseId: string;
  sectionId: string;
  surface: "lesson" | `problem-${string}`;
  selectedText: string;
  note?: string;
  color: "yellow" | "green" | "blue";
  createdAt: number;
  startOffset: number;
  endOffset: number;
  prefix: string;
  suffix: string;
}

export interface StandaloneQuizQuestion {
  id: string;
  type: "multiple-choice" | "written";
  question: string;
  // multiple-choice
  options?: string[];
  correctIndex?: number;
  // written
  answer?: string;
  // shared
  explanation?: string;
}
