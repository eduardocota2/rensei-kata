# OpenCode + Kimi K3 — AI Engineering Loop

## Quick Start

```bash
# Linux / Mac / Git Bash (Windows)
source ~/rensei-kata/examples/opencode-kimi/loop.sh

# Windows PowerShell
. ~/rensei-kata/examples/opencode-kimi/loop.ps1  # dot-source for functions
```

Then from any project directory:

```bash
loop gate "Agregar dashboard de analíticas"
loop-design "Diseñar pantalla de analytics"
loop-review "Revisar src/auth/login.ts"
loop-full "Implementar feature de suscripciones"
```

## Auto-Detection

The wrapper automatically finds and attaches these files from your project:

| Source | What it looks for |
|--------|-------------------|
| Root | `DESIGN.md`, `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `README.md`, `CONTRIBUTING.md` |
| `docs/` | `DESIGN.md` |
| `.claude/` | `CLAUDE.md`, `settings.json`, `agents/*.md`, `rules/*.md`, `skills/*.md` |
| `.codex/` | `config.yaml`, `instructions.md`, `skills/*.md`, `rules/*.md` |
| `.opencode/` | `config.yaml` |
| `openspec/` | `project.md` |
| `.github/` | `copilot-instructions.md` |

You never need to pass `-f` manually. The wrapper handles it.

## Windows

| Method | Works? | Setup |
|--------|--------|-------|
| **Git Bash** (included with Git for Windows) | ✅ Yes | Use `loop.sh`. Add `source` to `~/.bash_profile` |
| **WSL** (Windows Subsystem for Linux) | ✅ Yes | Full Linux environment. Use `loop.sh` normally |
| **PowerShell** | ✅ Yes | Use `loop.ps1`. Dot-source it in your `$PROFILE` |
| **cmd.exe** | ❌ No | Use one of the above |

PowerShell profile setup:

```powershell
# Edit your profile
notepad $PROFILE

# Add this line:
. ~/rensei-kata/examples/opencode-kimi/loop.ps1

# If execution policy blocks it (first time only):
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Model Mapping

| Purpose | Model | Variant |
|---------|-------|---------|
| Deep reasoning (analyze, self-critique, security, design) | Kimi K3 | `high` |
| Balanced (planning, reviews, integration) | Kimi K3 | `high` |
| Routine (implementation, fixes) | Kimi K3 | `minimal` |

Override model via env var: `export AI_LOOP_MODEL=openrouter/moonshotai/kimi-k2`

## Aliases

```
loop-gate       → loop gate
loop-architect  → loop architect
loop-implement  → loop builder
loop-review     → loop reviewer
loop-audit      → loop sentinel
loop-design     → loop designer
loop-full       → loop orchestrator
```

## Files

```
opencode-kimi/
├── README.md
├── loop.sh              ← Bash wrapper (Linux/Mac/Git Bash)
├── loop.ps1             ← PowerShell wrapper (Windows)
├── run.sh               ← Simple launcher (manual -f required)
└── sessions/
    ├── gate.opencode
    ├── architect.opencode
    ├── builder.opencode
    ├── reviewer.opencode
    ├── sentinel.opencode
    ├── designer.opencode
    └── orchestrator.opencode
```
