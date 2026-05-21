# Cloudflare Pages 发布准备报告

## 本阶段完成

- 根入口补齐 SEO、Open Graph、Twitter Card、favicon、Apple touch icon 和 manifest 引用。
- 路由标题根据首页、搜索、歌单、收藏、设置、播放器和歌词页面切换。
- 站点资源从旧 `assets/generated` 归档到 `assets/bg`、`assets/images`、`assets/avatars`、`assets/icons`。
- 保留 README 首页预览图，清理阶段性审计截图、临时图片目录和未引用贴纸。
- 增加根级 `404.html`、`offline.html`、`robots.txt`、`sitemap.xml` 与 `public/` 副本。
- 增加轻量 `sw.js`，只缓存本地静态资源，不缓存第三方 API 和播放 URL。
- 增加 `.gitignore`、MIT `LICENSE`、完整 README 与 Cloudflare Pages 部署说明。

## Cloudflare Pages 适配结论

- MuseHub 仍是纯静态 HTML/CSS/JavaScript 项目。
- 入口为根目录 `index.html`。
- 应用路由继续使用 hash，不需要服务端 rewrite。
- Pages 发布根目录配置可使用 Build command `exit 0`、Build output directory `.`。
- `404.html` 用于物理未知路径回流；应用内部未知 hash 路由仍由前端回到首页。

## 资源与加载优化

- favicon、PWA 图标和 Apple touch icon 统一来自同一枚品牌标记。
- 首屏预加载头像和首页 Hero 背景。
- JS 继续使用 `defer`。
- 页面图片仍使用 lazy load，远端封面保留失败 fallback。
- service worker 离线壳优先保证站点可打开，不把播放 URL 放入长期缓存。

## 域名上线前要改

- 将 `robots.txt` 和 `sitemap.xml` 中的默认 `https://musehub.pages.dev` 换成最终 Pages 域名或自定义域名。
- 若 GitHub Pages 使用仓库子路径，需要复核 `404.html` 的根路径跳转。

## 边界

- 第三方音乐 API 的 CORS、网络波动、音源授权和歌词可用性仍决定实际播放体验。
- 轻量 PWA 不实现离线搜索和离线播放。
- 当前没有生产埋点、错误上报或 CI 流程，部署验证仍以静态检查和浏览器 smoke 为主。
