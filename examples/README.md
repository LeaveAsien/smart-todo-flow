# Smart TODO Flow 示例

这个示例展示 Smart TODO Flow 如何将项目规划转化为持久的执行循环：

```text
PLAN.md -> /todo -> TODO.md -> 逐项执行 -> CHANGELOG.md
```

示例项目是一个个人博客。从分阶段规划开始，生成可执行的 TODO，处理中断和阻塞，最后将完成的变更记录为 changelog。

## 1. 从规划开始

[`PLAN.md`](PLAN.md) 描述项目方向：

- Phase 1：用 Next.js 搭博客，Markdown 文章、布局、响应式页面
- Phase 2：添加标签、RSS、搜索、暗色模式、SEO
- Phase 3：部署上线、性能优化、撰写种子文章

skill 读取这个文件作为上下文。它不会自动改写规划，大方向始终由你掌控。

## 2. 生成第一轮 TODO

运行：

```text
/todo
```

skill 检测到没有活跃的 TODO，就会为当前阶段生成具体的执行清单。

见 [`TODO-phase1.md`](TODO-phase1.md)：

```markdown
<!-- phase: 1 -->

- [x] 用 create-next-app 初始化项目，配置 TypeScript + Tailwind
- [x] 搭建基础布局组件：Header、Footer、Layout
- [x] 实现 Markdown 文件读取工具函数（gray-matter + remark）(depends: 1)
- [x] 首页文章列表：读取 /posts 目录，按日期倒序展示标题和摘要 (depends: 3)
```

生成的 TODO 不只是一个平铺的清单。它可以带阶段标记和依赖提示（如 `(depends: 3)`），让助手知道哪些项应该先做。

## 3. 中断不丢失主线

执行过程中经常会冒出额外的小任务。Smart TODO Flow 把它们作为临时子项插在相关任务下面，而不是替换主线计划：

```markdown
- [x] 代码高亮：集成 rehype-pretty-code (depends: 5)
  - [x] [temp] 修复代码块在移动端溢出的样式问题
  - [x] [temp] 顺手把行号显示也加上
```

临时工作可见但不会把整个 TODO 变成噪音。

## 4. 带真实状态续接

Phase 2 展示了一个更真实的项目中期状态。见 [`TODO-phase2.md`](TODO-phase2.md)：

```markdown
<!-- phase: 2 -->

- [-] RSS 订阅：生成 feed.xml (blocked: 还没确定最终的文章 URL 结构，等产品确认)
- [~] 暗色模式 (skipped: 设计稿还没给暗色配色方案)
- [ ] SEO 优化：添加 Open Graph meta、生成 sitemap.xml (depends: 4)
```

四种状态标记让续接更有用：

- `[ ]` 未开始
- `[x]` 已完成
- `[-]` 阻塞，原因写在行内
- `[~]` 跳过，原因写在行内

下次回来时，助手可以报告哪些做完了、哪些阻塞了、哪些跳过了、哪些可以继续。

## 5. 阻塞解除后继续

[`TODO-phase2-resumed.md`](TODO-phase2-resumed.md) 展示 RSS 阻塞解除后同一阶段的状态：

```markdown
- [x] RSS 订阅：生成 feed.xml
  - [x] [temp] 顺便加上 Atom 格式支持
- [~] 暗色模式 (skipped: 设计稿还没给暗色配色方案)
- [x] SEO 优化：添加 Open Graph meta、生成 sitemap.xml (depends: 4)
```

因为 SEO 依赖 RSS，RSS 解除阻塞后 SEO 才能安全完成。

## 6. 完成时记录变更

每完成一项就会记录到 [`CHANGELOG.md`](CHANGELOG.md)：

```markdown
## 2026-05-28 (Phase 2 收尾)
- add RSS feed.xml + Atom 格式支持
- add Open Graph meta 标签
- add sitemap.xml 自动生成
```

最终形成一套小而持久的项目记忆：

- `PLAN.md` 保存方向
- `TODO.md` 追踪当前执行状态
- `CHANGELOG.md` 记录实际变更

这就是核心价值：关掉会话，下次回来运行 `/todo`，从可读的项目状态继续，而不是从头重建上下文。
