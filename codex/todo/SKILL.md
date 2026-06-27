---
name: todo
description: >-
  Smart TODO state machine management for Codex. Chain PLAN.md to TODO.md to
  CHANGELOG.md, generate and resume execution checklists from project plans,
  track blocked/skipped/temp tasks, append changelog entries immediately, and
  keep progress resumable across Codex conversations. Primary trigger: /todo.
  Also use when the user says list todo, next step, continue, keep going,
  todo status, task status, write changelog, archive, clear todo, insert task,
  temporary task, or interrupt task.
---

# Smart TODO Flow

Lightweight state machine for task management based on `PLAN.md` -> `TODO.md` -> `CHANGELOG.md`.
Core principle: **persistent memory, resumable, user controls the pace**.

# State Detection

On every invocation, detect state by priority:

1. User explicitly says "clear todo" -> clear `TODO.md`
2. `TODO.md` exists with unchecked items (`[ ]`) -> enter Resume Mode
3. `TODO.md` exists and all items are resolved (`[x]`, `[-]`, `[~]`; no `[ ]`) -> enter Completion Pending
4. `TODO.md` is missing or empty -> enter Generation Mode

If the user explicitly asks to write changelog/archive, enter the relevant changelog flow even if another state applies.

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

If the project is a git repository, inspect recent commits and current diff:

- `git log --oneline -10`
- `git diff --stat`

Compare them against unchecked TODO items. If an item appears addressed, suggest marking it done but never update it without user confirmation.

Example:

```text
Detected: recent commits may have addressed these items:
- [ ] Implement user auth -> commit a1b2c3d "add user auth middleware"
Mark as done? (y/n per item)
```

Skip this step entirely outside git repositories.

## Progress Report

Read `TODO.md` and report progress with state breakdown. Use `TODO.md` as the primary state source. Read `PLAN.md` only when the phase marker, next-phase decision, or plan/task ambiguity requires it.

Report format:

```text
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

Omit the Phase line when no `<!-- phase: N -->` marker exists.

## Codex Plan Mirror

If Codex's `update_plan` tool is available, mirror `TODO.md` into the session plan after the progress report:

- Include only actionable pending work by default: remaining main items and active `[temp]` sub-items
- Keep `TODO.md` as the durable source of truth; the session plan is only a live progress display
- Use exactly one `in_progress` item at a time
- Do not mirror completed history unless it is needed for immediate context
- If `update_plan` is unavailable, continue normally with `TODO.md` only

# Generation Mode

## Information Gathering

Read context in this order:

1. Project instructions: root and current-directory `AGENTS.md` / `AGENT.md`, following the normal precedence chain
2. `PLAN.md` for goals and phase planning
3. Current code state, including `git status` and recent commits if git is available

## When PLAN.md Does Not Exist

Ask the user:

```text
No PLAN.md found in this project. How should we proceed?
1. I'll draft a quick one based on AGENTS.md/AGENT.md and current project state
2. You generate one yourself
3. No PLAN needed - just tell me what to do
```

## PLAN Guidance

When the user's input looks like it might contain planning-level content, offer a choice instead of deciding for the user:

```text
These could be planning directions or action items - you know best:
1. Write to PLAN.md first, then pick items to generate TODO
2. Directly generate TODO from these

Which way?
```

Planning-level content includes multiple directions, feature ideas, architectural options, phased goals, or vision-level discussion.

## Phase Detection

When reading `PLAN.md`:

1. Look for phase/stage structure, such as `Phase 1`, `Stage A`, `第一阶段`, or numbered sections
2. If `TODO.md` previously existed with `<!-- phase: N -->`, identify the next phase
3. If no prior phase marker exists, start from the first phase with unfinished goals
4. Present the detected phase to the user for confirmation before generating

## Generating TODO

- Break down current phase goals into concrete, actionable steps
- Default to 5-8 steps; adjust if the user asks for finer or coarser granularity
- If tasks have natural ordering dependencies, annotate with `(depends: N)` where `N` is the item number
- Present the TODO draft for confirmation; write `TODO.md` only after approval
- If the user modifies the draft, adjust and re-confirm

`TODO.md` format:

```markdown
# TODO

<!-- phase: 1 -->

- [ ] First step description
- [ ] Second step description
- [ ] Third step description (depends: 2)
```

Keep `TODO.md` as a pure checklist: no dates, section headers, or priority fields beyond the phase comment.

# Execution

## User Options

User may:

- Specify one or several items to work on
- Say "next" to do one item
- Say "finish all" to execute all remaining items in one turn
- Pick their own order
- Mark an item as blocked: "item 3 is blocked because..."
- Mark an item as skipped: "skip item 4"

Default pacing: after completing each item, pause, report progress, and wait for user input before continuing. "finish all" opts into a longer continuous turn with higher token usage.

If Codex's `update_plan` tool is available, keep it synchronized with the selected work. `TODO.md` remains the durable source of truth.

## Dependency Check

When the user selects a task, check for `(depends: N)`. If a dependency is not `[x]`, warn the user and ask whether to proceed anyway or do the dependency first.

## Starting a Task

When the user selects a task:

1. Re-read the relevant project instructions if needed
2. Ensure the session plan mirrors the current remaining TODO items if `update_plan` is available
3. Mark the selected task as `in_progress` in the session plan
4. If the user marks an item blocked or skipped instead of implementing it, update `TODO.md`, append changelog if appropriate, and mark the mirrored plan item completed with the reason in the step text
5. Implement the task

Do not create non-Codex platform task objects or call non-Codex platform tools.

## Temporary Tasks

When the user wants to do something else mid-flow, insert temporary tasks as indented sub-items under the furthest-progressed main item:

```markdown
- [x] Completed task A
- [x] Completed task B
  - [ ] [temp] User's temporary request
  - [ ] [temp] Another temporary task
- [ ] Original task C
- [ ] Original task D
```

- Temporary tasks appear as sub-items
- After temporary tasks are done, resume the next main-line item
- Main-line order is never disrupted
- When `update_plan` is available, include active `[temp]` sub-items in the session plan until they are resolved

## Completing an Item

After completing an item:

1. Mark it done in `TODO.md`: `- [x] task description`
2. Mark it `completed` in the session plan if `update_plan` is available
3. Append to `CHANGELOG.md` under the current batch
4. Refresh the session plan from remaining pending TODO items if continuing in the same turn
5. If all actionable items are done, notify the user and offer Completion Pending options
6. If not in "finish all" mode, pause and wait for the user to say "next" / "continue" before proceeding

Do not include completion dates in `TODO.md`.

# Changelog Rules

Three core rules:

1. Immediate: every completed TODO item is appended to `CHANGELOG.md` right away
2. Batched: changes in the same batch go under one heading. With git, a batch is one commit and is sealed on `git commit`. Without git, a batch is one TODO round and is sealed on clear/new round
3. Style-adaptive: match the existing changelog's wording and detail level. If none exists, use the default format

Default format:

```markdown
# CHANGELOG

## YYYY-MM-DD (batch summary)
- <verb> <description>
```

- Heading: `## YYYY-MM-DD (batch summary)`
- Entries: `- <verb> <description>`
- Newest batch goes on top
- When appending, check whether the latest batch is still open; create a new top heading if the latest batch has been sealed

# Completion Pending

When all actionable items are resolved, prompt the user:

```text
All TODOs resolved! (N done, M blocked, K skipped)
Changes have been recorded in CHANGELOG.md.

Remember to update PLAN.md - mark Phase N as completed if appropriate.

You can:
1. Review/edit blocked or skipped items
2. Review/revise CHANGELOG.md
3. Clear TODO.md
4. Commit to git
5. Generate next phase TODO from PLAN
```

Show the git commit option only in git repositories. Show the next phase option only when `PLAN.md` exists and appears to have a subsequent phase. These operations are independent; never auto-chain them.

# Clear TODO

Triggered only by the user. After clearing, `TODO.md` retains only:

```markdown
# TODO
```

# Git Commit

Triggered only by the user.

Commit message format: **Conventional Commits** specification. First read the project's recent git log. If the project already uses a different convention, follow that instead.

```text
<type>(<scope>): <description>

- <module or theme>: <high-level summary of the change>
- <module or theme>: <high-level summary of the change>
```

- First line <= 72 characters
- Types: `feat` / `fix` / `docs` / `refactor` / `chore` / `test` / `style` / `perf`
- Scope: optional, the module or area affected, such as `skill`, `hooks`, or `plugin`
- Body is optional; use it when 2+ modules, user-visible behaviors, or documentation surfaces changed
- Body bullets should be high-level and modular, grouping details by area instead of listing every file edit
- Each bullet must be specific enough to understand the change without reading the diff
- Include quantified results when available

Example:

```text
docs(codex): align handoff support

- skill: add Codex-native handoff entrypoint and metadata
- docs: update installation and command references for Codex users
```

# Reference

## PLAN.md Interaction

Only read `PLAN.md`. Do not generate or modify it unless the user explicitly asks.

When reading `PLAN.md`, focus on:

- Current phase
- Goals for that phase
- Constraints or prerequisites
- Phase structure for progression

If `PLAN.md` needs adjustment during execution, remind the user to update it.

## Integration with AGENTS.md / AGENT.md

This skill is the interactive half of a two-part system:

- `AGENTS.md` / `AGENT.md` contains always-on project rules, such as writing changelog after changes and guiding planning content to `PLAN.md`
- This skill handles on-demand operations: generate TODO, check progress, resume, and phase flow

For the workflow to fully work, the target project should include the Codex template rules in its `AGENTS.md` or `AGENT.md`.

# Important Rules

- `TODO.md` is an execution checklist, not documentation
- "continue" / "keep going" / "next step" means resume, not regenerate TODO
- After all items are done, wait for user instructions and do not auto-clear
- Planning-level content should be guided toward `PLAN.md` first
- Smart git detection only suggests; never auto-mark without confirmation
- Blocked/skipped items count as resolved for flow, but must be tracked separately
- Write changelog immediately on each item completion
- Keep platform-specific references Codex-native; avoid non-Codex tool references in this version
