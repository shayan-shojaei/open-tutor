---
name: new-recap
description: >
  Generates a Recap for an existing course in the Teacher app at
  ~/.tutor/modules. Reads each section's lesson content and writes a
  condensed summary and fresh quiz to courses/{courseId}/recap/. The Recap
  button then appears automatically in the course sidebar. Works for any
  subject in English or Persian.
---

# /new-recap Skill

## Purpose

Generate a Recap for an existing course. Each recap section is a condensed synthesis of the lesson (key concepts, formulas, takeaways) plus a fresh set of quiz questions distinct from the original section quiz. Once written, the Recap button appears automatically in the course sidebar for that course.

---

## Step 1 — Interview

Ask each question one at a time. Wait for the user's answer before proceeding.

**1a. Pick a course.**
Run: `ls ~/.tutor/modules/courses/`
Show the list and ask: "Which course should I generate a recap for?"

**1b. Confirm language.**
Read `~/.tutor/modules/courses/{courseId}/config.json`. Extract `"language"`.
Tell the user: "This course is in [English / Persian]. Do you want to keep that language for the recap, or switch?"

**1c. Summary depth.**
Ask: "How detailed should each section summary be?
- **Brief** (~100 words) — key terms and formulas only
- **Standard** (~200 words) — key concepts with a sentence of context each
- **Detailed** (~300 words) — fuller synthesis with brief examples"

---

## Step 2 — Generate content per section

Read the full `config.json` to get the ordered list of chapters and sections.

For **each section** in order:

1. Read `~/.tutor/modules/courses/{courseId}/sections/{sectionId}.md`
2. Read `~/.tutor/modules/courses/{courseId}/sections/{sectionId}.quiz.json` (if it exists) — note existing questions to avoid repetition

Generate two outputs before moving to the next section:

### Summary (`{sectionId}.md`)

- Compact prose — no headings, no bullet lists unless the source uses them for a series of items
- Cover the key concepts, definitions, and formulas from the lesson
- Do **not** copy sentences verbatim; synthesize and rephrase
- Preserve all LaTeX ($...$ and $$...$$)
- Preserve all code fences with their language tags
- For Persian courses: write prose in Farsi; keep math and code LTR

### Quiz (`{sectionId}.quiz.json`)

- 3–5 multiple-choice questions
- Must **not** repeat any question from the existing `{sectionId}.quiz.json` — check for overlap in concept and wording
- Questions may be more integrative or applied than the original quiz (the user has already studied the material)
- Each option should be plausible — avoid obviously wrong distractors
- Distribute `correctIndex` across 0, 1, 2, and 3 — do not put the correct answer at the same index for every question

Format:
```json
[
  {
    "id": "rq1",
    "type": "multiple-choice",
    "question": "Question text (LaTeX OK)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 2,
    "explanation": "Why the correct answer is correct."
  }
]
```

---

## Step 3 — Write files

**Before writing anything:**
Check if `~/.tutor/modules/courses/{courseId}/recap/` already exists.
If it does, tell the user: "A recap already exists for this course. Overwrite all files? (yes / no)"
If the user says no, stop.

Create the directory if it does not exist.

For each section, write:
- `~/.tutor/modules/courses/{courseId}/recap/{sectionId}.md`
- `~/.tutor/modules/courses/{courseId}/recap/{sectionId}.quiz.json`

Announce each section as you write it: "Writing recap for: {sectionTitle}…"

Do **not** modify `config.json` — recap detection is directory-based.

**Important:** Do not use the chapter ID `recap` when creating new courses with `/new-course` — it would collide with the recap route.

---

## Step 4 — Confirm

Tell the user:
- How many sections were covered
- "The Recap button now appears in the sidebar when you open this course."
- URL: `http://localhost:3000/learn/{courseId}/recap`

---

## Quality Rules

1. **Synthesis over quotation** — rephrase; do not paste from the source lesson.
2. **Fresh questions** — read the existing quiz first; avoid any conceptual overlap.
3. **Persian support** — prose in Farsi, math/code stays LTR.
4. **Shuffle correctIndex** — vary across 0, 1, 2, 3 within each quiz file.
5. **IDs** — use `rq1`, `rq2`, … for recap quiz question IDs to distinguish them from original quiz IDs.
6. **Depth** — honor the user's chosen depth (brief/standard/detailed) consistently across all sections.
