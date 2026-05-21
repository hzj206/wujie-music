# Cloudflare Pages 部署说明

## 1. 创建 GitHub 仓库

1. 在 GitHub 创建一个空仓库。
2. 在 MuseHub 项目根目录初始化 Git。
3. 检查 `.gitignore` 已排除本地编辑器状态、自动化临时目录和审计截图。

```bash
git init
git add .
git commit -m "release: prepare musehub pages deploy"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 2. 创建 Cloudflare Pages 项目

1. 打开 Cloudflare Dashboard。
2. 进入 Workers & Pages。
3. 选择 Create application。
4. 切到 Pages。
5. 选择 Import an existing Git repository。
6. 连接刚推送的 GitHub 仓库。

## 3. 构建配置

MuseHub 是纯静态项目，没有 Node 构建产物。

| 配置项 | 值 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | 留空或仓库根目录 |
| Build command | `exit 0` |
| Build output directory | `.` |

部署目录必须包含根级 `index.html`。Pages 会直接发布仓库根目录的 HTML、CSS、JS、assets、manifest、favicon、service worker 和文档资源。

## 4. 路由与 404

- 应用内部使用 hash 路由，例如 `/#/search`。
- hash 不依赖服务端 rewrite，Cloudflare Pages 刷新根入口时仍会加载 `index.html`。
- 根目录 `404.html` 处理未知物理路径，并自动回到 `/#/home`。
- 不要把路由改成 history 模式，除非以后额外补 Pages rewrite 策略。

## 5. favicon、manifest 与 PWA

- `favicon.ico`、`favicon-32x32.png`、`apple-touch-icon.png` 位于根目录。
- `site.webmanifest` 引用 `assets/icons` 下的 192 和 512 图标。
- `sw.js` 仅缓存站点静态资源和首页离线壳。
- service worker 不缓存第三方音乐 API、歌词响应或播放 URL。

## 6. 自定义域名与 HTTPS

1. 在 Pages 项目的 Custom domains 中添加域名。
2. 按 Cloudflare 提示完成 DNS 绑定。
3. 等待 HTTPS 证书就绪。
4. 将 `robots.txt`、`sitemap.xml` 及 `public/` 下副本中的 `https://musehub.pages.dev` 替换为最终域名。

## 7. 缓存刷新

- 每次 push 到 `main` 后等待 Pages 生成新的 production deployment。
- 若浏览器仍显示旧 service worker 版本，可刷新页面后在 DevTools Application 面板确认 `sw.js` 已更新。
- 若 CDN 或浏览器保留旧站点壳，先确认资源 query 版本和 Pages 最新部署，再按需清理缓存。

## 8. 常见问题

### 站点根路径 404

确认 Build output directory 指向包含 `index.html` 的目录。本项目应为 `.`。

### 页面路由刷新异常

确认访问路径采用 `/#/route`，而不是 history 路由路径。

### 搜索或播放失败

搜索、播放链接和歌词来自第三方公开 API。网络超时、平台无音源、授权限制和浏览器音频策略都可能触发友好失败提示。

### PWA 离线仍无法搜索

这是预期行为。离线缓存只保证静态首页和已缓存资源可打开，搜索与播放仍依赖网络。

## 9. 发布前清单

- `node --check` 检查全部 `js/*.js` 和 `sw.js`。
- 本地打开 `/#/home`、`/#/search`、`/#/player`、`/#/lyrics`。
- 检查 `site.webmanifest`、favicon、`robots.txt`、`sitemap.xml` 和 `404.html`。
- 在手机宽度下确认 TabBar 与底部播放器不互相遮挡。
