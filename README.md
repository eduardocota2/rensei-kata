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
rensei.graph.yaml  →  compile  →  agents, slash commands, docs, diagram, RUNNER
```

Because the loop is a graph, you can **validate it** (no infinite loops, no orphan phases), **visualize it**, **run it** (`/rensei` compiles the graph into an execution protocol), **observe it** (live phase tracking with loop bounds), **translate it** to any runtime, and **edit it** visually — none of which is possible with a 3,000-line prompt.

## Installation

**Requirements:** Node.js ≥ 18. No global install needed.

```bash
# in your project root
npx rensei-kata init
```

The runtime is **auto-detected**: a project with `.opencode/` or `opencode.json` compiles for OpenCode, one with `.claude/`/`CLAUDE.md` compiles for Claude Code. `--target` overrides.

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

# 2. open the project in Claude Code (or OpenCode) and run a task end-to-end:
#    /rensei login with Google OAuth      ← the loop runs itself: entry → phases → gates
#    /kata <request>                      ← or dispatch single requests

npx rensei-kata status                    # 3. watch the loop as it advances
npx rensei-kata studio                    # 4. tweak the graph visually
npx rensei-kata build                     # 5. recompile agents after edits
```

In-session commands:

```
/rensei <task>        RUN the loop: the compiled command turns the graph into an
                      execution protocol — phase by phase, gates honored, state
                      recorded. One command, full cycle.
/kata <request>       dispatch to the right agent (ES or EN)
@gate @designer @analyze @plan @implement @self-critique @spec-review @quality @correct @integrate @sentinel    direct invocation
```

`/rensei` is **compiled from your graph**: every `advance:`/`loop:` line comes
from an edge, every condition from its `when:`, every bound from its `max:`.
Edit the graph, rebuild, and the runner changes with it — including agents you
created in the studio.

## The loop

```
gate → [design] → analyze → plan → implement → self-critique → spec-review → quality-review → correct → integrate → done
                        ↑_____________________ correction loop (max 3×) _____________________↑
```

Every phase has exactly four things assigned, all from the graph:

| | |
|---|---|
| **An agent** | **a node IS an agent** — one agent per phase, named by the node (`agents/<node-id>/`) |
| **A model tier** | deep_reasoning · balanced · routine — **per runtime** (Claude, Codex, OpenCode) |
| **An effort level** | deep · standard · fast |
| **A quality gate** | the condition to enter the next phase (`tests pass`, `2-3+ issues found`…) |

The gate agent evaluates every request first: complexity level (OpenSpec), visual-design need, and whether the path can be shortened for trivial work (declarative skip-rules, also in the graph).

### A node IS an agent

There is no agent roster to choose from: adding a node to the graph **creates the agent**. On save/build, `agents/<node-id>/` is scaffolded (definition + prompt), and the compiler wires it into everything — kata's routing, RENSEI.md, the runtime artifacts. Want two self-critiques? Add two nodes with different names; they stay independent.

- **Duplicate** (Ctrl+D) seeds the new agent as a copy of the source — same config and prompt, but **unlinked**: editing either never touches the other.
- The agent's identity is its **name** (the label). The id is its slug, derived and hidden. Two agents cannot share a name — that's how instances differentiate.

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
  gate:    { label: GATE,    model: balanced,       effort: fast }
  design:  { label: DESIGN,  model: deep_reasoning, effort: deep }   # agent "design" is scaffolded automatically
  analyze: { label: ANALYZE, model: deep_reasoning, effort: deep }
  # …
edges:
  - { from: gate,    to: design,  when: "visual == yes" }
  - { from: gate,    to: analyze, when: "visual == no" }
  - { from: quality, to: correct, when: "issues found", max: "$ITERATIONS.correction_loop" }
```

Node = agent (id = the scaffolded `agents/<id>/`). Edge = transition (gate condition, loop bound). That's the whole model.

## The agents

Every loop phase is its own agent (one node = one agent). `@sentinel` is on-demand, outside the loop.

| Agent | Phase | Tier (claude) |
|-------|-------|---------------|
| **@gate** | Evaluates every request first: OpenSpec level + visual design need | balanced |
| **@designer** | Visual design via Stitch MCP, scored against DESIGN.md | deep_reasoning |
| **@analyze** | Requirements analysis — ambiguity resolved before any plan | deep_reasoning |
| **@plan** | Bite-sized TDD tasks with exact paths | balanced |
| **@implement** | Executes the plan with TDD, one commit per task | routine |
| **@self-critique** | The author reviews its OWN work — must find 2-3+ issues | deep_reasoning |
| **@spec-review** | Stage 1 — matches spec EXACTLY; FAIL stops the line | balanced |
| **@quality** | Stage 2 — correctness, style, security, simplicity | balanced |
| **@correct** | Fixes review findings, one commit per fix | routine |
| **@integrate** | Full suite green, git clean, PR ready | balanced |
| **@sentinel** | Security audit — on demand, any context | deep_reasoning |

### Runtimes — the same graph, the right models

Models and efforts live **per runtime** in `rensei.config.yaml`:

```yaml
RUNTIME: claude            # what this environment compiles for
MODELS:
  claude:  { deep_reasoning: opus-4.5, reasoning: opus-4.1, balanced: sonnet-4.5, routine: haiku-4.5, micro: haiku-4 }
  codex:   { deep_reasoning: gpt-5.2-codex, reasoning: gpt-5.1-codex, balanced: gpt-5-codex, routine: gpt-5-mini, micro: gpt-5-nano }
  opencode:{ deep_reasoning: glm-5.3, reasoning: glm-4.7, balanced: glm-4.6, routine: glm-4.5-air, micro: glm-4.5-flash }
```

The studio's **runtime selector** filters the model/effort dropdowns to the active runtime and persists the choice on save; `build --target opencode` (or `codex`) compiles with that runtime's models. A flat `MODELS: {tier: model}` still works — it applies to every runtime.

## CLI reference

| Command | Purpose |
|---------|---------|
| `init [dir] [--global] [--force] [--target claude\|opencode\|all]` | Seed `.rensei/` and compile |
| `build [--dir <path>] [--target …]` | Recompile all artifacts from `.rensei/` |
| `validate` `[--json]` | Graph health + artifact drift (CI-ready JSON) |
| `doctor` `[--json]` | Environment: git repo, runtime CLIs, SDD tool, entry-point blocks — `init` runs it silently as advice |
| `graph [--dir <path>]` | Regenerate `graph.html` only |
| `status [--start\|--set\|--note\|--reset]` | Where the loop is right now |
| `route "request" [--list]` | Deterministic kata routing preview — zero tokens |
| `diff [--dir <path>]` | Your `.rensei/` vs the packaged core |
| `update [--dir <path>] [--force]` | Pull core updates — your edits win |
| `studio [--dir <path>] [--port N]` | Bidirectional visual ⇄ YAML graph editor |

### `status` — observe the loop

The runner (`/rensei`) and every compiled agent keep `.rensei/state.json`
current as the loop advances, so the tool observes what it preaches. The loop
**auto-starts** the first time a phase is recorded — no explicit init needed:

```bash
$ npx rensei-kata status
task:    login with Google OAuth
phase:   ANALYZE  (@analyze, claude-fable-5, effort max)
loops:   quality>correct ×2

next:
  → plan  when: all ambiguities resolved
  → correct  when: issues found — 2/3 used

recent history:
  2026-08-14 10:12  gate → analyze — visual == no
  2026-08-14 10:31  analyze → plan
```

Bounds are visible live: a bounded transition shows `2/3 used`, and hitting the
max surfaces `⚠ BOUND REACHED — surface it, do not loop again`. Subcommands:
`--start "task"` names the loop · `--set <phase>` records a phase entry (agents
do this automatically) · `--note "…"` logs gate decisions · `--reset` clears.

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

The studio is the **workflow configurator**: what you edit here is what rensei and kata become.

- **Left inspector, always available** (hide it with the toggle) — the canvas fills the whole container underneath.
- **+ agent** adds a node — a new agent, scaffolded and wired into rensei + kata on save. **Ctrl+D** duplicates one as an unlinked copy.
- The agent's **name** is its identity; model/effort dropdowns adapt to the selected **runtime** (claude · codex · opencode).
- **As YAML** — a synced pane; a **line-diff preview** shows exactly what will change before it hits the canvas.
- Every save **validates first**, writes `rensei.graph.yaml`, scaffolds new agents, and **recompiles everything** — the change reaches the agents immediately. Validation errors are **anchored to the offending node/edge** on the canvas.
- **Ctrl+K** command palette, **minimap**, **kata** routing simulator, **SVG/PNG** export.

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
Yes — and you don't need to leave the studio. **+ agent** adds a node; on save the agent is scaffolded (`agents/<id>/` with definition and prompt), wired into kata's routing and the compiled artifacts. You can also add the node in YAML and run `build` — the scaffolder does the same. Customize the prompt afterwards in `agents/<id>/prompt.md`; the next build propagates it.

**What happens if I edit a generated file directly?**
`validate`/`doctor` detects it via the build manifest and tells you to move the change into `.rensei/` — before the next build overwrites it.

**Does it lock me into Claude Code?**
No. The graph compiles to Claude Code and OpenCode today; `prompts/` templates are tool-agnostic (usable in CI). New targets are adapters, not rewrites.

**How do I customize models/effort/iteration limits/behavior?**
`.rensei/rensei.config.yaml` — tiers (per runtime), effort levels, iteration bounds, skills registry, and behavior knobs like `BEHAVIOR.ask_before_commit: false` (agents commit without asking per task). `build` propagates changes everywhere.

## License

MIT
