# AI Engineering Loop Rules

These rules are loaded automatically by Claude Code as project rules. They provide the always-on context for the loop engineering workflow.

## Always-On Rules

### Model Selection
- Before starting any task, ask: "What model should I use for this?"
- Analysis, architecture, self-critique, security → Opus (effort high/max)
- Routine CRUD, mechanical refactoring, simple fixes, docs → Haiku (effort low)
- Planning, reviews, moderate implementation, integration → Sonnet (effort medium)
- When uncertain → Sonnet

### Self-Critique (NEVER SKIP)
- After writing ANY non-trivial code, self-critique before passing it on
- Read every line you wrote
- Find at least 2-3 issues (if you find zero, look harder)
- Fix all issues found
- Re-run tests after fixing
- Only then pass to review

### Implementation Discipline
- Follow the plan. Don't improvise.
- TDD: test → fail → implement → pass → commit
- Commit after every task (not after every file, after every TASK)
- If something unexpected happens, STOP and surface it
- No scope creep — implement what's in the plan, nothing more

### Review Discipline
- Spec compliance FIRST, code quality SECOND
- Never review quality until spec is confirmed
- Be specific in feedback: file:line + what's wrong + why + fix suggestion
- Critical issues block progress. Important issues should be fixed. Minor is optional.

### Quality Gates
- Do not pass a gate until conditions are met
- "Close enough" is not a thing
- If you're unsure, the gate is not satisfied

### Communication
- Surface issues immediately. Don't work around them silently.
- If requirements are ambiguous, ASK. Don't guess.
- If a decision has trade-offs, present them. Don't decide unilaterally on important things.
