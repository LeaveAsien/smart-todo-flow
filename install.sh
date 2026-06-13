#!/usr/bin/env bash
set -e

REPO="github:LeaveAsien/smart-todo-flow"
PLUGIN="smart-todo-flow"

claude plugin marketplace add "$REPO" 2>/dev/null || true
claude plugin install "$PLUGIN"
