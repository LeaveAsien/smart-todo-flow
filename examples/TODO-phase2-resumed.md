# TODO

<!-- phase: 2 -->

> This example shows what Phase 2 looks like after resuming:
> the RSS block was resolved, dark mode is still skipped,
> and SEO (which depended on RSS) can now proceed.

- [x] 文章 frontmatter 增加 tags 字段，解析并收集所有标签
- [x] 标签页 /tags/[tag]：列出该标签下的所有文章 (depends: 1)
- [x] 首页文章卡片显示标签徽章 (depends: 1)
- [x] RSS 订阅：生成 feed.xml
  - [x] [temp] 顺便加上 Atom 格式支持
- [x] 搜索功能：集成 Fuse.js，首页顶部搜索框
  - [x] [temp] 搜索结果高亮匹配关键词
- [~] 暗色模式 (skipped: 设计稿还没给暗色配色方案)
- [x] SEO 优化：添加 Open Graph meta、生成 sitemap.xml (depends: 4)
