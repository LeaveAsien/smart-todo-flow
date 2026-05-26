# Smart TODO Flow Example

This example shows how Smart TODO Flow turns a project plan into a persistent execution loop:

```text
PLAN.md -> /todo -> TODO.md -> work item by item -> CHANGELOG.md
```

The sample project is a personal blog. It starts with a phased plan, generates actionable TODO files, handles interrupts and blocked work, then records completed changes as a changelog.

## 1. Start With A Plan

[`PLAN.md`](PLAN.md) describes the project direction:

- Phase 1: set up a blog with Next.js, Markdown posts, layout, and responsive pages
- Phase 2: add tags, RSS, search, dark mode, and SEO
- Phase 3: deploy, optimize performance, and write seed posts

The skill reads this file as context. It does not rewrite the plan automatically, so the big-picture direction stays under your control.

## 2. Generate The First TODO

When you run:

```text
/todo
```

Smart TODO Flow detects that no active TODO exists and generates a concrete execution list for the current phase.

See [`TODO-phase1.md`](TODO-phase1.md):

```markdown
<!-- phase: 1 -->

- [x] 用 create-next-app 初始化项目，配置 TypeScript + Tailwind
- [x] 搭建基础布局组件：Header、Footer、Layout
- [x] 实现 Markdown 文件读取工具函数（gray-matter + remark）(depends: 1)
- [x] 首页文章列表：读取 /posts 目录，按日期倒序展示标题和摘要 (depends: 3)
```

The generated TODO is not just a flat checklist. It can carry phase markers and dependency hints like `(depends: 3)`, so the assistant knows which items should come first.

## 3. Keep Interrupts Without Losing The Main Flow

During implementation, small extra tasks often appear. Instead of replacing the main plan, Smart TODO Flow keeps them as temporary sub-items under the related task:

```markdown
- [x] 代码高亮：集成 rehype-pretty-code (depends: 5)
  - [x] [temp] 修复代码块在移动端溢出的样式问题
  - [x] [temp] 顺手把行号显示也加上
```

This keeps side work visible without turning the whole TODO into noise.

## 4. Resume With Real Task State

Phase 2 shows a more realistic mid-project state. See [`TODO-phase2.md`](TODO-phase2.md):

```markdown
<!-- phase: 2 -->

- [-] RSS 订阅：生成 feed.xml (blocked: 还没确定最终的文章 URL 结构，等产品确认)
- [~] 暗色模式 (skipped: 设计稿还没给暗色配色方案)
- [ ] SEO 优化：添加 Open Graph meta、生成 sitemap.xml (depends: 4)
```

The status markers make resume behavior more useful:

- `[ ]` means not started
- `[x]` means done
- `[-]` means blocked, with the reason inline
- `[~]` means skipped, with the reason inline

When you come back later, the assistant can report what is done, what is blocked, what was skipped, and what can proceed next.

## 5. Continue After A Blocker Is Resolved

[`TODO-phase2-resumed.md`](TODO-phase2-resumed.md) shows the same phase after the RSS blocker is resolved:

```markdown
- [x] RSS 订阅：生成 feed.xml
  - [x] [temp] 顺便加上 Atom 格式支持
- [~] 暗色模式 (skipped: 设计稿还没给暗色配色方案)
- [x] SEO 优化：添加 Open Graph meta、生成 sitemap.xml (depends: 4)
```

Because SEO depended on RSS, it becomes safe to complete once RSS is unblocked.

## 6. Record Changes As Work Finishes

Each completed item is recorded in [`CHANGELOG.md`](CHANGELOG.md):

```markdown
## 2026-05-28 (Phase 2 收尾)
- add RSS feed.xml + Atom 格式支持
- add Open Graph meta 标签
- add sitemap.xml 自动生成
```

The result is a small but durable project memory:

- `PLAN.md` preserves direction
- `TODO.md` tracks the current execution state
- `CHANGELOG.md` records what actually changed

That is the core value: you can close the session, come back later, run `/todo`, and continue from a readable project state instead of reconstructing context from memory.
