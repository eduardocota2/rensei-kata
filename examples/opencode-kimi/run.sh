#!/bin/bash
# run.sh — Launch AI Engineering Loop sessions with OpenCode + Kimi K3
# Usage: ./run.sh <agent> "<prompt>"
# Agents: gate, architect, builder, reviewer, sentinel, designer, orchestrator

set -e

AGENT="${1:?Usage: ./run.sh <agent> \"<prompt>\"}"
PROMPT="${2:?Missing prompt}"
LOOP_DIR="$(cd "$(dirname "$0")" && pwd)"
MODEL="openrouter/moonshotai/kimi-k3"

case "$AGENT" in
  gate|architect|reviewer|sentinel|designer|orchestrator)
    VARIANT="high"
    ;;
  builder)
    VARIANT="minimal"
    ;;
  *)
    echo "Unknown agent: $AGENT"
    echo "Valid agents: gate, architect, builder, reviewer, sentinel, designer, orchestrator"
    exit 1
    ;;
esac

SESSION_FILE="$LOOP_DIR/sessions/$AGENT.opencode"

if [ ! -f "$SESSION_FILE" ]; then
  echo "Session file not found: $SESSION_FILE"
  exit 1
fi

echo "🚀 Launching @$AGENT with Kimi K3 (variant: $VARIANT)"
echo ""

opencode run \
  -f "$SESSION_FILE" \
  --model "$MODEL" \
  --variant "$VARIANT" \
  "$PROMPT"
