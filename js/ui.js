(function () {
  let currentRoute = "home";
  let currentParams = {};
  let toastTimer = null;
  let searchDebounceTimer = null;
  let searchController = null;
  let searchSubmitImmediate = false;

  const routeLabels = {
    home: "发现音乐",
    search: "搜索",
    player: "播放器",
    lyrics: "歌词",
    playlists: "歌单",
    playlist: "歌单详情",
    favorites: "本地收藏",
    settings: "设置"
  };

  let searchRequestId = 0;
  let searchState = {
    key: "",
    status: "idle",
    result: null,
    error: ""
  };
  let favoriteViewMode = "grid";

  const iconPaths = {
    home: '<path d="m3 10.5 9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
    list: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    heart: '<path d="M20.8 7.3c0 5.2-8.8 10.5-8.8 10.5S3.2 12.5 3.2 7.3A4.3 4.3 0 0 1 11 4.8l1 1 1-1a4.3 4.3 0 0 1 7.8 2.5z"/>',
    settings: '<path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 0 1 0 4H21a1.7 1.7 0 0 0-1.6 1z"/>',
    play: '<polygon points="9 7 17 12 9 17 9 7"/>',
    pause: '<path d="M9 7h3v10H9zM14 7h3v10h-3z"/>',
    prev: '<path d="M6 7v10"/><polygon points="18 7 9 12 18 17 18 7"/>',
    next: '<path d="M18 7v10"/><polygon points="6 7 15 12 6 17 6 7"/>',
    volume: '<path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16 9.5a4 4 0 0 1 0 5"/>',
    lyrics: '<path d="M8 6h10M8 10h8M8 14h10M8 18h6"/><path d="M4 6h.01M4 10h.01M4 14h.01M4 18h.01"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    share: '<path d="M16 8l-8 4 8 4"/><circle cx="18" cy="7" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="17" r="2"/>',
    more: '<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>',
    back: '<path d="M15 18 9 12l6-6"/><path d="M10 12h11"/>',
    shuffle: '<path d="M4 7h3l10 10h3"/><path d="M17 7h3v3"/><path d="M4 17h3l3-3"/><path d="M17 17h3v-3"/>',
    repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    maximize: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/><path d="M3 8l5-5M16 3l5 5M21 16l-5 5M8 21l-5-5"/>',
    folder: '<path d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    chevronDown: '<path d="m7 10 5 5 5-5"/>'
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name, size, extraClass) {
    const content = iconPaths[name] || "";
    const className = extraClass ? ` ${extraClass}` : "";
    return `<svg class="icon${className}" width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
  }

  function sourceIdToLabel(source) {
    if (source === "qq" || source === "tencent") return "QQ音乐";
    if (source === "netease") return "网易云音乐";
    return "全部";
  }

  function normalizeSource(source) {
    return window.MuseHub.SearchService
      ? window.MuseHub.SearchService.normalizeSource(source)
      : (source === "qq" ? "tencent" : source || "all");
  }

  function sourceClass(label) {
    if (label === "QQ音乐") return "qq";
    if (label === "网易云音乐") return "netease";
    return "local";
  }

  function sourceDot(label) {
    if (label === "QQ音乐") return '<span class="source-dot qq">Q</span>';
    if (label === "网易云音乐") return '<span class="source-dot netease">N</span>';
    return '<span class="source-dot" style="background:#d7a95a">M</span>';
  }

  function sourcePill(label) {
    return `<span class="source-pill ${sourceClass(label)}">${sourceDot(label)}${escapeHtml(label)}</span>`;
  }

  function songSourceLabels(song) {
    if (Array.isArray(song.source)) return song.source;
    if (song.sourceName) return [song.sourceName];
    return [sourceIdToLabel(song.source)];
  }

  function durationLabel(song) {
    if (song.durationText) return song.durationText;
    if (typeof song.duration === "number") return window.MuseHub.Normalize.formatDuration(song.duration);
    return song.duration || "--:--";
  }

  function lyricText(line) {
    return line && (line.text || line.jp) || "";
  }

  function lyricTranslation(line) {
    return line && (line.translation || line.zh) || "";
  }

  function resultCountText(result) {
    if (!result) return "0";
    return result.totalIsEstimate ? `${result.total} 个当前页结果` : `${result.total || 0} 个`;
  }

  function pageNumber(value) {
    return Math.max(1, Number(value) || 1);
  }

  function searchKey(keyword, source, page) {
    return [String(keyword || "").trim(), normalizeSource(source || "all"), pageNumber(page)].join("::");
  }

  function currentUrlSource(fallback) {
    return normalizeSource(fallback || window.MuseHub.Storage.getSettings().defaultSource || "all");
  }

  function sourceSummary(source) {
    const normalized = normalizeSource(source);
    if (normalized === "all") return "聚合结果";
    return sourceIdToLabel(normalized);
  }

  function isCurrentSearchKey(key) {
    const current = window.MuseHub.Router.parseHash();
    if (current.route !== "search") return false;
    return searchKey(current.params.q || "", currentUrlSource(current.params.source), current.params.page) === key;
  }

  function resetSearchState() {
    clearTimeout(searchDebounceTimer);
    if (searchController) searchController.abort();
    searchState = { key: "", status: "idle", result: null, error: "" };
  }

  function startSearch(keyword, source, page, key) {
    const requestId = ++searchRequestId;
    if (searchController) searchController.abort();
    searchController = new AbortController();
    window.MuseHub.SearchService.search({ keyword, source, page, signal: searchController.signal, timeout: 12000 })
      .then((result) => {
        if (requestId !== searchRequestId || searchState.key !== key) return;
        window.MuseHub.Storage.addSearchHistory(result.keyword);
        searchState = { key, status: "success", result, error: "" };
        if (isCurrentSearchKey(key)) window.MuseHub.Router.renderCurrent();
      })
      .catch((error) => {
        if (requestId !== searchRequestId || searchState.key !== key) return;
        if (error && error.message === "请求已取消") return;
        searchState = {
          key,
          status: "error",
          result: null,
          error: error && error.message ? error.message : "搜索失败"
        };
        if (window.MuseHub.UI) showToast(searchState.error);
        if (isCurrentSearchKey(key)) window.MuseHub.Router.renderCurrent();
      });
  }

  function scheduleSearch(keyword, source, page, key, immediate) {
    clearTimeout(searchDebounceTimer);
    const delay = immediate ? 0 : 180;
    searchDebounceTimer = setTimeout(() => startSearch(keyword, source, page, key), delay);
  }

  function cover(entity, sizeClass) {
    const item = entity || {};
    const title = item.name || item.album || "MuseHub";
    const coverUrl = item.coverUrl || item.imageUrl || (/^https?:\/\//i.test(item.cover || "") ? item.cover : "");
    const style = coverUrl ? ` style="--cover-image:url('${escapeHtml(coverUrl)}')"` : "";
    const className = coverUrl ? "has-cover-image" : escapeHtml(item.cover || "tone-sunset");
    const image = coverUrl ? `<img src="${escapeHtml(coverUrl)}" alt="" loading="lazy" decoding="async" data-cover-img>` : "";
    return `<div class="cover ${sizeClass || "cover-sm"} ${className}" data-label="${escapeHtml(title)}"${style}>${image}</div>`;
  }

  function progressPercent(state) {
    if (!state.duration) return 0;
    return Math.min(100, Math.max(0, Math.round((state.progress / state.duration) * 100)));
  }

  function findSong(songId) {
    if (songId && typeof songId === "object") return songId;
    return window.MuseHub.Storage.getSong(songId) || window.MuseHub.Mock.songs[0];
  }

  function filterSongs(source) {
    const label = sourceIdToLabel(source);
    if (!source || source === "all") return window.MuseHub.Mock.songs.slice();
    return window.MuseHub.Mock.songs.filter((song) => song.source.includes(label));
  }

  function playerDisplaySong(state) {
    const display = state && (state.pendingSong || state.currentSong);
    if (display) return display;
    return {
      id: "",
      source: "local",
      sourceName: "MuseHub",
      name: "尚未播放歌曲",
      artist: "从搜索结果里点一首歌开始",
      album: "MuseHub",
      duration: 0,
      durationText: "--:--",
      cover: "tone-room",
      tags: []
    };
  }

  function renderHeader(route) {
    const nav = [
      { route: "home", label: "发现音乐", icon: "home", href: "#/home" },
      { route: "search", label: "搜索", icon: "search", href: "#/search" },
      { route: "playlists", label: "歌单", icon: "list", href: "#/playlists" },
      { route: "favorites", label: "本地收藏", icon: "heart", href: "#/favorites" },
      { route: "settings", label: "设置", icon: "settings", href: "#/settings" }
    ];
    return `
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="#/home" aria-label="无界音乐 MuseHub 首页">
            <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>
            <span class="brand-title"><strong>无界音乐</strong><span>MuseHub</span></span>
          </a>
          <nav class="main-nav" aria-label="主导航">
            ${nav.map((item) => `
              <a class="nav-link ${route === item.route || (route === "playlist" && item.route === "playlists") ? "is-active" : ""}" href="${item.href}">
                ${icon(item.icon, 22)}
                <span>${item.label}</span>
              </a>
            `).join("")}
          </nav>
          <div class="header-avatar" aria-hidden="true">
            <img class="brand-tv-img" src="./assets/avatars/musehub-tv-avatar.png" alt="" loading="eager" decoding="async" fetchpriority="high" width="72" height="72">
          </div>
        </div>
      </header>
    `;
  }

  function renderMobileTabBar(route) {
    const nav = [
      { route: "home", label: "发现", icon: "home", href: "#/home" },
      { route: "search", label: "搜索", icon: "search", href: "#/search" },
      { route: "playlists", label: "歌单", icon: "list", href: "#/playlists" },
      { route: "favorites", label: "收藏", icon: "heart", href: "#/favorites" },
      { route: "settings", label: "设置", icon: "settings", href: "#/settings" }
    ];
    return `
      <nav class="mobile-tabbar" aria-label="移动端导航">
        ${nav.map((item) => `
          <a class="mobile-tabbar-link ${route === item.route || (route === "playlist" && item.route === "playlists") ? "is-active" : ""}" href="${item.href}">
            ${icon(item.icon, 21)}
            <span>${item.label}</span>
          </a>
        `).join("")}
      </nav>
    `;
  }

  function renderSearchBar(value, compact, source) {
    return `
      <form class="search-bar ${compact ? "search-bar--compact" : ""} js-search-form" data-source="${escapeHtml(source || "all")}">
        <span class="row" style="justify-content:center;color:var(--color-text)">${icon("search", compact ? 24 : 30)}</span>
        <label class="sr-only" for="${compact ? "compact-search" : "hero-search"}">搜索关键词</label>
        <input id="${compact ? "compact-search" : "hero-search"}" name="keyword" value="${escapeHtml(value || "")}" placeholder="搜索歌曲 / 歌手 / 专辑 / 歌单 / 歌词" autocomplete="off">
        <button class="search-submit" type="submit" aria-label="搜索">${icon("search", compact ? 22 : 28)}</button>
      </form>
    `;
  }

  function renderSourceTabs(active) {
    const safeActive = normalizeSource(active || "all");
    return `
      <div class="source-tabs">
        ${window.MuseHub.Mock.sourceOptions.map((source) => `
          <button class="source-tab js-source-tab ${safeActive === source.id ? "is-active" : ""}" type="button" data-source="${source.id}">
            ${source.id === "all" ? icon("grid", 20) : sourceDot(source.label)}
            ${source.label}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderPlaylistCard(playlist) {
    return `
      <article class="playlist-card surface" data-playlist-id="${playlist.id}" tabindex="0" role="button" aria-label="打开歌单 ${escapeHtml(playlist.name)}">
        <div class="cover-collage" aria-hidden="true">
          ${playlist.covers.map((tone) => `<span class="${tone}"></span>`).join("")}
        </div>
        <div class="playlist-card-body">
          <h3>${escapeHtml(playlist.name)}</h3>
          <div class="playlist-count">${playlist.count} 首歌曲</div>
          <p>${escapeHtml(playlist.description)}</p>
        </div>
      </article>
    `;
  }

  function renderSongRow(song, index, options) {
    const playerState = window.MuseHub.Player.getState();
    const isPlaying = playerState.currentSong && playerState.currentSong.id === song.id && playerState.isPlaying;
    const active = playerState.currentSong && playerState.currentSong.id === song.id;
    const loading = playerState.loadingSongId === song.id && playerState.isLoading;
    const unavailable = song.playable === false;
    const favorite = window.MuseHub.Storage.isFavorite(song.id);
    const showIndex = options && options.showIndex;
    const playIcon = loading ? icon("rotate", showIndex ? 17 : 17, "spin-icon") : icon(isPlaying ? "pause" : "play", showIndex ? 17 : 17);
    if (showIndex) {
      return `
        <div class="song-index-row ${active && (isPlaying || loading) ? "is-playing" : ""} ${unavailable ? "is-unavailable" : ""}" data-song-id="${song.id}">
          <span class="song-rank">${String(index + 1).padStart(2, "0")}</span>
          ${cover(song, "cover-sm")}
          <div class="song-meta">
            <div class="song-title">${escapeHtml(song.name)}</div>
            <div class="song-artist">${escapeHtml(song.artist)}</div>
          </div>
          <span class="song-duration">${options.plays || song.duration}</span>
          <button class="icon-btn js-play ${loading ? "is-loading" : ""}" type="button" data-play-song="${song.id}" aria-label="播放 ${escapeHtml(song.name)}">${playIcon}</button>
        </div>
      `;
    }
    return `
      <article class="song-row ${active && (isPlaying || loading) ? "is-playing" : ""} ${unavailable ? "is-unavailable" : ""}" data-song-id="${song.id}">
        <div class="song-main">
          <div class="song-cover-wrap">
            ${cover(song, "cover-sm")}
            <button class="icon-btn quick-play js-play ${loading ? "is-loading" : ""}" type="button" data-play-song="${song.id}" aria-label="播放 ${escapeHtml(song.name)}">${loading ? icon("rotate", 15, "spin-icon") : icon(isPlaying ? "pause" : "play", 15)}</button>
          </div>
          <div class="song-meta">
            <div class="song-title">
              <span>${escapeHtml(song.name)}</span>
              <span class="song-tags">${(song.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}${unavailable ? '<span class="tag tag-muted">暂无音源</span>' : ""}</span>
            </div>
            <div class="song-artist">${escapeHtml(song.artist)}</div>
          </div>
        </div>
        <div class="song-album">《${escapeHtml(song.album)}》</div>
        <div class="song-duration">${durationLabel(song)}</div>
        <div class="song-sources">${songSourceLabels(song).map(sourcePill).join("")}</div>
        <div class="song-actions">
          <button class="icon-btn js-play ${loading ? "is-loading" : ""}" type="button" data-play-song="${song.id}" aria-label="播放 ${escapeHtml(song.name)}">${playIcon}</button>
          <button class="icon-btn favorite-btn js-favorite ${favorite ? "is-active" : ""}" type="button" data-favorite-song="${song.id}" aria-label="收藏 ${escapeHtml(song.name)}">${icon("heart", 18)}</button>
        </div>
      </article>
    `;
  }

  function renderSongList(songs, options) {
    if (!songs.length) {
      return `<div class="empty-state"><div><img class="empty-asset" src="./assets/images/pink-mascot.png" alt="" loading="lazy"><strong>没有找到歌曲</strong><span>换一个来源或关键词再试试</span></div></div>`;
    }
    return `<div class="song-list">${songs.map((song, index) => renderSongRow(song, index, options || {})).join("")}</div>`;
  }

  function renderMiniPlayer() {
    const state = window.MuseHub.Player.getState();
    const song = playerDisplaySong(state);
    const settings = window.MuseHub.Storage.getSettings();
    const percent = progressPercent(state);
    const loading = state.isLoading && state.loadingSongId === song.id;
    return `
      <section class="mini-player surface">
        <div class="mini-player-main">
          ${cover(song, "cover-md")}
          <button class="stack js-go-player" type="button" data-action="go-player" style="text-align:left;min-width:0">
            <h3>${escapeHtml(song.name)}</h3>
            <p>${loading ? "正在获取音源..." : escapeHtml(song.artist)}</p>
          </button>
          <button class="icon-btn favorite-btn js-favorite ${song.id && window.MuseHub.Storage.isFavorite(song.id) ? "is-active" : ""}" type="button" ${song.id ? `data-favorite-song="${song.id}"` : 'data-action="empty-player"'} aria-label="收藏">${icon("heart", 20)}</button>
          <button class="icon-btn is-primary js-toggle-play ${loading ? "is-loading" : ""}" type="button" data-action="toggle-play" aria-label="播放暂停">${loading ? icon("rotate", 22, "spin-icon") : icon(state.isPlaying ? "pause" : "play", 22)}</button>
          <button class="icon-btn js-next" type="button" data-action="next" aria-label="下一首">${icon("next", 20)}</button>
        </div>
        <div class="progress-line">
          <input class="range js-progress-input" type="range" min="0" max="100" value="${percent}" style="--value:${percent}%">
          <span class="muted"><span data-player-progress>${state.progressText}</span> / <span data-player-duration>${state.durationText}</span></span>
        </div>
      </section>
    `;
  }

  function renderHome(params) {
    const source = normalizeSource(params.source || window.MuseHub.Storage.getSettings().defaultSource || "all");
    const trend = window.MuseHub.Mock.trendSongs.map((item) => Object.assign({}, item, { song: findSong(item.songId) }));
    const playlists = window.MuseHub.Storage.getPlaylists ? window.MuseHub.Storage.getPlaylists() : window.MuseHub.Mock.playlists;
    return `
      <main class="site-main">
        <section class="page home-page">
          <div class="home-hero">
            <div class="hero-doodles" aria-hidden="true">
              <span class="tiny-star"></span><span class="tiny-star"></span><span class="tiny-star"></span>
              <span class="orbit-doodle"></span>
              <span class="person-doodle"></span>
            </div>
            <div class="hero-copy">
              <h1 class="hero-title">无界音乐 <span>MuseHub</span></h1>
              <p class="hero-subtitle">无需登录，即刻探索全网音乐</p>
              ${renderSearchBar(params.q || "", false, source)}
              <div class="hero-tabs">${renderSourceTabs(source)}</div>
            </div>
            <div class="room-hero" aria-hidden="true">
              <img class="hero-sticker hero-sticker--notes" src="./assets/images/notes-sticker.png" alt="" loading="lazy">
              <img class="hero-sticker hero-sticker--pink" src="./assets/images/pink-mascot.png" alt="" loading="lazy">
            </div>
          </div>

          <div class="home-panels">
            <section class="hot-search-card surface">
              <div class="row-between">
                <h2 class="section-title"><span class="title-mark">♨</span> 热门搜索</h2>
                <button class="icon-btn" type="button" data-action="refresh-hot" aria-label="刷新热搜">${icon("rotate", 18)}</button>
              </div>
              <div class="hot-chip-grid">
                ${window.MuseHub.Mock.hotSearches.map((keyword) => `<button class="chip chip-search" type="button" data-keyword="${escapeHtml(keyword)}">${escapeHtml(keyword)}</button>`).join("")}
              </div>
            </section>

            <section id="playlists" class="recommend-card surface">
              <div class="recommend-head row-between">
                <h2 class="section-title"><span class="title-mark">☆</span> 推荐歌单</h2>
                <a class="pill-btn" href="#/playlists">查看全部 ${icon("chevronDown", 16)}</a>
              </div>
              <div class="playlist-strip">
                ${playlists.slice(0, 4).map(renderPlaylistCard).join("")}
              </div>
            </section>

            <section class="trend-card surface">
              <h2 class="section-title"><span class="title-mark">♫</span> 趋势歌曲</h2>
              <div class="home-trend-list">
                ${trend.map((item, index) => renderSongRow(item.song, index, { showIndex: true, plays: item.plays })).join("")}
              </div>
            </section>
          </div>
          <div class="home-footer-decor">
            <span class="sticker-line">✦ 无界音乐 MuseHub - 聚合全网音乐，发现更多好音乐 ♫</span>
          </div>
        </section>
      </main>
    `;
  }

  function renderCategoryTabs(result) {
    const count = result && result.songs ? result.songs.length : 0;
    const categories = [
      { id: "all", label: count ? `全部（${count}）` : "全部", enabled: true },
      { id: "song", label: count ? `歌曲（${count}）` : "歌曲", enabled: true },
      { id: "artist", label: "歌手", enabled: false },
      { id: "album", label: "专辑", enabled: false },
      { id: "playlist", label: "歌单", enabled: false },
      { id: "lyric", label: "歌词", enabled: false },
      { id: "mv", label: "MV", enabled: false }
    ];
    return `
      <div class="category-tabs" role="tablist">
        ${categories.map((item, index) => `
          <button class="category-tab ${index === 0 ? "is-active" : ""} ${item.enabled ? "" : "is-disabled"}" type="button" role="tab" data-category="${item.id}" aria-disabled="${item.enabled ? "false" : "true"}">
            ${item.label}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderSearchState(keyword, source, page, state) {
    if (!keyword) {
      return `
        <div class="result-summary">
          <p>请输入关键词开始搜索</p>
          <button class="pill-btn" type="button" data-action="sort-results">综合排序 ${icon("chevronDown", 16)}</button>
        </div>
        <h2 class="result-section-title"><span class="decor-note">♫</span> 歌曲</h2>
        <div class="search-song-list">
          <div class="empty-state search-state">
            <div><img class="empty-asset" src="./assets/images/pink-mascot.png" alt="" loading="lazy"><strong>请输入关键词开始搜索</strong><span>可以试试首页热门词，或者直接搜索歌名 / 歌手</span></div>
          </div>
        </div>
      `;
    }

    if (state.status === "loading") {
      return `
        <div class="result-summary">
          <p>正在从 <strong>${sourceSummary(source)}</strong> 搜索 “<strong>${escapeHtml(keyword)}</strong>”</p>
          <button class="pill-btn" type="button" data-action="sort-results">综合排序 ${icon("chevronDown", 16)}</button>
        </div>
        <h2 class="result-section-title"><span class="decor-note">♫</span> 歌曲</h2>
        <div class="search-song-list">
          <div class="empty-state search-state search-state--loading">
            <div><span class="loading-note" aria-hidden="true">${icon("music", 30)}</span><strong>正在寻找音乐...</strong><span>正在连接 ${escapeHtml(sourceSummary(source))}</span></div>
          </div>
        </div>
      `;
    }

    if (state.status === "error") {
      return `
        <div class="result-summary">
          <p>搜索 “<strong>${escapeHtml(keyword)}</strong>” 时遇到了一点问题</p>
          <button class="pill-btn" type="button" data-action="retry-search">${icon("rotate", 16)} 重试</button>
        </div>
        <h2 class="result-section-title"><span class="decor-note">♫</span> 歌曲</h2>
        <div class="search-song-list">
          <div class="empty-state search-state search-state--error">
            <div><img class="empty-asset" src="./assets/images/dog-mascot.png" alt="" loading="lazy"><strong>网络好像走丢了，请稍后再试</strong><span>${escapeHtml(state.error || "接口暂时不可用")}</span><button class="btn btn-primary" type="button" data-action="retry-search">${icon("rotate", 17)} 再试一次</button></div>
          </div>
        </div>
      `;
    }

    const result = state.result || { songs: [], total: 0, totalIsEstimate: true, partialErrors: [] };
    const songs = result.songs || [];
    const partial = result.partialErrors && result.partialErrors.length
      ? `<div class="search-warning">部分来源暂时不可用：${result.partialErrors.map((item) => `${sourceIdToLabel(item.source)} ${escapeHtml(item.message)}`).join("；")}</div>`
      : "";
    const countText = resultCountText(result);
    return `
      <div class="result-summary">
        <p>为你找到 “<strong>${escapeHtml(keyword)}</strong>” 相关${source === "all" ? "聚合" : ""}结果 <strong>${escapeHtml(countText)}</strong></p>
        <button class="pill-btn" type="button" data-action="sort-results">综合排序 ${icon("chevronDown", 16)}</button>
      </div>
      ${partial}
      <h2 class="result-section-title"><span class="decor-note">♫</span> 歌曲</h2>
      <div class="search-song-list">
        ${songs.length ? renderSongList(songs) : `<div class="empty-state search-state"><div><img class="empty-asset" src="./assets/images/pink-mascot.png" alt="" loading="lazy"><strong>没有找到相关歌曲，换个关键词试试吧</strong><span>当前来源：${escapeHtml(sourceSummary(source))}</span></div></div>`}
      </div>
    `;
  }

  function renderSearch(params) {
    const keyword = String(params.q || "").trim();
    const source = currentUrlSource(params.source);
    const page = pageNumber(params.page);
    const key = searchKey(keyword, source, page);
    if (keyword && searchState.key !== key) {
      searchState = { key, status: "loading", result: null, error: "" };
      scheduleSearch(keyword, source, page, key, searchSubmitImmediate);
      searchSubmitImmediate = false;
    }
    const state = keyword ? searchState : { key: "", status: "idle", result: null, error: "" };
    const histories = window.MuseHub.Storage.getSearchHistory();
    return `
      <main class="site-main">
        <section class="page page--wide search-page">
          <div class="search-top">
            <div class="search-tools">
              ${renderSearchBar(keyword, true, source)}
              ${renderSourceTabs(source)}
            </div>
            <div class="search-room-card" aria-hidden="true">
              <img class="search-card-sticker" src="./assets/images/headphones-sticker.png" alt="" loading="lazy">
            </div>
          </div>
          <div class="search-content">
            <section class="search-results-card surface">
              ${renderCategoryTabs(state.result)}
              ${renderSearchState(keyword, source, page, state)}
            </section>
            <aside class="search-aside">
              <section class="aside-card surface">
                <div class="row-between">
                  <h2 class="section-title"><span class="title-mark">♨</span> 相关热搜</h2>
                  <button class="icon-btn" type="button" data-action="refresh-related-hot" aria-label="刷新">${icon("rotate", 18)}</button>
                </div>
                <div class="hot-rank-list">
                  ${window.MuseHub.Mock.relatedHot.map((item, index) => `
                    <button class="hot-rank-item chip-search" type="button" data-keyword="${escapeHtml(item.name)}">
                      <b>${index + 1}</b>
                      <span>${escapeHtml(item.name)}</span>
                      <span>${item.count}</span>
                    </button>
                  `).join("")}
                </div>
              </section>
              <section class="aside-card surface">
                <div class="row-between">
                  <h2 class="section-title">${icon("clock", 20)} 搜索历史</h2>
                  <button class="pill-btn" type="button" data-action="clear-search-history">${icon("trash", 15)} 清空</button>
                </div>
                <div class="search-history-chips">
                  ${histories.length ? histories.map((item) => `<button class="chip chip-search" type="button" data-keyword="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("") : '<span class="muted">暂无搜索历史</span>'}
                </div>
              </section>
              ${renderMiniPlayer()}
            </aside>
          </div>
          <div class="home-footer-decor"><span class="sticker-line">✦ 无界音乐 MuseHub - 聚合全网音乐，发现更多好音乐 ♫</span></div>
        </section>
      </main>
    `;
  }

  function renderPlayer() {
    const state = window.MuseHub.Player.getState();
    const song = playerDisplaySong(state);
    const percent = progressPercent(state);
    const lyricSong = state.currentSong || null;
    const lines = window.MuseHub.Lyric.displayLines(lyricSong);
    const active = window.MuseHub.Lyric.activeIndex(lyricSong, state.progress);
    const loading = state.isLoading && state.loadingSongId === song.id;
    const settings = window.MuseHub.Storage.getSettings();
    const lyricEmpty = state.lyricStatus === "empty" || state.lyricStatus === "error" || (!lines.length && state.lyricStatus !== "loading");
    return `
      <main class="site-main">
        <section class="player-page">
          <div class="player-room-bg" aria-hidden="true"></div>
          <div class="player-content">
            <div class="player-topline">
              <a class="pill-btn" href="#/home">${icon("back", 18)} 返回</a>
              <div class="segmented-row">
                <button class="pill-btn" type="button" data-action="go-lyrics">全屏歌词 ${icon("maximize", 16)}</button>
                <button class="pill-btn" type="button" data-action="open-lyric-settings">歌词设置 ${icon("sliders", 17)}</button>
              </div>
            </div>
            <div class="player-main">
              <section class="album-stage">
                ${cover(song, "cover-xl")}
                <div class="album-info">
                  <h1>${escapeHtml(song.name)}</h1>
                  <p>${escapeHtml(song.artist)}　｜　专辑：${escapeHtml(song.album)}</p>
                  <div class="song-meta-line">
                    <span class="muted">来源：</span>
                    ${songSourceLabels(song).map(sourcePill).join("")}
                  </div>
                  <div class="album-actions">
                    <button class="icon-btn favorite-btn js-favorite ${song.id && window.MuseHub.Storage.isFavorite(song.id) ? "is-active" : ""}" type="button" ${song.id ? `data-favorite-song="${song.id}"` : 'data-action="empty-player"'} aria-label="收藏">${icon("heart", 22)}</button>
                    <button class="icon-btn" type="button" data-action="share-current" aria-label="分享">${icon("share", 21)}</button>
                    <button class="icon-btn" type="button" data-action="open-more-menu" aria-label="更多">${icon("more", 22)}</button>
                  </div>
                </div>
                <div class="large-control-buttons">
                  <button class="icon-btn ${state.shuffleEnabled ? "is-active" : ""}" type="button" data-action="toggle-shuffle" aria-label="随机播放">${icon("shuffle", 20)}</button>
                  <button class="icon-btn" type="button" data-action="prev" aria-label="上一首">${icon("prev", 22)}</button>
                  <button class="icon-btn is-primary is-large ${loading ? "is-loading" : ""}" type="button" data-action="toggle-play" aria-label="播放暂停">${loading ? icon("rotate", 28, "spin-icon") : icon(state.isPlaying ? "pause" : "play", 28)}</button>
                  <button class="icon-btn" type="button" data-action="next" aria-label="下一首">${icon("next", 22)}</button>
                  <button class="icon-btn ${state.repeatMode === "one" ? "is-active" : ""}" type="button" data-action="toggle-repeat" aria-label="循环播放">${icon("repeat", 20)}</button>
                </div>
                <div class="time-progress" style="width:min(620px,100%)">
                  <span data-player-progress>${state.progressText}</span>
                  <input class="range js-progress-input" type="range" min="0" max="100" value="${percent}" style="--value:${percent}%">
                  <span data-player-duration>${state.durationText}</span>
                </div>
              </section>
              <aside class="lyrics-card surface lyric-size-${escapeHtml(settings.lyricFontSize)} lyric-color-${escapeHtml(settings.lyricColor)}">
                <div class="lyrics-card-head">
                  <h2 class="section-title">歌词</h2>
                  <button class="pill-btn" type="button" data-action="go-lyrics">全屏歌词 ${icon("maximize", 16)}</button>
                </div>
                <div class="lyrics-preview">
                  ${lines.length ? lines.map((line) => `
                    <div class="lyric-line ${line.index === active ? "is-active" : ""} ${Math.abs(line.index - active) === 1 ? "is-near" : ""}" data-lyric-index="${line.index}">
                      ${line.index === active ? '<span class="decor-note">♫</span> ' : ""}${escapeHtml(lyricText(line))}
                      ${lyricTranslation(line) ? `<span>${escapeHtml(lyricTranslation(line))}</span>` : ""}
                    </div>
                  `).join("") : `<div class="empty-state lyric-empty"><div><img class="empty-asset" src="./assets/images/notes-sticker.png" alt="" loading="lazy"><strong>${state.lyricStatus === "loading" ? "正在获取歌词..." : "暂无歌词"}</strong><span>${lyricEmpty ? "可以先享受旋律，歌词稍后再来" : "歌词载入中"}</span></div></div>`}
                </div>
              </aside>
            </div>
            <section class="queue-strip surface">
              <strong>播放列表（${state.queue.length || 0}）</strong>
              <div class="queue-list">
                ${state.queue.slice(0, 6).map((item) => `
                  <button class="queue-item js-play ${item.id === song.id ? "is-active" : ""}" type="button" data-play-song="${item.id}">
                    ${cover(item, "cover-sm")}
                    <span>
                      <h4>${escapeHtml(item.name)}</h4>
                      <p>${escapeHtml(item.artist)}</p>
                    </span>
                  </button>
                `).join("")}
              </div>
              <button class="pill-btn" type="button" data-action="show-queue">${icon("list", 17)} 全部展开</button>
            </section>
          </div>
        </section>
      </main>
    `;
  }

  function renderLyrics() {
    const state = window.MuseHub.Player.getState();
    const song = playerDisplaySong(state);
    const lyricSong = state.currentSong || null;
    const settings = window.MuseHub.Storage.getSettings();
    const percent = progressPercent(state);
    const active = window.MuseHub.Lyric.activeIndex(lyricSong, state.progress);
    const lyricLines = window.MuseHub.Lyric.displayLines(lyricSong);
    const loading = state.isLoading && state.loadingSongId === song.id;
    return `
      <main class="site-main">
        <section class="lyrics-full-page lyric-size-${escapeHtml(settings.lyricFontSize)} lyric-color-${escapeHtml(settings.lyricColor)} lyric-position-${escapeHtml(settings.lyricPosition)}">
          <div class="lyrics-focus-content">
            <div class="lyrics-focus-top">
              <a class="pill-btn" href="#/player">${icon("back", 18)} 返回播放器</a>
              <div class="lyrics-song-info">
                ${cover(song, "cover-md")}
                <h1>${escapeHtml(song.name)}</h1>
                <p class="muted">${escapeHtml(song.artist)}　｜　专辑：${escapeHtml(song.album)}</p>
                <div class="song-meta-line">${songSourceLabels(song).map(sourcePill).join("")}</div>
              </div>
              <div class="lyrics-top-actions">
                <button class="pill-btn" type="button" data-action="open-lyric-settings">${icon("sliders", 16)} 歌词设置</button>
                <button class="pill-btn" type="button" data-action="go-player">${icon("maximize", 16)} 退出全屏</button>
              </div>
            </div>
            <div class="lyrics-focus-list">
              ${lyricLines.length ? lyricLines.map((line, index) => `
                <div class="lyric-line ${index === active ? "is-active" : ""} ${Math.abs(index - active) === 1 ? "is-near" : ""}" data-lyric-index="${index}">
                  ${index === active ? '<span class="decor-note">♫</span> ' : ""}${escapeHtml(lyricText(line))}
                  ${lyricTranslation(line) ? `<span>${escapeHtml(lyricTranslation(line))}</span>` : ""}
                </div>
              `).join("") : `<div class="empty-state"><div><img class="empty-asset" src="./assets/images/notes-sticker.png" alt="" loading="lazy"><strong>${state.lyricStatus === "loading" ? "正在获取歌词..." : "暂无歌词"}</strong><span>如果接口没有返回歌词，播放器会继续保持播放</span></div></div>`}
            </div>
            <section class="focus-player-bar surface">
              <div class="player-track">
                ${cover(song, "cover-sm")}
                <span>
                  <h3>${escapeHtml(song.name)}</h3>
                  <p>${escapeHtml(song.artist)}</p>
                </span>
              </div>
              <div class="player-controls">
                <button class="icon-btn ${state.shuffleEnabled ? "is-active" : ""}" type="button" data-action="toggle-shuffle" aria-label="随机">${icon("shuffle", 19)}</button>
                <button class="icon-btn" type="button" data-action="prev" aria-label="上一首">${icon("prev", 21)}</button>
                <button class="icon-btn is-primary is-large ${loading ? "is-loading" : ""}" type="button" data-action="toggle-play" aria-label="播放暂停">${loading ? icon("rotate", 28, "spin-icon") : icon(state.isPlaying ? "pause" : "play", 28)}</button>
                <button class="icon-btn" type="button" data-action="next" aria-label="下一首">${icon("next", 21)}</button>
                <button class="icon-btn ${state.repeatMode === "one" ? "is-active" : ""}" type="button" data-action="toggle-repeat" aria-label="循环">${icon("repeat", 19)}</button>
              </div>
              <div class="time-progress">
                <span data-player-progress>${state.progressText}</span>
                <input class="range js-progress-input" type="range" min="0" max="100" value="${percent}" style="--value:${percent}%">
                <span data-player-duration>${state.durationText}</span>
              </div>
              <button class="pill-btn" type="button" data-action="go-player">${icon("maximize", 16)} 退出全屏</button>
            </section>
          </div>
        </section>
      </main>
    `;
  }

  function favoriteSectionTitle(section) {
    if (section === "later") return "稍后听";
    if (section === "recent") return "最近播放";
    return "收藏歌曲";
  }

  function renderFavorites(params) {
    const section = params && params.section ? params.section : "favorites";
    const query = String(params && params.q || "").trim();
    const favoriteSongs = window.MuseHub.Storage.getFavorites();
    const laterList = window.MuseHub.Storage.getLaterList ? window.MuseHub.Storage.getLaterList() : [];
    const recentPlayed = window.MuseHub.Storage.getRecentPlayed ? window.MuseHub.Storage.getRecentPlayed() : [];
    const playlists = window.MuseHub.Storage.getPlaylists ? window.MuseHub.Storage.getPlaylists() : window.MuseHub.Mock.playlists;
    const visibleSongs = section === "later" ? laterList : section === "recent" ? recentPlayed : favoriteSongs;
    const filteredSongs = query
      ? visibleSongs.filter((song) => `${song.name} ${song.artist} ${song.album}`.toLowerCase().includes(query.toLowerCase()))
      : visibleSongs;
    const sectionTitle = favoriteSectionTitle(section);
    return `
      <main class="site-main">
        <section class="page page--wide favorites-page">
          <div class="sidebar-layout favorites-shell">
            <aside class="side-menu">
              ${[
                ["我的收藏", "heart", "favorites", "#/favorites?section=favorites"],
                ["本地歌单", "music", "playlists", "#/playlists"],
                ["收藏歌曲", "heart", "favorites", "#/favorites?section=favorites"],
                ["稍后听", "clock", "later", "#/favorites?section=later"],
                ["最近播放", "clock", "recent", "#/favorites?section=recent"],
                ["本地音乐库", "folder", "local", ""],
                ["导入音乐", "upload", "import", ""]
              ].map((item) => item[2] === "local"
                ? `<div class="side-menu-divider"></div><button class="side-menu-item" type="button" data-action="local-library">${icon(item[1], 20)} ${item[0]}</button>`
                : item[2] === "import"
                  ? `<button class="side-menu-item" type="button" data-action="import-music">${icon(item[1], 20)} ${item[0]}</button>`
                  : `<a class="side-menu-item ${section === item[2] ? "is-active" : ""}" href="${item[3]}">${icon(item[1], 20)} ${item[0]}</a>`
              ).join("")}
              <section class="favorite-note-card surface">
                <p>音乐藏在每一个<br>温暖的角落里 <span class="decor-note">♫</span></p>
                <div class="desk-sticker favorites-sticker" aria-hidden="true"></div>
              </section>
            </aside>
            <div class="favorites-main">
              <div class="stats-grid">
                ${[
                  ["我的收藏", String(favoriteSongs.length), "首歌曲", "heart"],
                  ["最近播放", String(recentPlayed.length), "首歌曲", "music"],
                  ["本地歌单", String(playlists.length), "个歌单", "folder"],
                  ["稍后听", String(laterList.length), "首歌曲", "clock"]
                ].map((stat) => `
                  <section class="stat-card">
                    <div class="stat-illus">${icon(stat[3], 36)}</div>
                    <div>
                      <h3>${stat[0]}</h3>
                      <div class="stat-number">${stat[1]}</div>
                      <p class="muted">${stat[2]}</p>
                    </div>
                  </section>
                `).join("")}
              </div>
              <section class="stack">
                <div class="playlist-section-head">
                  <h2 class="section-title">我的歌单 <span class="title-mark">♫</span></h2>
                  <div class="row" style="gap:10px">
                    <span class="muted">排序：</span>
                    <button class="pill-btn" type="button" data-action="sort-favorites">最近更新 ${icon("chevronDown", 16)}</button>
                    <button class="icon-btn ${favoriteViewMode === "grid" ? "is-active" : ""}" type="button" data-action="favorite-view-grid" aria-label="网格">${icon("grid", 18)}</button>
                    <button class="icon-btn ${favoriteViewMode === "list" ? "is-active" : ""}" type="button" data-action="favorite-view-list" aria-label="列表">${icon("list", 18)}</button>
                  </div>
                </div>
                <div class="favorite-playlist-grid ${favoriteViewMode === "list" ? "is-list" : ""}">
                  <article class="playlist-card is-add surface">
                    <div class="add-playlist-content">
                      <button class="icon-btn is-primary is-large" type="button" data-action="create-playlist">${icon("plus", 30)}</button>
                      <span>新建歌单</span>
                    </div>
                  </article>
                  ${playlists.map(renderPlaylistCard).join("")}
                </div>
              </section>
              <section class="table-card">
                <div class="table-title-row">
                  <h2 class="section-title">${sectionTitle} <span class="muted">（${filteredSongs.length}）</span></h2>
                  <div class="table-tools">
                    <label class="table-search">
                      <input class="js-favorite-filter" type="text" value="${escapeHtml(query)}" placeholder="搜索当前列表">
                      ${icon("search", 16)}
                    </label>
                  </div>
                </div>
                ${filteredSongs.length ? `
                  <div class="table-head">
                    <span></span><span>歌曲</span><span>歌手</span><span>来源</span><span>收藏时间</span><span>操作</span>
                  </div>
                  ${filteredSongs.map((song, index) => `
                    <div class="favorite-row" data-song-id="${song.id}">
                      <button class="icon-btn favorite-btn ${window.MuseHub.Storage.isFavorite(song.id) ? "is-active" : ""} js-favorite" type="button" data-favorite-song="${song.id}" aria-label="收藏">${icon("heart", 17)}</button>
                      <div class="favorite-song-cell">
                        ${cover(song, "cover-sm")}
                        <strong class="song-title">${escapeHtml(song.name)}</strong>
                      </div>
                      <span class="muted">${escapeHtml(song.artist)}</span>
                      <span class="muted">${songSourceLabels(song).map(escapeHtml).join(" / ")}</span>
                      <span class="muted">2024-05-${String(20 - index).padStart(2, "0")} 22:${String(31 - index * 4).padStart(2, "0")}</span>
                      <span class="song-actions">
                        <button class="icon-btn js-play" type="button" data-play-song="${song.id}" aria-label="播放">${icon("play", 16)}</button>
                        <button class="icon-btn ${window.MuseHub.Storage.isLater && window.MuseHub.Storage.isLater(song.id) ? "is-active" : ""}" type="button" data-action="toggle-later" data-song-id="${song.id}" aria-label="稍后听">${icon("clock", 16)}</button>
                        <button class="icon-btn" type="button" data-action="${section === "later" ? "remove-later" : "delete-favorite"}" data-song-id="${song.id}" aria-label="删除">${icon("trash", 16)}</button>
                      </span>
                    </div>
                  `).join("")}
                ` : `<div class="empty-state"><div><img class="empty-asset" src="./assets/images/dog-mascot.png" alt="" loading="lazy"><strong>${query ? "没有匹配的歌曲" : `${sectionTitle}还是空的`}</strong><span>${query ? "换个关键词筛选试试" : "在歌曲列表里点按钮就能加入这里"}</span></div></div>`}
              </section>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  function optionCard(setting, value, active, title, desc, iconName) {
    return `
      <button class="option-card ${active ? "is-active" : ""}" type="button" data-setting-option="${setting}" data-setting-value="${value}">
        <strong>${iconName ? icon(iconName, 21) : ""}${title}</strong>
        <span>${desc}</span>
      </button>
    `;
  }

  function renderPlaylists() {
    const playlists = window.MuseHub.Storage.getPlaylists ? window.MuseHub.Storage.getPlaylists() : [];
    return `
      <main class="site-main">
        <section class="page page--wide playlists-page">
          <div class="playlist-page-head surface">
            <div>
              <h1 class="section-title">本地歌单 <span class="title-mark">♫</span></h1>
              <p class="muted">把喜欢的歌曲慢慢收纳起来，后续阶段会继续补充云端歌单能力。</p>
            </div>
            <button class="btn btn-primary" type="button" data-action="create-playlist">${icon("plus", 18)} 新建歌单</button>
          </div>
          ${playlists.length ? `
            <div class="playlist-library-grid">
              ${playlists.map(renderPlaylistCard).join("")}
            </div>
          ` : `
            <div class="empty-state surface"><div><img class="empty-asset" src="./assets/images/music-stickers.png" alt="" loading="lazy"><strong>还没有本地歌单</strong><span>新建一个歌单，给今天的心情留个位置</span><button class="btn btn-primary" type="button" data-action="create-playlist">${icon("plus", 17)} 新建歌单</button></div></div>
          `}
        </section>
      </main>
    `;
  }

  function renderPlaylistDetail(params) {
    const playlist = window.MuseHub.Storage.getPlaylist ? window.MuseHub.Storage.getPlaylist(params && params.id) : null;
    const songs = playlist && Array.isArray(playlist.songs) ? playlist.songs : [];
    return `
      <main class="site-main">
        <section class="page page--wide playlist-detail-page">
          <div class="playlist-detail-hero surface">
            <a class="pill-btn" href="#/playlists">${icon("back", 18)} 返回歌单</a>
            ${playlist ? `
              <div class="playlist-detail-main">
                <div class="cover-collage playlist-detail-cover" aria-hidden="true">
                  ${(playlist.covers || ["tone-room", "tone-pink", "tone-yellow", "tone-garden"]).map((tone) => `<span class="${tone}"></span>`).join("")}
                </div>
                <div class="stack">
                  <h1>${escapeHtml(playlist.name)}</h1>
                  <p class="muted">${escapeHtml(playlist.description || "本地创建的温柔歌单")}</p>
                  <div class="segmented-row">
                    <span class="chip">${songs.length} 首歌曲</span>
                    <span class="chip">本地歌单</span>
                  </div>
                  <div class="segmented-row">
                    <button class="btn btn-primary" type="button" data-action="play-playlist" data-playlist-id="${playlist.id}">${icon("play", 18)} 播放全部</button>
                    <button class="pill-btn" type="button" data-action="playlist-coming">${icon("plus", 16)} 添加歌曲</button>
                  </div>
                </div>
              </div>
            ` : `
              <div class="empty-state"><div><img class="empty-asset" src="./assets/images/pink-mascot.png" alt="" loading="lazy"><strong>没有找到这个歌单</strong><span>返回歌单列表重新选择一个吧</span></div></div>
            `}
          </div>
          ${playlist ? `
            <section class="table-card playlist-song-card">
              <div class="table-title-row">
                <h2 class="section-title">歌曲列表 <span class="muted">（${songs.length}）</span></h2>
              </div>
              ${songs.length ? renderSongList(songs) : `<div class="empty-state"><div><img class="empty-asset" src="./assets/images/notes-sticker.png" alt="" loading="lazy"><strong>歌单里还没有歌曲</strong><span>下一阶段会补充把歌曲加入歌单的完整入口</span></div></div>`}
            </section>
          ` : ""}
        </section>
      </main>
    `;
  }

  function themeCard(value, active, title, desc, tone) {
    return `
      <button class="option-card theme-card ${active ? "is-active" : ""}" type="button" data-setting-option="themeMode" data-setting-value="${value}">
        <div class="theme-preview ${tone}"></div>
        <strong>${title}</strong>
        <span>${desc}</span>
      </button>
    `;
  }

  function formatBytes(size) {
    const value = Number(size) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  }

  function renderSettingsSidebar(activeSection) {
    const sections = [
      ["personal", "个性化设置", "settings"],
      ["playback", "播放设置", "music"],
      ["cache", "本地与缓存", "list"],
      ["privacy", "隐私与安全", "shield"],
      ["about", "关于 MuseHub", "info"]
    ];
    return `
      <aside class="side-menu">
        ${sections.map((item) => `<button class="side-menu-item ${activeSection === item[0] ? "is-active" : ""}" type="button" data-action="settings-section" data-settings-section="${item[0]}">${icon(item[2], 20)} ${item[1]}</button>`).join("")}
        <section class="favorite-note-card surface">
          <p>音乐，是生活里<br>最温柔的陪伴 <span class="decor-note">♫</span></p>
          <div class="desk-sticker settings-sticker" aria-hidden="true"></div>
        </section>
      </aside>
    `;
  }

  function renderPlayerPreview(settings) {
    return `
      <section class="setting-card">
        <h3>播放器样式预览</h3>
        <p>选择会立即影响全站底部播放器</p>
        <div class="player-preview player-preview--${escapeHtml(settings.playerStyle)}">
          ${cover(findSong("song-8"), "cover-md")}
          <div class="player-preview-controls">
            <strong>城市日落时分</strong>
            <span class="muted">放松 / 流行 / 治愈</span>
            <input class="range" type="range" min="0" max="100" value="38" style="--value:38%" aria-label="播放器预览进度">
            <div class="player-controls">
              <button class="icon-btn" type="button" data-action="preview-only">${icon("prev", 17)}</button>
              <button class="icon-btn is-primary" type="button" data-action="preview-only">${icon("play", 18)}</button>
              <button class="icon-btn" type="button" data-action="preview-only">${icon("next", 17)}</button>
            </div>
          </div>
        </div>
        <div class="segmented-row" style="margin-top:14px">
          ${["mini", "standard", "wide"].map((value) => `<button class="pill-btn ${settings.playerStyle === value ? "btn-primary" : ""}" type="button" data-setting-option="playerStyle" data-setting-value="${value}">${value === "mini" ? "迷你模式" : value === "standard" ? "标准模式" : "宽屏模式"}</button>`).join("")}
        </div>
      </section>
    `;
  }

  function renderPersonalSettings(settings) {
    const defaultSource = normalizeSource(settings.defaultSource);
    return `
      <div class="settings-grid">
        <div class="settings-left">
          <section class="setting-card">
            <h3>默认搜索来源</h3>
            <p>首页和搜索页没有 URL 来源参数时，会读取这里的默认值。</p>
            <div class="option-grid">
              ${optionCard("defaultSource", "all", defaultSource === "all", "全部", "聚合全网资源", "grid")}
              ${optionCard("defaultSource", "tencent", defaultSource === "tencent", "QQ音乐", "优先使用 QQ 音乐搜索", "music")}
              ${optionCard("defaultSource", "netease", defaultSource === "netease", "网易云音乐", "优先使用网易云音乐搜索", "music")}
            </div>
          </section>
          <section class="setting-card">
            <h3>主题模式</h3>
            <p>主题色会立即作用到全站页面。</p>
            <div class="theme-grid">
              ${themeCard("cream", settings.themeMode === "cream", "暖阳奶油", "温暖治愈的日常氛围", "tone-room")}
              ${themeCard("mint", settings.themeMode === "mint", "清新薄荷", "浅绿与米白的轻盈感", "tone-garden")}
              ${themeCard("night", settings.themeMode === "night", "星夜静谧", "柔和夜蓝与紫灰", "tone-night")}
              ${themeCard("sakura", settings.themeMode === "sakura", "樱花粉", "浅粉与珊瑚色心情", "tone-pink")}
            </div>
          </section>
        </div>
        <div class="settings-right">
          <section class="setting-card">
            <h3>动画效果</h3>
            <p>关闭后会减少 hover 上浮、过渡动画和播放动效。</p>
            <div class="toggle-list">
              ${[
                ["界面过渡动画", "页面切换时的平滑过渡"],
                ["卡片悬浮动效", "卡片悬停时的轻微动效"],
                ["播放波纹效果", "播放按钮的淡淡反馈"]
              ].map((item) => `
                <div class="toggle-row">
                  <span><strong>${icon("list", 18)} ${item[0]}</strong><span class="muted">${item[1]}</span></span>
                  <button class="switch ${settings.animationEnabled ? "is-on" : ""}" type="button" data-setting-toggle="animationEnabled" aria-label="${item[0]}"></button>
                </div>
              `).join("")}
            </div>
          </section>
          ${renderPlayerPreview(settings)}
        </div>
      </div>
    `;
  }

  function renderPlaybackSettings(settings) {
    return `
      <div class="settings-grid">
        <div class="settings-left">
          <section class="setting-card">
            <h3>播放策略</h3>
            <p>播放失败时是否自动尝试其他来源。</p>
            <div class="option-grid option-grid-2">
              ${optionCard("autoSwitchSource", "true", settings.autoSwitchSource === true, "自动换源", "当前来源失败后尝试其他来源", "repeat")}
              ${optionCard("autoSwitchSource", "false", settings.autoSwitchSource === false, "不自动换源", "失败后只提示，不切换来源", "heart")}
              ${optionCard("preferOriginalPlatform", "true", settings.preferOriginalPlatform === true, "优先原平台", "先尝试歌曲原始来源", "music")}
              ${optionCard("preferOriginalPlatform", "false", settings.preferOriginalPlatform === false, "优先可用性", "允许先选择更稳定来源", "shuffle")}
            </div>
          </section>
          <section class="setting-card">
            <h3>播放模式</h3>
            <p>同步播放器详情页的循环按钮。</p>
            <div class="option-grid option-grid-2">
              ${optionCard("playMode", "list", settings.playMode === "list", "列表循环", "歌曲结束后播放下一首", "repeat")}
              ${optionCard("playMode", "single", settings.playMode === "single", "单曲循环", "歌曲结束后循环当前歌曲", "music")}
            </div>
          </section>
        </div>
        <div class="settings-right">
          <section class="setting-card">
            <h3>默认音量</h3>
            <p>会立即同步到底部播放器和全局 audio。</p>
            <div class="volume-setting">
              ${icon("volume", 22)}
              <input class="range js-setting-volume" type="range" min="0" max="100" value="${Math.round(settings.volume * 100)}" style="--value:${Math.round(settings.volume * 100)}%" aria-label="默认音量">
              <strong>${Math.round(settings.volume * 100)}%</strong>
            </div>
          </section>
          ${renderPlayerPreview(settings)}
        </div>
      </div>
    `;
  }

  function renderLyricSettings(settings) {
    return `
      <section class="setting-card lyric-preview-card">
        <div style="padding:22px 22px 14px">
          <h3>歌词显示设置</h3>
          <p>播放器页和歌词页会共用这里的显示设置。</p>
        </div>
        <div class="lyric-preview-image tone-dusk lyric-size-${escapeHtml(settings.lyricFontSize)} lyric-color-${escapeHtml(settings.lyricColor)}">
          <p>等春风吹过 跨时间的轮廓<br>我们慢慢走在一起的路口<br>从陌生到熟悉 这感觉很特别</p>
        </div>
        <div class="lyric-setting-body">
          <div class="segmented-row">
            <span>字体大小</span>
            ${[
              ["small", "A-"],
              ["standard", "标准"],
              ["large", "A+"]
            ].map((item) => `<button class="pill-btn ${settings.lyricFontSize === item[0] ? "btn-primary" : ""}" type="button" data-setting-option="lyricFontSize" data-setting-value="${item[0]}">${item[1]}</button>`).join("")}
          </div>
          <div class="segmented-row">
            <span>歌词颜色</span>
            ${[
              ["coral", "#ef776e", "珊瑚"],
              ["gold", "#f3ae24", "金黄"],
              ["green", "#58a889", "薄荷"],
              ["blue", "#5d8fd9", "晴空"],
              ["purple", "#9b78d8", "紫藤"]
            ].map((item) => `<button class="color-dot ${settings.lyricColor === item[0] ? "is-active" : ""}" type="button" data-setting-option="lyricColor" data-setting-value="${item[0]}" style="background:${item[1]}" aria-label="${item[2]}"></button>`).join("")}
          </div>
          <div class="segmented-row">
            <span>显示位置</span>
            ${[
              ["top", "顶部"],
              ["center", "居中"],
              ["bottom", "底部"]
            ].map((item) => `<button class="pill-btn ${settings.lyricPosition === item[0] ? "btn-primary" : ""}" type="button" data-setting-option="lyricPosition" data-setting-value="${item[0]}">${item[1]}</button>`).join("")}
          </div>
          <div class="toggle-row">
            <strong>滚动歌词</strong>
            <button class="switch ${settings.lyricScrollEnabled ? "is-on" : ""}" type="button" data-setting-toggle="lyricScrollEnabled" aria-label="滚动歌词"></button>
          </div>
        </div>
      </section>
    `;
  }

  function renderCacheSettings(settings) {
    const cache = window.MuseHub.Storage.getCacheSnapshot();
    return `
      <div class="settings-grid">
        <div class="settings-left">
          <section class="setting-card">
            <h3>本地缓存管理</h3>
            <p>普通清理不会删除收藏、歌单、稍后听和设置。</p>
            <div class="cache-card">
              <div class="cache-ring"><span><strong>${formatBytes(cache.total)}</strong>本地缓存</span></div>
              <div class="cache-types">
                <div class="row-between"><span>搜索历史</span><strong>${formatBytes(cache.searchHistory)}</strong></div>
                <div class="row-between"><span>最近播放</span><strong>${formatBytes(cache.recentPlayed)}</strong></div>
                <div class="row-between"><span>播放状态</span><strong>${formatBytes(cache.currentPlayback)}</strong></div>
                <div class="row-between"><span>歌曲缓存</span><strong>${formatBytes(cache.songCache)}</strong></div>
                <button class="btn btn-primary" type="button" data-action="clear-cache">${icon("trash", 17)} 清理缓存</button>
              </div>
            </div>
          </section>
        </div>
        <div class="settings-right">
          <section class="setting-card">
            <h3>缓存清理策略</h3>
            <p>决定后续使用时是否继续记录这些本地缓存。</p>
            <div class="toggle-list">
              ${[
                ["keepSearchHistory", "记录搜索历史", "搜索成功后写入本地历史"],
                ["keepRecentPlayed", "记录最近播放", "播放成功后写入最近播放"],
                ["keepLyricsCache", "预留歌词缓存", "当前版本暂未持久化歌词缓存"]
              ].map((item) => `
                <div class="toggle-row">
                  <span><strong>${icon("list", 18)} ${item[1]}</strong><span class="muted">${item[2]}</span></span>
                  <button class="switch ${settings.cachePolicy[item[0]] ? "is-on" : ""}" type="button" data-cache-policy-toggle="${item[0]}" aria-label="${item[1]}"></button>
                </div>
              `).join("")}
            </div>
          </section>
        </div>
      </div>
    `;
  }

  function renderPrivacySettings() {
    return `
      <div class="settings-grid">
        <div class="settings-left">
          <section class="setting-card privacy-card">
            <h3>隐私与安全</h3>
            <p>无界音乐 MuseHub 是纯前端项目，不需要登录，也不保存账号凭证。</p>
            <div class="privacy-list">
              ${[
                "不使用 QQ / 网易云 Cookie，也不接扫码登录。",
                "收藏、歌单、稍后听、播放历史只保存在本地浏览器。",
                "清理浏览器数据可能会导致本地收藏和歌单丢失。",
                "搜索和播放能力来自第三方公开 API。",
                "不提供会员歌曲破解，不提供下载服务。"
              ].map((text) => `<div class="privacy-item">${icon("shield", 18)}<span>${text}</span></div>`).join("")}
            </div>
          </section>
        </div>
        <div class="settings-right">
          <section class="setting-card">
            <h3>本地数据操作</h3>
            <p>导出内容包含收藏、歌单、稍后听和设置。</p>
            <div class="settings-action-grid">
              <button class="pill-btn" type="button" data-action="clear-search-history">${icon("trash", 16)} 清空搜索历史</button>
              <button class="pill-btn" type="button" data-action="clear-recent-played">${icon("trash", 16)} 清空最近播放</button>
              <button class="btn btn-primary" type="button" data-action="export-local-data">${icon("share", 16)} 导出本地数据</button>
              <button class="pill-btn" type="button" data-action="import-local-data">${icon("upload", 16)} 导入本地数据</button>
              <input class="sr-only js-import-data-file" type="file" accept="application/json,.json">
            </div>
          </section>
        </div>
      </div>
    `;
  }

  function renderAboutSettings() {
    return `
      <section class="setting-card about-card about-card--full">
        <div class="about-tv"></div>
        <div>
          <h3>无界音乐 MuseHub</h3>
          <p>这是一个纯前端、无需登录、无需后端数据库的音乐聚合探索平台。它通过公开音乐 API 实现搜索、播放、歌词展示、本地收藏和本地歌单能力。所有个人数据仅保存在用户浏览器本地。</p>
          <div class="segmented-row">
            <span class="chip">版本 1.0.0</span>
            <span class="chip">HTML / CSS / JavaScript</span>
            <span class="chip">localStorage</span>
            <span class="chip">纯前端</span>
            <span class="chip">轻量</span>
            <span class="chip">温暖治愈</span>
          </div>
          <p class="muted">免责声明：音乐内容版权归对应平台与权利方所有，本项目仅用于学习交流和个人体验。</p>
        </div>
      </section>
    `;
  }

  function renderSettings(params) {
    const settings = window.MuseHub.Storage.getSettings();
    const section = ["personal", "playback", "cache", "privacy", "about"].includes(params && params.section) ? params.section : "personal";
    const sectionHtml = {
      personal: renderPersonalSettings(settings),
      playback: renderPlaybackSettings(settings),
      cache: renderCacheSettings(settings),
      privacy: renderPrivacySettings(settings),
      about: renderAboutSettings(settings)
    }[section];
    return `
      <main class="site-main">
        <section class="page page--wide settings-page">
          <div class="settings-layout settings-shell">
            ${renderSettingsSidebar(section)}
            <div class="settings-main">
              ${sectionHtml}
              ${section === "personal" ? renderLyricSettings(settings) : ""}
            </div>
          </div>
        </section>
      </main>
    `;
  }

  function renderPlayerDock(route) {
    const state = window.MuseHub.Player.getState();
    const song = playerDisplaySong(state);
    const settings = window.MuseHub.Storage.getSettings();
    const shouldShow = route !== "player" && route !== "lyrics" && (Boolean(state.currentSong) || state.isPlaying || state.isLoading);
    document.body.classList.toggle("has-player-dock", shouldShow);
    if (!shouldShow) return "";
    const percent = progressPercent(state);
    const loading = state.isLoading && state.loadingSongId === song.id;
    return `
      <section class="player-dock player-dock--${escapeHtml(settings.playerStyle)} js-player-dock">
        <button class="player-track js-go-player" type="button" data-action="go-player">
          ${cover(song, "cover-sm")}
          <span>
            <h3>${escapeHtml(song.name)}</h3>
            <p>${escapeHtml(song.artist)}</p>
          </span>
        </button>
        <div class="player-controls">
          <button class="icon-btn" type="button" data-action="prev" aria-label="上一首">${icon("prev", 20)}</button>
          <button class="icon-btn is-primary ${loading ? "is-loading" : ""}" type="button" data-action="toggle-play" aria-label="播放暂停">${loading ? icon("rotate", 22, "spin-icon") : icon(state.isPlaying ? "pause" : "play", 22)}</button>
          <button class="icon-btn" type="button" data-action="next" aria-label="下一首">${icon("next", 20)}</button>
        </div>
        <div class="time-progress">
          <span data-player-progress>${state.progressText}</span>
          <input class="range js-progress-input" type="range" min="0" max="100" value="${percent}" style="--value:${percent}%">
          <span data-player-duration>${state.durationText}</span>
        </div>
        <div class="volume-control">
          ${icon("volume", 20)}
          <input class="range js-volume-input" type="range" min="0" max="100" value="${state.volume}" style="--value:${state.volume}%">
        </div>
        <div class="source-switch">
          ${songSourceLabels(song).slice(0, 2).map(sourcePill).join("")}
        </div>
        <button class="pill-btn dock-extra" type="button" data-action="go-lyrics">${icon("maximize", 16)} 全屏歌词</button>
      </section>
    `;
  }

  function routeTitle(route, params) {
    const titles = {
      home: "发现音乐",
      search: "搜索",
      playlists: "本地歌单",
      playlist: "歌单详情",
      favorites: "本地收藏",
      settings: "设置中心",
      player: "播放器",
      lyrics: "歌词专注"
    };
    if (route === "search" && params && params.q) {
      return `搜索 ${params.q} - 无界音乐 MuseHub`;
    }
    return `${titles[route] || titles.home} - 无界音乐 MuseHub`;
  }

  function renderPage(route, params) {
    currentRoute = route || "home";
    currentParams = params || {};
    applyTheme();
    document.title = routeTitle(currentRoute, currentParams);
    const app = document.getElementById("app");
    const pageHtml = {
      home: renderHome,
      search: renderSearch,
      player: renderPlayer,
      lyrics: renderLyrics,
      playlists: renderPlaylists,
      playlist: renderPlaylistDetail,
      favorites: renderFavorites,
      settings: renderSettings
    }[currentRoute](currentParams);
    app.innerHTML = `
      ${renderHeader(currentRoute)}
      ${pageHtml}
      ${renderMobileTabBar(currentRoute)}
      <div id="player-dock-slot">${renderPlayerDock(currentRoute)}</div>
    `;
    if (currentParams.section) {
      setTimeout(() => {
        const target = document.getElementById(currentParams.section);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
    syncState();
  }

  function updateDock() {
    const slot = document.getElementById("player-dock-slot");
    if (slot) slot.innerHTML = renderPlayerDock(currentRoute);
  }

  function syncState() {
    const state = window.MuseHub.Player.getState();
    document.querySelectorAll("[data-play-song]").forEach((button) => {
      const active = state.currentSong && button.dataset.playSong === state.currentSong.id;
      const loading = state.isLoading && state.loadingSongId === button.dataset.playSong;
      if (button.classList.contains("queue-item")) {
        button.classList.toggle("is-active", active);
        return;
      }
      button.classList.toggle("is-primary", active && state.isPlaying);
      button.classList.toggle("is-loading", loading);
      button.innerHTML = loading
        ? icon("rotate", button.classList.contains("quick-play") ? 15 : 17, "spin-icon")
        : icon(active && state.isPlaying ? "pause" : "play", button.classList.contains("quick-play") ? 15 : 17);
    });
    document.querySelectorAll(".song-row[data-song-id], .song-index-row[data-song-id]").forEach((row) => {
      row.classList.toggle("is-playing", state.currentSong && row.dataset.songId === state.currentSong.id && (state.isPlaying || state.isLoading));
    });
    document.querySelectorAll("[data-favorite-song]").forEach((button) => {
      button.classList.toggle("is-active", window.MuseHub.Storage.isFavorite(button.dataset.favoriteSong));
    });
    document.querySelectorAll(".js-progress-input").forEach((input) => {
      const percent = progressPercent(state);
      if (document.activeElement !== input) input.value = percent;
      input.style.setProperty("--value", `${percent}%`);
    });
    document.querySelectorAll(".js-volume-input").forEach((input) => {
      if (document.activeElement !== input) input.value = state.volume;
      input.style.setProperty("--value", `${state.volume}%`);
    });
    document.querySelectorAll("[data-player-progress]").forEach((item) => {
      item.textContent = state.progressText;
    });
    document.querySelectorAll("[data-player-duration]").forEach((item) => {
      item.textContent = state.durationText;
    });
    if (window.MuseHub.Lyric && window.MuseHub.Lyric.syncActiveLines) {
      window.MuseHub.Lyric.syncActiveLines(state.currentSong, state.progress);
    }
  }

  function applyTheme() {
    const settings = window.MuseHub.Storage.getSettings();
    const mode = settings.themeMode || "cream";
    document.body.classList.remove(
      "theme-cream", "theme-mint", "theme-night", "theme-sakura",
      "reduce-motion",
      "player-style-mini", "player-style-standard", "player-style-wide",
      "lyric-size-small", "lyric-size-standard", "lyric-size-large",
      "lyric-color-coral", "lyric-color-gold", "lyric-color-green", "lyric-color-blue", "lyric-color-purple"
    );
    document.body.classList.add(`theme-${mode}`);
    document.body.classList.add(`player-style-${settings.playerStyle}`);
    document.body.classList.add(`lyric-size-${settings.lyricFontSize}`);
    document.body.classList.add(`lyric-color-${settings.lyricColor}`);
    document.body.classList.toggle("reduce-motion", settings.animationEnabled === false);
  }

  function navigateSearch(keyword, source) {
    const value = String(keyword || "").trim();
    if (!value) {
      showToast("请输入关键词开始搜索");
      return;
    }
    const normalizedSource = normalizeSource(source || currentParams.source || window.MuseHub.Storage.getSettings().defaultSource || "all");
    window.MuseHub.Storage.saveSettings({ defaultSource: normalizedSource });
    const next = `#/search?q=${encodeURIComponent(value)}&source=${encodeURIComponent(normalizedSource)}`;
    searchSubmitImmediate = true;
    if (window.location.hash === next) {
      resetSearchState();
      window.MuseHub.Router.renderCurrent();
    } else {
      window.location.hash = next;
    }
  }

  function showToast(message) {
    const root = document.getElementById("toast-root");
    if (!root) return;
    clearTimeout(toastTimer);
    root.innerHTML = `<div class="toast is-visible">${escapeHtml(message)}</div>`;
    toastTimer = setTimeout(() => {
      const toast = root.querySelector(".toast");
      if (toast) toast.classList.remove("is-visible");
    }, 1600);
  }

  function modalRoot() {
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    return root;
  }

  function closeModal() {
    const root = document.getElementById("modal-root");
    if (root) root.innerHTML = "";
  }

  function showModal(content) {
    modalRoot().innerHTML = `<div class="soft-modal-backdrop" data-action="close-modal"><div class="soft-modal surface" role="dialog" aria-modal="true" data-modal-panel>${content}</div></div>`;
    const input = document.querySelector("#modal-root input");
    if (input) setTimeout(() => input.focus(), 20);
  }

  function showCreatePlaylistModal() {
    showModal(`
      <div class="soft-modal-head">
        <h3>新建歌单</h3>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="关闭">${icon("more", 18)}</button>
      </div>
      <label class="modal-field">
        <span>歌单名称</span>
        <input type="text" data-modal-input="playlist-name" placeholder="例如：深夜循环">
      </label>
      <div class="modal-actions">
        <button class="pill-btn" type="button" data-action="close-modal">取消</button>
        <button class="btn btn-primary" type="button" data-action="confirm-create-playlist">${icon("plus", 17)} 创建</button>
      </div>
    `);
  }

  function showConfirmModal(message, confirmAction, songId) {
    showModal(`
      <div class="soft-modal-head"><h3>请确认</h3></div>
      <p class="modal-copy">${escapeHtml(message)}</p>
      <div class="modal-actions">
        <button class="pill-btn" type="button" data-action="close-modal">取消</button>
        <button class="btn btn-primary" type="button" data-action="${confirmAction}" ${songId ? `data-song-id="${escapeHtml(songId)}"` : ""}>确认</button>
      </div>
    `);
  }

  function showLyricSettingsModal() {
    const settings = window.MuseHub.Storage.getSettings();
    showModal(`
      <div class="soft-modal-head">
        <h3>歌词设置</h3>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="关闭">${icon("more", 18)}</button>
      </div>
      <div class="modal-setting-group">
        <span>字体大小</span>
        <div class="segmented-row">
          ${[
            ["small", "小"],
            ["standard", "标准"],
            ["large", "大"]
          ].map((item) => `<button class="pill-btn ${settings.lyricFontSize === item[0] ? "btn-primary" : ""}" type="button" data-setting-option="lyricFontSize" data-setting-value="${item[0]}">${item[1]}</button>`).join("")}
        </div>
      </div>
      <div class="modal-setting-group">
        <span>高亮颜色</span>
        <div class="segmented-row">
          ${[
            ["coral", "珊瑚"],
            ["gold", "金黄"],
            ["green", "薄荷"],
            ["blue", "晴空"],
            ["purple", "紫藤"]
          ].map((item) => `<button class="pill-btn ${settings.lyricColor === item[0] ? "btn-primary" : ""}" type="button" data-setting-option="lyricColor" data-setting-value="${item[0]}">${item[1]}</button>`).join("")}
        </div>
      </div>
      <div class="modal-setting-group">
        <span>显示位置</span>
        <div class="segmented-row">
          ${[
            ["top", "靠上"],
            ["center", "居中"],
            ["bottom", "靠下"]
          ].map((item) => `<button class="pill-btn ${settings.lyricPosition === item[0] ? "btn-primary" : ""}" type="button" data-setting-option="lyricPosition" data-setting-value="${item[0]}">${item[1]}</button>`).join("")}
        </div>
      </div>
    `);
  }

  function showMoreMenu() {
    showModal(`
      <div class="soft-modal-head"><h3>更多操作</h3></div>
      <div class="modal-menu">
        <button class="pill-btn" type="button" data-action="share-current">${icon("share", 16)} 复制歌曲信息</button>
        <button class="pill-btn" type="button" data-action="toggle-current-later">${icon("clock", 16)} 加入稍后听</button>
        <button class="pill-btn" type="button" data-action="playlist-coming">${icon("plus", 16)} 添加到歌单</button>
      </div>
    `);
  }

  function showQueueModal() {
    const state = window.MuseHub.Player.getState();
    showModal(`
      <div class="soft-modal-head">
        <h3>播放列表（${state.queue.length}）</h3>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="关闭">${icon("more", 18)}</button>
      </div>
      <div class="modal-queue-list">
        ${state.queue.length ? state.queue.map((song) => `
          <button class="queue-item js-play ${state.currentSong && state.currentSong.id === song.id ? "is-active" : ""}" type="button" data-play-song="${song.id}">
            ${cover(song, "cover-sm")}
            <span><h4>${escapeHtml(song.name)}</h4><p>${escapeHtml(song.artist)}</p></span>
          </button>
        `).join("") : '<p class="muted">播放列表还是空的</p>'}
      </div>
    `);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error("clipboard unavailable"));
  }

  function applySettingsChange(settings) {
    applyTheme();
    if (window.MuseHub.Player && window.MuseHub.Player.applySettings) {
      window.MuseHub.Player.applySettings(settings);
    }
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        window.MuseHub.Storage.importLocalData(data);
        applySettingsChange(window.MuseHub.Storage.getSettings());
        window.MuseHub.Router.renderCurrent();
        showToast("本地数据已导入");
      } catch (error) {
        showToast(error && error.message ? error.message : "导入失败，请检查 JSON 文件");
      }
    };
    reader.onerror = () => showToast("导入失败，请稍后再试");
    reader.readAsText(file, "utf-8");
  }

  function handleClick(event) {
    const sourceTab = event.target.closest(".js-source-tab");
    if (sourceTab) {
      const source = normalizeSource(sourceTab.dataset.source);
      window.MuseHub.Storage.saveSettings({ defaultSource: source });
      if (currentRoute === "search") {
        if (currentParams.q) {
          navigateSearch(currentParams.q, source);
        } else {
          const next = `#/search?source=${encodeURIComponent(source)}`;
          if (window.location.hash === next) window.MuseHub.Router.renderCurrent();
          else window.location.hash = next;
        }
      } else if (currentRoute === "home") {
        const next = `#/home?source=${encodeURIComponent(source)}`;
        if (window.location.hash === next) renderPage("home", Object.assign({}, currentParams, { source }));
        else window.location.hash = next;
      }
      return;
    }

    const chip = event.target.closest(".chip-search");
    if (chip) {
      navigateSearch(chip.dataset.keyword || chip.textContent, currentParams.source || window.MuseHub.Storage.getSettings().defaultSource);
      return;
    }

    const playlistCard = event.target.closest("[data-playlist-id]");
    if (playlistCard && !event.target.closest("button")) {
      window.location.hash = `#/playlist?id=${encodeURIComponent(playlistCard.dataset.playlistId)}`;
      return;
    }

    const category = event.target.closest(".category-tab");
    if (category) {
      if (category.classList.contains("is-disabled")) {
        showToast("该分类将在下一阶段完善");
        return;
      }
      category.parentElement.querySelectorAll(".category-tab").forEach((item) => item.classList.remove("is-active"));
      category.classList.add("is-active");
      return;
    }

    const playButton = event.target.closest("[data-play-song]");
    if (playButton) {
      window.MuseHub.Player.play(playButton.dataset.playSong);
      return;
    }

    const favoriteButton = event.target.closest("[data-favorite-song]");
    if (favoriteButton) {
      const added = window.MuseHub.Storage.toggleFavorite(favoriteButton.dataset.favoriteSong);
      syncState();
      if (currentRoute === "favorites") window.MuseHub.Router.renderCurrent();
      showToast(added ? "已加入本地收藏" : "已取消收藏");
      return;
    }

    const settingOption = event.target.closest("[data-setting-option]");
    if (settingOption) {
      const key = settingOption.dataset.settingOption;
      let value = settingOption.dataset.settingValue;
      if (value === "true") value = true;
      if (value === "false") value = false;
      if (key === "defaultSource") value = normalizeSource(value);
      const settings = window.MuseHub.Storage.saveSettings({ [key]: value });
      applySettingsChange(settings);
      window.MuseHub.Router.renderCurrent();
      showToast("设置已保存在本地");
      return;
    }

    const settingToggle = event.target.closest("[data-setting-toggle]");
    if (settingToggle) {
      const key = settingToggle.dataset.settingToggle;
      const settings = window.MuseHub.Storage.getSettings();
      const next = window.MuseHub.Storage.saveSettings({ [key]: !settings[key] });
      applySettingsChange(next);
      window.MuseHub.Router.renderCurrent();
      showToast("设置已更新");
      return;
    }

    const cachePolicyToggle = event.target.closest("[data-cache-policy-toggle]");
    if (cachePolicyToggle) {
      const key = cachePolicyToggle.dataset.cachePolicyToggle;
      const settings = window.MuseHub.Storage.getSettings();
      const nextPolicy = Object.assign({}, settings.cachePolicy, { [key]: !settings.cachePolicy[key] });
      const next = window.MuseHub.Storage.saveSettings({ cachePolicy: nextPolicy });
      applySettingsChange(next);
      window.MuseHub.Router.renderCurrent();
      showToast("缓存策略已更新");
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    if (actionButton.classList.contains("soft-modal-backdrop") && event.target.closest("[data-modal-panel]")) return;
    const action = actionButton.dataset.action;
    if (action === "close-modal") {
      closeModal();
      return;
    }
    if (action === "empty-player") {
      showToast("先播放一首歌，再使用这个操作");
      return;
    }
    if (action === "toggle-play") {
      const state = window.MuseHub.Player.getState();
      if (!state.currentSong && !state.pendingSong) showToast("先从搜索结果里播放一首歌");
      else window.MuseHub.Player.toggle().catch(() => showToast("播放失败，可能是音源失效或浏览器限制。"));
    }
    if (action === "next") {
      if (!window.MuseHub.Player.getState().queue.length) showToast("播放列表还是空的");
      else window.MuseHub.Player.next();
      if (currentRoute === "player" || currentRoute === "lyrics") window.MuseHub.Router.renderCurrent();
    }
    if (action === "prev") {
      if (!window.MuseHub.Player.getState().queue.length) showToast("播放列表还是空的");
      else window.MuseHub.Player.prev();
      if (currentRoute === "player" || currentRoute === "lyrics") window.MuseHub.Router.renderCurrent();
    }
    if (action === "go-player") window.location.hash = "#/player";
    if (action === "go-lyrics") window.location.hash = "#/lyrics";
    if (action === "toggle-shuffle") {
      const enabled = window.MuseHub.Player.toggleShuffle();
      showToast(enabled ? "已开启随机播放" : "已关闭随机播放");
      window.MuseHub.Router.renderCurrent();
    }
    if (action === "toggle-repeat") {
      const mode = window.MuseHub.Player.toggleRepeat();
      showToast(mode === "one" ? "已切换为单曲循环" : "已切换为列表循环");
      window.MuseHub.Router.renderCurrent();
    }
    if (action === "share-current") {
      const state = window.MuseHub.Player.getState();
      if (!state.currentSong) {
        showToast("先播放一首歌，再分享歌曲信息");
      } else {
        const text = `${state.currentSong.name} - ${state.currentSong.artist}（${state.currentSong.sourceName || "MuseHub"}）`;
        copyText(text).then(() => showToast("歌曲信息已复制")).catch(() => showToast("浏览器暂不支持自动复制"));
      }
    }
    if (action === "open-more-menu") showMoreMenu();
    if (action === "show-queue") showQueueModal();
    if (action === "open-lyric-settings") showLyricSettingsModal();
    if (action === "create-playlist") showCreatePlaylistModal();
    if (action === "confirm-create-playlist") {
      const input = document.querySelector("[data-modal-input='playlist-name']");
      const playlist = window.MuseHub.Storage.createPlaylist(input && input.value);
      if (playlist) {
        closeModal();
        window.location.hash = `#/playlist?id=${encodeURIComponent(playlist.id)}`;
        showToast("歌单已创建");
      } else {
        showToast("请输入歌单名称");
      }
    }
    if (action === "playlist-coming") showToast("添加歌曲到歌单将在后续版本开放");
    if (action === "play-playlist") {
      const playlist = window.MuseHub.Storage.getPlaylist(actionButton.dataset.playlistId);
      if (playlist && playlist.songs && playlist.songs.length) {
        window.MuseHub.Player.setQueue(playlist.songs);
        window.MuseHub.Player.play(playlist.songs[0].id);
      } else {
        showToast("这个歌单还没有歌曲");
      }
    }
    if (action === "toggle-current-later") {
      const current = window.MuseHub.Player.getState().currentSong;
      if (!current) showToast("先播放一首歌，再加入稍后听");
      else showToast(window.MuseHub.Storage.toggleLater(current) ? "已加入稍后听" : "已从稍后听移除");
    }
    if (action === "retry-search") {
      resetSearchState();
      window.MuseHub.Router.renderCurrent();
    }
    if (action === "clear-search-history") {
      window.MuseHub.Storage.clearSearchHistory();
      window.MuseHub.Router.renderCurrent();
      showToast("搜索历史已清空");
    }
    if (action === "delete-favorite") {
      const songId = actionButton.dataset.songId;
      showConfirmModal("确定要从本地收藏中删除这首歌吗？", "confirm-delete-favorite", songId);
    }
    if (action === "confirm-delete-favorite") {
      const songId = actionButton.dataset.songId;
      if (window.MuseHub.Storage.isFavorite(songId)) window.MuseHub.Storage.toggleFavorite(songId);
      closeModal();
      window.MuseHub.Router.renderCurrent();
      showToast("已从收藏中删除");
    }
    if (action === "toggle-later") {
      const song = window.MuseHub.Storage.getSong(actionButton.dataset.songId);
      showToast(window.MuseHub.Storage.toggleLater(song) ? "已加入稍后听" : "已从稍后听移除");
      if (currentRoute === "favorites") window.MuseHub.Router.renderCurrent();
    }
    if (action === "remove-later") {
      const song = window.MuseHub.Storage.getSong(actionButton.dataset.songId);
      if (song && window.MuseHub.Storage.isLater(song.id)) window.MuseHub.Storage.toggleLater(song);
      window.MuseHub.Router.renderCurrent();
      showToast("已从稍后听移除");
    }
    if (action === "sort-results") showToast("综合排序已按接口返回顺序展示，更多排序将在后续版本开放");
    if (action === "sort-favorites") showToast("本地列表已按最近加入优先展示");
    if (action === "lyric-color-coming") showToast("歌词颜色预设会在后续版本开放");
    if (action === "favorite-view-grid") {
      favoriteViewMode = "grid";
      window.MuseHub.Router.renderCurrent();
    }
    if (action === "favorite-view-list") {
      favoriteViewMode = "list";
      window.MuseHub.Router.renderCurrent();
    }
    if (action === "local-library" || action === "import-music") showToast("本地导入将在后续版本开放");
    if (action === "settings-section") {
      const section = actionButton.dataset.settingsSection || "personal";
      const next = `#/settings?section=${encodeURIComponent(section)}`;
      if (window.location.hash === next) window.MuseHub.Router.renderCurrent();
      else window.location.hash = next;
    }
    if (action === "clear-cache") showConfirmModal("将清除搜索历史、最近播放和播放缓存，不会删除收藏和歌单。", "confirm-clear-cache");
    if (action === "confirm-clear-cache") {
      window.MuseHub.Storage.clearCache();
      closeModal();
      window.MuseHub.Router.renderCurrent();
      showToast("缓存已清理，收藏和歌单已保留");
    }
    if (action === "clear-recent-played") {
      window.MuseHub.Storage.clearRecentPlayed();
      window.MuseHub.Router.renderCurrent();
      showToast("最近播放已清空");
    }
    if (action === "export-local-data") {
      downloadJson(`musehub-backup-${new Date().toISOString().slice(0, 10)}.json`, window.MuseHub.Storage.exportLocalData());
      showToast("本地数据已导出");
    }
    if (action === "import-local-data") {
      const input = document.querySelector(".js-import-data-file");
      if (input) input.click();
    }
    if (action === "refresh-hot") showToast("热搜已刷新");
    if (action === "refresh-related-hot") showToast("相关热搜已刷新");
  }

  function handleSubmit(event) {
    const form = event.target.closest(".js-search-form");
    if (!form) return;
    event.preventDefault();
    const input = form.querySelector("input[name='keyword']");
    navigateSearch(input.value, form.dataset.source || currentParams.source || "all");
  }

  function handleKeydown(event) {
    if (event.key === "Enter" && event.target.matches("[data-modal-input='playlist-name']")) {
      event.preventDefault();
      const input = event.target;
      const playlist = window.MuseHub.Storage.createPlaylist(input.value);
      if (playlist) {
        closeModal();
        window.location.hash = `#/playlist?id=${encodeURIComponent(playlist.id)}`;
        showToast("歌单已创建");
      } else {
        showToast("请输入歌单名称");
      }
      return;
    }
    if (event.key !== "Enter") return;
    const input = event.target.closest(".js-search-form input[name='keyword']");
    if (!input) return;
    event.preventDefault();
    const form = input.closest(".js-search-form");
    navigateSearch(input.value, form.dataset.source || currentParams.source || "all");
  }

  function handleInput(event) {
    const progress = event.target.closest(".js-progress-input");
    if (progress) {
      progress.style.setProperty("--value", `${progress.value}%`);
      window.MuseHub.Player.seek(progress.value);
      return;
    }
    const volume = event.target.closest(".js-volume-input");
    if (volume) {
      volume.style.setProperty("--value", `${volume.value}%`);
      window.MuseHub.Player.setVolume(volume.value);
      return;
    }
    const settingVolume = event.target.closest(".js-setting-volume");
    if (settingVolume) {
      settingVolume.style.setProperty("--value", `${settingVolume.value}%`);
      const next = window.MuseHub.Storage.saveSettings({ volume: (Number(settingVolume.value) || 0) / 100 });
      applySettingsChange(next);
      const label = settingVolume.parentElement && settingVolume.parentElement.querySelector("strong");
      if (label) label.textContent = `${Math.round(Number(settingVolume.value) || 0)}%`;
      return;
    }
    const favoriteFilter = event.target.closest(".js-favorite-filter");
    if (favoriteFilter) {
      const value = favoriteFilter.value.trim();
      document.querySelectorAll(".favorite-row").forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.hidden = value ? !text.includes(value.toLowerCase()) : false;
      });
    }
  }

  function handleChange(event) {
    const importInput = event.target.closest(".js-import-data-file");
    if (importInput) {
      handleImportFile(importInput.files && importInput.files[0]);
      importInput.value = "";
    }
  }

  function handleImageError(event) {
    const image = event.target.closest("[data-cover-img]");
    if (!image) return;
    const wrapper = image.closest(".cover");
    image.remove();
    if (wrapper) {
      wrapper.classList.remove("has-cover-image");
      wrapper.classList.add("tone-sunset");
      wrapper.style.removeProperty("--cover-image");
    }
  }

  function init() {
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("error", handleImageError, true);
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.UI = {
    init,
    renderPage,
    updateDock,
    syncState,
    applyTheme,
    showToast,
    icon
  };
})();
