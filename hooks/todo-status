#!/usr/bin/env bash
# smart-todo-flow UserPromptSubmit hook
# Intercepts /todo-status command, shows progress locally, zero token cost.
# Exit code 2 = block prompt from reaching Claude.

INPUT=$(cat)

if ! echo "$INPUT" | grep -qi 'todo-status'; then
  exit 0
fi

TODO_FILE="${CLAUDE_PROJECT_DIR}/TODO.md"

if [ ! -f "$TODO_FILE" ]; then
  echo "" >&2
  echo "  No active TODO." >&2
  echo "" >&2
  exit 2
fi

DONE=$(grep -cE '^\s*- \[x\]' "$TODO_FILE" 2>/dev/null || true)
DONE=${DONE:-0}
PENDING=$(grep -cE '^\s*- \[ \]' "$TODO_FILE" 2>/dev/null || true)
PENDING=${PENDING:-0}
BLOCKED=$(grep -cE '^\s*- \[-\]' "$TODO_FILE" 2>/dev/null || true)
BLOCKED=${BLOCKED:-0}
SKIPPED=$(grep -cE '^\s*- \[~\]' "$TODO_FILE" 2>/dev/null || true)
SKIPPED=${SKIPPED:-0}
TOTAL=$((DONE + PENDING + BLOCKED + SKIPPED))

if [ "$TOTAL" -eq 0 ]; then
  echo "" >&2
  echo "  TODO.md exists but has no items." >&2
  echo "" >&2
  exit 2
fi

PHASE=$(sed -n 's/.*<!--\s*phase:\s*\([^ ]*\)\s*-->.*/\1/p' "$TODO_FILE" 2>/dev/null | head -1)

# Colors
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

# Percentage & progress bar
PCT=$((DONE * 100 / TOTAL))
BAR_W=20
FILLED=$((PCT * BAR_W / 100))
BAR=""
for ((i=0; i<FILLED; i++)); do BAR="${BAR}█"; done
for ((i=FILLED; i<BAR_W; i++)); do BAR="${BAR}░"; done

# Title
TITLE="TODO Progress"
[ -n "$PHASE" ] && TITLE="TODO Progress (Phase ${PHASE})"

{
echo ""
echo -e "  ${BOLD}── ${TITLE} ──${RESET}"
echo ""
echo -e "  ${GREEN}${BAR}${RESET}  ${BOLD}${PCT}%${RESET}  (${DONE}/${TOTAL})"
echo ""

# Status line
ST=""
[ "$DONE" -gt 0 ]    && ST="${ST}  ${GREEN}✓ ${DONE} done${RESET}"
[ "$PENDING" -gt 0 ] && ST="${ST}  ○ ${PENDING} pending"
[ "$BLOCKED" -gt 0 ] && ST="${ST}  ${RED}✕ ${BLOCKED} blocked${RESET}"
[ "$SKIPPED" -gt 0 ] && ST="${ST}  ${YELLOW}⊘ ${SKIPPED} skipped${RESET}"
echo -e " ${ST}"

# Pending items (no color)
if [ "$PENDING" -gt 0 ]; then
  echo ""
  echo "  Pending:"
  grep -E '^\s*- \[ \]' "$TODO_FILE" | sed 's/^\s*- \[ \] //' | while IFS= read -r line; do
    short="${line%%：*}"
    [ "$short" = "$line" ] && short="${line%%:*}"
    echo "    ○ ${short}"
  done
fi

# Blocked items (red, name + reason split)
if [ "$BLOCKED" -gt 0 ]; then
  echo ""
  echo -e "  ${RED}Blocked:${RESET}"
  grep -E '^\s*- \[-\]' "$TODO_FILE" | sed 's/^\s*- \[-\] //' | while IFS= read -r line; do
    # Try to extract name and reason
    name="${line%%(*}"
    name="${name%%（*}"
    name=$(echo "$name" | sed 's/[[:space:]]*$//')
    reason=$(echo "$line" | grep -oE '\(blocked:.*\)' || echo "$line" | grep -oE '（blocked:.*）' || true)
    if [ -n "$reason" ]; then
      echo -e "    ${RED}✕${RESET} ${name}"
      echo -e "      ${DIM}${reason}${RESET}"
    else
      short="${line%%：*}"
      [ "$short" = "$line" ] && short="${line%%:*}"
      echo -e "    ${RED}✕${RESET} ${short}"
    fi
  done
fi

# Skipped items (yellow)
if [ "$SKIPPED" -gt 0 ]; then
  echo ""
  echo -e "  ${YELLOW}Skipped:${RESET}"
  grep -E '^\s*- \[~\]' "$TODO_FILE" | sed 's/^\s*- \[~\] //' | while IFS= read -r line; do
    short="${line%%：*}"
    [ "$short" = "$line" ] && short="${line%%:*}"
    echo -e "    ${YELLOW}⊘${RESET} ${short}"
  done
fi

# Done items (green, dimmed)
if [ "$DONE" -gt 0 ]; then
  echo ""
  echo -e "  ${GREEN}Done:${RESET}"
  grep -E '^\s*- \[x\]' "$TODO_FILE" | sed 's/^\s*- \[x\] //' | while IFS= read -r line; do
    short="${line%%：*}"
    [ "$short" = "$line" ] && short="${line%%:*}"
    echo -e "    ${DIM}✓ ${short}${RESET}"
  done
fi

# Next action hint
if [ "$PENDING" -gt 0 ]; then
  NEXT=$(grep -E '^\s*- \[ \]' "$TODO_FILE" | head -1 | sed 's/^\s*- \[ \] //')
  NEXT_SHORT="${NEXT%%：*}"
  [ "$NEXT_SHORT" = "$NEXT" ] && NEXT_SHORT="${NEXT%%:*}"
  echo ""
  echo -e "  ${BOLD}Next →${RESET} ${NEXT_SHORT}"
fi

echo ""
echo -e "  ${DIM}──────────────────────────────${RESET}"
echo ""
} >&2

exit 2
