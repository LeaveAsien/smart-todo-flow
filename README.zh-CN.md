[English](README.md) | [中文](README.zh-CN.md)

# Smart TODO Flow

一个 Claude Code skill，为 AI 辅助编程会话提供轻量的执行记忆层，围绕三份联动文档构建：**PLAN.md** → **TODO.md** → **CHANGELOG.md**。

让大方向规划、逐步执行和变更记录在多次对话之间保持同步。

## 为什么需要

Claude Code 很强大，但 AI 辅助编程会话有几个反复出现的工作流痛点：

- **没有持久的执行记忆** — 关掉对话，下次打开可能丢失哪些做了、哪些没做、为什么这么做
- **规划和执行容易脱节** — PLAN.md 可以写好大方向，但实际执行经常变成零散的临时步骤
- **事后很难还原变更记录** — 长时间工作后，容易忘记到底改了什么、哪个 TODO 项触发了哪个变更

Smart TODO Flow 用三个纯 markdown 文件作为持久的、人类可读的项目状态来解决这些问题。

它不是要替代 issue tracker，更适合作为项目、功能分支或本地 worktree 里的小型本地执行层。

## 适用场景

- 个人项目和小型代码库
- 跨多次对话的 AI 辅助编程会话
- 需要分支级执行笔记的功能分支或本地 worktree
- 不需要完整项目管理系统的轻量变更追踪

## 工作原理

| 文档 | 定位 | 更新时机 |
|------|------|----------|
| `PLAN.md` | 大方向：目标、阶段、方向 | 方向变化时更新 |
| `TODO.md` | 执行清单：当前阶段的具体步骤 | `/todo` 生成；完成后打 `[x]` |
| `CHANGELOG.md` | 变更记录：改了什么、什么时候改的 | 每完成一项 TODO 自动追加 |

典型流程：

```
写 PLAN.md（目标和阶段）
        ↓
  /todo → 从当前阶段生成 TODO.md
        ↓
  逐项执行
  （每完成一项 → 自动追加到 CHANGELOG.md）
        ↓
  全部完成 → 检查 → 清空 → 下一阶段
```

## 演示

以一个博客项目为例，展示 PLAN → TODO → CHANGELOG 的流转：

```markdown
# PLAN.md
## Phase 2 — 功能扩展
5. 标签系统
6. RSS 订阅
7. 搜索功能
8. 暗色模式
9. SEO 优化
```

运行：

```text
/todo
```

skill 把规划转化为执行状态：

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

完成任务后，changelog 增量更新：

```markdown
# CHANGELOG.md
## 2026-05-28 (Phase 2 收尾)
- add RSS feed.xml + Atom 格式支持
- add Open Graph meta 标签
- add sitemap.xml 自动生成
```

完整示例见 [`examples/`](examples/README.zh-CN.md)。

## 安装

需要两部分，搭配使用才能获得完整体验：

### 1. 添加 skill 文件

**一键安装：**

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/LeaveAsien/smart-todo-flow/master/smart-todo-flow.md \
  -o ~/.claude/skills/todo.md --create-dirs

# Windows (PowerShell)
New-Item -ItemType Directory -Force ~/.claude/skills | Out-Null
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/LeaveAsien/smart-todo-flow/master/smart-todo-flow.md" `
  -OutFile "$HOME/.claude/skills/todo.md"
```

**手动安装：** 下载 [`smart-todo-flow.md`](smart-todo-flow.md)，保存为 `~/.claude/skills/todo.md`。

### 2. 在项目的 CLAUDE.md 中添加规则

把 [`claude-md-template.md`](claude-md-template.md) 的内容粘贴到你项目的 `CLAUDE.md` 文件中。

这样即使不在 `/todo` 会话中，也能启用常驻行为（如每次改动自动写 changelog）。否则这些规则只在调用 `/todo` 时生效。

> **为什么需要两部分？** skill 负责交互操作（`/todo` → 生成、续接、阶段流转）。CLAUDE.md 规则负责常驻行为（每次改动写 changelog、引导规划内容到 PLAN.md）。只装 skill = changelog 仅在 `/todo` 期间写入。只贴模板 = 没有 `/todo` 命令。两者搭配 = 完整工作流。

## 使用方法

### 开始

```
/todo
```

skill 自动检测当前状态：

- **没有 TODO.md** → 提议从 PLAN.md 生成
- **TODO.md 有未完成项** → 显示进度，让你选择下一步
- **所有项已处理** → 提供选项（检查、清空、提交、下一阶段）

### 常用命令

| 你说的 | 发生什么 |
|--------|---------|
| `/todo` | 查看状态或生成 TODO |
| `下一个` / `继续` / `接着做` | 做下一项（默认，利用缓存省 token） |
| `全部做完` | 一次性执行所有剩余项（token 消耗较高） |
| `做第 3 项` | 指定某一项开始 |
| `第 3 项阻塞了，因为...` | 标记为阻塞 `[-]` 并附原因 |
| `跳过第 4 项` | 标记为跳过 `[~]` |
| `插入临时任务：修个 typo` | 插入临时子任务，不打乱主线 |
| `清空 todo` | 清空 TODO.md 准备下一轮 |

### 任务状态

```markdown
- [ ] 未开始
- [x] 已完成
- [-] 阻塞（原因写在行内）
- [~] 跳过（原因写在行内）
```

## 功能特性

- **阶段感知** — 读取 PLAN.md 的阶段结构，通过 `<!-- phase: N -->` 追踪当前阶段，完成后引导进入下一阶段
- **依赖关系** — 任务标注 `(depends: 3)` 后，执行时会提醒前置依赖未完成
- **智能 git 检测** — 续接时对比近期 commit 和未完成项，建议哪些可能已完成（仅建议，不自动标记）
- **增量 changelog** — 每完成一项立即写入 CHANGELOG.md，有 git 按 commit 分批，无 git 按 TODO 轮次分批
- **临时任务** — 用 `[temp]` 子任务中断主线，完成后自动回到主流程
- **无 git 支持** — 没有 git 的项目也能用，git 相关功能（智能检测、提交）自动跳过

## PLAN.md 从哪来？

这个 skill **只读取 PLAN.md，不会生成或修改它**。你可以：

- **自己写** — 就是一个 markdown 文件，写上目标和阶段，没有格式要求
- **用其他 skill 或头脑风暴** — 让 Claude 帮你梳理方向，然后保存为 PLAN.md
- **不写** — 没有 PLAN.md 时，skill 会问你怎么做；你可以直接告诉它要做什么

不过有 PLAN.md 会明显改善体验——给 Claude 一个大方向，生成的 TODO 更靠谱，也不容易在细节里迷失。

## 常见问题

**问：装了 skill 但 `/todo` 之外不写 changelog。**
答：还需要把 `claude-md-template.md` 的内容粘贴到项目的 CLAUDE.md 里。skill 只在调用 `/todo` 时激活，CLAUDE.md 规则才是让 changelog 常驻写入的关键。

**问：没有 git 能用吗？**
答：可以。git 相关功能（智能检测已完成工作、提交选项、按 commit 分批 changelog）会自动跳过。changelog 改为按 TODO 轮次分批。

**问：skill 会修改 PLAN.md 吗？**
答：不会。它只读取 PLAN.md 来理解目标和阶段。如果计划需要更新，它会提醒你，但修改由你自己来。

**问：PLAN.md 不用 "Phase 1, Phase 2" 的格式行吗？**
答：可以。skill 能识别多种格式——"Phase"、"Stage"、"Step"、数字编号、中文的"第一阶段"等。如果完全没有阶段结构，整个计划会被当作一个阶段处理。

## 许可证

MIT
