/**
 * Build-time script: reads demo-modules and writes static JSON files to
 * public/_data/ for the GitHub Pages demo. Also copies images to public/_demo-assets/.
 *
 * Run via: npm run build:demo (sets TUTOR_MODULES_DIR and NEXT_PUBLIC_BASE_PATH)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve paths relative to web/ directory
const __filename = fileURLToPath(import.meta.url);
const webDir = path.resolve(path.dirname(__filename), "..");
const outDataDir = path.join(webDir, "public", "_data");
const outAssetsDir = path.join(webDir, "public", "_demo-assets");
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Use the same lib functions as the app (TUTOR_MODULES_DIR is already set in env)
import {
  getCourseSummaries,
  getCourseConfig,
  getSectionData,
  getRecapData,
  hasRecap,
  getRecapSectionIds,
} from "../src/lib/courses";
import { getFlashCardDecks, getFlashCardDeck, getFlashCards } from "../src/lib/flashcards";
import { getQuizSummaries, getQuizConfig, getQuizQuestions } from "../src/lib/quizzes";
import { getModulesDir } from "../src/lib/modulesDir";

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function rewriteAssetPaths(markdown: string): string {
  return markdown.replace(/\/api\/asset\//g, `${BASE_PATH}/_demo-assets/`);
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("Generating demo data from:", getModulesDir());

// Clean output directories
fs.rmSync(outDataDir, { recursive: true, force: true });
fs.rmSync(outAssetsDir, { recursive: true, force: true });

// --- Courses ---
const courses = getCourseSummaries();
writeJson(path.join(outDataDir, "courses.json"), courses);

for (const course of courses) {
  const config = getCourseConfig(course.id);
  if (!config) continue;

  writeJson(path.join(outDataDir, "course", `${course.id}.json`), config);

  // Section content
  for (const chapter of config.chapters) {
    for (const section of chapter.sections) {
      const data = getSectionData(course.id, section.id);
      if (!data) continue;
      const rewritten = { ...data, lessonMarkdown: rewriteAssetPaths(data.lessonMarkdown) };
      writeJson(path.join(outDataDir, "content", course.id, `${section.id}.json`), rewritten);
    }
  }

  // Recap
  const recapExists = hasRecap(course.id);
  const recapSectionIds = recapExists ? getRecapSectionIds(course.id) : [];
  writeJson(path.join(outDataDir, "recap", `${course.id}.json`), {
    hasRecap: recapExists,
    sectionIds: recapSectionIds,
  });

  for (const sectionId of recapSectionIds) {
    const data = getRecapData(course.id, sectionId);
    if (!data) continue;
    const rewritten = { ...data, lessonMarkdown: rewriteAssetPaths(data.lessonMarkdown) };
    writeJson(path.join(outDataDir, "recap", course.id, `${sectionId}.json`), rewritten);
  }

  // Copy images
  const imagesDir = path.join(getModulesDir(), "courses", course.id, "images");
  copyDir(imagesDir, path.join(outAssetsDir, "courses", course.id, "images"));
}

// --- Flashcards ---
const decks = getFlashCardDecks();
writeJson(path.join(outDataDir, "flashcards.json"), decks);

for (const deckMeta of decks) {
  const deck = getFlashCardDeck(deckMeta.id);
  const cards = getFlashCards(deckMeta.id);
  writeJson(path.join(outDataDir, "flashcard", `${deckMeta.id}.json`), { deck, cards });
}

// --- Quizzes ---
const quizzes = getQuizSummaries();
writeJson(path.join(outDataDir, "quizzes.json"), quizzes);

for (const quizMeta of quizzes) {
  const quiz = getQuizConfig(quizMeta.id);
  const questions = getQuizQuestions(quizMeta.id);
  writeJson(path.join(outDataDir, "quiz", `${quizMeta.id}.json`), { quiz, questions });
}

console.log(
  `Done. Wrote ${courses.length} courses, ${decks.length} decks, ${quizzes.length} quizzes.`
);
