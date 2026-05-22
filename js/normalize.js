(function () {
  function toHttps(url) {
    if (!url) return "";
    return String(url).replace(/^http:\/\//i, "https://");
  }

  function dataObject(response) {
    const data = response && response.data !== undefined ? response.data : response;
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  }

  function parseDuration(value) {
    if (typeof value === "number") {
      if (!Number.isFinite(value) || value <= 0) return 0;
      return value > 10000 ? Math.round(value / 1000) : Math.round(value);
    }
    const text = String(value || "").trim();
    if (!text) return 0;
    const mmss = text.match(/^(\d{1,2}):(\d{2})$/);
    if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
    const cn = text.match(/(?:(\d+)\s*分)?\s*(?:(\d+)\s*秒)?/);
    if (cn && (cn[1] || cn[2])) return Number(cn[1] || 0) * 60 + Number(cn[2] || 0);
    return 0;
  }

  function formatDuration(seconds) {
    if (!seconds) return "--:--";
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const min = Math.floor(safe / 60);
    const sec = String(safe % 60).padStart(2, "0");
    return `${min}:${sec}`;
  }

  function qualityTags(raw) {
    const quality = String(raw.quality || "");
    if (!quality) return [];
    if (/母带|臻音|Hi-?Res|无损|SQ/i.test(quality)) {
      if (/母带|Hi-?Res/i.test(quality)) return ["Hi-Res"];
      if (/无损|SQ/i.test(quality)) return ["SQ"];
      return ["臻音"];
    }
    return [];
  }

  function singerName(raw) {
    if (raw.singer) return raw.singer;
    if (Array.isArray(raw.singer_list) && raw.singer_list.length) {
      return raw.singer_list.map((item) => item.name || item.title).filter(Boolean).join(" / ");
    }
    if (Array.isArray(raw.artists) && raw.artists.length) {
      return raw.artists.map((item) => item.name).filter(Boolean).join(" / ");
    }
    return "未知歌手";
  }

  function albumName(raw) {
    if (!raw) return "未知专辑";
    if (typeof raw.album === "string" && raw.album.trim()) return raw.album;
    if (raw.al && raw.al.name) return raw.al.name;
    return "未知专辑";
  }

  function songName(raw) {
    if (!raw) return "未知歌曲";
    return raw.song || raw.name || raw.title || "未知歌曲";
  }

  function stableId(source, raw) {
    const value = raw.id || raw.mid || raw.songmid || `${songName(raw)}-${singerName(raw)}`;
    return `${source}-${value}`;
  }

  function baseSong(source, raw) {
    const duration = parseDuration(raw.interval || raw.duration || raw.timeLength || raw.dt);
    const cover = toHttps(raw.cover || raw.picUrl || raw.image || raw.al && raw.al.picUrl);
    return {
      id: stableId(source, raw),
      platformId: raw.id !== undefined && raw.id !== null ? String(raw.id) : "",
      mid: raw.mid || raw.songmid || "",
      vid: raw.vid || raw.mv || "",
      source,
      sourceName: source === "tencent" ? "QQ音乐" : "网易云音乐",
      name: songName(raw),
      artist: singerName(raw),
      album: albumName(raw),
      duration,
      durationText: formatDuration(duration),
      cover,
      coverUrl: cover,
      url: raw.url || "",
      link: raw.link || "",
      quality: raw.quality || "",
      playable: raw.url !== null,
      hasLyric: Boolean(raw.lrc || raw.lyric),
      hasMv: Boolean(raw.vid || raw.mv),
      lyric: raw.lrc || raw.lyric || "",
      parsedLyrics: [],
      tags: qualityTags(raw),
      raw
    };
  }

  function normalizeTencentSong(raw) {
    return Object.assign(baseSong("tencent", raw), { hasLyric: false });
  }

  function normalizeNeteaseSong(raw) {
    return Object.assign(baseSong("netease", raw), { mid: "", hasLyric: false });
  }

  function normalizePlayableSong(song, response) {
    const raw = dataObject(response);
    if (typeof raw === "string") {
      return Object.assign({}, song, {
        url: raw,
        playable: Boolean(raw),
        raw: Object.assign({}, song.raw && { search: song.raw }, { playable: raw })
      });
    }
    if (!raw) return song;
    const source = song.source === "netease" ? "netease" : "tencent";
    const normalized = source === "netease" ? normalizeNeteaseSong(raw) : normalizeTencentSong(raw);
    const next = Object.assign({}, song, normalized, {
      id: song.id || normalized.id,
      source: song.source || normalized.source,
      sourceName: song.sourceName || normalized.sourceName,
      platformId: normalized.platformId || song.platformId || "",
      mid: normalized.mid || song.mid || "",
      vid: normalized.vid || song.vid || "",
      name: normalized.name || song.name,
      artist: normalized.artist || song.artist,
      album: normalized.album || song.album,
      cover: normalized.cover || song.cover,
      coverUrl: normalized.coverUrl || song.coverUrl,
      duration: normalized.duration || song.duration || 0,
      durationText: normalized.duration ? normalized.durationText : (song.durationText || normalized.durationText),
      url: raw.url || "",
      link: raw.link || song.link || "",
      quality: raw.quality || song.quality || "",
      playable: Boolean(raw.url),
      hasLyric: song.hasLyric || Boolean(song.lyric),
      parsedLyrics: song.parsedLyrics || [],
      tags: normalized.tags && normalized.tags.length ? normalized.tags : (song.tags || []),
      raw: Object.assign({}, song.raw && { search: song.raw }, { playable: raw })
    });
    return next;
  }

  function normalizeLyricResponse(response) {
    const raw = dataObject(response) || {};
    const lrc = raw.lrc || raw.lyric || raw.lyc || raw.text || "";
    const trans = raw.trans || raw.tlyric || raw.translation || "";
    return { lrc, trans, raw };
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.Normalize = {
    toHttps,
    dataObject,
    parseDuration,
    formatDuration,
    normalizeTencentSong,
    normalizeNeteaseSong,
    normalizePlayableSong,
    normalizeLyricResponse
  };
})();
