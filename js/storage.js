(function () {
  const keys = {
    favorites: "musehub:favorites",
    history: "musehub:history",
    settings: "musehub:settings",
    playlists: "musehub:playlists",
    laterList: "musehub:later-list",
    searches: "musehub:search-history",
    recentPlayed: "musehub:recent-played",
    currentSong: "musehub:current-song",
    playerState: "musehub:player-state",
    currentSongId: "musehub:current-song-id",
    songCache: "musehub:song-cache"
  };

  const legacyKeys = {
    favorites: "musehub.favorites",
    history: "musehub.history",
    settings: "musehub.settings",
    searches: "musehub.searches",
    currentSongId: "musehub.currentSongId"
  };

  const defaultSettings = {
    defaultSource: "all",
    autoSwitchSource: true,
    preferOriginalPlatform: false,
    themeMode: "cream",
    animationEnabled: true,
    lyricFontSize: "standard",
    lyricColor: "coral",
    lyricPosition: "center",
    lyricScrollEnabled: true,
    playerStyle: "standard",
    volume: 0.8,
    playMode: "list",
    cachePolicy: {
      keepSearchHistory: true,
      keepRecentPlayed: true,
      keepLyricsCache: true
    }
  };

  function cloneFallback(fallback) {
    if (fallback && typeof fallback === "object") return JSON.parse(JSON.stringify(fallback));
    if (Array.isArray(fallback)) return fallback.slice();
    return fallback;
  }

  function normalizeSource(source) {
    if (source === "qq") return "tencent";
    if (source === "tencent" || source === "netease") return source;
    return "all";
  }

  function normalizeSettings(raw) {
    const input = raw && typeof raw === "object" ? raw : {};
    const cachePolicy = Object.assign({}, defaultSettings.cachePolicy, input.cachePolicy || {});
    const lyricFontSize = input.lyricFontSize || (input.lyricSize === "medium" ? "standard" : input.lyricSize) || defaultSettings.lyricFontSize;
    const next = Object.assign({}, defaultSettings, input, {
      defaultSource: normalizeSource(input.defaultSource || defaultSettings.defaultSource),
      autoSwitchSource: input.autoSwitchSource !== undefined ? Boolean(input.autoSwitchSource) : defaultSettings.autoSwitchSource,
      preferOriginalPlatform: input.preferOriginalPlatform !== undefined ? Boolean(input.preferOriginalPlatform) : defaultSettings.preferOriginalPlatform,
      animationEnabled: input.animationEnabled !== undefined ? Boolean(input.animationEnabled) : defaultSettings.animationEnabled,
      lyricFontSize: ["small", "standard", "large"].includes(lyricFontSize) ? lyricFontSize : defaultSettings.lyricFontSize,
      lyricColor: ["coral", "gold", "green", "blue", "purple"].includes(input.lyricColor) ? input.lyricColor : defaultSettings.lyricColor,
      lyricPosition: ["top", "center", "bottom"].includes(input.lyricPosition) ? input.lyricPosition : defaultSettings.lyricPosition,
      lyricScrollEnabled: input.lyricScrollEnabled !== undefined ? Boolean(input.lyricScrollEnabled) : (input.lyricScroll !== undefined ? Boolean(input.lyricScroll) : defaultSettings.lyricScrollEnabled),
      playerStyle: ["mini", "standard", "wide"].includes(input.playerStyle) ? input.playerStyle : defaultSettings.playerStyle,
      volume: Number.isFinite(Number(input.volume)) ? Math.min(1, Math.max(0, Number(input.volume))) : defaultSettings.volume,
      playMode: ["list", "single"].includes(input.playMode) ? input.playMode : defaultSettings.playMode,
      cachePolicy
    });
    next.lyricSize = next.lyricFontSize === "standard" ? "medium" : next.lyricFontSize;
    next.lyricScroll = next.lyricScrollEnabled;
    return next;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return cloneFallback(fallback);
      return JSON.parse(raw);
    } catch (error) {
      writeJson(key, cloneFallback(fallback));
      return cloneFallback(fallback);
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("MuseHub storage write failed:", key, error);
    }
  }

  function uniqueHead(list, item, limit) {
    return [item].concat(list.filter((value) => value !== item)).slice(0, limit);
  }

  function uniqueSongHead(list, song, limit) {
    return [song].concat(list.filter((item) => item && item.id !== song.id)).slice(0, limit);
  }

  function playlistRecord(item, index) {
    const id = item && item.id ? item.id : `playlist-${Date.now()}-${index || 0}`;
    const songs = Array.isArray(item && item.songs) ? item.songs.map(favoriteRecord).filter(Boolean) : [];
    return {
      id,
      name: item && item.name ? item.name : "未命名歌单",
      description: item && item.description ? item.description : "本地创建的温柔歌单",
      covers: Array.isArray(item && item.covers) && item.covers.length ? item.covers : ["tone-room", "tone-pink", "tone-yellow", "tone-garden"],
      songs,
      count: songs.length || Number(item && item.count) || 0,
      createdAt: item && item.createdAt ? item.createdAt : new Date().toISOString(),
      updatedAt: item && item.updatedAt ? item.updatedAt : new Date().toISOString()
    };
  }

  function mockSong(songId) {
    return window.MuseHub.Mock.songs.find((song) => song.id === songId) || null;
  }

  function getSongCache() {
    return readJson(keys.songCache, {});
  }

  function saveSong(song) {
    if (!song || !song.id) return null;
    const cache = getSongCache();
    cache[song.id] = song;
    writeJson(keys.songCache, cache);
    return song;
  }

  function saveSongs(songs) {
    if (!Array.isArray(songs) || !songs.length) return;
    const cache = getSongCache();
    songs.forEach((song) => {
      if (song && song.id) cache[song.id] = song;
    });
    writeJson(keys.songCache, cache);
  }

  function getSong(songId) {
    if (!songId) return null;
    return getSongCache()[songId] || mockSong(songId);
  }

  function favoriteRecord(item) {
    if (!item) return null;
    if (typeof item === "string") {
      return getSong(item) || mockSong(item);
    }
    if (item.id) {
      return item;
    }
    return null;
  }

  function migrateLegacy() {
    if (!localStorage.getItem(keys.favorites)) {
      const legacyFavorites = readJson(legacyKeys.favorites, null);
      const initial = Array.isArray(legacyFavorites) && legacyFavorites.length
        ? legacyFavorites.map(favoriteRecord).filter(Boolean)
        : ["song-1", "song-2", "song-8", "song-6", "song-7"].map(favoriteRecord).filter(Boolean);
      writeJson(keys.favorites, initial);
    }

    if (!localStorage.getItem(keys.settings)) {
      writeJson(keys.settings, normalizeSettings(Object.assign({}, window.MuseHub.Mock.settings, readJson(legacyKeys.settings, {}))));
    }

    if (!localStorage.getItem(keys.searches)) {
      const legacySearches = readJson(legacyKeys.searches, null);
      const initialSearches = Array.isArray(legacySearches) && legacySearches.length ? legacySearches : [];
      writeJson(keys.searches, initialSearches.slice(0, 8));
    }

    if (!localStorage.getItem(keys.playlists)) {
      writeJson(keys.playlists, window.MuseHub.Mock.playlists.map((item, index) => playlistRecord(item, index)));
    }

    if (!localStorage.getItem(keys.laterList)) {
      writeJson(keys.laterList, []);
    }

    if (!localStorage.getItem(keys.currentSongId) && localStorage.getItem(legacyKeys.currentSongId)) {
      localStorage.setItem(keys.currentSongId, localStorage.getItem(legacyKeys.currentSongId));
    }
  }

  function init() {
    migrateLegacy();
    writeJson(keys.settings, getSettings());
    saveSongs(window.MuseHub.Mock.songs);
  }

  function getFavorites() {
    return readJson(keys.favorites, []).map(favoriteRecord).filter(Boolean);
  }

  function getFavoriteIds() {
    return getFavorites().map((song) => song.id);
  }

  function setFavorites(songs) {
    const normalized = songs.map(favoriteRecord).filter(Boolean);
    normalized.forEach(saveSong);
    writeJson(keys.favorites, normalized);
  }

  function isFavorite(songId) {
    return getFavoriteIds().includes(songId);
  }

  function toggleFavorite(songOrId) {
    const song = typeof songOrId === "string" ? getSong(songOrId) : saveSong(songOrId);
    const songId = typeof songOrId === "string" ? songOrId : songOrId && songOrId.id;
    if (!songId) return false;
    const favorites = getFavorites();
    const exists = favorites.some((item) => item.id === songId);
    const next = exists ? favorites.filter((item) => item.id !== songId) : [song].concat(favorites).filter(Boolean);
    setFavorites(next);
    return !exists;
  }

  function getHistory() {
    return readJson(keys.history, []);
  }

  function addHistory(songOrId) {
    const song = typeof songOrId === "string" ? getSong(songOrId) : saveSong(songOrId);
    const songId = typeof songOrId === "string" ? songOrId : songOrId && songOrId.id;
    if (song) saveSong(song);
    if (songId) writeJson(keys.history, uniqueHead(getHistory(), songId, 50));
  }

  function getRecentPlayed() {
    return readJson(keys.recentPlayed, []).map(favoriteRecord).filter(Boolean);
  }

  function addRecentPlayed(songOrId) {
    if (getSettings().cachePolicy.keepRecentPlayed === false) return;
    const song = typeof songOrId === "string" ? getSong(songOrId) : saveSong(songOrId);
    if (!song || !song.id) return;
    saveSong(song);
    writeJson(keys.recentPlayed, uniqueSongHead(getRecentPlayed(), song, 50));
    addHistory(song);
  }

  function getSearchHistory() {
    return readJson(keys.searches, []);
  }

  function addSearchHistory(keyword) {
    if (getSettings().cachePolicy.keepSearchHistory === false) return;
    const value = String(keyword || "").trim();
    if (!value) return;
    writeJson(keys.searches, uniqueHead(getSearchHistory(), value, 8));
  }

  function clearSearchHistory() {
    writeJson(keys.searches, []);
  }

  function clearRecentPlayed() {
    writeJson(keys.recentPlayed, []);
    writeJson(keys.history, []);
  }

  function getPlaylists() {
    return readJson(keys.playlists, []).map((item, index) => playlistRecord(item, index));
  }

  function setPlaylists(playlists) {
    const normalized = (Array.isArray(playlists) ? playlists : []).map((item, index) => playlistRecord(item, index));
    normalized.forEach((playlist) => saveSongs(playlist.songs || []));
    writeJson(keys.playlists, normalized);
    return normalized;
  }

  function createPlaylist(name) {
    const title = String(name || "").trim();
    if (!title) return null;
    const playlists = getPlaylists();
    const playlist = playlistRecord({
      id: `playlist-local-${Date.now()}`,
      name: title,
      description: "本地创建的温柔歌单",
      songs: [],
      count: 0,
      covers: ["tone-room", "tone-pink", "tone-yellow", "tone-garden"]
    });
    setPlaylists([playlist].concat(playlists));
    return playlist;
  }

  function getPlaylist(playlistId) {
    return getPlaylists().find((playlist) => playlist.id === playlistId) || null;
  }

  function updatePlaylist(playlistId, partial) {
    let updated = null;
    const next = getPlaylists().map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      updated = playlistRecord(Object.assign({}, playlist, partial || {}, { updatedAt: new Date().toISOString() }));
      return updated;
    });
    setPlaylists(next);
    return updated;
  }

  function getLaterList() {
    return readJson(keys.laterList, []).map(favoriteRecord).filter(Boolean);
  }

  function isLater(songId) {
    return getLaterList().some((song) => song.id === songId);
  }

  function toggleLater(songOrId) {
    const song = typeof songOrId === "string" ? getSong(songOrId) : saveSong(songOrId);
    const songId = typeof songOrId === "string" ? songOrId : songOrId && songOrId.id;
    if (!songId || !song) return false;
    const later = getLaterList();
    const exists = later.some((item) => item.id === songId);
    const next = exists ? later.filter((item) => item.id !== songId) : [song].concat(later);
    next.forEach(saveSong);
    writeJson(keys.laterList, next.slice(0, 80));
    return !exists;
  }

  function getSettings() {
    return normalizeSettings(readJson(keys.settings, {}));
  }

  function saveSettings(partial) {
    const merged = Object.assign({}, getSettings(), partial || {});
    if (partial && partial.cachePolicy) {
      merged.cachePolicy = Object.assign({}, getSettings().cachePolicy, partial.cachePolicy);
    }
    const next = normalizeSettings(merged);
    writeJson(keys.settings, next);
    return next;
  }

  function getCurrentSongId() {
    const song = getCurrentSong();
    return song && song.id ? song.id : localStorage.getItem(keys.currentSongId);
  }

  function setCurrentSongId(songId) {
    if (!songId) {
      localStorage.removeItem(keys.currentSongId);
      localStorage.removeItem(keys.currentSong);
      return;
    }
    const song = getSong(songId);
    if (song) setCurrentSong(song);
    localStorage.setItem(keys.currentSongId, songId);
  }

  function getCurrentSong() {
    const song = favoriteRecord(readJson(keys.currentSong, null));
    if (song) return song;
    const legacyId = localStorage.getItem(keys.currentSongId);
    return legacyId ? getSong(legacyId) : null;
  }

  function setCurrentSong(song) {
    if (!song || !song.id) {
      localStorage.removeItem(keys.currentSong);
      localStorage.removeItem(keys.currentSongId);
      return null;
    }
    saveSong(song);
    writeJson(keys.currentSong, song);
    localStorage.setItem(keys.currentSongId, song.id);
    return song;
  }

  function getPlayerState() {
    return readJson(keys.playerState, {});
  }

  function savePlayerState(partial) {
    const next = Object.assign({}, getPlayerState(), partial || {}, { updatedAt: new Date().toISOString() });
    writeJson(keys.playerState, next);
    return next;
  }

  function estimateSizeForKeys(keyList) {
    const data = {};
    keyList.forEach((key) => {
      data[key] = localStorage.getItem(key) || "";
    });
    return new Blob([JSON.stringify(data)]).size;
  }

  function getCacheSnapshot() {
    const cacheKeys = [keys.searches, keys.recentPlayed, keys.currentSong, keys.playerState, keys.songCache];
    return {
      searchHistory: estimateSizeForKeys([keys.searches]),
      recentPlayed: estimateSizeForKeys([keys.recentPlayed, keys.history]),
      currentPlayback: estimateSizeForKeys([keys.currentSong, keys.playerState]),
      songCache: estimateSizeForKeys([keys.songCache]),
      total: estimateSizeForKeys(cacheKeys)
    };
  }

  function clearCache() {
    writeJson(keys.searches, []);
    clearRecentPlayed();
    writeJson(keys.playerState, {});
    localStorage.removeItem(keys.currentSong);
    localStorage.removeItem(keys.currentSongId);
    localStorage.removeItem(keys.songCache);
    saveSongs(window.MuseHub.Mock.songs);
    if (window.MuseHub.SearchService && window.MuseHub.SearchService.clearCache) {
      window.MuseHub.SearchService.clearCache();
    }
  }

  function exportLocalData() {
    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      favorites: getFavorites(),
      playlists: getPlaylists(),
      laterList: getLaterList(),
      settings: getSettings()
    };
  }

  function importLocalData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("导入文件格式不正确");
    }
    if (data.settings) saveSettings(data.settings);
    if (Array.isArray(data.favorites)) setFavorites(data.favorites);
    if (Array.isArray(data.playlists)) setPlaylists(data.playlists);
    if (Array.isArray(data.laterList)) {
      const normalized = data.laterList.map(favoriteRecord).filter(Boolean);
      normalized.forEach(saveSong);
      writeJson(keys.laterList, normalized);
    }
    return true;
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.Storage = {
    keys,
    init,
    getFavorites,
    getFavoriteIds,
    setFavorites,
    isFavorite,
    toggleFavorite,
    getHistory,
    addHistory,
    getRecentPlayed,
    addRecentPlayed,
    getSearchHistory,
    addSearchHistory,
    clearSearchHistory,
    clearRecentPlayed,
    getPlaylists,
    setPlaylists,
    createPlaylist,
    getPlaylist,
    updatePlaylist,
    getLaterList,
    isLater,
    toggleLater,
    getSettings,
    saveSettings,
    getCurrentSong,
    setCurrentSong,
    getCurrentSongId,
    setCurrentSongId,
    getPlayerState,
    savePlayerState,
    getCacheSnapshot,
    clearCache,
    exportLocalData,
    importLocalData,
    saveSong,
    saveSongs,
    getSong
  };
})();
