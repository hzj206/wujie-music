# MuseHub 静态资源规划

本阶段生成的图片只用于 MuseHub 的 UI 装饰、背景氛围和空状态提示，不作为歌曲、专辑、MV 或歌手内容图使用。

## 已生成并接入的静态装饰资源

| 文件 | 用途 | 类型 |
| --- | --- | --- |
| `assets/bg/home-hero-room.webp` | 首页 Hero 右侧原创少女乐队音乐房间主视觉 | 静态装饰背景 |
| `assets/bg/search-side-room.webp` | 搜索页右上角原创听歌/搜索房间氛围图 | 静态装饰背景 |
| `assets/bg/player-room.webp` | 播放器详情页沉浸式暖色音乐房间背景 | 静态装饰背景 |
| `assets/bg/lyrics-night-room.webp` | 歌词专注页夜晚房间背景 | 静态装饰背景 |
| `assets/bg/favorites-cozy-corner.webp` | 本地收藏页侧栏个人音乐角落插画 | 静态装饰插画 |
| `assets/bg/settings-turntable-corner.webp` | 设置页侧栏音乐摆件插画 | 静态装饰插画 |
| `assets/avatars/musehub-tv-avatar.png` | 顶部导航右侧品牌小电视头像 | 通用透明装饰 |
| `assets/images/pink-mascot.png` | 首页贴纸、空状态装饰 | 通用透明装饰 |
| `assets/images/dog-mascot.png` | 收藏空状态装饰 | 通用透明装饰 |
| `assets/images/turntable-sticker.png` | 首页底部角落装饰 | 通用透明装饰 |
| `assets/images/notes-sticker.png` | 首页 Hero 小音符贴纸 | 通用透明装饰 |
| `assets/images/headphones-sticker.png` | 搜索页卡片氛围贴纸 | 通用透明装饰 |
| `assets/images/paper-stickers.png` | 首页底部贴纸装饰 | 通用透明装饰 |
| `assets/images/music-stickers.png` | 通用贴纸原始合成表，可继续裁切复用 | 通用透明装饰 |

## 仍保持动态替换的位置

以下位置当前只使用 mock 阶段的 `tone-*` 渐变占位，后续接入 API 时必须替换为真实接口返回图片链接：

- 歌曲封面
- 专辑封面
- MV 封面
- 歌手头像
- 平台返回的歌单封面或内容图

`js/ui.js` 的 `cover(entity, sizeClass)` 已预留 `coverUrl` / `imageUrl` 支持。未来 API 返回图片时，只需要在歌曲、专辑或歌单对象中传入 `coverUrl` 或 `imageUrl`，当前 `tone-*` 会作为加载失败或无图时的 fallback。

## 边界原则

- 静态生成图只服务于页面氛围、装饰和品牌识别。
- 不把生成图写死为任何音乐内容封面。
- 当前 mock 封面只是开发占位，不代表真实音乐内容。
- API 接入后，内容图由平台接口动态渲染，静态资源继续保留为 UI 装饰层。
