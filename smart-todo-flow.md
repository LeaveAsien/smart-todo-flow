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
2. **TODO.md exists with actionable items** (unchecked `[ ]`, blocked `[-]`, or skipped `[~]`) → enter "Resume Mode"
3. **TODO.md exists but all items are resolved** (only `[x]`, `[-]`, `[~]` — no `[ ]`) → enter "Completion Pending"
4. **TODO.md missing or empty** → enter "Generation Mode"

In Generation Mode, if the user's input looks like it might contain planning-level content, offer a choice — don't decide for the user (see PLAN Guidance section).

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

## Dependency Check

When the user selects a task to work on, check if it has a `(depends: N)` marker. If any dependency is not yet `[x]`, warn the user:

```
Note: This task depends on item N which is not yet completed.
Proceed anyway, or do item N first?
```

Only warn — user decides whether to proceed or switch.

## Claude Task Integration

When starting work on a TODO item:
1. Create a Claude Task via `TaskCreate` with the item description as subject
2. Set the task to `in_progress`

When the item is completed:
1. Mark it done in TODO.md: `- [x] task description`
2. Update the Claude Task to `completed` via `TaskUpdate`

This keeps both persistent (TODO.md) and session-level (Claude Task) tracking in sync.

User may:
- Specify one or several items to work on
- Say "finish all" to execute all remaining items
- Say "next" to do just one item
- Pick their own order
- Mark an item as blocked: "item 3 is blocked because..."
- Mark an item as skipped: "skip item 4"

After completing an item:
- Mark it done in TODO.md: `- [x] task description`
- Do not include completion dates (keep it minimal)
- Immediately write this change to CHANGELOG.md under the current batch (see Changelog section)
- If all actionable items are done (only `[x]`, `[-]`, `[~]` remain — no `[ ]`), notify the user: TODO is fully completed, review results and decide next steps

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

# PLAN Guidance

When generating TODO, if the user's input looks like it might contain planning-level content (multiple directions, feature ideas, architectural options, phased goals), **don't auto-decide** — ask the user:

```
These could be planning directions or action items — you know best:
1. Write to PLAN.md first, then pick items to generate TODO
2. Directly generate TODO from these

Which way?
```

The skill does not judge whether content is "PLAN-level" or "TODO-level" — that distinction is up to the user. The skill only offers the choice when the input is ambiguous enough that it *might* belong in PLAN.

# Temporary Tasks (Sub-TODOs)

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

# Completion Pending

When all actionable items in TODO.md are resolved (no `[ ]` remaining — only `[x]`, `[-]`, `[~]`), prompt the user with available options:

```
All TODOs resolved! (N done, M blocked, K skipped)
Changes have been recorded in CHANGELOG.md.
You can:
1. Review/edit the status of blocked/skipped items
2. Review/revise CHANGELOG.md
3. Clear TODO.md
4. Commit to git          ← only shown if project has git
5. Generate next phase TODO from PLAN (Phase N → Phase N+1)
```

Option 4 only appears if the project is a git repository. Option 5 only appears if PLAN.md exists and has a subsequent phase. These operations are independent. User can execute them in any order or skip any.

# Changelog

CHANGELOG.md is written **incrementally** — every time a TODO item is completed, the change is immediately recorded. This ensures the user always knows what has been changed so far.

## Batching

Changes are grouped into **batches** under a single heading.

**With git**: a batch corresponds to one git commit. All changes before the next `git commit` belong to the current batch. After commit, the batch is sealed; subsequent changes start a new heading.

**Without git**: a batch corresponds to one TODO round. All completed items from the current TODO.md go under the same heading. Clearing TODO or generating a new round starts a new heading.

## Writing Flow

When a TODO item is completed:

1. **Inspect CHANGELOG.md** (if it exists) — check the latest relevant section for an open batch; do not reread or summarize the full changelog during normal append
2. **If an open batch exists** (with git: uncommitted changes under the latest heading; without git: current TODO round's heading) → append the new entry under the existing heading
3. **If no open batch** (first change, or previous batch was sealed) → create a new heading at the top
4. Write a concise one-line entry describing the change

## Default CHANGELOG Format

```markdown
# CHANGELOG

## 2026-05-24 (核心体验增强)
- add 任务状态扩展：新增阻塞/跳过状态
- add PLAN 阶段感知：自动检测并追踪 PLAN 阶段
- add 任务依赖关系：支持 depends 标注

## 2026-05-20 (初始化项目)
- add 项目基础结构
```

Format rules:
- Heading: `## YYYY-MM-DD (batch summary)` — the batch summary is a short phrase describing the overall theme of this batch
- Entries: `- <verb> <description>` — one line per change
- Reverse chronological order (newest batch on top)
- The batch summary in parentheses is written/updated when the batch is first created, and may be refined on commit

## Batch Summary

The parenthetical batch summary should capture the theme of the batch:
- Written when the first item in the batch is recorded
- If subsequent items shift the theme, update the summary to reflect the broader scope
- Keep it short: 2–8 characters in Chinese, or 3–5 words in English

## Writing Tone

**Follow the project's existing CHANGELOG style**. If the project already has a CHANGELOG, analyze its wording, level of detail, use of terminology, and maintain consistency. If creating a new CHANGELOG, reference the project's CLAUDE.md writing requirements (if any). If no special requirements exist, use a concise technical style.

# PLAN.md Interaction

This skill **only reads PLAN.md — it does not generate or modify it**.

When reading PLAN, focus on:
- Which phase the project is currently in
- Specific goals for that phase
- Any constraints or prerequisites
- Phase structure for tracking progression

Treat PLAN.md as a concise roadmap. If it is long, extract only the current phase goals, immediate constraints, and phase progression needed for this TODO round.

If PLAN needs adjustment during execution (e.g. goals are outdated), remind the user to update PLAN, but do not modify it.

# Integration with CLAUDE.md

This skill is the **interactive half** of a two-part system:
- **CLAUDE.md** contains always-on rules (write changelog after changes, guide planning to PLAN.md) — see `claude-md-template.md` for the template
- **This skill** handles on-demand operations (generate TODO, check progress, phase flow)

For the workflow to fully work, the project's CLAUDE.md should include the rules from the template. Without it, the always-on behaviors (like incremental changelog) only apply during `/todo` sessions.

# Clear TODO

Triggered only by user (e.g. "clear todo"). After clearing, TODO.md retains only the heading:

```markdown
# TODO
```

# Git Commit

Triggered only by user (e.g. "commit").

Commit message format: first read the project's recent git log and follow existing style. If no clear style exists, use the default template:

```
<verb> <subject>: <detail>
```

- Verbs: add / fix / optimize / refactor / update / remove, etc.
- `<detail>` must be specific enough to understand the change without reading the diff — list what was added/changed/fixed, not just a category summary
- Include quantified results when available (e.g. `match rate 49% → 54.7%`)
- Single-line summary, no multi-line body (unless changes are substantial)

# Important Rules

- TODO.md is an execution checklist, not documentation — keep it minimal
- TODO.md is a pure checklist — no over-engineering ("implement XX feature" > "add ZZ method at line YY in file XX")
- "continue" / "keep going" / "next step" → resume directly, do not regenerate TODO
- After all items done → wait for user instructions, do not auto-clear
- Planning-level content → guide toward PLAN.md first, do not flatten into TODO items
- Smart git detection only suggests — never auto-mark without user confirmation
- Blocked/skipped items count as resolved for flow, but tracked separately in reports
- Keep Claude Task in sync with TODO.md — create on start, complete on finish
- Changelog is written incrementally on each item completion under the current batch
