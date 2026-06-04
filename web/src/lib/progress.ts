"use client";

import type { CourseProgress, Progress } from "./types";

const KEY = "teacher-progress";
const LEGACY_COURSE_KEY = "moduleProgress";
const COURSE_KEY = "courseProgress";

export function getProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    // Migrate legacy per-key storage if needed
    const legacy = localStorage.getItem(LEGACY_COURSE_KEY);
    const current = localStorage.getItem(COURSE_KEY);
    if (legacy && !current) {
      localStorage.setItem(COURSE_KEY, legacy);
      localStorage.removeItem(LEGACY_COURSE_KEY);
    }
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function setProgress(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

function courseProgress(p: Progress, courseId: string): CourseProgress {
  return p[courseId] as CourseProgress;
}

export function markSectionComplete(courseId: string, sectionId: string, score: number) {
  const p = getProgress();
  if (!p[courseId]) p[courseId] = { completedSections: [], quizScores: {}, currentPhase: {} };
  const m = courseProgress(p, courseId);
  if (!m.completedSections.includes(sectionId)) {
    m.completedSections.push(sectionId);
  }
  m.quizScores[sectionId] = score;
  m.currentPhase[sectionId] = "complete";
  setProgress(p);
}

export function setPhase(
  courseId: string,
  sectionId: string,
  phase: "lesson" | "practice" | "quiz" | "complete"
) {
  const p = getProgress();
  if (!p[courseId]) p[courseId] = { completedSections: [], quizScores: {}, currentPhase: {} };
  courseProgress(p, courseId).currentPhase[sectionId] = phase;
  setProgress(p);
}

export function resetCourseProgress(courseId: string) {
  const p = getProgress();
  delete p[courseId];
  setProgress(p);
}

export function isSectionComplete(courseId: string, sectionId: string): boolean {
  const p = getProgress();
  return courseProgress(p, courseId)?.completedSections?.includes(sectionId) ?? false;
}

export function getFlashCardProgress(
  deckId: string
): { easy: string[]; hard: string[]; unknown: string[] } {
  const p = getProgress();
  return p.flashcards?.[deckId] ?? { easy: [], hard: [], unknown: [] };
}

export function saveFlashCardProgress(
  deckId: string,
  easy: string[],
  hard: string[],
  unknown: string[]
) {
  const p = getProgress();
  if (!p.flashcards) p.flashcards = {};
  p.flashcards[deckId] = { easy, hard, unknown };
  setProgress(p);
}
