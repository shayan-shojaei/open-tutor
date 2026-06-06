export const dynamic = process.env.NEXT_PUBLIC_DEMO === "true" ? "auto" : "force-dynamic";

import { getCourseSummaries, getCourseConfig } from "@/lib/courses";
import { getFlashCardDecks } from "@/lib/flashcards";
import type { CourseConfig } from "@/lib/types";
import StatsClient from "./StatsClient";

export default async function StatsPage() {
  const summaries = getCourseSummaries();
  const courses: CourseConfig[] = summaries.map((s) => {
    try { return getCourseConfig(s.id); } catch { return null; }
  }).filter(Boolean) as CourseConfig[];
  const decks = getFlashCardDecks();
  return <StatsClient courses={courses} decks={decks} />;
}
