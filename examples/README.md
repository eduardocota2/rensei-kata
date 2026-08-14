# Examples

Prototypes that preview where rensei-kata is heading. Not part of the npm package's install path.

## `opencode/`

Manual recipes for running the loop phases with OpenCode (model selection per phase, session management). Superseded once the OpenCode target lands in the compiler (roadmap phase 4).

## `opencode-kimi/`

A working **headless runner prototype**: `loop.sh` / `loop.ps1` walk the phases invoking `opencode run` with per-phase models (Kimi/DeepSeek via OpenRouter), plus prebuilt session files per agent. This is the preview of a future `rensei run "feature"` command that walks `rensei.graph.yaml` automatically.

Agent names here already use the canonical roster: `gate`, `architect`, `builder`, `reviewer`, `sentinel`, `designer`, `orchestrator`.
