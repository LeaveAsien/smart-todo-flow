## 项目管理

本项目用三份文档管理任务流程：

| 文档 | 定位 | 更新时机 |
|------|------|----------|
| `PLAN.md` | 全局规划：目标、阶段、方向 | 方向变化时更新 |
| `TODO.md` | 执行清单：当前要做的具体步骤 | `/todo` 生成；做完一项打 `[x]` |
| `CHANGELOG.md` | 变更记录：每次改动的记录 | 每完成一项 TODO 立即追加 |

### 工作流规则

- 讨论中产出**方向性/规划性内容**（多个方向、阶段划分、目标愿景）→ 先写 PLAN.md，再从中挑选生成 TODO
- 每完成一个 TODO 项 → 立即在 CHANGELOG.md 追加记录，同一批改动归在同一个标题下
- CHANGELOG 格式：`## YYYY-MM-DD (批次摘要)` + `- <动词> <描述>`
- 详细的 TODO 状态管理（生成、续接、阶段流转）见 `/todo`
- 会话交接使用 `/handoff` 生成 `HANDOFF.md`，记录待决定事项、设计理由和跨 Codex 会话会丢失的上下文

### Codex 注意事项

- Codex 不运行 Claude Code plugin hooks。若要在非 `/todo` 会话中保持常驻行为，请把这些规则保留在 `AGENTS.md` / `AGENT.md`。
- 完整工作流建议同时安装两个 Codex skill：`codex/todo/` 负责任务状态，`codex/handoff/` 负责会话交接。
