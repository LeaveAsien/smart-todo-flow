#!/usr/bin/env bash
# smart-todo-flow SessionStart hook
# Injects workflow rules and current TODO status as system-reminder context.
# Replaces the need for users to manually add rules to their CLAUDE.md.

TODO_FILE="${CLAUDE_PROJECT_DIR}/TODO.md"
PLAN_FILE="${CLAUDE_PROJECT_DIR}/PLAN.md"

# Only activate if project uses smart-todo-flow (has TODO.md or PLAN.md)
if [ ! -f "$TODO_FILE" ] && [ ! -f "$PLAN_FILE" ]; then
  exit 0
fi

# Inject workflow rules
cat <<'RULES'
[smart-todo-flow] Project management rules:
- Planning/directional content → write to PLAN.md first, then generate TODO
- After completing a TODO item → immediately append to CHANGELOG.md
- CHANGELOG format: ## YYYY-MM-DD (batch summary) + - <verb> <description>
- Use /todo for task management (generate, resume, phase flow)
RULES

# Inject TODO status if TODO.md exists
if [ -f "$TODO_FILE" ]; then
  DONE=$(grep -cE '^\s*- \[x\]' "$TODO_FILE" 2>/dev/null || true)
  DONE=${DONE:-0}
  PENDING=$(grep -cE '^\s*- \[ \]' "$TODO_FILE" 2>/dev/null || true)
  PENDING=${PENDING:-0}
  BLOCKED=$(grep -cE '^\s*- \[-\]' "$TODO_FILE" 2>/dev/null || true)
  BLOCKED=${BLOCKED:-0}
  SKIPPED=$(grep -cE '^\s*- \[~\]' "$TODO_FILE" 2>/dev/null || true)
  SKIPPED=${SKIPPED:-0}
  TOTAL=$((DONE + PENDING + BLOCKED + SKIPPED))

  if [ "$TOTAL" -gt 0 ]; then
    PHASE=$(sed -n 's/.*<!--\s*phase:\s*\([^ ]*\)\s*-->.*/\1/p' "$TODO_FILE" 2>/dev/null | head -1)
    STATUS="TODO: ${DONE}/${TOTAL} done"
    [ "$BLOCKED" -gt 0 ] && STATUS="${STATUS} · ${BLOCKED} blocked"
    [ "$SKIPPED" -gt 0 ] && STATUS="${STATUS} · ${SKIPPED} skipped"
    [ "$PENDING" -gt 0 ] && STATUS="${STATUS} · ${PENDING} pending"
    [ -n "$PHASE" ] && STATUS="Phase ${PHASE} · ${STATUS}"
    echo "[smart-todo-flow] ${STATUS}"
  fi
fi
