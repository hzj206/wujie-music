(function () {
  const PAGE_SIZE = 10;
  const CACHE_TTL = 4 * 60 * 1000;
  const searchCache = new Map();
  const inflight = new Map();
  let lastResult = null;

  function normalizeSource(source) {
    if (source === "qq") return "tencent";
    if (source === "tencent" || source === "netease") return source;
    return "all";
  }

  function sourceLabel(source) {
    const normalized = normalizeSource(source);
    if (normalized === "tencent") return "QQ音乐";
    if (normalized === "netease") return "网易云音乐";
    return "全部";
  }

  function cacheKey(keyword, source, page, num) {
    return [String(keyword || "").trim().toLowerCase(), normalizeSource(source), page, num].join("::");
  }

  function cloneResult(result) {
    return Object.assign({}, result, {
      songs: Array.isArray(result && result.songs) ? result.songs.slice() : [],
      partialErrors: Array.isArray(result && result.partialErrors) ? result.partialErrors.slice() : [],
      raw: Array.isArray(result && result.raw) ? result.raw.slice() : result && result.raw
    });
  }

  function readCache(key) {
    const cached = searchCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.time > CACHE_TTL) {
      searchCache.delete(key);
      return null;
    }
    return cloneResult(cached.result);
  }

  function writeCache(key, result) {
    searchCache.set(key, { time: Date.now(), result: cloneResult(result) });
    if (searchCache.size > 30) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
    }
  }

  function responseList(response) {
    const data = response && response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.list)) return data.list;
    if (data && Array.isArray(data.songs)) return data.songs;
    if (data && Array.isArray(data.result)) return data.result;
    return [];
  }

  function responseTotal(response, fallback) {
    const data = response && response.data;
    const candidates = [
      response && response.total,
      response && response.count,
      data && data.total,
      data && data.count,
      data && data.songCount
    ];
    const value = candidates.find((item) => item !== undefined && item !== null && item !== "" && Number.isFinite(Number(item)) && Number(item) >= 0);
    return value === undefined ? fallback : Number(value);
  }

  async function searchPlatform(platform, keyword, page, num, requestOptions) {
    const params = { word: keyword, page, num };
    if (platform === "tencent") {
      const response = await window.MuseHub.Api.searchTencent(params, requestOptions);
      const list = responseList(response);
      return {
        source: platform,
        songs: list.map(window.MuseHub.Normalize.normalizeTencentSong).filter(Boolean),
        total: responseTotal(response, list.length),
        totalIsEstimate: responseTotal(response, null) === null,
        raw: response
      };
    }
    const response = await window.MuseHub.Api.searchNetease(params, requestOptions);
    const list = responseList(response);
    return {
      source: platform,
      songs: list.map(window.MuseHub.Normalize.normalizeNeteaseSong).filter(Boolean),
      total: responseTotal(response, list.length),
      totalIsEstimate: responseTotal(response, null) === null,
      raw: response
    };
  }

  async function runSearch(keyword, source, page, num, options, key) {
    const platforms = source === "all" ? ["tencent", "netease"] : [source];
    const requestOptions = { signal: options && options.signal, timeout: options && options.timeout };
    const settled = await Promise.allSettled(platforms.map((platform) => searchPlatform(platform, keyword, page, num, requestOptions)));
    const successful = settled.filter((item) => item.status === "fulfilled").map((item) => item.value);
    const partialErrors = settled.reduce((errors, item, index) => {
      if (item.status === "rejected") {
        const message = item.reason && item.reason.message ? item.reason.message : "搜索失败";
        if (message !== "请求已取消") {
          errors.push({ source: platforms[index], message });
        }
      }
      return errors;
    }, []);

    if (!successful.length && partialErrors.length) {
      throw new Error(partialErrors.map((item) => `${sourceLabel(item.source)}：${item.message}`).join("；"));
    }
    if (!successful.length && options && options.signal && options.signal.aborted) {
      throw new Error("请求已取消");
    }

    const songs = successful.flatMap((item) => item.songs);
    const totalIsEstimate = successful.some((item) => item.totalIsEstimate);
    const total = totalIsEstimate ? songs.length : successful.reduce((sum, item) => sum + item.total, 0);
    const result = {
      keyword,
      source,
      page,
      num,
      songs,
      total,
      totalLabel: `${total}`,
      totalIsEstimate,
      partialErrors,
      raw: successful.map((item) => item.raw)
    };
    writeCache(key, result);
    return cloneResult(result);
  }

  async function search(options) {
    const keyword = String(options && options.keyword || "").trim();
    const source = normalizeSource(options && options.source);
    const page = Math.max(1, Number(options && options.page) || 1);
    const num = Math.max(1, Number(options && options.num) || PAGE_SIZE);
    const key = cacheKey(keyword, source, page, num);

    if (!keyword) {
      return {
        keyword,
        source,
        page,
        num,
        songs: [],
        total: 0,
        totalLabel: "0",
        partialErrors: []
      };
    }

    const cached = readCache(key);
    if (cached) {
      window.MuseHub.Storage.saveSongs(cached.songs);
      if (window.MuseHub.Player && window.MuseHub.Player.setQueue) window.MuseHub.Player.setQueue(cached.songs);
      lastResult = cloneResult(cached);
      return cloneResult(cached);
    }

    if (!(options && options.signal) && inflight.has(key)) {
      return inflight.get(key);
    }

    const promise = runSearch(keyword, source, page, num, options || {}, key)
      .then((result) => {
        window.MuseHub.Storage.saveSongs(result.songs);
        if (window.MuseHub.Player && window.MuseHub.Player.setQueue) window.MuseHub.Player.setQueue(result.songs);
        lastResult = cloneResult(result);
        return result;
      })
      .finally(() => inflight.delete(key));
    if (!(options && options.signal)) inflight.set(key, promise);
    return promise;
  }

  function getCurrentSearchResults() {
    return lastResult && Array.isArray(lastResult.songs) ? lastResult.songs.slice() : [];
  }

  function clearCache() {
    searchCache.clear();
    inflight.clear();
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.SearchService = {
    PAGE_SIZE,
    CACHE_TTL,
    normalizeSource,
    sourceLabel,
    search,
    getCurrentSearchResults,
    clearCache
  };
})();
