---
name: handoff
description: Generate HANDOFF.md for session context handoff — captures decisions, implicit knowledge, and references to TODO/git that would be lost between sessions
triggers:
  - /handoff
  - handoff
  - 交接
---

# Handoff

Generate a HANDOFF.md that captures what would be lost between sessions. Do NOT duplicate content already in TODO.md, CHANGELOG.md, or git history — reference them instead.

# Information Source

Default: generate from **conversation context only** — what was discussed, committed, decided, and left open during this session. Do NOT re-read files or run git commands if the information is already known from the conversation.

Only read external sources (`git log`, `TODO.md`, `PLAN.md`, `git status`) when the conversation context is insufficient — e.g. the user invokes `/handoff` at the very start of a session to capture prior state.

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

Only list work that is **actually in progress** — partially done, blocked, or has uncommitted changes. Do NOT list TODO items that haven't started; they are already in TODO.md.

```markdown
## 进行中 / 未完成

- dev 分支 6 个 commit 未推远程，未合并 master
- git status: HANDOFF.md 未提交
```

### 待决定

**This is the most important section.** Only capture decisions that were **genuinely discussed** in the conversation but not finalized. Do NOT invent hypothetical decisions or list things that were never brought up.

- Options considered and why no conclusion was reached
- Trade-offs the user is still weighing
- Questions raised but not answered

```markdown
## 待决定

- 插件发布节奏：用户想先本地验证再推远程，但 --plugin-dir 无法测试 /plugin add 完整流程
```

If nothing was discussed but left open, write "无". Never pad this section.

### 关键上下文

**The second most important section.** Capture ideas, design rationale, and decision context from the conversation — things that informed choices but aren't recorded in code or docs:

- Brainstorming ideas that came up but weren't implemented
- Design rationale: why option A was chosen over B
- User preferences or constraints expressed in conversation
- Strategic thinking about project direction

```markdown
## 关键上下文

- Commit 规范选 Conventional Commits 而非自定义格式，主要为了可读性，工具链生态（自动 changelog/版本号）目前不需要
- Handoff 设计原则：引用不重复，重点写盲区；本次完成用 git hash，进行中引用 TODO 项号
```

If there is no such context, write "无".

### 备注

Technical gotchas, platform quirks, workarounds discovered during the session. These are reference notes for future debugging, not project direction context:

```markdown
## 备注

- grep -oP 在 Windows Git Bash 不可用，用 sed -n 替代
- claude plugin validate 会报 CLAUDE.md warning，可忽略
```

Optional section — omit if nothing to note.

### 下一步建议

One to three bullet points. Brief, actionable:

```markdown
## 下一步

- 本地测试插件安装
- 实现 /handoff skill
```

# User Interaction

1. After gathering information, draft the full HANDOFF.md content
2. Present to user for review — especially ask if there are pending decisions or implicit knowledge you missed
3. Write to HANDOFF.md only after user confirms

# Rules

- HANDOFF.md is always overwritten, not appended — it represents the current session's state
- Keep it short — if a section would just repeat what's in TODO or git, use references
- The value of HANDOFF.md is in "待决定" and "关键上下文" — if those are empty, the handoff has little value; prompt the user to think about what they'd want their future self to know
- Add the session date and topic as a blockquote under the heading: `> 本次会话：YYYY-MM-DD · topic`
