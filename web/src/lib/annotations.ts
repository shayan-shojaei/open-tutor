"use client";

import type { Annotation } from "./types";

const KEY = "tutor-annotations";

export function getAnnotations(): Annotation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setAnnotations(annotations: Annotation[]) {
  localStorage.setItem(KEY, JSON.stringify(annotations));
}

export function getAnnotationsForSurface(
  courseId: string,
  sectionId: string,
  surface: Annotation["surface"]
): Annotation[] {
  return getAnnotations().filter(
    (a) => a.courseId === courseId && a.sectionId === sectionId && a.surface === surface
  );
}

export function saveAnnotation(annotation: Annotation) {
  const all = getAnnotations();
  setAnnotations([...all, annotation]);
}

export function updateAnnotation(
  id: string,
  changes: Partial<Pick<Annotation, "note" | "color">>
) {
  const all = getAnnotations().map((a) => (a.id === id ? { ...a, ...changes } : a));
  setAnnotations(all);
}

export function deleteAnnotation(id: string) {
  setAnnotations(getAnnotations().filter((a) => a.id !== id));
}
