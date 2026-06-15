#!/usr/bin/env bash
# smart-todo-flow PostToolUse hook (Edit|Write)
# Reminds Claude to update CHANGELOG.md when a TODO item is marked [x].
# Only outputs when TODO.md is edited with a checkbox completion.
# Token cost: zero unless triggered; ~1 line when triggered.

INPUT=$(cat)

# Quick check: is TODO.md mentioned in the tool input?
if ! echo "$INPUT" | grep -q 'TODO\.md'; then
  exit 0
fi

# Check if the edit contains a completed checkbox
if echo "$INPUT" | grep -q '\[x\]'; then
  echo "[smart-todo-flow] TODO item completed — ensure CHANGELOG.md is updated."
fi
