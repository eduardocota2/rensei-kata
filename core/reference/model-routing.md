# Model Routing Guide

Which tier to use for which task — and what each tier maps to on your runtime.
The tier names live in `rensei.config.yaml → MODELS`; the concrete models are
per-runtime and swappable as new versions ship.

## Decision Tree

```
What are you doing?
├── Understanding requirements?        → deep_reasoning
├── Designing architecture?            → deep_reasoning
├── Visual design (screens, UI)?       → deep_reasoning
├── Writing a plan?                    → reasoning or balanced
├── Implementing code?
│   ├── Routine CRUD / boilerplate?    → routine
│   ├── Moderate complexity?           → balanced
│   └── Complex algorithm / new pattern? → deep_reasoning (design), balanced (implement)
├── Self-critiquing your own work?     → deep_reasoning (effort deep)
├── Reviewing someone else's code?
│   ├── Spec compliance?               → balanced
│   └── Code quality?                  → balanced
├── Security audit?                    → deep_reasoning
├── Fixing a bug?
│   ├── Root cause known, fix obvious? → routine
│   └── Root cause unknown?            → balanced or deep_reasoning
├── Refactoring?
│   ├── Mechanical (rename, extract)?  → routine
│   └── Architectural (patterns)?      → deep_reasoning
├── Writing tests?                     → routine or balanced
├── Writing docs?                      → routine
└── Unsure?                            → balanced (safe default)
```

## Tier → model, per runtime

The same graph compiles anywhere; only the model names change:

| Tier | Purpose | Claude | Codex | OpenCode |
|------|---------|--------|-------|----------|
| **deep_reasoning** | hardest reasoning: architecture, analysis, self-critique, security, design | claude-fable-5 | gpt-5.6 | kimi-k3 |
| **reasoning** | strong reasoning, second opinion | claude-opus-5 | gpt-5.6-terra | deepseek-v4-pro |
| **balanced** | everyday default: plans, reviews, integration | claude-sonnet-5 | gpt-5.1-codex | glm-4.6 |
| **routine** | implementation, fixes, CRUD, docs | claude-haiku-4-5 | gpt-5.6-luna | kimi-k2.7-code-highspeed |
| **micro** | cheapest: formatting, trivial edits, summaries | claude-haiku-4-5 | gpt-5-nano | deepseek-v4-flash |

Cost intuition across every runtime: deep_reasoning ≈ 5-25× routine per token.
The loop's economics come from this ladder — @implement on routine while
@self-critique runs deep_reasoning is the whole point.

## Tier Profiles

### deep_reasoning
- **Use when:** analysis, architecture, self-critique, security, visual design, anything ambiguous
- **Effort:** `deep` (max) for critique/analysis; `standard` when it's also executing
- **Don't use for:** anything mechanical — it's 5-25× the cost of routine for no quality gain

### reasoning
- **Use when:** you want a second strong model in the loop (e.g. a review pass that shouldn't share the author's tier), or heavy context synthesis
- **Effort:** `standard`

### balanced
- **DEFAULT.** When in doubt, balanced.
- **Use when:** planning, two-stage reviews, integration, moderate implementation
- **Effort:** `standard`; `fast` for the lightweight phases (gate)

### routine
- **Use when:** implementing from a complete plan, mechanical fixes, test boilerplate, docs
- **Effort:** `fast`
- **Watch:** needs exact paths and exact tasks — give it a plan, not a problem

### micro
- **Use when:** summaries, formatting, trivial one-line edits
- **Effort:** `minimal`

## Phase defaults (as shipped in the graph)

| Phase | Tier | Effort | Why |
|-------|------|--------|-----|
| gate | balanced | fast | triage is cheap; only the decision matters |
| design | deep_reasoning | deep | visual quality + scorecard judgment |
| analyze | deep_reasoning | deep | ambiguity detection IS the phase |
| plan | balanced | standard | structure over depth once analysis is done |
| implement | routine | fast | executes a complete plan task by task |
| self-critique | deep_reasoning | deep | the author must out-think its own routine work |
| spec-review | balanced | standard | compliance is checklist-shaped |
| quality | balanced | standard | taste + speed balance |
| correct | routine | fast | findings are already specified |
| integrate | balanced | standard | verification, not creation |

**The counter-intuitive rule:** the phase that WRITES the code is the cheap
tier; the phases that JUDGE the code are the expensive ones. That inversion —
cheap hands, expensive eyes — is what makes the loop both better and cheaper
than a single big model doing everything.
