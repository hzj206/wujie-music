(function () {
  const API_BASE = "https://api.vkeys.cn";
  const API_PROXY_BASE = "/api/vkeys";
  const DEFAULT_TIMEOUT = 12000;

  function buildUrl(path, params, base) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(normalizedPath, base || API_BASE);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  function canUseProxy(options) {
    if (options && options.direct) return false;
    if (!window.location || window.location.protocol === "file:") return false;
    if (!/^https?:$/.test(window.location.protocol)) return false;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    return true;
  }

  function proxyUrl(path, params) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return buildUrl(`${API_PROXY_BASE}${normalizedPath}`, params, window.location.origin);
  }

  async function requestUrl(url, signal) {
    const response = await fetch(url, {
      method: "GET",
      signal,
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (payload && payload.code !== undefined && Number(payload.code) !== 200) {
      const error = new Error(payload.message || payload.msg || "接口返回异常");
      error.apiCode = payload.code;
      throw error;
    }
    return payload;
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
      const urls = canUseProxy(options)
        ? [proxyUrl(path, params), buildUrl(path, params, API_BASE)]
        : [buildUrl(path, params, API_BASE)];
      let lastError = null;
      for (const url of urls) {
        try {
          return await requestUrl(url, controller.signal);
        } catch (error) {
          lastError = error;
          if (error && error.apiCode !== undefined) throw error;
          if (externalSignal && externalSignal.aborted) throw error;
        }
      }
      throw lastError || new Error("接口请求失败");
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
    API_PROXY_BASE,
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
