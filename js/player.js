(function () {
  const listeners = new Set();
  let audio = null;

  const state = {
    queue: [],
    currentSong: null,
    previousSong: null,
    pendingSong: null,
    isPlaying: false,
    isLoading: false,
    loadingSongId: "",
    progress: 0,
    currentTime: 0,
    duration: 0,
    volume: 66,
    error: null,
    lyricStatus: "idle",
    parsedLyrics: [],
    currentLyricIndex: -1,
    repeatMode: "list",
    shuffleEnabled: false
  };

  function findSong(songId) {
    if (!songId) return null;
    return window.MuseHub.Storage.getSong(songId) || window.MuseHub.Mock.songs.find((song) => song.id === songId) || null;
  }

  function durationSeconds(song) {
    if (!song) return 0;
    if (Number.isFinite(state.duration) && state.duration > 0 && state.currentSong && song.id === state.currentSong.id) return state.duration;
    if (typeof song.duration === "number") return song.duration;
    return window.MuseHub.Lyric.durationToSeconds(song.duration || song.durationText || "00:00");
  }

  function lyricLines(song) {
    if (!song) return [];
    if (Array.isArray(song.parsedLyrics)) return song.parsedLyrics;
    return [];
  }

  function calculateCurrentLyricIndex() {
    const lines = lyricLines(state.currentSong);
    if (!lines.length || !window.MuseHub.LyricService) return -1;
    return window.MuseHub.LyricService.getCurrentLyricIndex(lines, state.progress);
  }

  function savePlayerState() {
    if (!window.MuseHub.Storage || !window.MuseHub.Storage.savePlayerState) return;
    window.MuseHub.Storage.savePlayerState({
      currentSongId: state.currentSong && state.currentSong.id,
      progress: state.progress,
      duration: state.duration,
      volume: state.volume,
      repeatMode: state.repeatMode,
      shuffleEnabled: state.shuffleEnabled
    });
  }

  function notify(reason) {
    state.currentLyricIndex = calculateCurrentLyricIndex();
    listeners.forEach((listener) => listener(getState(), reason));
  }

  function getAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = "metadata";
    audio.volume = state.volume / 100;

    audio.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(audio.duration)) {
        state.duration = Math.round(audio.duration);
        if (state.currentSong) {
          state.currentSong = Object.assign({}, state.currentSong, {
            duration: state.duration,
            durationText: window.MuseHub.Normalize.formatDuration(state.duration)
          });
          window.MuseHub.Storage.saveSong(state.currentSong);
          window.MuseHub.Storage.setCurrentSong(state.currentSong);
        }
      }
      savePlayerState();
      notify("metadata");
    });

    audio.addEventListener("timeupdate", () => {
      state.progress = audio.currentTime || 0;
      state.currentTime = state.progress;
      if (Number.isFinite(audio.duration)) state.duration = audio.duration;
      savePlayerState();
      notify("timeupdate");
    });

    audio.addEventListener("play", () => {
      state.isPlaying = true;
      state.isLoading = false;
      state.loadingSongId = "";
      state.pendingSong = null;
      state.error = null;
      notify("playstate");
    });

    audio.addEventListener("pause", () => {
      state.isPlaying = false;
      if (!state.pendingSong) {
        state.isLoading = false;
        state.loadingSongId = "";
      }
      notify("playstate");
    });

    audio.addEventListener("ended", () => {
      state.isPlaying = false;
      notify("ended");
      if (state.repeatMode === "one" && state.currentSong) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      next();
    });

    audio.addEventListener("error", () => {
      if (!state.currentSong || state.isLoading) return;
      const error = new Error("播放失败，可能是音源失效或浏览器限制。");
      if (window.MuseHub.PlayerService) {
        window.MuseHub.PlayerService.handlePlayError(state.currentSong, error, { triedIds: [state.currentSong.id], fromAudioError: true });
      } else {
        setError(error.message, state.currentSong);
      }
    });

    return audio;
  }

  function init() {
    const saved = window.MuseHub.Storage.getPlayerState ? window.MuseHub.Storage.getPlayerState() : {};
    const settings = window.MuseHub.Storage.getSettings ? window.MuseHub.Storage.getSettings() : {};
    const recent = window.MuseHub.Storage.getRecentPlayed ? window.MuseHub.Storage.getRecentPlayed() : [];
    state.queue = recent.length ? recent : window.MuseHub.Mock.songs.slice();
    state.currentSong = window.MuseHub.Storage.getCurrentSong ? window.MuseHub.Storage.getCurrentSong() : findSong(window.MuseHub.Storage.getCurrentSongId());
    if (state.currentSong && !state.queue.some((song) => song.id === state.currentSong.id)) state.queue.unshift(state.currentSong);
    state.duration = durationSeconds(state.currentSong);
    state.progress = 0;
    state.currentTime = 0;
    const settingsVolume = Number.isFinite(Number(settings.volume)) ? Math.round(Number(settings.volume) * 100) : state.volume;
    state.volume = Number.isFinite(Number(saved.volume)) ? Number(saved.volume) : settingsVolume;
    state.repeatMode = saved.repeatMode === "one" || settings.playMode === "single" ? "one" : "list";
    state.shuffleEnabled = Boolean(saved.shuffleEnabled);
    if (state.currentSong) {
      state.lyricStatus = state.currentSong.lyricStatus || (lyricLines(state.currentSong).length ? "ready" : "idle");
      state.parsedLyrics = lyricLines(state.currentSong);
      window.MuseHub.Storage.saveSong(state.currentSong);
      window.MuseHub.Storage.setCurrentSong(state.currentSong);
    }
    getAudio();
  }

  function getState() {
    const song = state.currentSong;
    const pendingSong = state.pendingSong;
    const duration = durationSeconds(song);
    return {
      queue: state.queue.slice(),
      currentSong: song,
      previousSong: state.previousSong,
      pendingSong,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      loadingSongId: state.loadingSongId,
      progress: state.progress,
      currentTime: state.currentTime,
      volume: state.volume,
      duration,
      durationText: window.MuseHub.Normalize.formatDuration(duration),
      progressText: window.MuseHub.Lyric.secondsToTime(state.progress),
      error: state.error,
      lyricStatus: state.lyricStatus,
      parsedLyrics: lyricLines(song),
      currentLyricIndex: state.currentLyricIndex,
      repeatMode: state.repeatMode,
      shuffleEnabled: state.shuffleEnabled
    };
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function setQueue(songs) {
    if (!Array.isArray(songs) || !songs.length) return;
    window.MuseHub.Storage.saveSongs(songs);
    const current = state.currentSong;
    state.queue = current && !songs.some((song) => song.id === current.id) ? [current].concat(songs) : songs.slice();
    notify("queue");
  }

  function setLoading(song) {
    const nextSong = typeof song === "string" ? findSong(song) : song;
    if (!nextSong) return;
    state.previousSong = state.currentSong;
    state.pendingSong = nextSong;
    state.isLoading = true;
    state.loadingSongId = nextSong.id;
    state.error = null;
    if (state.isPlaying) getAudio().pause();
    notify("loading");
  }

  function setError(message, song) {
    state.isLoading = false;
    state.loadingSongId = "";
    state.pendingSong = null;
    state.isPlaying = false;
    state.error = { message: message || "", songId: song && song.id };
    notify("error");
  }

  async function playResolvedSong(song) {
    const nextSong = Object.assign({}, song, {
      lyric: "",
      transLyric: "",
      parsedLyrics: [],
      hasLyric: false,
      lyricStatus: "loading"
    });
    const element = getAudio();
    const previousSong = state.currentSong;
    const previousSrc = element.src;
    const previousProgress = state.progress;
    const previousDuration = state.duration;

    state.previousSong = previousSong;
    state.currentSong = nextSong;
    state.pendingSong = null;
    state.isLoading = true;
    state.loadingSongId = nextSong.id;
    state.error = null;
    state.lyricStatus = "loading";
    state.parsedLyrics = [];
    state.currentLyricIndex = -1;
    state.progress = 0;
    state.currentTime = 0;
    state.duration = nextSong.duration || 0;
    if (!state.queue.some((item) => item.id === nextSong.id)) state.queue = [nextSong].concat(state.queue);
    window.MuseHub.Storage.saveSong(nextSong);
    window.MuseHub.Storage.setCurrentSong(nextSong);
    notify("songpending");

    try {
      element.src = nextSong.url;
      element.volume = state.volume / 100;
      await element.play();
      window.MuseHub.Storage.addRecentPlayed(nextSong);
      savePlayerState();
      notify("songchange");
      return nextSong;
    } catch (error) {
      element.pause();
      if (previousSrc) element.src = previousSrc;
      state.currentSong = previousSong;
      state.pendingSong = null;
      state.isLoading = false;
      state.loadingSongId = "";
      state.isPlaying = false;
      state.lyricStatus = previousSong ? (previousSong.lyricStatus || "idle") : "idle";
      state.progress = previousProgress || 0;
      state.currentTime = state.progress;
      state.duration = previousDuration || durationSeconds(previousSong);
      state.error = { message: error && error.message ? error.message : "播放失败", songId: nextSong.id };
      if (previousSong) window.MuseHub.Storage.setCurrentSong(previousSong);
      notify("error");
      throw error;
    }
  }

  function updateCurrentSong(song, reason) {
    if (!song || !song.id) return;
    state.currentSong = song;
    state.duration = song.duration || state.duration;
    state.lyricStatus = song.lyricStatus || state.lyricStatus;
    state.parsedLyrics = lyricLines(song);
    state.currentLyricIndex = calculateCurrentLyricIndex();
    state.queue = state.queue.map((item) => item.id === song.id ? song : item);
    if (!state.queue.some((item) => item.id === song.id)) state.queue.unshift(song);
    window.MuseHub.Storage.saveSong(song);
    window.MuseHub.Storage.setCurrentSong(song);
    notify(reason || "songupdate");
  }

  function setLyricStatus(status) {
    state.lyricStatus = status || "idle";
    if (state.currentSong) {
      state.currentSong = Object.assign({}, state.currentSong, {
        lyricStatus: state.lyricStatus,
        parsedLyrics: status === "loading" ? [] : state.currentSong.parsedLyrics || []
      });
      state.parsedLyrics = state.currentSong.parsedLyrics || [];
      window.MuseHub.Storage.saveSong(state.currentSong);
      window.MuseHub.Storage.setCurrentSong(state.currentSong);
    }
    notify("lyric");
  }

  function play(songId) {
    const song = findSong(songId);
    return window.MuseHub.PlayerService.playSong(song);
  }

  function pause() {
    getAudio().pause();
    state.isPlaying = false;
    notify("playstate");
  }

  async function resume() {
    if (!state.currentSong) return null;
    if (!getAudio().src || !state.currentSong.url) {
      return window.MuseHub.PlayerService.playSong(state.currentSong, { force: true });
    }
    await getAudio().play();
    return state.currentSong;
  }

  function toggle() {
    if (state.isLoading) return Promise.resolve(state.currentSong);
    if (state.isPlaying) {
      pause();
      return Promise.resolve(state.currentSong);
    }
    return resume();
  }

  function setPlaying(value) {
    if (value) return resume();
    pause();
    return Promise.resolve(state.currentSong);
  }

  function next() {
    if (!state.queue.length) return Promise.resolve(null);
    const currentId = state.currentSong && state.currentSong.id;
    let song;
    if (state.shuffleEnabled && state.queue.length > 1) {
      const candidates = state.queue.filter((item) => item.id !== currentId);
      song = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      const index = Math.max(0, state.queue.findIndex((item) => item.id === currentId));
      song = state.queue[(index + 1 + state.queue.length) % state.queue.length];
    }
    return window.MuseHub.PlayerService.playSong(song, { force: true });
  }

  function prev() {
    if (!state.queue.length) return Promise.resolve(null);
    const currentId = state.currentSong && state.currentSong.id;
    const index = Math.max(0, state.queue.findIndex((song) => song.id === currentId));
    const song = state.queue[(index - 1 + state.queue.length) % state.queue.length];
    return window.MuseHub.PlayerService.playSong(song, { force: true });
  }

  function seek(percent) {
    const element = getAudio();
    const max = durationSeconds(state.currentSong);
    const clamped = Math.min(100, Math.max(0, Number(percent) || 0));
    const nextTime = Math.round(max * clamped / 100);
    if (Number.isFinite(nextTime)) {
      if (element.src) element.currentTime = nextTime;
      state.progress = nextTime;
      state.currentTime = nextTime;
    }
    notify("seek");
  }

  function setVolume(value) {
    state.volume = Math.min(100, Math.max(0, Number(value) || 0));
    getAudio().volume = state.volume / 100;
    if (window.MuseHub.Storage && window.MuseHub.Storage.saveSettings) {
      window.MuseHub.Storage.saveSettings({ volume: state.volume / 100 });
    }
    savePlayerState();
    notify("volume");
  }

  function toggleShuffle() {
    state.shuffleEnabled = !state.shuffleEnabled;
    savePlayerState();
    notify("mode");
    return state.shuffleEnabled;
  }

  function toggleRepeat() {
    state.repeatMode = state.repeatMode === "one" ? "list" : "one";
    if (window.MuseHub.Storage && window.MuseHub.Storage.saveSettings) {
      window.MuseHub.Storage.saveSettings({ playMode: state.repeatMode === "one" ? "single" : "list" });
    }
    savePlayerState();
    notify("mode");
    return state.repeatMode;
  }

  function applySettings(settings) {
    if (!settings) return;
    if (Number.isFinite(Number(settings.volume))) {
      state.volume = Math.round(Math.min(1, Math.max(0, Number(settings.volume))) * 100);
      getAudio().volume = state.volume / 100;
    }
    state.repeatMode = settings.playMode === "single" ? "one" : "list";
    savePlayerState();
    notify("settings");
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.Player = {
    init,
    getAudio,
    getState,
    subscribe,
    setQueue,
    setLoading,
    setError,
    playResolvedSong,
    updateCurrentSong,
    setLyricStatus,
    play,
    pause,
    resume,
    toggle,
    setPlaying,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    applySettings
  };
})();
