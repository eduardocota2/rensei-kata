# OpenCode Configuration

This directory contains OpenCode-specific equivalents of the Claude Code agents and commands.

For now, OpenCode doesn't have a direct equivalent of Claude Code's custom agents and slash commands. Instead, use these approaches:

## Model Selection with OpenCode

```bash
# Analysis / Architecture → DeepSeek v4 or Claude Opus
opencode run "analyze this requirement: ..." --model openrouter/deepseek/deepseek-v4-pro --variant high

# Implementation → Claude Haiku or Sonnet
opencode run "implement this from plan: ..." --model openrouter/anthropic/claude-haiku-3.5 --variant minimal

# Review → Claude Sonnet
opencode run "review this code: ..." --model openrouter/anthropic/claude-sonnet-4
```

## Using the Prompt Templates

The prompts in `../prompts/` are tool-agnostic. Use them as:
```bash
opencode run "$(cat .rensei/prompts/analyze.md)\n\nRequirement: [your requirement]"
```

## Session Management

OpenCode sessions can be used to simulate the loop:
```bash
# Start architect session for analysis + planning
opencode --title "architect-phase1-2"
# ... do analysis and planning ...
# Exit (Ctrl+C), note session ID

# Start builder session
opencode --title "builder-phase3"
# ... implement from plan ...
# Self-critique before exiting

# Start reviewer session
opencode --title "reviewer-phase5-6"
# ... review the diff ...
```

## Future

As OpenCode adds custom agent/command support, this directory will contain equivalent definitions to the Claude Code agents in `../agents/`.
