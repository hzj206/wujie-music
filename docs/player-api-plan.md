# 无界音乐 MuseHub 播放与歌词 API 接入计划

## 播放接口设计

播放链路统一走 `PlayerService.playSong(song)`：

1. 根据歌曲来源判断平台。
2. 调用播放链接接口解析真实 `url`。
3. 将播放接口返回的 `url`、`link`、`quality`、`cover`、`duration` 写回统一 `Song` 对象。
4. 交给 `Player.playResolvedSong(song)` 设置全局 `HTMLAudioElement`。
5. 播放成功后写入 `musehub:recent-played`，并异步请求歌词。

全项目只创建一个 `audio` 实例，由 `js/player.js` 维护。

## QQ 音乐播放接口

优先调用：

- `GET https://api.vkeys.cn/v2/music/tencent/geturl?id={id}&quality=8`
- `GET https://api.vkeys.cn/v2/music/tencent/geturl?id={id}&quality=4`
- `GET https://api.vkeys.cn/v2/music/tencent/geturl?id={id}`

如果歌曲没有数字 `id`，改用 `mid`。如果 `geturl` 接口失败，会尝试：

- `GET https://api.vkeys.cn/v2/music/tencent?id={id}`
- `GET https://api.vkeys.cn/v2/music/tencent?mid={mid}`

当前策略优先保证可播放，不默认追求最高音质。

## 网易云音乐播放接口

调用：

- `GET https://api.vkeys.cn/v2/music/netease?id={id}&quality=4`
- `GET https://api.vkeys.cn/v2/music/netease?id={id}&quality=3`
- `GET https://api.vkeys.cn/v2/music/netease?id={id}`

如果接口返回 `data.url` 为空，视为当前歌曲暂无可用音源。

## 歌词接口

QQ 音乐：

- `GET https://api.vkeys.cn/v2/music/tencent/lyric?id={id}`
- `GET https://api.vkeys.cn/v2/music/tencent/lyric?mid={mid}`

网易云音乐：

- `GET https://api.vkeys.cn/v2/music/netease/lyric?id={id}`

歌词服务优先读取 `data.lrc`，同时保留 `data.trans`。LRC 会解析为：

```js
[
  { time: 12.42, text: "歌词内容" }
]
```

## Audio 全局状态设计

`js/player.js` 维护：

- `currentSong`
- `queue`
- `isPlaying`
- `isLoading`
- `loadingSongId`
- `progress`
- `duration`
- `volume`
- `lyricStatus`

监听 `audio` 的 `loadedmetadata`、`timeupdate`、`play`、`pause`、`ended`、`error` 事件，同步迷你播放器、底部播放条、播放器页和歌词页。

## 播放失败处理策略

- 接口失败：提示“网络好像走丢了，请稍后再试。”
- 没有播放地址：提示“当前歌曲暂无可用音源，可以试试其他来源。”
- 浏览器播放失败：提示“播放失败，可能是音源失效或浏览器限制。”
- 会员或版权限制：提示“当前歌曲可能暂不可播放，请尝试其他版本或其他来源。”
- 歌词为空：提示“暂无歌词。”

如果开启自动换源，会在当前播放队列中寻找歌名和歌手完全相同、来源不同的歌曲做一次轻量兜底。
