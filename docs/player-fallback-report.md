# MuseHub 第五阶段播放兜底报告

## 问题分析

部分 QQ 音乐歌曲会在 `/v2/music/tencent/geturl` 返回 `code=500`，常见原因是接口侧判断当前歌曲无音源、付费专辑、版权或试听限制。网易云点歌接口也经常返回 `code=200` 但 `data.url` 为空。第五阶段将这些情况视为“歌曲不可播放”，不再当作程序异常。

## 状态修复

- `Player.setLoading(song)` 只记录 `pendingSong` 与 `loadingSongId`，不提前切换 `currentSong`。
- 只有拿到有效 URL 后，才进入 `playResolvedSong(song)` 提交播放。
- 如果 `audio.play()` 失败，会回滚到上一首 `currentSong`，清理 loading，播放按钮恢复默认。
- 播放失败不会让失败歌曲留在底部播放器、播放器页或歌词页。
- 切歌时先清空旧歌词并标记歌词加载中，旧歌词请求返回后会按歌曲 id/requestId 丢弃。

## QQ 音乐兜底顺序

1. `/v2/music/tencent/geturl?id=xxx&quality=8`
2. `/v2/music/tencent/geturl?id=xxx&quality=4`
3. `/v2/music/tencent/geturl?id=xxx`
4. `/v2/music/tencent/geturl?mid=xxx&quality=8`
5. `/v2/music/tencent/geturl?mid=xxx&quality=4`
6. `/v2/music/tencent/geturl?mid=xxx`
7. `/v2/music/tencent?id=xxx&quality=4`
8. `/v2/music/tencent?mid=xxx&quality=4`
9. `/v2/music/tencent?id=xxx`
10. `/v2/music/tencent?mid=xxx`

任一步拿到 `data.url` 后立即停止。

## 网易云兜底顺序

1. `/v2/music/netease?id=xxx&quality=4`
2. `/v2/music/netease?id=xxx&quality=3`
3. `/v2/music/netease?id=xxx`

如果仍无 `url`，显示“当前歌曲暂无可用音源，可以试试其他版本或其他来源。”

## 自动换源策略

- 设置中开启自动换源时，先从当前搜索结果和播放队列查找其他来源候选。
- 匹配规则包含歌名完全相同、清理括号/remix/live/变速等后相似、歌手相同或相近。
- 当前列表没有候选时，使用 `歌名 + 歌手` 做一次轻量 `source=all` 后台搜索。
- 最多尝试 3 首候选，不做无限递归。
- 换源成功 Toast：“当前来源不可用，已为你切换到其他来源。”

## 不可播放 UI 表现

- 搜索列表播放按钮退出 loading。
- 当前播放歌曲不被失败歌曲污染。
- 底部播放器、播放器页、歌词页保留上一首可播放歌曲。
- Toast 给出温和提示，不白屏，不产生控制台错误。
