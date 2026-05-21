(function () {
  const allowedRoutes = new Set(["home", "search", "player", "lyrics", "favorites", "settings", "playlists", "playlist"]);

  function parseHash() {
    const raw = window.location.hash || "#/home";
    const clean = raw.replace(/^#\/?/, "");
    const parts = clean.split("?");
    const route = allowedRoutes.has(parts[0]) ? parts[0] : "home";
    const params = {};
    const searchParams = new URLSearchParams(parts[1] || "");
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return { route, params };
  }

  function renderCurrent(options) {
    const current = parseHash();
    window.MuseHub.UI.renderPage(current.route, current.params);
    if (options && options.scrollToTop) {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    }
  }

  function start() {
    window.addEventListener("hashchange", () => renderCurrent({ scrollToTop: true }));
    if (!window.location.hash) {
      window.location.hash = "#/home";
      return;
    }
    renderCurrent({ scrollToTop: true });
  }

  window.MuseHub = window.MuseHub || {};
  window.MuseHub.Router = {
    parseHash,
    renderCurrent,
    start
  };
})();
