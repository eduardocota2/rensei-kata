# rensei-kata

**rensei (錬成) + kata (型)** — a graph-driven AI engineering loop for Claude Code and OpenCode.

> **rensei** is the methodology: refinement through repetition — forge, temper, correct, repeat until the result is excellent.
> **kata** is the dispatcher: it reads your request (Spanish or English) and routes it to the right agent — you never need to memorize the agent roster.

One **single source of truth** — a YAML graph — compiles into agents, slash commands, methodology docs and a live diagram. Edit the graph, run `build`, and every agent reflects the change immediately.

```bash
npx rensei-kata init        # install the loop into your project
```

---

## Table of contents

- [Why](#why)
- [Installation](#installation)
- [Quickstart](#quickstart)
- [The loop](#the-loop)
- [How it works](#how-it-works)
- [The agents](#the-agents)
- [CLI reference](#cli-reference)
  - [`status` — observe the loop](#status--observe-the-loop)
  - [`route` — test routing for free](#route--test-routing-for-free)
  - [`diff` / `update` — stay current](#diff--update--stay-current)
  - [`validate` — graph health + drift](#validate--graph-health--drift)
  - [`studio` — visual ⇄ YAML editor](#studio--visual--yaml-editor)
- [Targets: Claude Code, OpenCode, or both](#targets-claude-code-opencode-or-both)
- [Skills — optional and configurable](#skills--optional-and-configurable)
- [Guarantees the validator enforces](#guarantees-the-validator-enforces)
- [Repo layout](#repo-layout)
- [FAQ](#faq)
- [License](#license)

---

## Why

AI coding agents are powerful but undisciplined: they skip planning, self-congratulate instead of self-critique, and drift from the spec. Frameworks that fix this usually do it in **prose** — long prompts that can't be checked, visualized or executed.

rensei-kata treats the workflow as **data**:

```
rensei.graph.yaml  →  compile  →  agents, slash commands, docs, diagram
```

Because the loop is a graph, you can **validate it** (no infinite loops, no orphan phases), **visualize it**, **observe it** (live phase tracking), **translate it** to any runtime, and **edit it** visually — none of which is possible with a 3,000-line prompt.

## Installation

**Requirements:** Node.js ≥ 18. No global install needed.

```bash
# in your project root
npx rensei-kata init
```

That's it. `init` seeds a `.rensei/` directory into the project, validates the graph, and compiles the first batch of artifacts (`.claude/agents/`, `.claude/commands/`, `RENSEI.md`, `graph.html`).

Useful variants:

```bash
npx rensei-kata init --target opencode    # compile for OpenCode instead of Claude Code
npx rensei-kata init --target all         # both runtimes from the same graph
npx rensei-kata init --global             # install into ~ (all your projects)
npx rensei-kata init --force              # overwrite existing .rensei/ files
```

> After `init`, `.rensei/` is **yours**. The packaged core is only the default starting point.

## Quickstart

```bash
npx rensei-kata init                      # 1. install

# 2. open the project in Claude Code (or OpenCode) and try:
#    /kata evalúa este requerimiento      ← kata routes to the right agent
#    /rensei                              ← loads the full methodology

npx rensei-kata status                    # 3. watch the loop as agents advance
npx rensei-kata studio                    # 4. tweak the graph visually
npx rensei-kata build                     # 5. recompile agents after edits
```

In-session commands:

```
/kata <request>       dispatch to the right agent (ES or EN)
/rensei               load the full methodology into the session
@gate @architect @builder @reviewer @sentinel @designer    direct invocation
```

## The loop

```
gate → [design] → analyze → plan → implement → self-critique → spec-review → quality-review → correct → integrate → done
                        ↑_____________________ correction loop (max 3×) _____________________↑
```

Every phase has exactly four things assigned, all from the graph:

| | |
|---|---|
| **An agent** | who does the work (`@builder`, `@architect`…) |
| **A model tier** | deep_reasoning · balanced · routine (mapped to real models in config) |
| **An effort level** | deep · standard · fast |
| **A quality gate** | the condition to enter the next phase (`tests pass`, `2-3+ issues found`…) |

The gate agent evaluates every request first: complexity level (OpenSpec), visual-design need, and whether the path can be shortened for trivial work (declarative skip-rules, also in the graph).

## How it works

`.rensei/rensei.graph.yaml` is the **single source of truth**. Everything else is generated:

```
.rensei/
├── rensei.graph.yaml      ← EDIT THIS: nodes, edges, gates, iteration bounds
├── rensei.config.yaml     ← model tiers, effort levels, iteration limits, skills registry
├── agents/<name>/         ← agent.yaml (model, tools, triggers ES/EN) + prompt.md
├── fragments/             ← shared protocols (self-critique, communication)
├── rules/                 ← always-on engineering rules
├── reference/             ← decision framework, model routing guide
├── prompts/               ← tool-agnostic prompt templates (any runtime, CI included)
├── RENSEI.md              ← GENERATED methodology doc (imported by CLAUDE.md / AGENTS.md)
├── graph.html             ← GENERATED loop diagram (SVG/PNG export built in)
├── build-manifest.json    ← GENERATED hashes — powers drift detection
└── state.json             ← live loop state — powers `status`
```

Edit anything under `.rensei/` (YAML by hand, or visually in the studio), then:

```bash
npx rensei-kata build       # recompile agents, commands, RENSEI.md, graph.html
```

Invalid graphs **never touch disk** — the build refuses to run until validation passes.

### The graph, in one glance

```yaml
nodes:
  gate:    { agent: gate,      model: balanced,       effort: fast }
  design:  { agent: designer,  model: deep_reasoning, effort: deep, when: "visual == yes" }
  analyze: { agent: architect, model: deep_reasoning, effort: deep }
  # …
edges:
  - { from: gate,    to: design,  when: "visual == yes" }
  - { from: gate,    to: analyze, when: "visual == no" }
  - { from: quality, to: correct, when: "issues found", max: "$ITERATIONS.correction_loop" }
```

Node = phase (agent + model + effort). Edge = transition (gate condition, loop bound). That's the whole model.

## The agents

| Agent | Role | Loop phases | Default tier |
|-------|------|-------------|--------------|
| **@gate** | Evaluates every request first: OpenSpec level + visual design need | GATE | balanced · fast |
| **@architect** | Understands requirements, plans, integrates. Never writes code | ANALYZE, PLAN, INTEGRATE | deep_reasoning |
| **@builder** | Implements with TDD, self-critiques before passing work on, fixes findings | IMPLEMENT, SELF-CRITIQUE, CORRECT | routine |
| **@reviewer** | Two-stage review: spec compliance, then code quality | SPEC-REVIEW, QUALITY-REVIEW | balanced |
| **@sentinel** | Security audit — on demand, any context | — | deep_reasoning |
| **@designer** | Visual design via Stitch MCP, scored against DESIGN.md | DESIGN | deep_reasoning |

The same agent can run different phases at different tiers — the graph decides per phase, not per agent.

## CLI reference

| Command | Purpose |
|---------|---------|
| `init [dir] [--global] [--force] [--target claude\|opencode\|all]` | Seed `.rensei/` and compile |
| `build [--dir <path>] [--target …]` | Recompile all artifacts from `.rensei/` |
| `validate` / `doctor` `[--json]` | Graph health + artifact drift (CI-ready JSON) |
| `graph [--dir <path>]` | Regenerate `graph.html` only |
| `status [--start\|--set\|--note\|--reset]` | Where the loop is right now |
| `route "request" [--list]` | Deterministic kata routing preview — zero tokens |
| `diff [--dir <path>]` | Your `.rensei/` vs the packaged core |
| `update [--dir <path>] [--force]` | Pull core updates — your edits win |
| `studio [--dir <path>] [--port N]` | Bidirectional visual ⇄ YAML graph editor |

### `status` — observe the loop

The compiled agents keep `.rensei/state.json` current as they run, so the tool can observe what it preaches:

```bash
$ npx rensei-kata status
task:    login feature
phase:   ANALYZE  (@architect, opus, effort max)
loops:   quality>correct ×2

next transitions:
  → plan  when: all ambiguities resolved

recent history:
  2026-08-14 10:12  gate → analyze — visual == no
  2026-08-14 10:31  analyze → plan
```

Subcommands: `--start "task"` starts a loop · `--set <phase>` records a phase entry (agents do this automatically) · `--note "…"` logs gate decisions · `--reset` clears.

### `route` — test routing for free

See exactly where kata would send a request, and why — no session, no tokens:

```bash
$ npx rensei-kata route "corrige este bug en el login"
✓ → @builder  (score 21)
    matched (es): "corrige" ×1 — @builder
    matched (es): "bug en" ×1 — @builder

$ npx rensei-kata route --list     # full ES/EN trigger vocabulary per agent
```

The studio has the same simulator behind the **kata** button.

### `diff` / `update` — stay current

```bash
npx rensei-kata diff       # .rensei/ vs packaged core: changed / missing / local-only
npx rensei-kata update     # pull core updates — YOUR EDITS WIN (--force overwrites)
```

### `validate` — graph health + drift

Every build records a sha256 of each generated artifact (`.rensei/build-manifest.json`). `validate` compares and flags hand-edited compiled files **before** the next build silently destroys them:

```
⚠ generated file was hand-edited since the last build: .claude/agents/builder.md
  — move the change into .rensei/ (agents/<n>/prompt.md, fragments/, graph)
```

`validate --json` emits machine-readable output — errors carry `node`/`edge` anchors and concrete fix suggestions — ready for CI pipelines.

### `studio` — visual ⇄ YAML editor

```bash
npx rensei-kata studio        # → http://localhost:4789
```

A local editor where the graph can be modified **both ways**:

- **Visually** — click nodes/edges to edit agent, model tier, effort, gate conditions and loop bounds; drag ports to connect; add/remove phases; pan & zoom; **minimap** for large graphs; **Ctrl+K** command palette.
- **As YAML** — a synced pane; paste or hand-edit the graph. A **line-diff preview** shows exactly what will change before it hits the canvas.

Every save **validates first**, writes `rensei.graph.yaml`, and **recompiles everything** — the change reaches the agents immediately. Validation errors are **anchored to the offending node/edge** on the canvas (red border + tooltip; the error toast jumps to it on click).

Extras: the **kata** button opens the routing simulator; **SVG/PNG** buttons export the current graph for READMEs and PRs.

## Targets: Claude Code, OpenCode, or both

One graph, any runtime:

```bash
npx rensei-kata init --target opencode   # .opencode/agent/, command/, rule/ + AGENTS.md block
npx rensei-kata build --target all       # .claude/ + .opencode/ from the same source
```

| Target | Artifacts | Entry point |
|--------|-----------|-------------|
| `claude` (default) | `.claude/agents/`, `.claude/commands/`, `.claude/rules/` | `CLAUDE.md` managed block |
| `opencode` | `.opencode/agent/`, `.opencode/command/`, `.opencode/rule/` | `AGENTS.md` managed block |
| `all` | both | both |

## Skills — optional and configurable

Skills are data, not prose hardcoded in prompts:

- **Registry** — `rensei.config.yaml → SKILLS:` maps each skill to its purpose (`impeccable`, `dataviz`, `design-md`…).
- **Per agent** — `agents/<name>/agent.yaml → skills:` declares what the agent can work with.
- **Per phase** — any graph node can override with `skills:` for that phase only. Editable in the studio (node inspector → skills checkboxes).

Agents are compiled with a Skills table (phase · skill · purpose) and load each one *only when the task calls for it*. The validator warns when a skill isn't in the registry.

## Guarantees the validator enforces

- **No unbounded cycles** — every loop edge needs `max:`
- **Every node reachable** from the entry point; **no dead ends**
- **Model/effort tiers** must exist in `rensei.config.yaml`
- **No duplicate edges**, warning on parallel edges (merge conditions or remove)
- **No trigger collisions** across agents (warns on kata routing ambiguity)
- **No silent overwrites** — hand-edited generated files are flagged before the next build

## Repo layout

```
core/                  ← the framework source (packaged by npm; seeds .rensei/)
src/
├── cli.js             ← command parsing
├── bin/               ← CLI entry point
└── lib/
    ├── load.js        ← .rensei/ loader (graph, config, agents, fragments…)
    ├── validate.js    ← graph validator (Tarjan SCC, reachability, triggers)
    ├── compile.js     ← graph → agents/commands/docs + build manifest
    ├── route.js       ← deterministic kata routing matcher
    ├── state.js       ← loop state (.rensei/state.json)
    ├── diff.js        ← core vs project diff/update
    ├── diagram.js     ← static graph.html generator
    ├── graph-render.js← shared layout + SVG renderer (Node + browser)
    └── studio-*.js    ← local visual editor (server + page)
examples/              ← opencode / opencode-kimi prototypes (headless runner preview)
PRODUCT_ANALYSIS.md    ← product vision and roadmap
DESIGN.md              ← visual design system (studio + diagram)
```

## FAQ

**Do I need to know the agents to use it?**
No — that's kata's job. `/kata <anything>` routes to the right agent in Spanish or English. `npx rensei-kata route "…"` shows the decision before you spend tokens.

**Can I add my own agent?**
Yes — create `.rensei/agents/<name>/agent.yaml` (+ `prompt.md`), add a node/edges for it (studio or YAML), run `build`. The validator flags routing collisions and overlaps before they reach production.

**What happens if I edit a generated file directly?**
`validate`/`doctor` detects it via the build manifest and tells you to move the change into `.rensei/` — before the next build overwrites it.

**Does it lock me into Claude Code?**
No. The graph compiles to Claude Code and OpenCode today; `prompts/` templates are tool-agnostic (usable in CI). New targets are adapters, not rewrites.

**How do I customize models/effort/iteration limits?**
`.rensei/rensei.config.yaml` — tiers, effort levels, iteration bounds, skills registry. `build` propagates changes everywhere.

## License

MIT
