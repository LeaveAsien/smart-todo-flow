# TODO

<!-- phase: 2 -->

> This example shows what Phase 2 looks like after resuming:
> the RSS blocker was resolved, dark mode is still skipped,
> and SEO (which depended on RSS) can now proceed.

- [x] Add tags field to post frontmatter, parse and collect all tags
- [x] Tag page /tags/[tag]: list all posts under that tag (depends: 1)
- [x] Show tag badges on homepage post cards (depends: 1)
- [x] RSS feed: generate feed.xml
  - [x] [temp] Add Atom format support while at it
- [x] Search: integrate Fuse.js, search bar at top of homepage
  - [x] [temp] Highlight matching keywords in search results
- [~] Dark mode (skipped: design team hasn't provided dark color scheme)
- [x] SEO optimization: add Open Graph meta, generate sitemap.xml (depends: 4)
