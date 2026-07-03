import { z } from "zod";

const kebabId = z.string().regex(/^[a-z][a-z0-9-]*$/, "ID must be kebab-case");

const subject = z.enum(["math", "programming", "general"]);
const language = z.enum(["en", "fa"]);

export const SectionMetaSchema = z
  .object({
    id: kebabId,
    title: z.string().min(1),
    chapterId: kebabId,
  })
  .strict();

export const ChapterSchema = z
  .object({
    id: kebabId,
    title: z.string().min(1),
    sections: z.array(SectionMetaSchema),
  })
  .strict();

export const CourseConfigSchema = z
  .object({
    id: kebabId,
    title: z.string().min(1),
    description: z.string(),
    subject,
    icon: z.string().min(1),
    language,
    chapters: z.array(ChapterSchema),
  })
  .strict();

export const ProblemSchema = z
  .object({
    id: kebabId,
    statement: z.string().min(1),
    hint: z.string().optional(),
    solution: z.string().min(1),
    answer: z.string().min(1),
  })
  .strict();

export const QuizQuestionSchema = z
  .object({
    id: kebabId,
    type: z.literal("multiple-choice"),
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
    correctIndex: z.number().int().min(0),
    explanation: z.string(),
  })
  .strict();

export const SectionDataSchema = z.object({
  lessonMarkdown: z.string(),
  problems: z.array(ProblemSchema),
  quiz: z.array(QuizQuestionSchema),
});

export const FlashCardSchema = z
  .object({
    id: kebabId,
    front: z.string().min(1),
    back: z.string().min(1),
  })
  .strict();

// File-stored shape: no cardCount (computed at load time)
export const FlashCardDeckFileSchema = z
  .object({
    id: kebabId,
    title: z.string().min(1),
    description: z.string(),
    subject,
    language,
    sourceCourse: z.string().optional(),
  })
  .strict();

export const StandaloneQuizQuestionSchema = z
  .object({
    id: kebabId,
    type: z.enum(["multiple-choice", "written"]),
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    correctIndex: z.number().int().min(0).optional(),
    answer: z.string().optional(),
    explanation: z.string().optional(),
  })
  .strict();

// File-stored shape: no questionCount (computed at load time)
export const QuizConfigFileSchema = z
  .object({
    id: kebabId,
    title: z.string().min(1),
    description: z.string(),
    subject,
    language,
    sourceCourse: z.string().optional(),
    sourceDeck: z.string().optional(),
    questionType: z.enum(["multiple-choice", "written", "mixed"]),
  })
  .strict();
