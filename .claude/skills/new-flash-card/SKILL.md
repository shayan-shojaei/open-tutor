---
name: new-flash-card
description: >
  Interactively creates a flash card deck for the Teacher app at
  ~/.tutor/modules. Interviews the user, derives cards from an existing
  module or user-provided material, then writes config.json and cards.json to
  the flashcards/ directory. Works for any subject in English or Persian.
---

# Flash Card Deck Generator

## Purpose

Creates a flash card deck for the Teacher app at `~/.tutor/modules`.
You will interview the user, generate all cards, and write them to disk so the
app immediately shows the new deck at http://localhost:3000/flashcards.

---

## Step 1 — Interview

Ask these questions **one at a time**, waiting for each answer before proceeding:

1. **Source**: "Based on an existing module, or your own material?"
   - If **module**: run `ls ~/.tutor/modules/` and list the available modules, then ask "Which module should I base the deck on?" Once answered, read the section markdown files inside that module to extract key concepts, definitions, theorems, and formulas.
   - If **own material**: ask "Paste your notes or text now and I'll extract the key concepts from it."
2. **Subject**: "What subject category fits best? (math / programming / general)"
3. **Language**: "Should the cards be in English or Persian (Farsi)? (en/fa)"
4. **Card count**: "How many cards would you like? (suggested: 15–25, max 50)"

---

## Step 2 — Propose Sample Cards

Before generating the full deck, show **5 sample front/back pairs** that represent the range of concepts you plan to cover.

Ask: "Do these look right? Any adjustments to style, depth, or focus before I generate all the cards?"

Wait for approval or adjustments before proceeding.

---

## Step 3 — Generate All Cards

Write `cards.json` to `~/.tutor/modules/flashcards/{deckId}/cards.json`.

```json
[
  {
    "id": "c1",
    "front": "Term or question (markdown + LaTeX OK)",
    "back": "Definition or answer (markdown + LaTeX OK)"
  }
]
```

**Card writing rules**:
- **Fronts**: concise — a term to define, a formula to name, or a short question
- **Backs**: complete — full definition or worked answer; use `$...$` inline LaTeX and `$$...$$` for block equations where appropriate; use fenced code blocks for code subjects
- **Distribution**: mix definition cards, formula recall cards, and concept-application cards; avoid clustering all cards of one type together
- **For Persian (`fa`)**: write all prose in Farsi; keep math notation, code, and variable names in standard LTR format; include the English term in parentheses on first use of a technical term
- **If from a module**: extract key definitions, theorems, named formulas, algorithm steps, and "gotcha" concepts from the lesson markdown files; do not copy entire paragraphs verbatim onto a card back

---

## Step 4 — Write Config

Write `config.json` to `~/.tutor/modules/flashcards/{deckId}/config.json`.

```json
{
  "id": "deck-id-in-kebab-case",
  "title": "Deck Title",
  "description": "1–2 sentence description of what the deck covers",
  "subject": "math | programming | general",
  "language": "en | fa",
  "sourceModule": "module-id"
}
```

Omit `sourceModule` entirely if the deck was not derived from an existing module.

**Subject rules**:
- `"math"` for: calculus, algebra, statistics, linear algebra, physics, chemistry
- `"programming"` for: any language (Go, Python, Rust, etc.) or CS topics
- `"general"` for: history, literature, languages, economics, etc.

---

## Step 5 — File Paths and Duplicate Check

All files go in `~/.tutor/modules/flashcards/{deckId}/`:

- `config.json` — deck metadata
- `cards.json` — all flash cards

**Before writing**: run `ls ~/.tutor/modules/flashcards/` and check for an existing directory with the same id. If one exists, append `-2` (or the next available suffix) to pick a unique id.

**Create the directory** before writing:
```
~/.tutor/modules/flashcards/{deckId}/
```

---

## Step 6 — Confirm

After writing all files, tell the user:
- The deck id and title
- How many cards were written
- "Open http://localhost:3000/flashcards — your new deck should appear immediately."

If the dev server isn't running: "Run `tutor start` to start the app."

---

## Content Quality Rules

1. **One concept per card**: each card tests exactly one thing; split compound ideas into separate cards
2. **Fronts must be unambiguous**: a front like "What is it?" is useless — be specific
3. **Backs must be self-contained**: the user shouldn't need outside context to understand the answer
4. **Math**: show the formula cleanly; add a one-line intuition note where it helps recall
5. **Persian lessons**: use clear academic Farsi; for technical terms, include the English term in parentheses on first use
6. **Code examples on backs**: use idiomatic, syntactically correct snippets — keep them short (≤ 10 lines)
7. **Avoid trivia**: prefer cards that reinforce understanding over cards that test memorisation of obscure facts
8. **Card count**: honour the user's requested count; never silently truncate or pad

---

## Example Invocation

User: `/new-flash-card`

You: "Based on an existing module, or your own material?"
User: "Existing module"

You: "Here are the available modules: `calc3`, `linear-algebra`, `go-basics`. Which one should I base the deck on?"
User: "linear-algebra"

You: (reads section files, then) "How many cards would you like? Suggested: 15–25, max 50."
User: "20"

...show 5 sample cards, wait for approval, generate all 20, write files.
