(function () {
  const TENCENT_QUALITIES = [8, 4, null];
  const NETEASE_QUALITIES = [4, 3, null];
  const PLAYBACK_TIMEOUT = 8000;
  let lyricRequestId = 0;

  function platformId(song) {
    if (!song) return "";
    if (song.platformId) return String(song.platformId);
    if (song.raw && song.raw.id !== undefined && song.raw.id !== null) return String(song.raw.id);
    const match = String(song.id || "").match(/^(?:tencent|netease)-(.+)$/);
    return match ? match[1] : String(song.id || "");
  }

  function songMid(song) {
    return song && (song.mid || song.songmid || song.raw && (song.raw.mid || song.raw.songmid)) || "";
  }

  function sourceName(song) {
    if (!song) return "当前来源";
    return song.sourceName || (song.source === "tencent" ? "QQ音乐" : song.source === "netease" ? "网易云音乐" : "当前来源");
  }

  function playableError(message, code) {
    const error = new Error(message);
    error.code = code || "PLAYABLE_ERROR";
    return error;
  }

  function friendlyError(error) {
    const message = error && error.message ? error.message : "";
    if (/会员|付费|pay|vip|版权|试听|无音源/i.test(message)) return "当前歌曲可能暂不可播放，请尝试其他版本或其他来源。";
    if (/暂无可用音源|url|URL|音源/i.test(message)) return "当前歌曲暂无可用音源，可以试试其他版本或其他来源。";
    if (/play|NotAllowed|NotSupported|audio|media/i.test(message)) return "播放失败，可能是音源失效或浏览器限制。";
    if (/HTTP|超时|Failed|fetch|Network|接口|请求/i.test(message)) return "网络好像走丢了，请稍后再试。";
    return message || "播放失败，可能是音源失效或浏览器限制。";
  }

  function audioProxyUrl(url) {
    if (!url || !window.location || !/^https?:$/.test(window.location.protocol)) return "";
    return `${window.location.origin}/api/audio?url=${encodeURIComponent(url)}`;
  }

  function isAudioProxyUrl(url) {
    return Boolean(url && window.location && String(url).startsWith(`${window.location.origin}/api/audio?`));
  }

  function canProxyAudioUrl(url) {
    return Boolean(url && /^https?:\/\//i.test(String(url)) && !isAudioProxyUrl(url) && window.location && /^https?:$/.test(window.location.protocol));
  }

  function normalizeAudioUrl(url) {
    if (!url) return "";
    const text = String(url).trim();
    if (!text) return "";
    if (text.startsWith("//")) return `${window.location.protocol === "https:" ? "https:" : "http:"}${text}`;
    if (window.location.protocol === "https:" && /^http:\/\//i.test(text)) return audioProxyUrl(text);
    return text;
  }

  function normalizePlayable(song, response) {
    const next = window.MuseHub.Normalize.normalizePlayableSong(song, response);
    const originalUrl = String(next.url || "").trim();
    next.originalUrl = originalUrl;
    next.directUrl = originalUrl.startsWith("//")
      ? `${window.location.protocol === "https:" ? "https:" : "http:"}${originalUrl}`
      : originalUrl;
    next.url = normalizeAudioUrl(next.url);
    if (!next.url) throw playableError("当前歌曲暂无可用音源", "NO_URL");
    return next;
  }

  async function playResolvedWithRetry(playable) {
    try {
      return await window.MuseHub.Player.playResolvedSong(playable);
    } catch (error) {
      const rawUrl = playable && (playable.originalUrl || playable.directUrl);
      const proxy = canProxyAudioUrl(rawUrl) ? audioProxyUrl(rawUrl) : "";
      if (proxy && playable.url !== proxy) {
        if (window.MuseHub.UI) window.MuseHub.UI.showToast("音源直连失败，正在尝试安全线路");
        return window.MuseHub.Player.playResolvedSong(Object.assign({}, playable, {
          url: proxy,
          audioProxy: true
        }));
      }
      throw error;
    }
  }

  function collectTencentIdentities(song) {
    const id = platformId(song);
    const mid = songMid(song);
    return {
      id: id && /^\d+$/.test(id) ? id : "",
      mid: mid || (id && !/^\d+$/.test(id) ? id : "")
    };
  }

  function attemptLabel(kind, params) {
    const via = params.id ? `id=${params.id}` : `mid=${params.mid}`;
    const quality = params.quality ? ` quality=${params.quality}` : "";
    return `${kind} ${via}${quality}`;
  }

  async function tryAttempts(song, attempts) {
    const errors = [];
    for (const attempt of attempts) {
      try {
        const response = await attempt.run();
        return normalizePlayable(song, response);
      } catch (error) {
        error.attempt = attempt.label;
        errors.push(error);
      }
    }
    throw errors[errors.length - 1] || playableError("当前歌曲暂无可用音源", "NO_URL");
  }

  function tencentGetUrlAttempts(song) {
    const ids = collectTencentIdentities(song);
    const attempts = [];
    if (ids.id) {
      TENCENT_QUALITIES.forEach((quality) => {
        const params = { id: ids.id };
        if (quality) params.quality = quality;
        attempts.push({ label: attemptLabel("tencent/geturl", params), run: () => window.MuseHub.Api.getTencentSongUrl(params, { timeout: PLAYBACK_TIMEOUT }) });
      });
    }
    if (ids.mid) {
      TENCENT_QUALITIES.forEach((quality) => {
        const params = { mid: ids.mid };
        if (quality) params.quality = quality;
        attempts.push({ label: attemptLabel("tencent/geturl", params), run: () => window.MuseHub.Api.getTencentSongUrl(params, { timeout: PLAYBACK_TIMEOUT }) });
      });
    }
    return attempts;
  }

  function tencentDetailAttempts(song) {
    const ids = collectTencentIdentities(song);
    const attempts = [];
    [
      ids.id ? { id: ids.id, quality: 4 } : null,
      ids.mid ? { mid: ids.mid, quality: 4 } : null,
      ids.id ? { id: ids.id } : null,
      ids.mid ? { mid: ids.mid } : null
    ].filter(Boolean).forEach((params) => {
      attempts.push({ label: attemptLabel("tencent/detail", params), run: () => window.MuseHub.Api.getTencentSongDetail(params, { timeout: PLAYBACK_TIMEOUT }) });
    });
    return attempts;
  }

  async function resolveTencentPlayable(song) {
    const ids = collectTencentIdentities(song);
    if (!ids.id && !ids.mid) throw playableError("当前歌曲缺少 QQ 音乐 id 或 mid", "NO_ID");
    return tryAttempts(song, tencentGetUrlAttempts(song).concat(tencentDetailAttempts(song)));
  }

  async function resolveNeteasePlayable(song) {
    const id = platformId(song);
    if (!id) throw playableError("当前歌曲缺少网易云音乐 id", "NO_ID");
    const attempts = NETEASE_QUALITIES.map((quality) => {
      const params = { id };
      if (quality) params.quality = quality;
      return { label: attemptLabel("netease", params), run: () => window.MuseHub.Api.getNeteaseSongUrl(params, { timeout: PLAYBACK_TIMEOUT }) };
    });
    return tryAttempts(song, attempts);
  }

  async function resolvePlayableSong(song) {
    if (!song) throw playableError("没有找到要播放的歌曲", "NO_SONG");
    if (song.source === "tencent") return resolveTencentPlayable(song);
    if (song.source === "netease") return resolveNeteasePlayable(song);
    throw playableError(`${sourceName(song)} 暂不支持真实播放`, "UNSUPPORTED_SOURCE");
  }

  function cleanText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[（(【\[].*?[）)】\]]/g, "")
      .replace(/\b(live|remix|cover|ver\.?|version|mv)\b/gi, "")
      .replace(/伴奏|翻唱|现场|变速|加速|慢速|片段|完整版|试听版/gi, "")
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .trim();
  }

  function artistTokens(value) {
    return String(value || "")
      .toLowerCase()
      .split(/[、，,&/\s]+/)
      .map(cleanText)
      .filter(Boolean);
  }

  function titleSimilar(a, b) {
    const left = cleanText(a && a.name);
    const right = cleanText(b && b.name);
    if (!left || !right) return false;
    return left === right || left.includes(right) || right.includes(left);
  }

  function artistSimilar(a, b) {
    const left = artistTokens(a && a.artist);
    const right = artistTokens(b && b.artist);
    if (!left.length || !right.length) return true;
    return left.some((item) => right.includes(item) || right.some((other) => item.includes(other) || other.includes(item)));
  }

  function candidateScore(candidate, song) {
    if (!candidate || candidate.id === song.id || candidate.source === song.source) return 0;
    let score = 0;
    if (String(candidate.name || "").trim() === String(song.name || "").trim()) score += 4;
    else if (titleSimilar(candidate, song)) score += 3;
    if (String(candidate.artist || "").trim() === String(song.artist || "").trim()) score += 3;
    else if (artistSimilar(candidate, song)) score += 2;
    return score;
  }

  function localAlternateCandidates(song, triedIds) {
    const queue = window.MuseHub.Player.getState().queue || [];
    const searchResults = window.MuseHub.SearchService && window.MuseHub.SearchService.getCurrentSearchResults
      ? window.MuseHub.SearchService.getCurrentSearchResults()
      : [];
    const seen = new Set(triedIds || []);
    return searchResults.concat(queue)
      .filter((item) => item && !seen.has(item.id))
      .map((item) => ({ song: item, score: candidateScore(item, song) }))
      .filter((item) => item.score >= 4)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.song);
  }

  async function backgroundAlternateCandidates(song, triedIds) {
    if (!window.MuseHub.SearchService) return [];
    try {
      const keyword = [song.name, song.artist].filter(Boolean).join(" ");
      const result = await window.MuseHub.SearchService.search({ keyword, source: "all", page: 1, num: 12 });
      const seen = new Set(triedIds || []);
      return (result.songs || [])
        .filter((item) => item && !seen.has(item.id))
        .map((item) => ({ song: item, score: candidateScore(item, song) }))
        .filter((item) => item.score >= 4)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.song);
    } catch (error) {
      return [];
    }
  }

  async function tryAlternateCandidates(candidates, triedIds, options) {
    const depth = options && Number(options.switchDepth) || 0;
    const limit = Math.max(0, 3 - depth);
    for (const candidate of candidates.slice(0, limit)) {
      const played = await playSong(candidate, {
        force: true,
        triedIds: (triedIds || []).concat(candidate.id),
        autoSearchTried: true,
        switchDepth: 3,
        suppressFinalToast: true
      });
      if (played) {
        if (window.MuseHub.UI) window.MuseHub.UI.showToast("当前来源不可用，已为你切换到其他来源。");
        return played;
      }
    }
    return null;
  }

  async function requestLyric(song) {
    if (!window.MuseHub.LyricService) return;
    const requestId = ++lyricRequestId;
    window.MuseHub.Player.setLyricStatus("loading");
    try {
      const lyric = await window.MuseHub.LyricService.fetchLyric(song);
      const current = window.MuseHub.Player.getState().currentSong;
      if (requestId !== lyricRequestId || !current || current.id !== song.id) return;
      const next = Object.assign({}, current, {
        lyric: lyric.lrc || "",
        transLyric: lyric.trans || "",
        parsedLyrics: lyric.parsedLyrics || [],
        hasLyric: Boolean(lyric.parsedLyrics && lyric.parsedLyrics.length),
        lyricStatus: lyric.parsedLyrics && lyric.parsedLyrics.length ? "ready" : "empty",
        lyricRaw: lyric.raw || null
      });
      window.MuseHub.Player.updateCurrentSong(next, "lyric");
      if (!next.hasLyric && window.MuseHub.UI) window.MuseHub.UI.showToast("暂无歌词");
    } catch (error) {
      const current = window.MuseHub.Player.getState().currentSong;
      if (requestId !== lyricRequestId || !current || current.id !== song.id) return;
      const next = Object.assign({}, current, {
        lyric: "",
        parsedLyrics: [],
        hasLyric: false,
        lyricStatus: "error",
        lyricError: error && error.message ? error.message : "暂无歌词"
      });
      window.MuseHub.Player.updateCurrentSong(next, "lyric");
      if (window.MuseHub.UI) window.MuseHub.UI.showToast("暂无歌词");
    }
  }

  async function playSong(songOrId, options) {
    const opts = options || {};
    const song = typeof songOrId === "string" ? window.MuseHub.Storage.getSong(songOrId) : songOrId;
    if (!song) {
      if (window.MuseHub.UI && !opts.suppressFinalToast) window.MuseHub.UI.showToast("没有找到要播放的歌曲");
      return null;
    }

    const current = window.MuseHub.Player.getState().currentSong;
    if (!opts.force && current && current.id === song.id && current.url && !window.MuseHub.Player.getState().isLoading) {
      return window.MuseHub.Player.toggle();
    }

    const triedIds = Array.from(new Set(opts.triedIds || [song.id]));
    window.MuseHub.Player.setLoading(song);
    try {
      const playable = await resolvePlayableSong(song);
      await playResolvedWithRetry(playable);
      requestLyric(playable);
      return playable;
    } catch (error) {
      return handlePlayError(song, error, Object.assign({}, opts, { triedIds }));
    }
  }

  async function handlePlayError(song, error, options) {
    const opts = options || {};
    const settings = window.MuseHub.Storage.getSettings();
    const triedIds = Array.from(new Set(opts.triedIds || [song && song.id].filter(Boolean)));

    if (settings.autoSwitchSource && (Number(opts.switchDepth) || 0) < 3) {
      const localCandidates = localAlternateCandidates(song, triedIds);
      if (localCandidates.length) {
        if (window.MuseHub.UI && !opts.suppressFinalToast) window.MuseHub.UI.showToast("当前音源不可用，正在尝试其他来源");
        const played = await tryAlternateCandidates(localCandidates, triedIds, opts);
        if (played) return played;
      }

      if (!localCandidates.length && !opts.autoSearchTried) {
        const backgroundCandidates = await backgroundAlternateCandidates(song, triedIds);
        if (backgroundCandidates.length) {
          if (window.MuseHub.UI && !opts.suppressFinalToast) window.MuseHub.UI.showToast("当前来源不可用，正在轻量换源");
          const played = await tryAlternateCandidates(backgroundCandidates, triedIds, Object.assign({}, opts, { autoSearchTried: true }));
          if (played) return played;
        }
      }
    }

    const message = friendlyError(error);
    window.MuseHub.Player.setError(message, song);
    if (window.MuseHub.UI && !opts.suppressFinalToast) window.MuseHub.UI.showToast(message);
    return null;
  }

  function pause() {
    return window.MuseHub.Player.pause();
  }

  function resume() {
    return window.MuseHub.Player.resume();
  }

  function togglePlay() {
    return window.MuseHub.Player.toggle();
  }

  function next() {
    return window.MuseHub.Player.next();
  }

  function prev() {
    return window.MuseHub.Player.prev();
  }

  function seek(value) {
    return window.MuseHub.Player.seek(value);
  }

  function setVolume(value) {
    return window.MuseHub.Player.setVolume(value);
  }

  function updateCurrentSong(song) {
    return window.MuseHub.Player.updateCurrentSong(song, "service-update");
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.PlayerService = {
    playSong,
    resolvePlayableSong,
    resolveTencentPlayable,
    resolveNeteasePlayable,
    pause,
    resume,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    updateCurrentSong,
    handlePlayError
  };
})();
