import fs from "fs";
import path from "path";
import type { CourseConfig } from "./types";
import { getModulesDir, coursesDir, flashcardsDir, quizzesDir } from "./modulesDir";

// ids and filenames: no leading dot, no "/", no ".."
const SLUG = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

export class StudioError extends Error {
  constructor(public status: number, message: string, public payload?: object) {
    super(message);
  }
}

export function assertSlug(seg: string): string {
  if (!SLUG.test(seg) || seg === "." || seg === "..") {
    throw new StudioError(400, `Invalid id: ${JSON.stringify(seg)}`);
  }
  return seg;
}

/** Belt-and-braces after path.join: stay inside the modules dir. */
function assertInsideModules(p: string): string {
  const resolved = path.resolve(p);
  if (!resolved.startsWith(path.resolve(getModulesDir()) + path.sep)) {
    throw new StudioError(403, "Forbidden path");
  }
  return resolved;
}

function writeFileAtomic(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = p + ".tmp";
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, p);
}

function serializeJson(data: unknown): string {
  return JSON.stringify(data, null, 2) + "\n";
}

// ── Doc addressing ────────────────────────────────────────────────────────
// A "doc" is any editable text/JSON artifact, addressed by URL segments.

interface DocFile {
  file: string;
  kind: "md" | "json";
  /** "course-config" | "deck-config" | "quiz-config" for the PUT special cases */
  config?: "course" | "flashcards" | "quizzes";
}

export function resolveDoc(segments: string[]): DocFile | null {
  const [root, id, ...rest] = segments;
  if (!id) return null;
  assertSlug(id);

  if (root === "course") {
    const dir = path.join(coursesDir(), id);
    if (rest.length === 1 && rest[0] === "config") {
      return { file: path.join(dir, "config.json"), kind: "json", config: "course" };
    }
    if (rest.length === 3) {
      const [where, sid, doc] = rest;
      assertSlug(sid);
      if (where === "section") {
        if (doc === "lesson") return { file: path.join(dir, "sections", `${sid}.md`), kind: "md" };
        if (doc === "quiz") return { file: path.join(dir, "sections", `${sid}.quiz.json`), kind: "json" };
        if (doc === "problems") return { file: path.join(dir, "sections", `${sid}.problems.json`), kind: "json" };
      }
      if (where === "recap") {
        if (doc === "lesson") return { file: path.join(dir, "recap", `${sid}.md`), kind: "md" };
        if (doc === "quiz") return { file: path.join(dir, "recap", `${sid}.quiz.json`), kind: "json" };
      }
    }
    return null;
  }
  if (root === "flashcards" && rest.length === 1) {
    const dir = path.join(flashcardsDir(), id);
    if (rest[0] === "config") return { file: path.join(dir, "config.json"), kind: "json", config: "flashcards" };
    if (rest[0] === "cards") return { file: path.join(dir, "cards.json"), kind: "json" };
    return null;
  }
  if (root === "quizzes" && rest.length === 1) {
    const dir = path.join(quizzesDir(), id);
    if (rest[0] === "config") return { file: path.join(dir, "config.json"), kind: "json", config: "quizzes" };
    if (rest[0] === "questions") return { file: path.join(dir, "questions.json"), kind: "json" };
    return null;
  }
  return null;
}

export function readDoc(segments: string[]): { data: unknown; mtime: number | null } {
  const doc = resolveDoc(segments);
  if (!doc) throw new StudioError(404, "Unknown doc");
  const file = assertInsideModules(doc.file);
  if (!fs.existsSync(file)) {
    // configs must exist; content files (quiz/problems/recap/lesson) may not yet
    if (doc.config) throw new StudioError(404, "Not found");
    return { data: null, mtime: null };
  }
  const raw = fs.readFileSync(file, "utf-8");
  return {
    data: doc.kind === "md" ? raw : JSON.parse(raw),
    mtime: fs.statSync(file).mtimeMs,
  };
}

export function writeDoc(
  segments: string[],
  data: unknown,
  expectedMtime: number | null
): { mtime: number } {
  const doc = resolveDoc(segments);
  if (!doc) throw new StudioError(404, "Unknown doc");
  const file = assertInsideModules(doc.file);

  if (expectedMtime !== null && fs.existsSync(file)) {
    const current = fs.statSync(file).mtimeMs;
    if (current !== expectedMtime) {
      throw new StudioError(409, "conflict", { error: "conflict", mtime: current });
    }
  }

  let content: string;
  if (doc.kind === "md") {
    if (typeof data !== "string") throw new StudioError(400, "Markdown doc requires a string");
    content = data;
  } else {
    if (data === null || typeof data !== "object") throw new StudioError(400, "JSON doc requires an object");
    if (doc.config) data = cleanConfig(doc.config, segments[1], data as Record<string, unknown>);
    content = serializeJson(data);
  }
  writeFileAtomic(file, content);

  // Adding a section = saving the course config; stub the .md so the learner UI never 404s.
  if (doc.config === "course") stubMissingSections(segments[1], data as unknown as CourseConfig);

  return { mtime: fs.statSync(file).mtimeMs };
}

/** Force id to match the URL, validate fs-relevant ids, strip computed fields. */
function cleanConfig(
  type: "course" | "flashcards" | "quizzes",
  id: string,
  config: Record<string, unknown>
): Record<string, unknown> {
  const { questionCount, cardCount, ...clean } = config; // computed at read time, never stored
  clean.id = id;
  if (type === "course") {
    const chapters = clean.chapters;
    if (!Array.isArray(chapters)) throw new StudioError(400, "Course config requires chapters[]");
    for (const ch of chapters as { id: string; sections?: { id: string }[] }[]) {
      assertSlug(ch.id);
      // /learn/{courseId}/recap is the recap route, so a chapter can't claim that URL
      if (ch.id === "recap") throw new StudioError(400, 'Chapter id "recap" is reserved');
      for (const s of ch.sections ?? []) assertSlug(s.id);
    }
  }
  return clean;
}

function stubMissingSections(courseId: string, config: CourseConfig) {
  for (const ch of config.chapters ?? []) {
    for (const s of ch.sections ?? []) {
      const md = path.join(coursesDir(), courseId, "sections", `${s.id}.md`);
      if (!fs.existsSync(md)) writeFileAtomic(md, `# ${s.title}\n`);
    }
  }
}

// ── Module lifecycle ──────────────────────────────────────────────────────

export type ModuleType = "course" | "flashcards" | "quizzes";

function moduleDir(type: ModuleType, id: string): string {
  const base = { course: coursesDir(), flashcards: flashcardsDir(), quizzes: quizzesDir() }[type];
  return assertInsideModules(path.join(base, assertSlug(id)));
}

export function createModule(type: ModuleType, config: Record<string, unknown>) {
  const id = typeof config.id === "string" ? config.id : "";
  const dir = moduleDir(type, id);
  if (fs.existsSync(dir)) throw new StudioError(409, `"${id}" already exists`);

  if (type === "course" && !Array.isArray(config.chapters)) {
    config.chapters = [
      {
        id: "chapter-1",
        title: "Chapter 1",
        sections: [{ id: "getting-started", title: "Getting Started", chapterId: "chapter-1" }],
      },
    ];
  }
  const clean = cleanConfig(type, id, config);
  writeFileAtomic(path.join(dir, "config.json"), serializeJson(clean));

  if (type === "course") stubMissingSections(id, clean as unknown as CourseConfig);
  if (type === "flashcards") writeFileAtomic(path.join(dir, "cards.json"), serializeJson([]));
  if (type === "quizzes") writeFileAtomic(path.join(dir, "questions.json"), serializeJson([]));
}

export function deleteModule(type: ModuleType, id: string) {
  const dir = moduleDir(type, id);
  if (!fs.existsSync(dir)) throw new StudioError(404, "Not found");
  fs.rmSync(dir, { recursive: true });
}

// ── Course structure deletes ──────────────────────────────────────────────

function readCourseConfig(courseId: string): { file: string; config: CourseConfig } {
  const file = assertInsideModules(path.join(coursesDir(), assertSlug(courseId), "config.json"));
  if (!fs.existsSync(file)) throw new StudioError(404, "Course not found");
  return { file, config: JSON.parse(fs.readFileSync(file, "utf-8")) };
}

function unlinkSectionFiles(courseId: string, sectionId: string) {
  const dir = path.join(coursesDir(), courseId);
  for (const f of [
    path.join(dir, "sections", `${sectionId}.md`),
    path.join(dir, "sections", `${sectionId}.quiz.json`),
    path.join(dir, "sections", `${sectionId}.problems.json`),
    path.join(dir, "recap", `${sectionId}.md`),
    path.join(dir, "recap", `${sectionId}.quiz.json`),
  ]) {
    fs.rmSync(f, { force: true });
  }
  removeRecapDirIfEmpty(courseId);
}

function removeRecapDirIfEmpty(courseId: string) {
  const recapDir = path.join(coursesDir(), courseId, "recap");
  if (fs.existsSync(recapDir) && fs.readdirSync(recapDir).length === 0) fs.rmdirSync(recapDir);
}

export function deleteSection(courseId: string, sectionId: string) {
  assertSlug(sectionId);
  const { file, config } = readCourseConfig(courseId);
  for (const ch of config.chapters) {
    ch.sections = ch.sections.filter((s) => s.id !== sectionId);
  }
  writeFileAtomic(file, serializeJson(config));
  unlinkSectionFiles(courseId, sectionId);
}

export function deleteChapter(courseId: string, chapterId: string) {
  assertSlug(chapterId);
  const { file, config } = readCourseConfig(courseId);
  const chapter = config.chapters.find((c) => c.id === chapterId);
  if (!chapter) throw new StudioError(404, "Chapter not found");
  config.chapters = config.chapters.filter((c) => c.id !== chapterId);
  writeFileAtomic(file, serializeJson(config));
  for (const s of chapter.sections) unlinkSectionFiles(courseId, s.id);
}

export function deleteRecap(courseId: string, sectionId: string) {
  assertSlug(courseId);
  assertSlug(sectionId);
  const dir = assertInsideModules(path.join(coursesDir(), courseId, "recap"));
  fs.rmSync(path.join(dir, `${sectionId}.md`), { force: true });
  fs.rmSync(path.join(dir, `${sectionId}.quiz.json`), { force: true });
  removeRecapDirIfEmpty(courseId);
}

// ── Image upload ──────────────────────────────────────────────────────────

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function saveCourseImage(
  courseId: string,
  file: File
): Promise<{ url: string }> {
  assertSlug(courseId);
  if (!fs.existsSync(path.join(coursesDir(), courseId))) throw new StudioError(404, "Course not found");
  if (file.size > MAX_IMAGE_BYTES) throw new StudioError(413, "Image exceeds 5 MB");

  const ext = path.extname(file.name).slice(1).toLowerCase();
  // ponytail: SVG can carry scripts; acceptable for a local single-user app
  if (!IMAGE_EXT.has(ext)) throw new StudioError(400, `Unsupported image type ".${ext}"`);

  const base =
    path
      .basename(file.name, path.extname(file.name))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image";
  const imagesDir = assertInsideModules(path.join(coursesDir(), courseId, "images"));
  fs.mkdirSync(imagesDir, { recursive: true });

  let name = `${base}.${ext}`;
  if (fs.existsSync(path.join(imagesDir, name))) name = `${Date.now()}-${name}`;
  fs.writeFileSync(path.join(imagesDir, name), Buffer.from(await file.arrayBuffer()));

  return { url: `/api/asset/courses/${courseId}/images/${name}` };
}
