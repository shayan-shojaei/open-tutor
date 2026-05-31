import path from "path";
import os from "os";

export function getModulesDir(): string {
  return (
    process.env.TUTOR_MODULES_DIR ??
    path.join(os.homedir(), ".tutor", "modules")
  );
}

export function coursesDir(): string {
  return path.join(getModulesDir(), "courses");
}

export function flashcardsDir(): string {
  return path.join(getModulesDir(), "flashcards");
}

export function quizzesDir(): string {
  return path.join(getModulesDir(), "quizzes");
}
