# Model Routing Guide

Which model to use for which task. Print this, stick it on your wall.

## Decision Tree

```
What are you doing?
├── Understanding requirements? → OPUS
├── Designing architecture? → OPUS
├── Writing a plan? → OPUS or SONNET
├── Implementing code?
│   ├── Routine CRUD / boilerplate? → HAIKU
│   ├── Moderate complexity? → SONNET
│   └── Complex algorithm / new pattern? → OPUS (design), SONNET (implement)
├── Self-critiquing your code? → OPUS (effort max)
├── Reviewing someone else's code?
│   ├── Spec compliance? → SONNET
│   └── Code quality? → SONNET
├── Security audit? → OPUS
├── Fixing a bug?
│   ├── Root cause known, fix is obvious? → HAIKU
│   └── Root cause unknown, needs investigation? → SONNET or OPUS
├── Refactoring?
│   ├── Mechanical (rename, extract, move)? → HAIKU
│   └── Architectural (change patterns, restructure)? → OPUS
├── Writing tests? → HAIKU or SONNET
├── Writing docs? → HAIKU
└── Unsure? → SONNET (safe default)
```

## Model Profiles

### Claude Opus 4
- **Strengths:** Deep reasoning, meta-cognition, ambiguity detection, architecture, security
- **Weaknesses:** Expensive, slower, overkill for routine tasks
- **Use when:** Analysis, self-critique, security, architecture, complex debugging
- **Cost:** $$$$
- **Effort:** `high` or `max` for analysis/critique, `medium` for design

### Claude Sonnet 4
- **Strengths:** Best all-rounder, good reasoning + good speed, balanced
- **Weaknesses:** Not as deep as Opus, not as cheap as Haiku
- **Use when:** Planning, code review, moderate implementation, integration
- **Cost:** $$$
- **Effort:** `medium` default, `high` for complex reviews
- **DEFAULT MODEL.** When in doubt, use Sonnet.

### Claude Haiku 3.5
- **Strengths:** Fast, cheap, great for pattern-matching tasks
- **Weaknesses:** Less reasoning depth, can miss subtle issues
- **Use when:** Routine CRUD, mechanical refactoring, test boilerplate, docs, simple bug fixes
- **Cost:** $
- **Effort:** `low` or `medium`

### DeepSeek v4 Pro (OpenCode / OpenRouter)
- **Strengths:** Strong reasoning, good alternative to Opus, open-source friendly
- **Weaknesses:** May not match Opus on very complex meta-cognition
- **Use when:** Analysis, architecture, self-critique (when Opus is unavailable or overloaded)
- **Command:** `opencode run --model openrouter/deepseek/deepseek-v4-pro "..."` or set in OpenCode config

### Kimi (OpenCode / OpenRouter)
- **Strengths:** Good general purpose, long context
- **Weaknesses:** Less proven for deep code reasoning
- **Use when:** General coding tasks, documentation, as Sonnet alternative
- **Command:** `opencode run --model openrouter/moonshotai/kimi "..."` or set in OpenCode config

## Effort Level Guide (Claude Code)

| Effort | When | Cost Impact | Quality Impact |
|--------|------|-------------|----------------|
| `max` | Self-critique, security audit, critical analysis | Highest | Deepest thinking |
| `high` | Requirements analysis, architecture | High | Thorough reasoning |
| `medium` | Planning, code review, complex implementation | Moderate | Good balance |
| `low` | Routine CRUD, tests, docs, simple fixes | Low | Fast, surface-level |

**Rule of thumb:** Use the lowest effort that gets the job done well. Don't use `max` for a CRUD endpoint. Don't use `low` for analyzing requirements.

## Model Switching Commands

### Claude Code (interactive)
```
/model opus       # Switch to Opus
/model sonnet     # Switch to Sonnet
/model haiku      # Switch to Haiku
/effort max       # Maximum reasoning
/effort high      # Deep reasoning
/effort medium    # Balanced
/effort low       # Fast
```

### Claude Code (print mode)
```bash
claude -p "analyze this" --model opus --effort high
claude -p "write CRUD endpoint" --model haiku --effort low
claude -p "review this code" --model sonnet --effort medium
```

### OpenCode
```bash
opencode run "analyze requirements" --model openrouter/anthropic/claude-opus-4 --variant high
opencode run "implement endpoint" --model openrouter/anthropic/claude-haiku-3.5 --variant minimal
opencode run "review code" --model openrouter/anthropic/claude-sonnet-4
```

## Phase-to-Model Mapping (Quick Reference)

| Phase | Primary Model | Alt Model | Effort |
|-------|--------------|-----------|--------|
| 1. ANALYZE | Opus | DeepSeek v4 | max/high |
| 2. PLAN | Opus | Sonnet | medium/high |
| 3. IMPLEMENT | Haiku | Sonnet | low/medium |
| 4. SELF-CRITIQUE | Opus | DeepSeek v4 | max |
| 5. SPEC-REVIEW | Sonnet | — | medium |
| 6. QUALITY-REVIEW | Sonnet | — | medium |
| 7. CORRECT | Haiku | Sonnet | low/medium |
| 8. INTEGRATE | Sonnet | — | medium |

## Cost Awareness

Rough relative costs (per task):
- Haiku + low effort: $0.05-0.20
- Sonnet + medium effort: $0.20-1.00
- Opus + max effort: $1.00-5.00+

**Budget strategy for a feature:**
- 10% on analysis (Opus, max) — get it right upfront
- 15% on planning (Opus/Sonnet) — good plan prevents rework
- 30% on implementation (Haiku mostly) — bulk of the work
- 10% on self-critique (Opus, max) — catch issues early
- 15% on reviews (Sonnet) — external quality gate
- 10% on corrections (Haiku) — small targeted fixes
- 10% on integration (Sonnet) — final verification
