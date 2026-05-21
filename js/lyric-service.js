(function () {
  function platformId(song) {
    if (!song) return "";
    if (song.platformId) return song.platformId;
    if (song.raw && song.raw.id !== undefined && song.raw.id !== null) return String(song.raw.id);
    const match = String(song.id || "").match(/^(?:tencent|netease)-(.+)$/);
    return match ? match[1] : String(song.id || "");
  }

  function parseTime(min, sec, ms) {
    return Number(min || 0) * 60 + Number(sec || 0) + Number(`0.${ms || 0}`);
  }

  function parseLrc(lrcText) {
    const lines = String(lrcText || "").split(/\r?\n/);
    const result = [];
    lines.forEach((line) => {
      const timeTags = Array.from(line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g));
      if (!timeTags.length) return;
      const text = line.replace(/\[[^\]]+\]/g, "").trim();
      timeTags.forEach((tag) => {
        result.push({
          time: parseTime(tag[1], tag[2], tag[3]),
          text
        });
      });
    });
    return result.sort((a, b) => a.time - b.time);
  }

  function mergeTranslation(lines, transText) {
    if (!lines.length || !transText) return lines;
    const translations = parseLrc(transText).filter((line) => line.text);
    if (!translations.length) return lines;
    return lines.map((line) => {
      const match = translations.find((item) => Math.abs(item.time - line.time) < 0.35);
      return match ? Object.assign({}, line, { translation: match.text }) : line;
    });
  }

  function normalizeLyricResponse(response) {
    return window.MuseHub.Normalize.normalizeLyricResponse(response);
  }

  async function fetchLyric(song) {
    if (!song || !song.source) return { lrc: "", trans: "", parsedLyrics: [] };
    const source = song.source === "netease" ? "netease" : "tencent";
    let response;
    if (source === "tencent") {
      const id = platformId(song);
      const params = {};
      if (id && /^\d+$/.test(id)) params.id = id;
      else if (song.mid || id) params.mid = song.mid || id;
      if (!params.id && !params.mid) return { lrc: "", trans: "", parsedLyrics: [] };
      response = await window.MuseHub.Api.getTencentLyric(params);
    } else {
      const id = platformId(song);
      if (!id) return { lrc: "", trans: "", parsedLyrics: [] };
      response = await window.MuseHub.Api.getNeteaseLyric({ id });
    }
    const normalized = normalizeLyricResponse(response);
    const parsedLyrics = mergeTranslation(parseLrc(normalized.lrc), normalized.trans);
    return Object.assign({}, normalized, { parsedLyrics });
  }

  function getCurrentLyricIndex(lines, currentTime) {
    const safeLines = Array.isArray(lines) ? lines : [];
    if (!safeLines.length) return -1;
    let index = 0;
    safeLines.forEach((line, i) => {
      if (Number(currentTime || 0) >= line.time) index = i;
    });
    return index;
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.LyricService = {
    fetchLyric,
    parseLrc,
    getCurrentLyricIndex,
    normalizeLyricResponse
  };
})();
