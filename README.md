# Open Tutor

A self-hosted interactive learning environment. Install once, run anywhere, share modules on GitHub.

## Quick Start

```bash
# 1. Install the CLI (download from Releases, or build from source)
go install github.com/shayan-shojaei/open-tutor/cli@latest

# 2. Initialize your local tutor directory (~/.tutor/)
tutor init

# 3. Download the latest web app
tutor install

# 4. Start (default port 3000)
tutor start

# Optional: choose a port
tutor start --port 8080
```

Open `http://localhost:3000` in your browser.

## Configuration

`~/.tutor/config.json` — created by `tutor init`:

```json
{
  "port": 3000,
  "repos": []
}
```

The `port` here is the default; `--port` always takes precedence.

## Installing Modules

Modules are courses, flashcard decks, and quizzes. They live in `~/.tutor/modules/`.

### From a GitHub repository

```bash
# Register a community module repo
tutor repo add https://github.com/example/tutor-modules

# Browse what's in it
tutor module search calculus

# Install a specific module
tutor module install tutor-modules calculus-101

# List everything you've installed
tutor module list
```

### Sharing your own modules

1. Create a public GitHub repo
2. Add a `tutor-manifest.json` at the root (see format below)
3. Put your modules in `courses/`, `flashcards/`, or `quizzes/` subdirectories
4. Tell users to run `tutor repo add https://github.com/you/your-repo`

**`tutor-manifest.json` format:**

```json
{
  "name": "My Module Collection",
  "description": "Short description",
  "modules": [
    {
      "type": "course",
      "id": "calculus-101",
      "title": "Calculus 101",
      "description": "Limits, derivatives, and integrals"
    }
  ]
}
```

## Creating Modules with Claude Code

Open this project in Claude Code and use the built-in skills:

| Skill | What it does |
|-------|-------------|
| `/new-course` | Interviews you and generates a full course (lessons + problems + quizzes) |
| `/new-flash-card` | Creates a flashcard deck from existing content or your notes |
| `/new-quiz` | Creates a standalone quiz |
| `/new-recap` | Generates condensed summaries + fresh quizzes for an existing course |
| `/course-images` | Finds and inserts relevant diagrams from Wikimedia Commons |

All skills write directly to `~/.tutor/modules/` and content appears immediately when you reload the app.

## Module Format

### Course

```
~/.tutor/modules/courses/{courseId}/
├── config.json
└── sections/
    ├── {sectionId}.md
    ├── {sectionId}.problems.json
    └── {sectionId}.quiz.json
```

### Flashcard Deck

```
~/.tutor/modules/flashcards/{deckId}/
├── config.json
└── cards.json
```

### Quiz

```
~/.tutor/modules/quizzes/{quizId}/
├── config.json
└── questions.json
```

Full schema definitions are in `web/src/lib/types.ts`.

## CLI Reference

```
tutor init                               Create ~/.tutor/ structure
tutor install [--version v1.2.3]         Download the web app
tutor upgrade                            Upgrade to the latest release
tutor start [--port N]                   Serve the web app

tutor module list                        List installed modules
tutor module install <repo> <id>         Install a module
tutor module remove <id>                 Remove a module
tutor module search <query>              Search registered repos

tutor repo add <github-url>              Register a module repo
tutor repo list                          List registered repos
tutor repo remove <alias-or-url>         Unregister a repo
tutor repo update                        Refresh manifest cache
```

## Development

```bash
# Web app (dev mode reads from TUTOR_MODULES_DIR or ~/.tutor/modules/)
cd web && npm install && npm run dev

# CLI
cd cli && go build -o tutor . && ./tutor --help
```

## License

MIT
