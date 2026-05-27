[English](README.md) | [中文](README.zh-CN.md)

# Smart TODO Flow

A Claude Code skill that adds a lightweight execution memory layer for AI-assisted coding sessions, built around three linked documents: **PLAN.md** → **TODO.md** → **CHANGELOG.md**.

Keep the big-picture plan, step-by-step execution, and changelog in sync across conversations.

## Why

Claude Code is powerful, but AI-assisted coding sessions have a few recurring workflow gaps:

- **No persistent execution memory** — close the chat, and the next session may lose what's done, what's left, and why
- **Plan and execution drift apart** — a high-level PLAN.md can exist, but implementation often turns into scattered ad-hoc steps
- **Changelog is hard to reconstruct later** — after a long session, it is easy to forget exactly what changed and which TODO item caused it

Smart TODO Flow solves these by using three plain markdown files as persistent, human-readable project state.

It is not trying to replace an issue tracker; it works best as the small local execution layer inside a project, feature branch, or local worktree.

## Best For

- Solo projects and small codebases
- AI-assisted coding sessions that span multiple conversations
- Feature branches or local worktrees that need branch-local execution notes
- Lightweight changelog tracking without a full project management system

## How It Works

| Document | Role | When to update |
|----------|------|----------------|
| `PLAN.md` | Big picture: goals, phases, directions | When direction changes |
| `TODO.md` | Execution: concrete steps for the current phase | Generated via `/todo`; items checked off as completed |
| `CHANGELOG.md` | Record: what changed and when | Auto-appended each time a TODO item is completed |

A typical cycle:

```
Write PLAN.md (goals & phases)
        ↓
  /todo → generate TODO.md from current phase
        ↓
  Work through items one by one
  (each completion → auto-append to CHANGELOG.md)
        ↓
  All done → review → clear → next phase
```

## Demo

Smart TODO Flow is easiest to understand as a before/after loop:

```markdown
# PLAN.md
## Phase 2 — 功能扩展
5. 标签系统
6. RSS 订阅
7. 搜索功能
8. 暗色模式
9. SEO 优化
```

Run:

```text
/todo
```

The skill turns the plan into an execution state:

```markdown
# TODO.md
<!-- phase: 2 -->

- [x] 文章 frontmatter 增加 tags 字段，解析并收集所有标签
- [-] RSS 订阅：生成 feed.xml (blocked: 还没确定最终的文章 URL 结构，等产品确认)
- [x] 搜索功能：集成 Fuse.js，首页顶部搜索框
  - [x] [temp] 搜索结果高亮匹配关键词
- [~] 暗色模式 (skipped: 设计稿还没给暗色配色方案)
- [ ] SEO 优化：添加 Open Graph meta、生成 sitemap.xml (depends: 4)
```

As items are completed, the changelog is updated incrementally:

```markdown
# CHANGELOG.md
## 2026-05-28 (Phase 2 收尾)
- add RSS feed.xml + Atom 格式支持
- add Open Graph meta 标签
- add sitemap.xml 自动生成
```

See the full walkthrough in [`examples/`](examples/README.md).

## Install

Two parts, both needed for the full experience:

### 1. Add the skill file

**Quick install (one command):**

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/LeaveAsien/smart-todo-flow/master/smart-todo-flow.md \
  -o ~/.claude/skills/smart-todo-flow.md --create-dirs

# Windows (PowerShell)
New-Item -ItemType Directory -Force ~/.claude/skills | Out-Null
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/LeaveAsien/smart-todo-flow/master/smart-todo-flow.md" `
  -OutFile "$HOME/.claude/skills/smart-todo-flow.md"
```

**Or manually:** download [`smart-todo-flow.md`](smart-todo-flow.md) and place it in `~/.claude/skills/`.

### 2. Add rules to your project's CLAUDE.md

Paste the content from [`claude-md-template.en.md`](claude-md-template.en.md) into your project's `CLAUDE.md` file.

This enables always-on behaviors (like writing changelog after every change) even outside of `/todo` sessions. Without it, these rules only apply when the skill is actively invoked.

> **Why both?** The skill handles interactive operations (`/todo` → generate, resume, phase flow). The CLAUDE.md rules handle always-on behaviors (write changelog on every change, guide planning content to PLAN.md). Skill alone = changelog only written during `/todo`. Template alone = no `/todo` command. Together = full workflow.

## Usage

### Start

```
/todo
```

The skill detects the current state automatically:

- **No TODO.md** → offers to generate one from PLAN.md
- **TODO.md with remaining items** → shows progress, lets you pick what to do next
- **All items resolved** → offers next steps (review, clear, commit, next phase)

### Common commands

| What you say | What happens |
|-------------|-------------|
| `/todo` | Check status or generate TODO |
| `next` / `continue` / `keep going` | Do the next item |
| `finish all` | Execute all remaining items |
| `do item 3` | Work on a specific item |
| `item 3 is blocked because...` | Mark as blocked `[-]` with reason |
| `skip item 4` | Mark as skipped `[~]` |
| `insert a temp task: fix the typo` | Add a temporary sub-task without disrupting the main flow |
| `clear todo` | Clear TODO.md for the next round |

### Task states

```markdown
- [ ] Not started
- [x] Done
- [-] Blocked (reason noted inline)
- [~] Skipped (reason noted inline)
```

## Features

- **Phase awareness** — reads PLAN.md phases, tracks which phase you're on via `<!-- phase: N -->`, guides you to the next phase when done
- **Dependencies** — mark `(depends: 3)` on a task; the skill warns you if the dependency isn't done yet
- **Smart git detection** — on resume, compares recent commits against unchecked items and suggests which ones might already be done (never auto-marks, always asks)
- **Incremental changelog** — writes to CHANGELOG.md immediately on each item completion, not after the fact; batches by git commit (or by TODO round if no git)
- **Temporary tasks** — interrupt the flow with `[temp]` sub-tasks without losing your place in the main line
- **No-git support** — works in projects without git; git-dependent features (smart detection, commit) are skipped gracefully

## Where does PLAN.md come from?

This skill **reads PLAN.md but does not generate it**. You have a few options:

- **Write it yourself** — just a markdown file with your goals and phases, no special format required
- **Use another skill or brainstorm session** — let Claude help you think through directions, then save the result as PLAN.md
- **Skip it** — when no PLAN.md exists, the skill asks how you'd like to proceed; you can just tell it what to do directly

That said, having a PLAN.md significantly improves the experience — it gives Claude a north star to generate better TODOs and prevents getting lost in details.

## FAQ

**Q: I installed the skill but changelog isn't being written outside of `/todo` sessions.**
A: You need to also paste the template from `claude-md-template.en.md` into your project's CLAUDE.md. The skill only activates when you call `/todo`; the CLAUDE.md rules are what make changelog writing always-on.

**Q: Can I use this without git?**
A: Yes. Git-dependent features (smart detection of completed work, commit option, commit-based changelog batching) are automatically skipped. Changelog batches by TODO round instead.

**Q: Does the skill modify PLAN.md?**
A: Never. It only reads PLAN.md to understand your goals and phases. If the plan needs updating, it will remind you, but you make the changes yourself.

**Q: What if my PLAN.md doesn't use "Phase 1, Phase 2" format?**
A: The skill recognizes various formats — "Phase", "Stage", "Step", numbered sections, Chinese equivalents like "第一阶段". If there's no phase structure at all, it treats the whole plan as one phase.

## License

MIT
