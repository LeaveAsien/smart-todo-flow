# HANDOFF

> 本次会话：2026-06-13 · Conventional Commits 规范 + Handoff skill

## 本次完成

- 11acb9b docs(skill): commit 格式切换为 Conventional Commits 规范
- (uncommitted) skills/handoff/SKILL.md — /handoff skill 实现
- (uncommitted) TODO.md — Phase 2 TODO 重新整理

## 进行中 / 未完成

- dev 分支 6 个 commit 未推远程，未合并 master

## 待决定

- 插件发布节奏：用户想先本地验证再推远程，但 `--plugin-dir` 无法测试 `/plugin add` 完整流程，最终还是要推一次

## 关键上下文

- Commit 规范选 Conventional Commits 而非自定义格式，主要为了可读性，工具链生态（自动 changelog/版本号）目前不需要
- Handoff 设计原则：引用不重复，重点写盲区；本次完成用 git hash，进行中只列真正在做的，关键上下文放决策理由不放技术细节
- OpenSpec / Superpowers / TODO 模板三项在 TODO 里但没有外部需求驱动，用户没表态优先级

## 备注

- `grep -oP` 在 Windows Git Bash 不可用，hook 脚本中用 `sed -n` 替代
- `grep -c` 匹配 0 条时 exit code 1，用 `|| true` + `${VAR:-0}` 修复
- `claude plugin validate` 会报 "CLAUDE.md at plugin root is not loaded"，可忽略
- CLAUDE.md 和 AGENTS.md 在 .gitignore 里，改动只在本地

## 下一步

- 提交 handoff skill + TODO 变更
- 本地测试 `--plugin-dir` 验证 skill 和 hooks
- 推 dev → master 后真实测试 `/plugin add`
