# 无界音乐 MuseHub 搜索 API 接入计划

## 本阶段接入接口

- QQ 音乐点歌/搜索整合接口：`GET https://api.vkeys.cn/v2/music/tencent`
- 网易云音乐点歌/搜索整合接口：`GET https://api.vkeys.cn/v2/music/netease`

当前仅使用搜索参数：

- `word`：搜索关键词
- `page`：页码，默认 `1`
- `num`：每页数量，默认 `10`

本阶段不传 `choose`、`id`、`mid`，不请求播放链接，不请求歌词。

## 数据模型统一

页面只消费标准化后的 `Song` 对象：

```js
{
  id: "",
  mid: "",
  vid: "",
  source: "tencent",
  sourceName: "QQ音乐",
  name: "",
  artist: "",
  album: "",
  duration: 0,
  durationText: "",
  cover: "",
  playable: true,
  hasLyric: false,
  hasMv: false,
  raw: {}
}
```

`js/normalize.js` 负责把 QQ 音乐和网易云音乐不同字段转换为统一结构，并保留原始响应到 `raw`，方便后续播放、歌词、MV 阶段复用。

## 搜索流程

1. 首页输入关键词并选择来源。
2. 点击搜索按钮或按 Enter。
3. 跳转到 `#/search?q=关键词&source=来源`。
4. 搜索页从 URL 读取 `q`、`source`、`page`。
5. `js/search-service.js` 根据来源调用对应接口。
6. `source=all` 时并行请求 QQ 音乐和网易云音乐。
7. 接口结果经 `js/normalize.js` 标准化后渲染到歌曲列表。
8. 成功搜索后写入 `musehub:search-history`。
9. 搜索结果写入歌曲缓存，使收藏和播放器 UI 可以识别真实搜索歌曲。

## 本阶段暂不做

- 不接入真实播放链接。
- 不创建或驱动真实 `audio` 播放。
- 不请求真实歌词。
- 不实现歌词同步滚动。
- 不接入 MV 播放。
- 不做自动换源播放。
- 不对聚合结果做复杂去重。
