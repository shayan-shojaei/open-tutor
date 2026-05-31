---
name: course-images
description: >
  Finds images for a course's sections on Wikimedia Commons, then inserts them
  into the section markdown files. Searches Wikimedia Commons for SVGs only;
  skips any concept where no suitable image is found.
  Works on any existing course in ~/.tutor/modules/courses/.
---

# Course Images

## Purpose

Enriches an existing course with illustrative images sourced from Wikimedia
Commons. For each section, you identify concepts that benefit from a visual
(graph, diagram, geometry, architecture) and search for a real diagram on
Wikimedia Commons. Concepts with no suitable Wikimedia image are skipped.

Images are saved to `~/.tutor/modules/api/asset/courses/{courseId}/images/`
and referenced in markdown as `![caption](/api/asset/courses/{courseId}/images/{filename})`.

---

## Step 1 — Identify the course

If the user invoked the skill with a course ID argument (e.g. `/course-images go-load-balancer`), use that.
Otherwise ask: "Which course should I add images to? (run `ls ~/.tutor/modules/courses/` to see available courses)"

Read `~/.tutor/modules/courses/{courseId}/config.json` to get the chapter/section list.

---

## Step 2 — Analyse each section

For every section, read its markdown file at
`~/.tutor/modules/courses/{courseId}/sections/{sectionId}.md`.

Identify **1–2 concepts** per section that would benefit from a diagram. Good candidates:
- Mathematical objects: curves, surfaces, coordinate systems, geometric shapes, vector fields
- Data structures: trees, graphs, linked lists, hash tables
- System/architecture diagrams: request flows, pipelines, state machines
- Algorithm visualizations: sorting steps, tree traversals

Skip sections that are already rich in code blocks (pure coding sections rarely need images),
and skip any section that already has `![` in it (image already present).

Build a plan: a list of `{ sectionId, concept, searchQuery }` tuples.
Tell the user the plan before starting: "I'll look for images for these sections: …"

---

## Step 3 — Find each image on Wikimedia Commons

For each `(sectionId, concept, searchQuery)`:

### 3a. Search Wikimedia Commons

Fetch the Wikimedia Commons search API:
```
https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={searchQuery}+filetype:svg&srnamespace=6&prop=imageinfo&format=json&srlimit=5
```

Parse the JSON response. For each result with a title like `File:*.svg`:
- Fetch the file page to get the direct download URL:
  ```
  https://commons.wikimedia.org/w/api.php?action=query&titles={File:Title}&prop=imageinfo&iiprop=url&format=json
  ```
- Download the SVG content (use `-L` to follow redirects).
- Check that it is a real SVG (starts with `<svg` or `<?xml`).
- If valid: save to `~/.tutor/modules/api/asset/courses/{courseId}/images/{slug}.svg` and proceed to Step 3b.

If no suitable image is found on Wikimedia Commons, skip this concept and move on.

### 3b. Insert image into markdown

Open the section's `.md` file. Insert the image reference at a natural position:
- **After the paragraph that introduces the concept**, before any blockquote or worked example.
- Never insert at the very top (first line) of the file.
- Never duplicate — check that no `![` already exists near that concept.

Insert exactly this syntax:
```markdown
![{Descriptive caption matching the concept}](/api/asset/courses/{courseId}/images/{slug}.svg)
```

---

## Step 4 — Create the public directory

Before writing any image, ensure the directory exists:
```bash
mkdir -p ~/.tutor/modules/courses/{courseId}/images
```

---

## Step 5 — Report

After processing all sections, print a summary table:

| Section | Concept | Source | File |
|---------|---------|--------|------|
| intro   | Coordinate axes | Wikimedia | axes.svg |
| gradients | Gradient vector field | Skipped (not found) | — |
| …       | …       | …       | … |

Tell the user: "Open http://localhost:3000 and navigate to the course — images should appear inline in the lessons."

---

## Slug Naming Convention

Convert the concept to a filename slug:
- Lowercase, words separated by hyphens
- No special characters
- Examples: `coordinate-axes.svg`, `gradient-vector-field.svg`, `round-robin-flow.svg`

---

## Running inside /new-course

When invoked from within the `/new-course` skill (Step 3.5):
- Still report the summary table at the end.
- Do not ask for the course ID — it is provided by the calling skill.

---

## Example Invocation

```
/course-images calc3
```

1. Reads `courses/calc3/config.json` (2 sections: vectors-intro, dot-product)
2. Identifies: coordinate axes in 3D, dot product geometric interpretation
3. Searches Wikimedia → finds a 3D axes SVG → downloads and inserts it
4. Searches Wikimedia for dot product → nothing found → skips
5. Reports the table
