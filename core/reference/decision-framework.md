# Decision Framework — @gate

The @gate agent evaluates every incoming request before any other phase runs. It makes two decisions.

## When @gate runs

**Always.** Before ANALYZE, before DESIGN, before anything else. The user's request enters the loop through @gate.

## Decision 1: OpenSpec Level

| Level | Criteria | What happens |
|-------|----------|-------------|
| **full** | 5+ implementation tasks, multi-layer changes, roadmap phase, payments/auth/security, team collaboration | Run `$SDD_TOOL new change <name>`, generate proposal.md + design.md + specs/*.md + tasks.md |
| **light** | 2-4 tasks, 2-3 files, moderate scope | Generate proposal.md + tasks.md only. Skip formal specs. |
| **skip** | Single bug fix, UI tweak, refactor (no behavior change), doc update, hotfix, spike, dependency bump | No spec artifacts. Implement directly. |

### Decision tree

```
How many implementation tasks will this need?
├── 5+ tasks OR multi-layer OR roadmap phase OR payments/auth/security
│   └── full → proposal + design + specs + tasks
├── 2-4 tasks, 2-3 files, moderate scope
│   └── light → proposal + tasks only
└── 1 task OR bug fix OR UI tweak OR refactor OR doc OR hotfix OR spike
    └── skip → no spec
```

### Edge cases

| Scenario | Decision | Reasoning |
|----------|----------|-----------|
| "Fix the login bug" (known cause) | skip | Single fix, no spec needed |
| "Fix the login bug" (unknown cause) | light | May need investigation, document approach |
| "Refactor the auth module" (mechanical) | skip | Behavior unchanged |
| "Refactor the auth module" (architectural) | full | May change patterns, needs design doc |
| "Add a new endpoint" | light | If isolated. full if it touches multiple layers |
| "Add dark mode" | full | Touches every component |
| "Update dependencies" | skip | Routine |
| "Investigate performance issue" | skip | Spike, don't know what you'll find |

## Decision 2: Visual Design Needed

| Answer | Criteria | What happens |
|--------|----------|-------------|
| **yes** | New screens, new components, layout changes, any UI that users will see | Invoke @designer BEFORE Plan |
| **no** | Backend-only, API-only, logic-only, no visual change | Skip DESIGN phase |

### Decision tree

```
Does this request affect what users SEE?
├── New screen / page → yes
├── New component / widget → yes
├── Layout / style changes → yes
├── User-facing form / modal → yes
├── Dashboard / report / chart → yes
├── Backend API / logic only → no
├── Database migration / model → no
├── CLI tool / script → no
├── Config / env changes → no
└── Documentation (unless visual design doc) → no
```

## Output Format

@gate always responds with:

```
## Spec-Gate Assessment

### OpenSpec Decision: full | light | skip
**Why:** [one sentence reasoning]

### Visual Design: yes | no
**Why:** [one sentence reasoning]

### Recommended Path
→ [list of phases that will run]
```

### Example outputs

**Feature request:**
```
## Spec-Gate Assessment
### OpenSpec Decision: full
**Why:** New subscription management system, touches domain + application + infra + API layers, 8+ tasks.

### Visual Design: yes
**Why:** New dashboard screens for subscription list, detail, and plan selection.

### Recommended Path
→ DESIGN → ANALYZE → PLAN → IMPLEMENT → SELF-CRITIQUE → SPEC-REVIEW → QUALITY-REVIEW → CORRECT → INTEGRATE
```

**Bug fix:**
```
## Spec-Gate Assessment
### OpenSpec Decision: skip
**Why:** Null check fix in UserService, single line change, known cause.

### Visual Design: no
**Why:** Backend logic only, no UI impact.

### Recommended Path
→ ANALYZE → IMPLEMENT → SELF-CRITIQUE → QUALITY-REVIEW → INTEGRATE
```

**UI tweak:**
```
## Spec-Gate Assessment
### OpenSpec Decision: skip
**Why:** Single color change in button component, no logic change.

### Visual Design: yes
**Why:** Visual change to button styling affects all user-facing screens.

### Recommended Path
→ DESIGN → IMPLEMENT → SELF-CRITIQUE → QUALITY-REVIEW → INTEGRATE
```
