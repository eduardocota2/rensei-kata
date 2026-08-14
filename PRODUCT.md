# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individual open-source developers who use Claude Code or OpenCode and want a structured, multi-agent engineering methodology in their projects. They discover the package on npm, install it with `npx rensei-kata init`, and expect to be productive without learning an agent roster — kata routes their request (Spanish or English) to the right agent. The README and npm listing are written for this public audience; the user confirmed this audience leads product and design decisions.

## Product Purpose

rensei-kata installs a graph-driven AI engineering loop into any project. `.rensei/rensei.graph.yaml` is the single source of truth — nodes (phases), edges (transitions), gates (conditions), iteration bounds — and a compiler materializes it into Claude Code agents, slash commands, RENSEI.md, and a live HTML diagram. Edit the data, run `build`, and every generated artifact reflects the change.

- **rensei (錬成)** is the methodology: every phase has an agent, a model tier, an effort level, and a quality gate.
- **kata (型)** is the dispatcher: it reads the request and routes to the right agent.

Success means: a developer edits the graph (by hand or in the studio), recompiles, and the agents in their project immediately reflect the change — with invalid graphs (unbounded cycles, orphans, dead ends, tier typos, trigger collisions) never reaching disk.

## Positioning

The graph and agents are data; the markdown agents, commands, and docs are build artifacts. Neighboring products ship ad-hoc collections of hand-edited agent markdown that drift out of sync; rensei-kata makes the loop itself validatable (no unbounded cycles, every node reachable), visualizable (generated diagram), translatable to multiple runtimes, and — on the roadmap — evaluable and self-improving via telemetry, an `@evaluator` meta-agent, and bench A/B testing, always with human approval and versioned diffs.

## Operating Context

Used inside real software projects via the terminal: `npx rensei-kata init | build | validate | graph | studio`. The two confirmed first-class product surfaces are the **Studio editor** (localhost bidirectional visual ⇄ YAML graph editor) and the **generated graph.html diagram**. In the host project, users interact through Claude Code: `/kata`, `/rensei`, and the six agents (@gate, @architect, @builder, @reviewer, @sentinel, @designer). Runs cross-platform on Windows and Unix (Node ≥ 18; the Node CLI replaced bash scripts precisely for this). Current version: 0.3.0, MIT licensed, published on npm as `rensei-kata` (the bare name `rensei` was taken).

## Capabilities and Constraints

Confirmed functionality: init (seed `.rensei/`, per-project or `--global`), build (compile all artifacts), validate/doctor (graph health), graph (diagram only), studio (visual ⇄ YAML editing; every save validates first and recompiles). The validator enforces: no unbounded cycles, no dead ends, reachable nodes, tiers must exist in config, no duplicate kata triggers.

Durable constraints from PRODUCT_ANALYSIS.md (§5, §9): the compiler stays deliberately dumb (templates + YAML); generated artifacts stay human-readable markdown; agent inflation is governed by a formal admission protocol (singularity, routing, economy, shadow-mode trial) and pruning; self-modification never applies silently — proposals are diffs with human approval, rollback, and bench evidence.

Language: **English is primary** for all user-facing surfaces (studio UI, diagram, generated docs, CLI). ES/EN trigger parity remains a permanent capability of kata routing.

Undecided (recorded, not invented): public docs/landing site — not a current surface; telemetry/@evaluator/bench — roadmap phases 3–4, designed but not built.

## Brand Commitments

Name: **rensei-kata** — rensei (錬成, transmutation/refinement) + kata (型, form/pattern). The paired Japanese terms are the identity: methodology and dispatcher, loop and form. Keep the kanji gloss in brand moments. MIT license. Voice in existing copy is direct, technical, and confident ("the graph is the single source of truth").

Visual direction (standing preference, chosen 2026-08-12 via `/impeccable` direction roll, seed 08d19a9d): **the category standard at full fidelity** — the Linear + VS Code + Raycast craft bar, executed without irony and without smuggled quirk. Dual light/dark themes with explicit `data-theme` override are mandatory on every surface. Brand lives in precise details (the 錬成 kanji accent, the authored graph language), never in decoration over data.

## Evidence on Hand

- `README.md` — public face; loop diagram, command table, agent roster, guarantees.
- `PRODUCT_ANALYSIS.md` (Spanish, 2026-08-12) — product vision, admission protocol, self-improvement design, roadmap (phases 0–4). Authoritative for direction; user-facing copy must not quote it verbatim in Spanish.
- `core/` — the packaged framework: graph, config, 6 agents, fragments, prompts, reference docs, rules.
- `src/` — working CLI, compiler, validator, diagram generator, studio server/page.
- `examples/` — opencode / opencode-kimi headless-runner prototypes.

No testimonials, users, benchmarks, or download stats exist yet — future work must not fabricate them.

## Product Principles

1. **The graph is the only source of truth.** Everything else is compiled; never design a flow that edits generated artifacts directly.
2. **Invalid states never reach disk.** Validation gates every write — in the CLI, in the studio, in both editor directions.
3. **Data over prose.** The loop as YAML is what makes it validatable, visualizable, and improvable; surfaces should expose the data, not narrate it.
4. **Deliberately dumb machinery.** Templates + YAML, readable output, zero heavy dependencies (one dep: `yaml`) — trust comes from being inspectable.
5. **No silent self-modification.** Every improvement is a versioned diff with human approval; power is never applied invisibly.
