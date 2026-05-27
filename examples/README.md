[English](README.md) | [中文](README.zh-CN.md)

# Smart TODO Flow Examples

This example shows how Smart TODO Flow turns a project plan into a persistent execution loop:

```text
PLAN.md -> /todo -> TODO.md -> work through items -> CHANGELOG.md
```

The sample project is a personal blog. Starting from a phased plan, it generates an actionable TODO, handles interruptions and blockers, and records completed changes as a changelog.

## 1. Start with a plan

[`PLAN.md`](en/PLAN.md) describes the project direction:

- Phase 1: Build a blog with Next.js — Markdown posts, layout, responsive pages
- Phase 2: Add tags, RSS, search, dark mode, SEO
- Phase 3: Deploy, performance optimization, write seed posts

The skill reads this file as context. It never modifies the plan — the big picture stays in your hands.

## 2. Generate the first TODO round

Run:

```text
/todo
```

The skill detects there is no active TODO and generates a concrete execution checklist for the current phase.

See [`TODO-phase1.md`](en/TODO-phase1.md):

```markdown
<!-- phase: 1 -->

- [x] Initialize project with create-next-app, configure TypeScript + Tailwind
- [x] Build base layout components: Header, Footer, Layout
- [x] Implement Markdown file reader utility (gray-matter + remark) (depends: 1)
- [x] Homepage post list: read /posts directory, display titles and excerpts by date (depends: 3)
```

The generated TODO is more than a flat list. It includes phase markers and dependency hints (e.g. `(depends: 3)`), so the assistant knows which items should come first.

## 3. Interruptions without losing the main flow

Extra small tasks often come up during execution. Smart TODO Flow inserts them as temporary sub-items under the relevant task, instead of replacing the main plan:

```markdown
- [x] Code highlighting: integrate rehype-pretty-code (depends: 5)
  - [x] [temp] Fix code block overflow on mobile
  - [x] [temp] Add line numbers while at it
```

Temporary work is visible but doesn't turn the entire TODO into noise.

## 4. Resume with real state

Phase 2 shows a more realistic mid-project state. See [`TODO-phase2.md`](en/TODO-phase2.md):

```markdown
<!-- phase: 2 -->

- [-] RSS feed: generate feed.xml (blocked: final post URL structure not decided, waiting for product confirmation)
- [~] Dark mode (skipped: design team hasn't provided dark color scheme)
- [ ] SEO optimization: add Open Graph meta, generate sitemap.xml (depends: 4)
```

Four status markers make resuming more useful:

- `[ ]` Not started
- `[x]` Done
- `[-]` Blocked, with reason inline
- `[~]` Skipped, with reason inline

When you come back next time, the assistant can report what's done, what's blocked, what's skipped, and what can continue.

## 5. Continue after a blocker is resolved

[`TODO-phase2-resumed.md`](en/TODO-phase2-resumed.md) shows the same phase after the RSS blocker is resolved:

```markdown
- [x] RSS feed: generate feed.xml
  - [x] [temp] Add Atom format support while at it
- [~] Dark mode (skipped: design team hasn't provided dark color scheme)
- [x] SEO optimization: add Open Graph meta, generate sitemap.xml (depends: 4)
```

Since SEO depends on RSS, SEO can only be safely completed after the RSS blocker is resolved.

## 6. Record changes on completion

Each completed item is recorded in [`CHANGELOG.md`](en/CHANGELOG.md):

```markdown
## 2026-05-28 (Phase 2 wrap-up)
- add RSS feed.xml + Atom format support
- add Open Graph meta tags
- add sitemap.xml auto-generation
```

This forms a small but persistent project memory:

- `PLAN.md` stores the direction
- `TODO.md` tracks the current execution state
- `CHANGELOG.md` records actual changes

This is the core value: close the session, come back later, run `/todo`, and resume from readable project state — instead of rebuilding context from scratch.
