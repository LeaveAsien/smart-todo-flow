---
name: smart-todo-flow
description: >-
  Smart TODO state machine management. Chains PLAN.md → TODO.md → CHANGELOG.md.
  Reads PLAN and project context to generate/resume TODOs, supports temporary
  sub-task interruptions, and archives completed work to CHANGELOG.
  Triggers: /todo, list todo, next step, continue, keep going,
  todo status, task status, insert task, temporary task, interrupt task
---

# Smart TODO Flow

Lightweight state machine for task management based on PLAN.md → TODO.md → CHANGELOG.md.
Core principle: **persistent memory, resumable, user controls the pace**.

# State Detection (run on every invocation)

On entry, determine the current state by priority:

1. **User explicitly says "clear todo"** → Clear TODO.md
2. **TODO.md exists with unchecked items** (has `[ ]`) → enter "Resume Mode"
3. **TODO.md exists but all items are resolved** (only `[x]`, `[-]`, `[~]` — no `[ ]`) → enter "Completion Pending"
4. **TODO.md missing or empty** → enter "Generation Mode"

In Generation Mode, if the user's input looks like it might contain planning-level content, offer a choice — don't decide for the user (see PLAN Guidance section under Generation Mode).

# Task States

TODO items support four states:

| Syntax | State | Meaning |
|--------|-------|---------|
| `- [ ]` | Pending | Not started |
| `- [x]` | Done | Completed |
| `- [-]` | Blocked | Cannot proceed; reason noted inline |
| `- [~]` | Skipped | Intentionally deferred |

Blocked and skipped items use inline notes:

```markdown
- [-] Deploy to production (blocked: waiting for security review)
- [~] Write integration tests (skipped: API spec not finalized)
```

# Resume Mode

## Smart Detection of Completed Work

**Requires git.** If the project is not a git repository, skip this step entirely.

Before reporting progress:

1. Read recent git commits and current diff (`git log --oneline -10`, `git diff --stat`)
2. Compare against unchecked TODO items
3. If any item appears to have been addressed by recent changes, include a suggestion:

```
Detected: recent commits may have addressed these items:
- [ ] Implement user auth → commit a1b2c3d "add user auth middleware"
Mark as done? (y/n per item)
```

Only suggest — never auto-mark. Wait for user confirmation.

## Progress Report

Read TODO.md. Report current progress with state breakdown, then let the user decide how to proceed.
When resuming, prefer TODO.md as the primary state source; read PLAN.md only when the phase marker, next-phase decision, or plan/task ambiguity requires it.

Report format:
```
Phase: 2 (from PLAN.md)
Progress: 3/7 done · 1 blocked · 1 skipped · 2 remaining

Blocked:
- [-] Task B (blocked: reason)

Skipped:
- [~] Task F (skipped: reason)

Remaining:
- [ ] Task D
- [ ] Task E

How would you like to proceed? (e.g.: do next item / finish all / do item 5 first / I'll pick)
```

If no phase marker exists in TODO.md, omit the Phase line.

When the user chooses to execute an item, follow **# Execution**.

# Generation Mode

## Information Gathering

Read context in priority order:
1. `CLAUDE.md` — project background and constraints
2. `PLAN.md` — goals and phase planning
3. Current code state (git status, recent commits if git is available)

## When PLAN.md Does Not Exist

Ask the user:
```
No PLAN.md found in this project. How should we proceed?
1. I'll draft a quick one based on CLAUDE.md and current project state
2. You generate one yourself (e.g. using brainstorm)
3. No PLAN needed — just tell me what to do
```

## PLAN Guidance

When generating TODO, if the user's input looks like it might contain planning-level content (multiple directions, feature ideas, architectural options, phased goals), **don't auto-decide** — ask the user:

```
These could be planning directions or action items — you know best:
1. Write to PLAN.md first, then pick items to generate TODO
2. Directly generate TODO from these

Which way?
```

The skill does not judge whether content is "PLAN-level" or "TODO-level" — that distinction is up to the user. The skill only offers the choice when the input is ambiguous enough that it *might* belong in PLAN.

## Phase Detection

When reading PLAN.md:
1. Look for phase/stage structure (e.g., "Phase 1", "Stage A", "第一阶段", numbered sections)
2. If TODO.md previously existed with a phase marker `<!-- phase: N -->`, identify the next phase
3. If no prior phase marker, start from the first phase that has unfinished goals
4. Present the detected phase to the user for confirmation before generating

## Generating TODO

- Break down the current phase goals from PLAN into concrete, actionable steps
- Default 5–8 steps; user can adjust granularity ("make it finer", "3 steps is enough")
- If tasks have natural ordering dependencies, annotate with `(depends: N)` where N is the item number
- Present to user for confirmation; write to TODO.md only after approval
- If user has modifications, adjust and re-confirm

## TODO.md Format

```markdown
# TODO

<!-- phase: 1 -->

- [ ] First step description
- [ ] Second step description
- [ ] Third step description (depends: 2)
```

The `<!-- phase: N -->` comment tracks which PLAN phase this TODO round corresponds to. No section headers, no dates, no priority markers beyond this. Pure checklist.

# Execution

## User Options

User may:
- Specify one or several items to work on
- Say "next" to do just one item (default, cache-friendly)
- Say "finish all" to execute all remaining items in one turn (⚠️ higher token cost — no prompt cache between items)
- Pick their own order
- Mark an item as blocked: "item 3 is blocked because..."
- Mark an item as skipped: "skip item 4"

**Default pacing**: after completing each item, pause and report progress, then wait for user input before continuing. This leverages prompt cache at turn boundaries and significantly reduces token consumption. "finish all" opts out of this pacing.

## Dependency Check

When the user selects a task to work on, check if it has a `(depends: N)` marker. If any dependency is not yet `[x]`, warn the user:

```
Note: This task depends on item N which is not yet completed.
Proceed anyway, or do item N first?
```

Only warn — user decides whether to proceed or switch.

## Starting a Task

When the user selects a task to work on:

1. Load deferred tools: `ToolSearch` (query: `select:TaskCreate,TaskUpdate`)
2. Create a Claude Task via `TaskCreate` with the item description — set to `in_progress`
3. Begin implementation

## Temporary Tasks

When the user wants to do something else mid-flow (e.g. "fix this bug first", "add a quick feature"):

Insert temporary tasks as indented sub-items under the furthest-progressed item (whether in-progress or completed):

```markdown
- [x] Completed task A
- [x] Completed task B
  - [ ] [temp] User's temporary request
  - [ ] [temp] Another temporary task
- [ ] Original task C
- [ ] Original task D
```

- Temporary tasks appear as sub-items, visually distinct from the main line
- After all temporary tasks are done, resume the next main-line item
- Main-line order is never disrupted

## Completing an Item

After completing an item:
1. Mark it done in TODO.md: `- [x] task description`
2. Update the Claude Task to `completed` via `TaskUpdate`
3. Append to CHANGELOG.md under the current batch (see Changelog Rules below)
4. If all actionable items are done (only `[x]`, `[-]`, `[~]` remain — no `[ ]`), notify the user: TODO is fully completed, review results and decide next steps
5. **If not "finish all" mode**: pause, report brief progress (e.g. "3/7 done"), and wait for user to say "next" / "continue" before proceeding to the next item

Do not include completion dates in TODO.md (keep it minimal).

## Changelog Rules

Three core rules:
1. **Immediate**: every completed TODO item is appended to CHANGELOG.md right away — never deferred
2. **Batched**: changes in the same batch go under one heading. With git: a batch = one commit (sealed on `git commit`). Without git: a batch = one TODO round (sealed on clear/new round)
3. **Style-adaptive**: if the project already has a CHANGELOG, match its wording and detail level. Otherwise use the default format below

Default format:
```markdown
# CHANGELOG

## YYYY-MM-DD (batch summary)
- <verb> <description>
```

- Heading: `## YYYY-MM-DD (batch summary)` — short phrase summarizing the batch theme (2–8 chars Chinese / 3–5 words English)
- Entries: `- <verb> <description>` — one line per change
- Reverse chronological order (newest batch on top)
- When appending: check the latest heading for an open batch; if the latest batch has been sealed (committed with git, or TODO round cleared), create a new heading at the top instead of appending to it; do not reread the full changelog

# Completion Pending

When all actionable items in TODO.md are resolved (no `[ ]` remaining — only `[x]`, `[-]`, `[~]`), prompt the user with available options:

```
All TODOs resolved! (N done, M blocked, K skipped)
Changes have been recorded in CHANGELOG.md.

💡 Remember to update PLAN.md — mark Phase N as completed (e.g. add ✅)

You can:
1. Review/edit the status of blocked/skipped items
2. Review/revise CHANGELOG.md
3. Clear TODO.md
4. Commit to git          ← only shown if project has git
5. Generate next phase TODO from PLAN (Phase N → Phase N+1)
```

Option 4 only appears if the project is a git repository. Option 5 only appears if PLAN.md exists and has a subsequent phase. The PLAN update reminder only appears if TODO.md has a `<!-- phase: N -->` marker and PLAN.md exists. These operations are independent. User can execute them in any order or skip any.

# Clear TODO

Triggered only by user (e.g. "clear todo"). After clearing, TODO.md retains only the heading:

```markdown
# TODO
```

# Git Commit

Triggered only by user (e.g. "commit").

Commit message format: first read the project's recent git log and follow existing style. If no clear style exists, use the default format:

```
<summary>: <keyword1>/<keyword2>/<keyword3>
  - <specific change 1>
  - <specific change 2>
```

- First line: `<verb> <summary>: <key changes separated by />`
- Verbs: add / fix / optimize / refactor / update / remove, etc.
- Body (when 2+ changes): each change one bullet `- <specific detail>`
- Each bullet must be specific enough to understand the change without reading the diff
- Include quantified results when available (e.g. `match rate 49% → 54.7%`)

Example:
```
fix 四项质量修复: 坐标缩放/异显误判/mark路径/过检治理
  - GT 坐标按来源图片尺寸单独缩放, 修复 mark 标注图尺寸不一致导致的匹配偏差
  - min_abnormal_patterns 1→2, 减少 Mura 被误判为异显
```

# Reference

## PLAN.md Interaction

This skill **only reads PLAN.md — it does not generate or modify it**.

When reading PLAN, focus on:
- Which phase the project is currently in
- Specific goals for that phase
- Any constraints or prerequisites
- Phase structure for tracking progression

Treat PLAN.md as a concise roadmap. If it is long, extract only the current phase goals, immediate constraints, and phase progression needed for this TODO round.

If PLAN needs adjustment during execution (e.g. goals are outdated), remind the user to update PLAN, but do not modify it.

## Integration with CLAUDE.md

This skill is the **interactive half** of a two-part system:
- **CLAUDE.md** contains always-on rules (write changelog after changes, guide planning to PLAN.md) — see `claude-md-template.md` for the template
- **This skill** handles on-demand operations (generate TODO, check progress, phase flow)

For the workflow to fully work, the project's CLAUDE.md should include the rules from the template. Without it, the always-on behaviors (like incremental changelog) only apply during `/todo` sessions.

# Important Rules

- TODO.md is an execution checklist, not documentation — keep it minimal
- TODO.md is a pure checklist — no over-engineering ("implement XX feature" > "add ZZ method at line YY in file XX")
- "continue" / "keep going" / "next step" → resume directly, do not regenerate TODO
- After all items done → wait for user instructions, do not auto-clear
- Planning-level content → guide toward PLAN.md first, do not flatten into TODO items
- Smart git detection only suggests — never auto-mark without user confirmation
- Blocked/skipped items count as resolved for flow, but tracked separately in reports
- Claude Task must stay in sync with TODO.md — load via ToolSearch on first task, create on start, complete on finish
- Changelog is written immediately on each item completion, never deferred
