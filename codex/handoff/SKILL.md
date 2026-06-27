---
name: handoff
description: >-
  Generate HANDOFF.md for Codex session context handoff. Captures decisions,
  implicit knowledge, in-progress work, and references to TODO/git that would be
  lost between Codex conversations. Primary trigger: /handoff.
  Also use when the user says handoff, context handoff, session handoff, or 交接.
---

# Handoff

Generate a `HANDOFF.md` file that captures what would be lost between Codex conversations. Do not duplicate content already in `TODO.md`, `CHANGELOG.md`, or git history; reference those sources instead.

# Information Source

Default: generate from **conversation context only**: what was discussed, committed, decided, and left open during this session.

Only read external sources, such as `git log`, `TODO.md`, `PLAN.md`, and `git status`, when the conversation context is insufficient. For example, read them when the user invokes `/handoff` at the very start of a session and wants to capture prior state.

# Generating HANDOFF.md

## Sections

### 本次完成

List commit hashes only. One line per commit, no re-summarizing:

```markdown
## 本次完成

- f64cc21 fix(plugin): 修正安装命令路径
- c450434 docs: 安装文档更新
```

If there are uncommitted staged changes, note them as `(uncommitted)`.

### 进行中 / 未完成

Only list work that is actually in progress: partially done, blocked, or represented by uncommitted changes. Do not list TODO items that have not started; they are already in `TODO.md`.

```markdown
## 进行中 / 未完成

- dev 分支 6 个 commit 未推远程，未合并 master
- git status: HANDOFF.md 未提交
```

### 待决定

This is the most important section. Only capture decisions that were genuinely discussed in the conversation but not finalized. Do not invent hypothetical decisions or list things that were never brought up.

- Options considered and why no conclusion was reached
- Trade-offs the user is still weighing
- Questions raised but not answered

```markdown
## 待决定

- 插件发布节奏：用户想先本地验证再推远程，但完整安装流程仍待真实环境确认
```

If nothing was discussed but left open, write `无`. Never pad this section.

### 关键上下文

This is the second most important section. Capture ideas, design rationale, and decision context from the conversation: things that informed choices but are not recorded in code or docs.

- Brainstorming ideas that came up but were not implemented
- Design rationale: why option A was chosen over B
- User preferences or constraints expressed in conversation
- Strategic thinking about project direction

```markdown
## 关键上下文

- Commit 规范选 Conventional Commits 而非自定义格式，主要为了可读性；自动 changelog/版本号工具链暂不作为当前目标
- Handoff 设计原则：引用不重复，重点写盲区；本次完成用 git hash，进行中引用 TODO 项号
```

If there is no such context, write `无`.

### 备注

Technical gotchas, platform quirks, and workarounds discovered during the session. These are reference notes for future debugging, not project direction context:

```markdown
## 备注

- PowerShell 默认编码可能影响中文输出，读取 markdown 时优先显式使用 UTF-8
- Codex 没有 Claude plugin hooks，常驻规则依赖目标项目的 AGENTS.md / AGENT.md
```

This section is optional; omit it if there is nothing to note.

### 下一步

One to three bullets. Keep them brief and actionable:

```markdown
## 下一步

- 本地测试 Codex skill 安装路径
- 同步 README 中 Codex /handoff 安装说明
```

# User Interaction

1. Gather the minimum context needed.
2. Draft the full `HANDOFF.md` content in the conversation.
3. Ask the user to review it, especially pending decisions or implicit knowledge that may be missing.
4. Write `HANDOFF.md` only after the user confirms.

# Rules

- `HANDOFF.md` is always overwritten, not appended. It represents the current session's handoff state.
- Keep it short. If a section would only repeat `TODO.md`, `CHANGELOG.md`, or git history, reference those sources instead.
- The value of `HANDOFF.md` is in `待决定` and `关键上下文`. If those are empty, the handoff has little value; prompt the user to think about what their future self should know.
- Add the session date and topic as a blockquote under the heading: `> 本次会话：YYYY-MM-DD · topic`.
- Keep platform-specific behavior Codex-native. Avoid non-Codex tool references unless contrasting documented platform limitations.
