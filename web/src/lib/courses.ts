import fs from "fs";
import path from "path";
import type { CourseConfig, CourseSummary, SectionData } from "./types";
import { coursesDir } from "./modulesDir";

export function getCourseSummaries(): CourseSummary[] {
  const dir = coursesDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const configPath = path.join(dir, d.name, "config.json");
      if (!fs.existsSync(configPath)) return null;
      const config: CourseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const sectionCount = config.chapters.reduce((n, ch) => n + ch.sections.length, 0);
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
    .filter(Boolean) as CourseSummary[];
}

export function getCourseConfig(courseId: string): CourseConfig | null {
  const configPath = path.join(coursesDir(), courseId, "config.json");
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

export function hasRecap(courseId: string): boolean {
  return fs.existsSync(path.join(coursesDir(), courseId, "recap"));
}

export function getRecapSectionIds(courseId: string): string[] {
  const config = getCourseConfig(courseId);
  if (!config) return [];
  const recapDir = path.join(coursesDir(), courseId, "recap");
  if (!fs.existsSync(recapDir)) return [];
  const files = new Set(
    fs
      .readdirSync(recapDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
  );
  return config.chapters
    .flatMap((c) => c.sections)
    .map((s) => s.id)
    .filter((id) => files.has(id));
}

export function getRecapData(courseId: string, sectionId: string): SectionData | null {
  const base = path.join(coursesDir(), courseId, "recap");
  const mdPath = path.join(base, `${sectionId}.md`);
  const quizPath = path.join(base, `${sectionId}.quiz.json`);
  if (!fs.existsSync(mdPath)) return null;
  return {
    lessonMarkdown: fs.readFileSync(mdPath, "utf-8"),
    problems: [],
    quiz: fs.existsSync(quizPath) ? JSON.parse(fs.readFileSync(quizPath, "utf-8")) : [],
  };
}

export function getSectionData(courseId: string, sectionId: string): SectionData | null {
  const base = path.join(coursesDir(), courseId, "sections");
  const lessonPath = path.join(base, `${sectionId}.md`);
  const problemsPath = path.join(base, `${sectionId}.problems.json`);
  const quizPath = path.join(base, `${sectionId}.quiz.json`);

  if (!fs.existsSync(lessonPath)) return null;

  return {
    lessonMarkdown: fs.readFileSync(lessonPath, "utf-8"),
    problems: fs.existsSync(problemsPath)
      ? JSON.parse(fs.readFileSync(problemsPath, "utf-8"))
      : [],
    quiz: fs.existsSync(quizPath) ? JSON.parse(fs.readFileSync(quizPath, "utf-8")) : [],
  };
}
