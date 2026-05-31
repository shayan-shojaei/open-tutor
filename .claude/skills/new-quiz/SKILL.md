---
name: new-quiz
description: >
  Interactively creates a standalone quiz for the Teacher app at
  ~/.tutor/modules. Interviews the user to determine source material,
  question type (multiple-choice, written, or mixed), and format preferences,
  then writes config.json and questions.json to the quizzes/ directory.
  Works for any subject in English or Persian.
---

# Quiz Creator

## Purpose

Creates a standalone quiz for the Teacher app at `~/.tutor/modules`.
You will interview the user, generate all questions, and write them to disk so
the quiz immediately appears at http://localhost:3000/quizzes.

---

## Step 1 — Interview

Ask these questions **one at a time**, waiting for each answer before proceeding:

1. **Source**: "Where should the quiz content come from?
   - A course (I'll base questions on an existing course's content)
   - A flashcard deck (I'll turn flashcards into quiz questions)
   - Custom material (paste notes, text, or describe a topic)"
2. **Subject/Topic**: "What subject or topic should this quiz cover?" (If they chose a course or deck, confirm which one: `ls ~/.tutor/modules/courses/` or `ls ~/.tutor/modules/flashcards/`)
3. **Language**: "Should the quiz be in English or Persian (Farsi)? (en/fa)"
4. **Question type**: "What kind of questions do you want?
   - Multiple-choice (pick 1 of 2–4 options)
   - Written (type a free-text answer, then self-assess)
   - Mixed (both types)"
5. **Options count** (only if multiple-choice or mixed): "How many options per multiple-choice question? (2, 3, or 4)"
6. **Question count**: "How many questions? (5–30 recommended)"
7. **Difficulty**: "What difficulty level? (easy / medium / hard)"

---

## Step 2 — Show Sample Questions

Generate 3 sample questions matching the requested format and show them to the user. Ask: "Do these look right? Any adjustments to style, difficulty, or format before I generate the full quiz?"

Wait for approval or adjustments before proceeding.

---

## Step 3 — Generate All Questions

Generate all questions as a JSON array. Each question must follow this schema:

**Multiple-choice question:**
```json
{
  "id": "q1",
  "type": "multiple-choice",
  "question": "Question text (markdown + LaTeX supported)",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 2,
  "explanation": "Why this answer is correct"
}
```

**Written question:**
```json
{
  "id": "q2",
  "type": "written",
  "question": "Question text (markdown + LaTeX supported)",
  "answer": "The correct answer (shown after user submits)",
  "explanation": "Optional: additional context or worked solution"
}
```

**Content rules:**
- Questions must test understanding, not just recall of definitions
- Multiple-choice distractors must be plausible — avoid obviously wrong options
- **Shuffling rule**: distribute `correctIndex` across 0, 1, 2, 3 — don't always use the same index
- Written answers should be concise but complete (1–3 sentences or a formula)
- For math: use `$...$` inline and `$$...$$` for block equations
- For Persian: write prose in Farsi, keep math/code LTR, include English terms in parentheses on first use
- Match difficulty to the user's stated level

---

## Step 4 — Write Config

Write `config.json`:

```json
{
  "id": "quiz-id-in-kebab-case",
  "title": "Quiz Title",
  "description": "1–2 sentence description",
  "subject": "math | programming | general",
  "language": "en | fa",
  "sourceCourse": "optional-course-id",
  "sourceDeck": "optional-deck-id",
  "questionType": "multiple-choice | written | mixed"
}
```

- Set `sourceCourse` if the quiz was based on a course
- Set `sourceDeck` if based on a flashcard deck
- Omit both if based on custom material

**Subject rules:**
- `"math"` — calculus, algebra, statistics, physics, chemistry
- `"programming"` — any language or CS topic
- `"general"` — history, literature, languages, economics, etc.

---

## Step 5 — File Paths

All files go in `~/.tutor/modules/quizzes/{quizId}/`:

- `config.json`
- `questions.json`

**Before writing**: run `ls ~/.tutor/modules/quizzes/` and check for existing IDs to avoid duplicates.

**Create directory** before writing:
```
~/.tutor/modules/quizzes/{quizId}/
```

---

## Step 6 — Confirm

After writing all files, tell the user:
- Quiz title and ID
- Number of questions and type breakdown (e.g. "10 multiple-choice, 5 written")
- "Open http://localhost:3000/quizzes — your new quiz should appear immediately."

If the dev server isn't running: "Run `tutor start` to start the app."

---

## Example Invocation

User: `/new-quiz`

You: "Where should the quiz content come from? (course / flashcard deck / custom material)"
User: "The riyazi3-fa course"

You: "Should the quiz be in English or Persian?"
User: "Persian"

You: "What kind of questions? (multiple-choice / written / mixed)"
User: "Mixed"

...continue interview, show 3 samples, then generate all questions and write files.
