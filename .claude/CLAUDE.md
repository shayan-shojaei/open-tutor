# Open Tutor — Claude Code Context

## Project Layout

```
open-tutor/
├── web/          Next.js app (the learning UI)
├── cli/          Go CLI (`tutor` binary)
└── .claude/skills/   Claude Code skills for creating modules
```

## Web App (`web/`)

- **Next.js 14**, TypeScript, Tailwind CSS
- Reads modules from `TUTOR_MODULES_DIR` env var (defaults to `~/.tutor/modules/`)
- `src/lib/modulesDir.ts` is the single source of truth for the module root path
- Build: `npm run build` produces a standalone server at `.next/standalone/server.js`
- Dev: `cd web && npm run dev` — modules are served from `~/.tutor/modules/` by default

### Module types and data dirs

| Type | Path |
|------|------|
| Courses | `$TUTOR_MODULES_DIR/courses/{id}/` |
| Flashcard decks | `$TUTOR_MODULES_DIR/flashcards/{id}/` |
| Quizzes | `$TUTOR_MODULES_DIR/quizzes/{id}/` |

### Image serving

Module images (e.g. SVGs downloaded by `/course-images`) are stored in the modules dir,
not in `public/`. They are served via `/api/asset/[...assetPath]` which reads from
`$TUTOR_MODULES_DIR` and streams the file. Reference them in markdown as:

```
![caption](/api/asset/courses/{courseId}/images/{file}.svg)
```

## CLI (`cli/`)

- **Go**, `cobra` for commands
- `internal/config/config.go` — `~/.tutor/` paths and `config.json` loading
- `internal/github/` — GitHub API calls (release downloads, manifest fetching, zip extraction)
- `internal/server/` — spawns the Node.js standalone server
- Build: `cd cli && go build -o tutor .`

## Skills

All five skills write to `~/.tutor/modules/`. They mirror the module format exactly.
When the dev server is running, content appears immediately on refresh.

| Skill | Writes to |
|-------|-----------|
| `/new-course` | `~/.tutor/modules/courses/{id}/` |
| `/new-flash-card` | `~/.tutor/modules/flashcards/{id}/` |
| `/new-quiz` | `~/.tutor/modules/quizzes/{id}/` |
| `/new-recap` | `~/.tutor/modules/courses/{id}/recap/` |
| `/course-images` | `~/.tutor/modules/courses/{id}/images/` |

## Module Format

See `web/src/lib/types.ts` for the full TypeScript schema.
See `README.md` for directory layout.

## Releases

A single GitHub Actions workflow (`.github/workflows/release.yml`) fires on `v*` tags:
1. Builds `web/` as a Next.js standalone tarball (`web-standalone-vX.Y.Z.tar.gz`)
2. Cross-compiles the CLI for linux/amd64, darwin/amd64, darwin/arm64, windows/amd64
3. Publishes all artifacts to the GitHub Release

`tutor install` downloads the tarball and extracts it to `~/.tutor/app/`.
