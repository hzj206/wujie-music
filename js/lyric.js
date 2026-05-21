(function () {
  let lastSyncedIndex = -1;

  function durationToSeconds(duration) {
    const parts = String(duration || "00:00").split(":").map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }

  function secondsToTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds || 0));
    const min = Math.floor(safe / 60);
    const sec = String(safe % 60).padStart(2, "0");
    return `${min}:${sec}`;
  }

  function lyricLines(song) {
    if (!song) return [];
    if (Array.isArray(song.parsedLyrics) && song.parsedLyrics.length) return song.parsedLyrics;
    if (Array.isArray(song.lyric)) {
      return song.lyric.map((line) => ({
        time: line.time || 0,
        text: line.text || line.jp || "",
        translation: line.translation || line.zh || ""
      }));
    }
    return [];
  }

  function activeIndex(song, progressSeconds) {
    const lines = lyricLines(song);
    if (!lines.length) return -1;
    if (window.MuseHub.LyricService) {
      return window.MuseHub.LyricService.getCurrentLyricIndex(lines, progressSeconds);
    }
    let index = 0;
    lines.forEach((line, i) => {
      if (progressSeconds >= line.time) index = i;
    });
    return index;
  }

  function displayLines(song) {
    return lyricLines(song).map((line, index) => Object.assign({}, line, { index }));
  }

  function windowedLines(song, progressSeconds, before, after) {
    const lines = displayLines(song);
    const index = activeIndex(song, progressSeconds);
    if (!lines.length) return [];
    const start = Math.max(0, index - before);
    const end = Math.min(lines.length, index + after + 1);
    return lines.slice(start, end).map((line) => Object.assign({}, line, {
      active: line.index === index,
      near: Math.abs(line.index - index) === 1
    }));
  }

  function syncActiveLines(song, progressSeconds) {
    const index = activeIndex(song, progressSeconds);
    const settings = window.MuseHub.Storage && window.MuseHub.Storage.getSettings ? window.MuseHub.Storage.getSettings() : {};
    const shouldScroll = settings.lyricScrollEnabled !== false && index !== lastSyncedIndex;
    document.querySelectorAll("[data-lyric-index]").forEach((element) => {
      const lineIndex = Number(element.dataset.lyricIndex);
      element.classList.toggle("is-active", lineIndex === index);
      element.classList.toggle("is-near", Math.abs(lineIndex - index) === 1);
      if (shouldScroll && lineIndex === index && (element.closest(".lyrics-focus-list") || element.closest(".lyrics-preview"))) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
    lastSyncedIndex = index;
    return index;
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.Lyric = {
    durationToSeconds,
    secondsToTime,
    lyricLines,
    activeIndex,
    displayLines,
    windowedLines,
    syncActiveLines
  };
})();
