# TODO

<!-- phase: 1 -->

- [x] 用 create-next-app 初始化项目，配置 TypeScript + Tailwind
- [x] 搭建基础布局组件：Header、Footer、Layout
- [x] 实现 Markdown 文件读取工具函数（gray-matter + remark）(depends: 1)
- [x] 首页文章列表：读取 /posts 目录，按日期倒序展示标题和摘要 (depends: 3)
- [x] 文章详情页：动态路由 [slug]，渲染 Markdown 内容 (depends: 3)
- [x] 代码高亮：集成 rehype-pretty-code (depends: 5)
  - [x] [temp] 修复代码块在移动端溢出的样式问题
  - [x] [temp] 顺手把行号显示也加上
- [x] 响应式适配：移动端导航折叠菜单 (depends: 2)
