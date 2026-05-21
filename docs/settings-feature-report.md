# MuseHub 第六阶段设置中心报告

## 已实现设置项

- 设置页左侧分区真实切换：`personal`、`playback`、`cache`、`privacy`、`about`。
- 默认搜索来源：`all`、`tencent`、`netease`，首页和搜索页都会读取。
- 播放策略：自动换源、优先原平台/优先可用性。
- 主题模式：暖阳奶油、清新薄荷、星夜静谧、樱花粉。
- 动画效果：关闭后 body 添加 `reduce-motion`，禁用主要 transition/animation/hover 上浮。
- 歌词设置：字体大小、歌词高亮颜色、歌词位置、滚动歌词开关。
- 播放器样式：`mini`、`standard`、`wide`，影响底部播放器。
- 本地缓存：估算 localStorage 缓存大小，支持确认后清理。
- 隐私与安全：清空搜索历史、清空最近播放、导出本地数据、导入本地数据。
- 关于 MuseHub：补充版本、技术栈、存储方式、免责声明。

## localStorage 设置结构

设置统一保存到 `musehub:settings`：

```json
{
  "defaultSource": "all",
  "autoSwitchSource": true,
  "preferOriginalPlatform": false,
  "themeMode": "cream",
  "animationEnabled": true,
  "lyricFontSize": "standard",
  "lyricColor": "coral",
  "lyricPosition": "center",
  "lyricScrollEnabled": true,
  "playerStyle": "standard",
  "volume": 0.8,
  "playMode": "list",
  "cachePolicy": {
    "keepSearchHistory": true,
    "keepRecentPlayed": true,
    "keepLyricsCache": true
  }
}
```

旧字段 `lyricSize`、`lyricScroll` 会兼容读取，并写回等价的新字段。

## 全站联动

- `defaultSource`：影响首页默认来源、搜索页无 `source` 参数时的来源、首页搜索跳转 URL。
- `autoSwitchSource`：播放失败时是否尝试其他来源。
- `preferOriginalPlatform`：关闭后允许在当前搜索结果中优先尝试更稳定来源。
- `themeMode`：切换 body 主题 class，并通过 CSS 变量影响全站颜色。
- `animationEnabled`：切换 `reduce-motion`，减少动画和 hover 位移。
- `lyricFontSize`、`lyricColor`、`lyricPosition`：影响播放器页歌词卡片与歌词专注页。
- `lyricScrollEnabled`：关闭后只高亮歌词，不自动滚动到当前句。
- `playerStyle`：影响底部播放器 mini/standard/wide 布局。
- `volume`、`playMode`：同步全局 audio 音量和循环模式。

## 缓存清理策略

普通缓存清理会清理：

- `musehub:search-history`
- `musehub:recent-played`
- `musehub:history`
- `musehub:current-song`
- `musehub:current-song-id`
- `musehub:player-state`
- `musehub:song-cache`

不会清理：

- `musehub:favorites`
- `musehub:playlists`
- `musehub:later-list`
- `musehub:settings`

缓存大小通过 localStorage 字符串长度估算。

## 隐私与安全

- 项目无需登录，不保存账号凭证。
- 不使用 QQ/网易云 Cookie，不接扫码登录。
- 收藏、歌单、稍后听、播放历史都保存在本地浏览器。
- 第三方公开 API 提供搜索、播放与歌词能力。
- 不提供会员歌曲破解，不提供下载服务。

## 导入导出格式

导出 JSON 包含：

- `favorites`
- `playlists`
- `laterList`
- `settings`
- `version`
- `exportedAt`

导入时会校验 JSON 基本结构；格式错误会 Toast 提示，不会写入。

## 仍然保留的限制

- 歌词缓存字段已预留，但当前版本尚未持久化歌词缓存。
- 主题切换主要通过全局 CSS 变量覆盖，少量插画资源不会随主题替换。
- 播放策略的“优先可用性”是轻量实现，后续可加入更完整的源质量评分。
