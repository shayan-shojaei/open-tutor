import fs from "fs";
import path from "path";
import { QuizConfig, StandaloneQuizQuestion } from "./types";
import { quizzesDir } from "./modulesDir";

export function getQuizSummaries(): QuizConfig[] {
  const dir = quizzesDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const configPath = path.join(dir, d.name, "config.json");
      if (!fs.existsSync(configPath)) return null;
      const config: Omit<QuizConfig, "questionCount"> = JSON.parse(
        fs.readFileSync(configPath, "utf-8")
      );
      const questionsPath = path.join(dir, d.name, "questions.json");
      const questionCount = fs.existsSync(questionsPath)
        ? (JSON.parse(fs.readFileSync(questionsPath, "utf-8")) as StandaloneQuizQuestion[]).length
        : 0;
      return { ...config, questionCount } satisfies QuizConfig;
    })
    .filter(Boolean) as QuizConfig[];
}

export function getQuizConfig(id: string): QuizConfig | null {
  const dir = quizzesDir();
  const configPath = path.join(dir, id, "config.json");
  if (!fs.existsSync(configPath)) return null;
  const config: Omit<QuizConfig, "questionCount"> = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  );
  const questionsPath = path.join(dir, id, "questions.json");
  const questionCount = fs.existsSync(questionsPath)
    ? (JSON.parse(fs.readFileSync(questionsPath, "utf-8")) as StandaloneQuizQuestion[]).length
    : 0;
  return { ...config, questionCount };
}

export function getQuizQuestions(id: string): StandaloneQuizQuestion[] {
  const questionsPath = path.join(quizzesDir(), id, "questions.json");
  if (!fs.existsSync(questionsPath)) return [];
  return JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
}
