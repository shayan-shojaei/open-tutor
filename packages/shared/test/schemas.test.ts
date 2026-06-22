import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import {
  CourseConfigSchema,
  ProblemSchema,
  QuizQuestionSchema,
  FlashCardDeckFileSchema,
  QuizConfigFileSchema,
} from "../src/schemas";

const demoDir = resolve(__dirname, "../../../demo-modules/courses/calc3");

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(demoDir, path), "utf-8"));
}

describe("CourseConfigSchema", () => {
  it("parses calc3 config.json", () => {
    const config = readJson("config.json");
    expect(() => CourseConfigSchema.parse(config)).not.toThrow();
  });

  it("rejects an uppercase ID", () => {
    const bad = { id: "Calc3", title: "X", description: "", subject: "math", icon: "∫", language: "en", chapters: [] };
    expect(() => CourseConfigSchema.parse(bad)).toThrow();
  });

  it("rejects an unknown subject", () => {
    const bad = { id: "calc3", title: "X", description: "", subject: "history", icon: "∫", language: "en", chapters: [] };
    expect(() => CourseConfigSchema.parse(bad)).toThrow();
  });

  it("rejects an unknown language", () => {
    const bad = { id: "calc3", title: "X", description: "", subject: "math", icon: "∫", language: "de", chapters: [] };
    expect(() => CourseConfigSchema.parse(bad)).toThrow();
  });
});

describe("ProblemSchema", () => {
  it("parses vectors-intro.problems.json", () => {
    const problems = readJson("sections/vectors-intro.problems.json");
    expect(() => z.array(ProblemSchema).parse(problems)).not.toThrow();
  });
});

describe("QuizQuestionSchema", () => {
  it("parses vectors-intro.quiz.json", () => {
    const quiz = readJson("sections/vectors-intro.quiz.json");
    expect(() => z.array(QuizQuestionSchema).parse(quiz)).not.toThrow();
  });

  it("parses dot-product.quiz.json", () => {
    const quiz = readJson("sections/dot-product.quiz.json");
    expect(() => z.array(QuizQuestionSchema).parse(quiz)).not.toThrow();
  });
});

describe("FlashCardDeckFileSchema", () => {
  it("rejects cardCount in stored config", () => {
    const bad = {
      id: "my-deck",
      title: "My Deck",
      description: "desc",
      subject: "math",
      language: "en",
      cardCount: 10,
    };
    expect(() => FlashCardDeckFileSchema.parse(bad)).toThrow();
  });

  it("accepts a valid deck config without cardCount", () => {
    const valid = {
      id: "my-deck",
      title: "My Deck",
      description: "desc",
      subject: "math",
      language: "en",
    };
    expect(() => FlashCardDeckFileSchema.parse(valid)).not.toThrow();
  });
});

describe("QuizConfigFileSchema", () => {
  it("rejects questionCount in stored config", () => {
    const bad = {
      id: "my-quiz",
      title: "My Quiz",
      description: "desc",
      subject: "math",
      language: "en",
      questionType: "multiple-choice",
      questionCount: 5,
    };
    expect(() => QuizConfigFileSchema.parse(bad)).toThrow();
  });

  it("accepts a valid quiz config without questionCount", () => {
    const valid = {
      id: "my-quiz",
      title: "My Quiz",
      description: "desc",
      subject: "math",
      language: "en",
      questionType: "multiple-choice",
    };
    expect(() => QuizConfigFileSchema.parse(valid)).not.toThrow();
  });
});
