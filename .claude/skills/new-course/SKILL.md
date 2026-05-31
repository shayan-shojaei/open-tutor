---
name: new-course
description: >
  Interactively creates a new learning course for the Teacher app at
  ~/.tutor/modules. Interviews the user, generates structured lesson
  content (markdown + LaTeX/code), practice problems, and quizzes, then saves
  everything to the courses/ directory. Works for any subject in English or Persian.
---

# New Course Creator

## Purpose

Creates a complete learning course for the Teacher app at `~/.tutor/modules`.
You will interview the user, generate all content, and write it to disk so the app
immediately shows the new course at http://localhost:3000.

---

## Step 1 — Interview

Ask these questions **one at a time**, waiting for each answer before proceeding:

1. **Subject**: "What subject do you want to learn? (e.g. Linear Algebra, Rust programming, Organic Chemistry, Farsi Grammar)"
2. **Language**: "Should the lessons be in English or Persian (Farsi)? (en/fa)"
3. **Level**: "What's your current level? (beginner / intermediate / advanced)"
4. **Goal**: "What's your goal? (exam prep / project / curiosity / interview prep)"
5. **Topics**: "List the main topics or chapters you want covered. I'll suggest a structure based on these."
6. **Material**: "Do you have any source material (notes, textbook excerpts, problem sets) you'd like me to base the content on? If yes, paste it now or give me file paths. If no, I'll generate based on standard curriculum."

---

## Step 2 — Propose Structure

Based on the answers, propose a **chapter/section breakdown**:
- 3–6 chapters
- 2–5 sections per chapter
- Each section has a short descriptive title

Show the proposed outline as a numbered/indented list. Ask: "Does this structure look right? Any adjustments before I start generating?"

Wait for approval or adjustments before proceeding.

---

## Step 3 — Generate Content (Section by Section)

For **each section**, generate and write ALL THREE files before moving to the next section. Tell the user which section you're working on.

### Lesson file (`{sectionId}.md`)

Write a markdown lesson file that:
- Uses `$...$` for inline LaTeX and `$$...$$` for block equations (math subjects)
- Uses fenced code blocks with language identifiers (programming subjects)
- Covers the section's topics clearly (2–5 paragraphs of explanation)
- Includes **at least one worked example** in a `> **Worked Example**` blockquote
- For problem-solving sections: ends with 1–2 more worked examples showing step-by-step method
- For Persian lessons: write all prose in Persian/Farsi; keep math notation and code in standard format (LTR)

### Problems file (`{sectionId}.problems.json`)

Generate 1–2 practice problems as a JSON array matching this schema:
```json
[
  {
    "id": "p1",
    "statement": "Problem text with LaTeX if needed",
    "hint": "Optional hint",
    "solution": "Full worked solution in markdown+LaTeX",
    "answer": "Final answer"
  }
]
```

### Quiz file (`{sectionId}.quiz.json`)

Generate 3–5 multiple-choice questions as a JSON array:
```json
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "question": "Question text with LaTeX if needed",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Explanation of why the correct answer is right"
  }
]
```

**Shuffling rule**: The correct answer must NOT always be at index 0. For each question, place the correct answer at a varied position across the question set — distribute `correctIndex` values across 0, 1, 2, and 3 so no single index dominates. Set `correctIndex` to match wherever the correct answer actually lands in the `options` array after placement.

---

## Step 3.5 — Images (optional)

After all section files are written, ask:

> "All sections are written. Would you like me to find or generate images for visual concepts? I'll search Wikimedia Commons for diagrams and generate SVGs where nothing is found. (yes / no)"

- If **yes**: run the `/course-images` skill in auto mode for this course (see `.claude/skills/course-images/SKILL.md`). Pass the courseId and skip per-image confirmation — generate SVGs automatically when no Wikimedia image is found.
- If **no**: continue to Step 4.

---

## Step 4 — Write Config

After all sections are generated, write the `config.json`:

```json
{
  "id": "course-id-in-kebab-case",
  "title": "Full Course Title",
  "description": "1–2 sentence description",
  "subject": "math | programming | general",
  "icon": "relevant emoji",
  "language": "en | fa",
  "chapters": [
    {
      "id": "chapter-id",
      "title": "Chapter Title",
      "sections": [
        {
          "id": "section-id",
          "title": "Section Title",
          "chapterId": "chapter-id"
        }
      ]
    }
  ]
}
```

**Subject rules**:
- `"math"` for: calculus, algebra, statistics, linear algebra, physics, chemistry
- `"programming"` for: any language (Go, Python, Rust, etc.) or CS topics
- `"general"` for: history, literature, languages, economics, etc.

---

## Step 5 — File Paths

All files go in `~/.tutor/modules/courses/{courseId}/`:

- `config.json` — written last
- `sections/{sectionId}.md` — lesson content
- `sections/{sectionId}.problems.json` — practice problems
- `sections/{sectionId}.quiz.json` — quiz questions

**Before writing**: run `ls ~/.tutor/modules/courses/` and check for existing IDs to avoid duplicates.

**Create directories** before writing:
```
~/.tutor/modules/courses/{courseId}/
~/.tutor/modules/courses/{courseId}/sections/
```

---

## Step 6 — Confirm

After writing all files, tell the user:
- Which course was created (title + id)
- How many chapters and sections
- "Open http://localhost:3000 — your new course should appear on the home page immediately."

If the dev server isn't running: "Run `tutor start` to start the app."

---

## Content Quality Rules

1. **Don't oversimplify**: match the depth to the user's stated level
2. **Math**: always show the formula first, then the intuition behind it
3. **Worked examples**: show every step; don't skip algebra
4. **Quiz distractors**: make wrong options plausible, not obviously wrong
5. **Persian lessons**: use clear academic Farsi; for technical terms, include the English term in parentheses on first use
6. **Code examples**: use idiomatic, production-quality code with correct syntax
7. **Section size**: aim for 300–600 words per lesson (not too short, not overwhelming)
8. **Problems**: problems should require applying the concepts from the lesson, not just recalling definitions

---

## Example Invocation

User: `/new-course`

You: "What subject do you want to learn?"
User: "Go programming"

You: "English or Persian?"
User: "English"

...continue interview, then generate content section by section, writing files as you go.
