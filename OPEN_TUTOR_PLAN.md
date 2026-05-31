# Implementation Plan: Open Tutor

## Overview

Create a new open-source project called **Open Tutor** (`~/Documents/dev/open-tutor`) derived from the current `teacher` app. Open Tutor is a self-hosted learning environment:

- Users install a `tutor` CLI, which downloads a pre-built web app from GitHub Releases and serves it locally on a configurable port.
- Modules (courses, flashcards, quizzes) live in `~/.tutor/modules/` — shared across any project, creatable with Claude Code skills.
- GitHub repositories serve as module registries; users publish and consume modules by adding repo URLs to their local config.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CLI language | **Go** | Single binary, no runtime deps, cross-platform, shayan knows Go |
| Web app | **Next.js standalone** | Port from `teacher`; `output: 'standalone'` in `next.config` produces a self-contained Node server bundle suitable for GitHub Releases |
| Module storage | `~/.tutor/modules/{courses,flashcards,quizzes}/` | Mirrors current repo layout; skills can write there without changing logic |
| Config file | `~/.tutor/config.json` | Port, repo list, theme; flag overrides config |
| Module repo format | GitHub repo + `tutor-manifest.json` at root | Simple; no registry server required |
| Web app env wiring | `TUTOR_MODULES_DIR` env var | CLI injects this when spawning the Node server |
| Node.js requirement | **Required by user** | Standalone Next.js still needs Node; we check and warn on `tutor start` |

---

## Directory Layouts

### `~/Documents/dev/open-tutor/` (this repo)
```
open-tutor/
├── web/                    # Next.js app (ported from teacher)
│   ├── src/
│   ├── public/
│   ├── next.config.mjs
│   └── package.json
├── cli/                    # Go CLI source
│   ├── main.go
│   ├── cmd/
│   │   ├── root.go
│   │   ├── install.go
│   │   ├── start.go
│   │   ├── module.go
│   │   └── repo.go
│   ├── internal/
│   │   ├── config/
│   │   ├── github/
│   │   └── server/
│   └── go.mod
├── .claude/
│   └── skills/             # ported + updated skills
└── .github/
    └── workflows/
        ├── release-web.yml  # builds & publishes Next.js standalone on tag
        └── release-cli.yml  # cross-compiles Go CLI on tag
```

### `~/.tutor/` (user's home, created by `tutor init`)
```
~/.tutor/
├── config.json             # { "port": 3000, "repos": [...] }
├── app/                    # downloaded standalone Next.js server
│   └── server.js
└── modules/
    ├── courses/
    ├── flashcards/
    └── quizzes/
```

### Module repository format (any public GitHub repo)
```
my-tutor-modules/
├── tutor-manifest.json     # lists available modules
├── courses/
│   └── my-course/
│       ├── config.json
│       └── sections/
├── flashcards/
│   └── my-deck/
│       ├── config.json
│       └── cards.json
└── quizzes/
    └── my-quiz/
        ├── config.json
        └── questions.json
```

`tutor-manifest.json` format:
```json
{
  "name": "Human-readable collection name",
  "description": "Short description",
  "modules": [
    { "type": "course", "id": "my-course", "title": "My Course", "description": "..." },
    { "type": "flashcard", "id": "my-deck", "title": "My Deck", "description": "..." }
  ]
}
```

---

## CLI Reference (`tutor`)

```
tutor init                        # create ~/.tutor/ structure
tutor install [--version v1.2.3]  # download latest web app release
tutor start [--port 3000]         # serve the web app
tutor upgrade                     # re-run install with latest tag

tutor module list                 # list installed modules
tutor module install <repo> <id>  # install one module from a registered repo
tutor module remove <id>          # delete a module from ~/.tutor/modules/
tutor module search <query>       # search across registered repos

tutor repo add <github-url>       # register a module repo
tutor repo list                   # list registered repos
tutor repo remove <github-url>    # unregister a repo
tutor repo update                 # refresh manifest cache for all repos
```

---

## Task List

---

### Phase 1: Bootstrap New Project

#### Task 1: Scaffold `open-tutor` repository
**Description:** Create the project root, git repo, directory skeleton, and top-level README.

**Acceptance criteria:**
- [ ] `~/Documents/dev/open-tutor/` exists with `web/`, `cli/`, `.claude/skills/`, `.github/workflows/` directories
- [ ] `git init` done, initial commit present
- [ ] `README.md` explains: what Open Tutor is, `tutor install && tutor start`, module sharing model

**Verification:**
- [ ] `ls ~/Documents/dev/open-tutor/` shows expected structure
- [ ] `git log --oneline` shows at least one commit

**Dependencies:** None

**Files likely touched:**
- `README.md`
- `web/` (empty dir)
- `cli/` (empty dir)
- `.gitignore`

**Estimated scope:** Small

---

#### Task 2: Port Next.js web app into `web/`
**Description:** Copy the full `teacher` Next.js app into `open-tutor/web/`, strip the personal content modules (courses, flashcards, quizzes directories), rename all branding from "Teacher" → "Open Tutor", and update `package.json` name.

**Acceptance criteria:**
- [ ] `open-tutor/web/` is a runnable Next.js app (`npm run dev` works)
- [ ] No references to "Teacher" remain in UI text, `<title>`, page headings, or `package.json`
- [ ] No personal modules are bundled (the `courses/`, `flashcards/`, `quizzes/` dirs are absent from `web/`)
- [ ] App loads with an empty home page (no modules = graceful empty state message)

**Verification:**
- [ ] `cd web && npm run dev` → `http://localhost:3000` loads, shows "Open Tutor", empty course list

**Dependencies:** Task 1

**Files likely touched:**
- `web/src/app/layout.tsx` — title
- `web/src/app/page.tsx` — heading, copy
- `web/src/components/layout/NavBar.tsx`
- `web/package.json`

**Estimated scope:** Small

---

### Phase 2: Dynamic Module Loading

#### Task 3: Make module base directory configurable via env var
**Description:** The current `src/lib/courses.ts`, `flashcards.ts`, `quizzes.ts` all hardcode `process.cwd() + "/courses"`. Replace these with a function `getModulesDir()` that reads `process.env.TUTOR_MODULES_DIR` and falls back to `path.join(process.cwd(), "modules")` for local dev. Apply the same pattern to flashcards and quizzes.

**Acceptance criteria:**
- [ ] `TUTOR_MODULES_DIR=/some/path npm run dev` causes all API routes to read from `/some/path/{courses,flashcards,quizzes}/`
- [ ] Without the env var, app reads from `web/modules/` (local dev mode)
- [ ] No hardcoded `process.cwd() + "/courses"` paths remain anywhere in `src/lib/`

**Verification:**
- [ ] `TUTOR_MODULES_DIR=~/.tutor/modules npm run dev` with a course in `~/.tutor/modules/courses/` → course appears on home page

**Dependencies:** Task 2

**Files likely touched:**
- `web/src/lib/courses.ts`
- `web/src/lib/flashcards.ts`
- `web/src/lib/quizzes.ts`
- New: `web/src/lib/modulesDir.ts`

**Estimated scope:** Small

---

#### Task 4: Add Next.js standalone output and build verification
**Description:** Add `output: 'standalone'` to `next.config.mjs`. Verify that `npm run build` produces a `.next/standalone/server.js` that can be run with `TUTOR_MODULES_DIR=... node server.js`. Document the server start command.

**Acceptance criteria:**
- [ ] `npm run build` in `web/` succeeds without errors
- [ ] `.next/standalone/server.js` exists after build
- [ ] `TUTOR_MODULES_DIR=~/.tutor/modules PORT=3000 node .next/standalone/server.js` serves the app

**Verification:**
- [ ] Manual: run the standalone server, open browser, confirm modules load

**Dependencies:** Task 3

**Files likely touched:**
- `web/next.config.mjs`

**Estimated scope:** XS

---

### Checkpoint: After Phase 2
- [ ] Web app builds to standalone
- [ ] Module directory is env-configurable
- [ ] Empty state is graceful
- [ ] Review with Shayan before building CLI

---

### Phase 3: Go CLI — Core

#### Task 5: Initialize Go module and CLI skeleton
**Description:** Set up the Go module (`github.com/shayanshojaei/open-tutor` or chosen path), wire up `cobra` for subcommand routing, and add a bare `tutor --version` command.

**Acceptance criteria:**
- [ ] `cli/go.mod` exists with module path and `cobra` dependency
- [ ] `go build ./...` succeeds
- [ ] `./tutor --version` prints `tutor v0.1.0`
- [ ] `./tutor --help` lists available subcommands

**Verification:**
- [ ] `go build -o tutor ./cli && ./tutor --version`

**Dependencies:** Task 1

**Files likely touched:**
- `cli/go.mod`
- `cli/go.sum`
- `cli/main.go`
- `cli/cmd/root.go`

**Estimated scope:** Small

---

#### Task 6: `tutor init` — create `~/.tutor/` structure
**Description:** On first run, `tutor init` creates the home directory structure if it does not exist. Idempotent — safe to run again. Also creates a default `config.json` with `{"port": 3000, "repos": []}`.

**Acceptance criteria:**
- [ ] `tutor init` creates `~/.tutor/`, `~/.tutor/modules/{courses,flashcards,quizzes}/`, `~/.tutor/config.json`
- [ ] Running `tutor init` a second time prints "Already initialized" and exits 0

**Verification:**
- [ ] `rm -rf ~/.tutor && tutor init && ls ~/.tutor/`

**Dependencies:** Task 5

**Files likely touched:**
- `cli/cmd/init.go`
- `cli/internal/config/config.go`

**Estimated scope:** Small

---

#### Task 7: `tutor install` — download latest web app release
**Description:** Fetch the latest GitHub Release from the `open-tutor` repo (or a configurable release URL). Download the `web-standalone.tar.gz` asset, extract to `~/.tutor/app/`. Show a progress bar. Verify the download with SHA256 if a checksum file is present in the release.

**Acceptance criteria:**
- [ ] `tutor install` downloads and extracts the web app to `~/.tutor/app/`
- [ ] `~/.tutor/app/server.js` exists after install
- [ ] `tutor install --version v1.2.3` installs a specific version
- [ ] Re-running replaces the old install cleanly

**Verification:**
- [ ] (For now, test against a local tarball or a placeholder release)

**Dependencies:** Task 6

**Files likely touched:**
- `cli/cmd/install.go`
- `cli/internal/github/release.go`

**Estimated scope:** Medium

---

#### Task 8: `tutor start` — serve the web app
**Description:** Start the standalone Next.js server as a child process. Inject `TUTOR_MODULES_DIR=~/.tutor/modules` and `PORT=<configured port>`. Verify Node.js is installed first; print a friendly error if not. Port is read from `~/.tutor/config.json`, overridden by `--port` flag.

**Acceptance criteria:**
- [ ] `tutor start` spawns `node ~/.tutor/app/server.js` with correct env vars
- [ ] `tutor start --port 4000` overrides config port
- [ ] If Node.js is not installed, prints: "Node.js is required. Install it from https://nodejs.org"
- [ ] Ctrl-C cleanly terminates the child process
- [ ] If `~/.tutor/app/server.js` doesn't exist, prints: "Web app not installed. Run `tutor install` first."

**Verification:**
- [ ] `tutor start`, open `http://localhost:3000`

**Dependencies:** Task 7

**Files likely touched:**
- `cli/cmd/start.go`
- `cli/internal/server/serve.go`

**Estimated scope:** Small

---

#### Task 9: `tutor upgrade` command
**Description:** Alias/wrapper for `tutor install` that always fetches the latest tag, skipping the version flag. Prints the current installed version vs the new version before upgrading.

**Acceptance criteria:**
- [ ] `tutor upgrade` prints current version and new version, then installs the new one

**Verification:**
- [ ] Manual smoke test

**Dependencies:** Task 7

**Files likely touched:**
- `cli/cmd/upgrade.go`

**Estimated scope:** XS

---

### Checkpoint: After Phase 3
- [ ] `tutor init && tutor install && tutor start` full flow works end-to-end
- [ ] Port flag and config file both work
- [ ] Review with Shayan

---

### Phase 4: CLI — Module Management

#### Task 10: `tutor module list`
**Description:** Read `~/.tutor/modules/{courses,flashcards,quizzes}/` and print a table of installed modules with their type, id, title, and language.

**Acceptance criteria:**
- [ ] Lists all installed courses, flashcard decks, and quizzes
- [ ] Shows: Type, ID, Title, Language columns
- [ ] Empty output (with informational message) when no modules are installed

**Verification:**
- [ ] Install a test module manually, run `tutor module list`

**Dependencies:** Task 6

**Files likely touched:**
- `cli/cmd/module.go`

**Estimated scope:** Small

---

#### Task 11: `tutor module install <repo-url-or-alias> <module-id>`
**Description:** Given a registered repo alias or full GitHub URL and a module ID, download that module's directory into `~/.tutor/modules/{type}/{id}/`. Uses the GitHub API to fetch the repo tree (or a zip archive) for the specific module subdirectory. Reads `tutor-manifest.json` first to validate the module exists and find its type.

**Acceptance criteria:**
- [ ] `tutor module install my-repo my-course` copies `courses/my-course/` into `~/.tutor/modules/courses/my-course/`
- [ ] Errors clearly if module ID not found in the repo's manifest
- [ ] Does not re-download if already installed unless `--force` is passed

**Verification:**
- [ ] Install a module from a real or test GitHub repo, verify files appear in `~/.tutor/modules/`

**Dependencies:** Task 10

**Files likely touched:**
- `cli/cmd/module.go`
- `cli/internal/github/download.go`

**Estimated scope:** Medium

---

#### Task 12: `tutor module remove <id>`
**Description:** Delete a module from `~/.tutor/modules/`. Ask for confirmation before deleting. Search all three type directories for the given id.

**Acceptance criteria:**
- [ ] Prompts "Remove module 'my-course'? (y/N)"
- [ ] Deletes the directory on confirmation
- [ ] Prints error if module not found

**Verification:**
- [ ] Install then remove a module

**Dependencies:** Task 11

**Files likely touched:**
- `cli/cmd/module.go`

**Estimated scope:** XS

---

### Phase 5: CLI — Repository Management

#### Task 13: `tutor repo add <github-url>`
**Description:** Add a GitHub repo URL to `~/.tutor/config.json`'s `repos` array. Validate that the repo exists and has a `tutor-manifest.json` at its root by fetching it via GitHub API. Assign a short alias (repo name) for use in `tutor module install`.

**Acceptance criteria:**
- [ ] `tutor repo add https://github.com/user/my-modules` fetches and validates the manifest, then saves the repo to config
- [ ] Duplicate repo URL is rejected with a clear message
- [ ] Invalid or non-existent repo shows a clear error

**Verification:**
- [ ] Add a real test repo, confirm it appears in `tutor repo list`

**Dependencies:** Task 6

**Files likely touched:**
- `cli/cmd/repo.go`
- `cli/internal/config/config.go`
- `cli/internal/github/manifest.go`

**Estimated scope:** Small

---

#### Task 14: `tutor repo list` and `tutor repo remove`
**Description:** List registered repos (alias, URL, module count from cached manifest). Remove removes from config.

**Acceptance criteria:**
- [ ] `tutor repo list` shows a table: Alias, URL, Modules
- [ ] `tutor repo remove <alias-or-url>` removes the entry

**Verification:**
- [ ] Add and remove a repo, verify list reflects changes

**Dependencies:** Task 13

**Files likely touched:**
- `cli/cmd/repo.go`

**Estimated scope:** XS

---

#### Task 15: `tutor module search <query>`
**Description:** Search across all registered repos' cached manifests for modules matching the query (case-insensitive substring match on title + description). Fetch fresh manifests if cache is stale (>24h). Print a table: Repo, Type, ID, Title.

**Acceptance criteria:**
- [ ] `tutor module search calculus` lists all modules across all repos with "calculus" in title/description
- [ ] Cache is stored in `~/.tutor/cache/{alias}-manifest.json` with a timestamp
- [ ] `tutor repo update` forces cache refresh for all repos

**Verification:**
- [ ] With a registered test repo containing several modules, search and verify results

**Dependencies:** Task 13

**Files likely touched:**
- `cli/cmd/module.go`
- `cli/cmd/repo.go`
- `cli/internal/github/manifest.go`

**Estimated scope:** Medium

---

### Checkpoint: After Phase 5
- [ ] Full module flow works: add repo → search → install → list → remove
- [ ] Config file and flag override both functional
- [ ] Review with Shayan

---

### Phase 6: Port and Update Skills

#### Task 16: Copy skills into `open-tutor/.claude/skills/` and update paths
**Description:** Copy all five skills from `teacher/.claude/skills/` into `open-tutor/.claude/skills/`. Update every hardcoded path from `~/Documents/dev/teacher/` to `~/.tutor/modules/`. Update the server URL from `http://localhost:3000` to `http://localhost:<configured-port>` (or just keep 3000 as the default).

**Acceptance criteria:**
- [ ] All five skills exist in `open-tutor/.claude/skills/`
- [ ] No references to `~/Documents/dev/teacher` remain in any skill file
- [ ] Skills write to `~/.tutor/modules/{courses,flashcards,quizzes}/`
- [ ] Skills reference the correct dev server URL

**Verification:**
- [ ] Read each skill file and confirm paths are correct

**Dependencies:** Task 2

**Files likely touched:**
- `.claude/skills/new-course/SKILL.md`
- `.claude/skills/new-flash-card/SKILL.md`
- `.claude/skills/new-quiz/SKILL.md`
- `.claude/skills/new-recap/SKILL.md`
- `.claude/skills/course-images/SKILL.md`

**Estimated scope:** Small

---

#### Task 17: Create `CLAUDE.md` for the open-tutor repo
**Description:** Write `.claude/CLAUDE.md` that documents the project structure, how the web app and CLI relate, and how skills should write modules. This gives agents (and future contributors) full context.

**Acceptance criteria:**
- [ ] Explains `web/` vs `cli/` structure
- [ ] Documents `TUTOR_MODULES_DIR` env var
- [ ] Explains module format (courses, flashcards, quizzes)
- [ ] References available skills and their purpose

**Verification:**
- [ ] Read-through confirms it's accurate

**Dependencies:** Task 16

**Files likely touched:**
- `.claude/CLAUDE.md`

**Estimated scope:** Small

---

### Phase 7: CI/CD and Releases

#### Task 18: GitHub Actions — build and release the web app
**Description:** Write `.github/workflows/release-web.yml`. On push of a tag `v*`, build `web/` with `npm run build`, package `.next/standalone/` as `web-standalone-{version}.tar.gz`, and publish to GitHub Releases with a SHA256 checksum file.

**Acceptance criteria:**
- [ ] Workflow triggers on `v*` tags
- [ ] Artifact is named `web-standalone-{version}.tar.gz`
- [ ] Checksum file `web-standalone-{version}.sha256` is published alongside it
- [ ] Release notes are auto-generated from the tag message

**Verification:**
- [ ] Inspect workflow YAML for correctness (can't run without a push)

**Dependencies:** Task 4

**Files likely touched:**
- `.github/workflows/release-web.yml`

**Estimated scope:** Small

---

#### Task 19: GitHub Actions — cross-compile and release the CLI
**Description:** Write `.github/workflows/release-cli.yml`. On the same `v*` tag, cross-compile the Go CLI for `linux/amd64`, `darwin/amd64`, `darwin/arm64`, `windows/amd64`. Publish all binaries to the same GitHub Release as the web app.

**Acceptance criteria:**
- [ ] Four binaries published: `tutor-linux-amd64`, `tutor-darwin-amd64`, `tutor-darwin-arm64`, `tutor-windows-amd64.exe`
- [ ] Binaries are attached to the same release as the web app
- [ ] Install instructions in README updated with `curl | tar` one-liner

**Verification:**
- [ ] Inspect workflow YAML for correctness

**Dependencies:** Task 18

**Files likely touched:**
- `.github/workflows/release-cli.yml`
- `README.md` (install instructions)

**Estimated scope:** Small

---

### Final Checkpoint
- [ ] `tutor init && tutor install && tutor start` works on a clean machine (excluding Node.js requirement)
- [ ] `tutor repo add <url> && tutor module search && tutor module install` works
- [ ] All skills write to `~/.tutor/modules/` and content appears in the served app
- [ ] README is publication-ready for GitHub

---

## Parallelization Opportunities

After Task 1 (scaffold), the following can proceed in parallel:
- **Phase 2** (web app changes) and **Phase 3 Tasks 5–6** (CLI bootstrap + init) are independent
- **Phase 6** (skills port) can start as soon as Task 2 is done
- **Phase 7** (CI/CD) can be written any time after Phase 2 + 3 are stable

Sequential dependencies:
- Task 3 → Task 4 (standalone output depends on env var refactor)
- Task 7 → Task 8 → Task 9 (install before start before upgrade)
- Task 10 → Task 11 → Task 12 (list before install before remove)
- Task 13 → Task 14 → Task 15 (add before list before search)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GitHub API rate limits during module install | Medium | Cache manifests; use unauthenticated API for public repos (60 req/hr is enough for normal use) |
| Next.js standalone output doesn't work with all features | High | Test `output: 'standalone'` early (Task 4) before building CLI around it |
| Users don't have Node.js installed | Medium | `tutor start` checks for Node, prints clear install instructions |
| Module id collisions between repos | Low | Namespacing: `tutor module install <repo-alias>/<module-id>` makes the source unambiguous |
| Open Tutor GitHub org/repo name for releases | Low | Decide repo name before wiring `tutor install`; can be overridden in CLI config |

---

## Open Questions

1. **GitHub org/user**: What GitHub account/org will host the `open-tutor` repo? (needed for `tutor install` default release URL)
2. **CLI module path**: What should the Go module path be? (`github.com/shayan/open-tutor` or something else?)
3. **Empty-state UX**: Should the web app show sample/demo content when no modules are installed, or a pure "get started" screen?
4. **Public images**: The current `course-images` skill downloads from Wikimedia and writes to `public/courses/`. In the new model, module images need to be bundled with the module in `~/.tutor/modules/courses/{id}/images/`. How should the web app serve these — via an API route that reads from the modules dir?
