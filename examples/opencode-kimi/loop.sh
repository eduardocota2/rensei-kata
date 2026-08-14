#!/bin/bash
# loop.sh — Smart wrapper for AI Engineering Loop with OpenCode + Kimi K3
# Usage: loop <agent> "<prompt>"
#
# Auto-detects project context from current directory.
# Windows: works in Git Bash, WSL, or MSYS2. NOT in cmd.exe or PowerShell.
#
# Install: add to ~/.bashrc (Linux/Mac) or ~/.bash_profile (Git Bash on Windows)
#   echo 'source ~/rensei-kata/examples/opencode-kimi/loop.sh' >> ~/.bashrc

set -e

AGENT="${1:?Usage: loop <agent> \"<prompt>\"}"
PROMPT="${2:?Missing prompt}"
LOOP_DIR="${AI_LOOP_DIR:-$HOME/rensei-kata/examples/opencode-kimi}"
MODEL="${AI_LOOP_MODEL:-openrouter/moonshotai/kimi-k3}"
PROJECT_DIR="$(pwd)"

# ── Determine variant per agent ──
case "$AGENT" in
  gate|architect|reviewer|sentinel|designer|orchestrator)
    VARIANT="high" ;;
  builder)
    VARIANT="minimal" ;;
  *)
    echo "❌ Unknown agent: $AGENT"
    echo "Valid: gate, architect, builder, reviewer, sentinel, designer, orchestrator"
    return 1 2>/dev/null || exit 1 ;;
esac

SESSION_FILE="$LOOP_DIR/sessions/$AGENT.opencode"
[ -f "$SESSION_FILE" ] || { echo "❌ Session not found: $SESSION_FILE"; return 1 2>/dev/null || exit 1; }

# ── Auto-detect project context files ──
CONTEXT_FILES=()

# Helper: add file if it exists
add() { [ -f "$1" ] && CONTEXT_FILES+=("$1"); }

# Helper: add all .md files in a directory (recursive, max 1 level)
add_dir() {
  if [ -d "$1" ]; then
    for f in "$1"/*.md "$1"/*/*.md; do
      [ -f "$f" ] && CONTEXT_FILES+=("$f")
    done
  fi
}

# ── Design tokens ──
add "$PROJECT_DIR/DESIGN.md"
add "$PROJECT_DIR/design.md"
add "$PROJECT_DIR/docs/DESIGN.md"
add "$PROJECT_DIR/.design/DESIGN.md"

# ── Project conventions (root level) ──
add "$PROJECT_DIR/AGENTS.md"
add "$PROJECT_DIR/agents.md"
add "$PROJECT_DIR/CLAUDE.md"
add "$PROJECT_DIR/.cursorrules"
add "$PROJECT_DIR/.cursor/rules"      # Cursor rules directory
add "$PROJECT_DIR/.github/copilot-instructions.md"

# ── Claude Code project context ──
add "$PROJECT_DIR/.claude/CLAUDE.md"
add "$PROJECT_DIR/.claude/settings.json"
add "$PROJECT_DIR/.claude/settings.local.json"
add_dir "$PROJECT_DIR/.claude/agents"
add_dir "$PROJECT_DIR/.claude/commands"
add_dir "$PROJECT_DIR/.claude/rules"
add_dir "$PROJECT_DIR/.claude/skills"

# ── Codex project context ──
add "$PROJECT_DIR/.codex/config.yaml"
add "$PROJECT_DIR/.codex/config.yml"
add "$PROJECT_DIR/.codex/instructions.md"
add_dir "$PROJECT_DIR/.codex/skills"
add_dir "$PROJECT_DIR/.codex/rules"

# ── OpenCode project config ──
add "$PROJECT_DIR/.opencode/config.yaml"
add "$PROJECT_DIR/.opencode/config.yml"

# ── OpenSpec context ──
add "$PROJECT_DIR/openspec/project.md"

# ── Generic project docs ──
add "$PROJECT_DIR/CONTRIBUTING.md"
add "$PROJECT_DIR/README.md"

# ── Build command ──
CMD="opencode run"

# Session file first (system prompt)
CMD="$CMD -f \"$SESSION_FILE\""

# Project context files
for ctx in "${CONTEXT_FILES[@]}"; do
  CMD="$CMD -f \"$ctx\""
done

CMD="$CMD --model \"$MODEL\" --variant \"$VARIANT\" \"$PROMPT\""

# ── Show what's being loaded ──
echo "🤖 @$AGENT · $MODEL · variant:$VARIANT"
echo "📁 $PROJECT_DIR"
if [ ${#CONTEXT_FILES[@]} -gt 0 ]; then
  echo "📎 ${#CONTEXT_FILES[@]} context files detected:"
  for ctx in "${CONTEXT_FILES[@]}"; do
    echo "   ${ctx#$PROJECT_DIR/}"
  done
else
  echo "📎 No project context files detected (this is fine for standalone tasks)"
fi
echo ""

eval "$CMD"

# ── Aliases for convenience ──
alias loop-gate='loop gate'
alias loop-architect='loop architect'
alias loop-implement='loop builder'
alias loop-review='loop reviewer'
alias loop-audit='loop sentinel'
alias loop-design='loop designer'
alias loop-full='loop orchestrator'
