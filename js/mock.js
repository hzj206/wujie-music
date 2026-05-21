(function () {
  const sharedLyric = [
    { time: 0, jp: "星座になれたら", zh: "如果能成为星座" },
    { time: 28, jp: "君と集まって星座になれたら", zh: "如果能和你一起 聚在星座之下" },
    { time: 54, jp: "星降る夜 一瞬の願いごと", zh: "星光落下的夜晚 许下瞬间的愿望" },
    { time: 78, jp: "もう少しだけ そばにいさせて", zh: "再让我靠近你一点点就好" },
    { time: 106, jp: "泣き虫でもいいよ", zh: "就算爱哭也没关系" },
    { time: 134, jp: "強がらなくてもいいよ", zh: "不必逞强 也没关系" },
    { time: 160, jp: "君が笑うなら それだけでいいや", zh: "只要你能微笑 那就足够了" },
    { time: 190, jp: "夜明け前のメロディー", zh: "黎明之前的旋律" }
  ];

  // `cover` is a CSS tone fallback used only during mock development.
  // Future music APIs should provide `coverUrl`/`imageUrl` for real song, album, MV, or artist images.
  const songs = [
    {
      id: "song-1",
      source: ["QQ音乐", "网易云音乐"],
      name: "星座になれたら",
      artist: "结束バンド",
      album: "结束バンド",
      duration: "03:28",
      cover: "tone-pink",
      tags: ["SQ", "独家"],
      url: "#mock/song-1",
      lyric: sharedLyric
    },
    {
      id: "song-2",
      source: ["QQ音乐", "网易云音乐"],
      name: "忘れてやらない",
      artist: "结束バンド",
      album: "结束バンド",
      duration: "04:08",
      cover: "tone-yellow",
      tags: ["SQ", "独家"],
      url: "#mock/song-2",
      lyric: sharedLyric
    },
    {
      id: "song-3",
      source: ["QQ音乐", "网易云音乐"],
      name: "ギターと孤独と蒼い惑星",
      artist: "结束バンド",
      album: "结束バンド",
      duration: "03:57",
      cover: "tone-blue",
      tags: ["SQ"],
      url: "#mock/song-3",
      lyric: sharedLyric
    },
    {
      id: "song-4",
      source: ["网易云音乐"],
      name: "あのバンド",
      artist: "结束バンド",
      album: "结束バンド",
      duration: "04:27",
      cover: "tone-gray",
      tags: ["SQ", "独家"],
      url: "#mock/song-4",
      lyric: sharedLyric
    },
    {
      id: "song-5",
      source: ["QQ音乐"],
      name: "カラカラ",
      artist: "结束バンド",
      album: "结束バンド",
      duration: "04:15",
      cover: "tone-room",
      tags: ["SQ"],
      url: "#mock/song-5",
      lyric: sharedLyric
    },
    {
      id: "song-6",
      source: ["QQ音乐", "网易云音乐"],
      name: "夜に駆ける",
      artist: "YOASOBI",
      album: "夜に駆ける",
      duration: "04:21",
      cover: "tone-night",
      tags: ["Hi-Res"],
      url: "#mock/song-6",
      lyric: sharedLyric
    },
    {
      id: "song-7",
      source: ["网易云音乐"],
      name: "晴る",
      artist: "ヨルシカ",
      album: "晴る",
      duration: "04:30",
      cover: "tone-sky",
      tags: ["SQ"],
      url: "#mock/song-7",
      lyric: sharedLyric
    },
    {
      id: "song-8",
      source: ["本地音乐"],
      name: "城市日落时分",
      artist: "放松音乐",
      album: "日落散步",
      duration: "03:45",
      cover: "tone-sunset",
      tags: ["治愈"],
      url: "#mock/song-8",
      lyric: sharedLyric
    }
  ];

  const playlists = [
    {
      id: "playlist-1",
      name: "深夜循环",
      count: 28,
      description: "夜深人静，耳机里的温柔陪伴",
      covers: ["tone-city", "tone-night", "tone-dusk", "tone-blue"]
    },
    {
      id: "playlist-2",
      name: "通勤路上",
      count: 34,
      description: "地铁与耳机，开启一天的能量",
      covers: ["tone-sky", "tone-city", "tone-garden", "tone-dusk"]
    },
    {
      id: "playlist-3",
      name: "学习专注",
      count: 41,
      description: "专注当下，效率与旋律同行",
      covers: ["tone-room", "tone-garden", "tone-sky", "tone-vinyl"]
    },
    {
      id: "playlist-4",
      name: "日系治愈",
      count: 26,
      description: "温柔日系，治愈每一个瞬间",
      covers: ["tone-garden", "tone-sky", "tone-sunset", "tone-room"]
    },
    {
      id: "playlist-5",
      name: "运动燃曲",
      count: 30,
      description: "节奏起跳，运动更有动力",
      covers: ["tone-yellow", "tone-city", "tone-dusk", "tone-sunset"]
    },
    {
      id: "playlist-6",
      name: "怀旧经典",
      count: 50,
      description: "那些年，我们一起听过的歌",
      covers: ["tone-vinyl", "tone-room", "tone-gray", "tone-sunset"]
    }
  ];

  const settings = {
    defaultSource: "all",
    autoSwitchSource: true,
    preferOriginalPlatform: false,
    themeMode: "cream",
    animationEnabled: true,
    lyricFontSize: "standard",
    lyricColor: "coral",
    lyricPosition: "center",
    lyricSize: "medium",
    lyricScrollEnabled: true,
    lyricScroll: true,
    playerStyle: "standard",
    volume: 0.8,
    playMode: "list",
    cachePolicy: {
      keepSearchHistory: true,
      keepRecentPlayed: true,
      keepLyricsCache: true
    }
  };

  const hotSearches = ["孤独摇滚", "星座になれたら", "青春コンプレックス", "忘れてやらない", "YOASOBI", "夜に駆ける", "新宝島", "あのバンド"];

  const trendSongs = [
    { songId: "song-1", plays: "12.3万" },
    { songId: "song-2", plays: "9.8万" },
    { songId: "song-3", plays: "7.1万" },
    { songId: "song-4", plays: "6.5万" }
  ];

  const relatedHot = [
    { name: "孤独摇滚", count: "32.1万" },
    { name: "孤独摇滚 名场面", count: "18.7万" },
    { name: "结束バンド", count: "12.4万" },
    { name: "星座になれたら", count: "9.8万" },
    { name: "ぼっち・ざ・ろっく！", count: "7.6万" }
  ];

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.Mock = {
    songs,
    playlists,
    settings,
    hotSearches,
    trendSongs,
    relatedHot,
    sourceOptions: [
      { id: "all", label: "全部" },
      { id: "tencent", label: "QQ音乐" },
      { id: "netease", label: "网易云音乐" }
    ]
  };
})();
