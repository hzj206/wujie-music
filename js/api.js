(function () {
  const API_BASE = "https://api.vkeys.cn";
  const DEFAULT_TIMEOUT = 12000;

  function buildUrl(path, params) {
    const url = new URL(path, API_BASE);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  async function request(path, params, options) {
    const timeout = (options && options.timeout) || DEFAULT_TIMEOUT;
    const externalSignal = options && options.signal;
    if (externalSignal && externalSignal.aborted) {
      throw new Error("请求已取消");
    }

    const controller = new AbortController();
    const abortFromExternal = () => controller.abort();
    const timer = setTimeout(() => controller.abort(), timeout);
    if (externalSignal) externalSignal.addEventListener("abort", abortFromExternal, { once: true });

    try {
      const response = await fetch(buildUrl(path, params), {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (payload && payload.code !== undefined && Number(payload.code) !== 200) {
        throw new Error(payload.message || payload.msg || "接口返回异常");
      }
      return payload;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(externalSignal && externalSignal.aborted ? "请求已取消" : "请求超时，请稍后再试");
      }
      throw error;
    } finally {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener("abort", abortFromExternal);
    }
  }

  function fetchJson(path, params, options) {
    return request(path, params, options);
  }

  function searchTencent(params, options) {
    return request("/v2/music/tencent", params, options);
  }

  function searchNetease(params, options) {
    return request("/v2/music/netease", params, options);
  }

  function getTencentSongUrl(params, options) {
    return request("/v2/music/tencent/geturl", params, options);
  }

  function getTencentSongDetail(params, options) {
    return request("/v2/music/tencent", params, options);
  }

  function getNeteaseSongUrl(params, options) {
    return request("/v2/music/netease", params, options);
  }

  function getTencentLyric(params, options) {
    return request("/v2/music/tencent/lyric", params, options);
  }

  function getNeteaseLyric(params, options) {
    return request("/v2/music/netease/lyric", params, options);
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.Api = {
    API_BASE,
    request,
    fetchJson,
    searchTencent,
    searchNetease,
    getTencentSongUrl,
    getTencentSongDetail,
    getNeteaseSongUrl,
    getTencentLyric,
    getNeteaseLyric
  };
})();
