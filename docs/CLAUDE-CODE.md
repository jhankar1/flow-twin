# Claude Code — Project Settings and Skills

This document covers every Claude Code configuration choice for this project:
what is allowed, why, and how to change it.

Config lives in `.claude/settings.json` at the repo root.
This doc must be updated whenever `.claude/settings.json` changes.

---

## Settings File Location

```
/ (repo root)
└── .claude/
    └── settings.json    ← project-scoped Claude Code config
```

Global user config lives at `~/.claude/settings.json` (not tracked in this repo).
Project settings override global settings for anything in this working directory.

---

## Allowed Bash Commands

The `permissions.allow` list controls which Bash commands Claude can run without
asking for confirmation. Every entry below is intentional.

### Package Manager

| Pattern | Why allowed |
|---|---|
| `Bash(pnpm *)` | Primary package manager — install, dev, build, run scripts |
| `Bash(npm *)` | Fallback for packages that need npm directly |
| `Bash(npx *)` | Run one-off tools (prisma, create-next-app, etc.) |

### TypeScript / Node Runtimes

| Pattern | Why allowed |
|---|---|
| `Bash(tsx *)` | Dev runner for all TypeScript services (workers, backend) |
| `Bash(ts-node *)` | Alternative TS runner for scripts |
| `Bash(node *)` | Run compiled JS output or plain node scripts |

### Database

| Pattern | Why allowed |
|---|---|
| `Bash(npx prisma *)` | Run Prisma CLI: `migrate dev`, `generate`, `studio`, `db push` |
| `Bash(psql *)` | Direct PostgreSQL access for debugging and one-off queries |

### Docker / Infrastructure

| Pattern | Why allowed |
|---|---|
| `Bash(docker compose *)` | Start/stop/inspect infra stack from `docker/` |
| `Bash(docker *)` | General docker: `ps`, `logs`, `exec`, `inspect`, `build` |
| `Bash(tctl *)` | Temporal CLI for workflow inspection and admin |

### Git

| Pattern | Why allowed |
|---|---|
| `Bash(git status)` | Read-only repo state |
| `Bash(git log *)` | Read-only history |
| `Bash(git diff *)` | Read-only diff |
| `Bash(git add *)` | Stage files for commit |
| `Bash(git commit *)` | Create commits |
| `Bash(git push *)` | Push to GitHub (`jhankar1/flow-twin`) |
| `Bash(git pull *)` | Pull upstream changes |
| `Bash(git remote *)` | Inspect and update remote URL |
| `Bash(git mv *)` | Rename/move tracked files |
| `Bash(git rm *)` | Remove tracked files |
| `Bash(git branch *)` | List or create branches |
| `Bash(git checkout *)` | Switch branches or restore files |
| `Bash(git stash *)` | Stash and pop changes |
| `Bash(git ls-remote *)` | Verify remote connectivity |

### File System

| Pattern | Why allowed |
|---|---|
| `Bash(ls *)` / `Bash(ls)` | List directories during exploration |
| `Bash(find *)` | Locate files by name or pattern |
| `Bash(grep *)` | Search file contents |
| `Bash(cat *)` | Print file contents |
| `Bash(echo *)` | Output text, write to files with `>` |
| `Bash(mkdir *)` | Create directories |
| `Bash(cp *)` | Copy files (e.g. `.env.example` → `.env`) |
| `Bash(mv *)` | Move or rename files |
| `Bash(rm *)` | Delete files and directories |
| `Bash(touch *)` | Create empty files (`.gitkeep`, etc.) |
| `Bash(head *)` | Read first N lines of a file |
| `Bash(tail *)` | Read last N lines / follow logs |
| `Bash(sort *)` | Sort output for comparison |
| `Bash(wc *)` | Count lines, words, bytes |

### Network / Process

| Pattern | Why allowed |
|---|---|
| `Bash(curl *)` | Test API endpoints manually |
| `Bash(kill-port *)` | Free a port before restarting a service |
| `Bash(kill *)` | Terminate stuck processes |

---

## What Is NOT Allowed (and Why)

These patterns are intentionally absent:

| Command | Reason not allowed |
|---|---|
| `Bash(rm -rf /)` | Catastrophic — always requires explicit confirmation |
| `Bash(sudo *)` | Never needed inside this project |
| `Bash(chmod *)` | Not applicable on Windows / WSL path |
| `Bash(ssh *)` | No remote server access from Claude in this project |
| `Bash(aws *)` | Not in current stack (Phase 6+ only) |

---

## Available Skills

Skills are slash commands Claude Code exposes in the terminal.
Use them by typing `/skill-name` in the Claude Code prompt.

| Skill | Trigger | What It Does |
|---|---|---|
| `update-config` | `/update-config` | Edit `.claude/settings.json` or `settings.local.json` — use this when adding permissions, hooks, or env vars |
| `init` | `/init` | Generates or refreshes `CLAUDE.md` with codebase documentation |
| `review` | `/review` | Reviews the current pull request — reads diff, checks against architecture |
| `security-review` | `/security-review` | Full security review of pending branch changes |
| `simplify` | `/simplify` | Reviews changed code for reuse, quality, and efficiency — fixes issues found |
| `fewer-permission-prompts` | `/fewer-permission-prompts` | Scans transcripts for repeated Bash calls and adds them to the allow list automatically |
| `loop` | `/loop <interval> <command>` | Runs a command on a repeating interval (e.g. `/loop 5m /review`) |
| `schedule` | `/schedule` | Creates a one-time or recurring scheduled Claude agent |
| `claude-api` | `/claude-api` | Builds, debugs, and optimises Anthropic SDK / Claude API code with prompt caching |
| `keybindings-help` | `/keybindings-help` | Customise Claude Code keyboard shortcuts |

### Most Useful for This Project

```
/update-config     → add a new allowed command without editing JSON manually
/fewer-permission-prompts → auto-detect missing allows after a session
/review            → check a PR against the locked architecture in CLAUDE.md
/security-review   → check auth, JWT handling, Prisma queries before merging
/simplify          → clean up a new worker or route after writing it
```

---

## How to Add a New Allowed Command

**Option 1 — use the skill:**
```
/update-config
> add permission for "Bash(temporal *)"
```

**Option 2 — edit directly:**

1. Open `.claude/settings.json`
2. Add the pattern to the `permissions.allow` array
3. Update this doc under the matching group above

**Option 3 — auto-detect after a session:**
```
/fewer-permission-prompts
```
Claude scans the session transcript and adds any repeatedly-prompted commands.

---

## How to Add a Hook

Hooks run shell commands automatically on Claude Code events (before/after tool use, on stop, etc.).

Example — show a desktop notification when Claude finishes:

```json
{
  "permissions": { "allow": [...] },
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo Claude finished"
          }
        ]
      }
    ]
  }
}
```

Use `/update-config` to add hooks without editing JSON manually.

---

## Environment Variables

To pass env vars into Claude's Bash environment, add an `env` block:

```json
{
  "permissions": { "allow": [...] },
  "env": {
    "DATABASE_URL": "postgresql://elb:elb_secret@localhost:5432/elb_platform",
    "TEMPORAL_ADDRESS": "localhost:7233"
  }
}
```

> Do not add secrets here — `.claude/settings.json` is committed to git.
> Use `settings.local.json` (gitignored) for anything sensitive.

---

## settings.local.json (gitignored)

Create `.claude/settings.local.json` for machine-specific or secret overrides.
It is automatically gitignored by Claude Code and never committed.

```json
{
  "env": {
    "DATABASE_URL": "postgresql://elb:elb_secret@localhost:5432/elb_platform"
  }
}
```

---

## Change Log

| Date       | Change |
|------------|--------|
| 2026-04-22 | Initial settings created — pnpm, docker, git, file system, curl, psql |
| 2026-04-22 | Added grep, echo, head, tail, sort, wc, kill-port, kill, tctl, git branch/checkout/stash |
| 2026-04-22 | config/temporal moved to repo root — settings updated to reflect new layout |
| 2026-04-22 | This doc created in docs/CLAUDE-CODE.md |
