(function () {
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || window.location.protocol === "file:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  function bindConnectivityHints() {
    window.addEventListener("offline", () => {
      window.MuseHub.UI.showToast("当前处于离线状态，已缓存页面仍可浏览。");
    });
    window.addEventListener("online", () => {
      window.MuseHub.UI.showToast("网络已恢复，可以继续搜索音乐。");
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    window.MuseHub.Storage.init();
    window.MuseHub.Player.init();
    window.MuseHub.UI.init();
    window.MuseHub.UI.applyTheme();
    bindConnectivityHints();
    registerServiceWorker();
    window.MuseHub.Player.subscribe((state, reason) => {
      window.MuseHub.UI.updateDock();
      window.MuseHub.UI.syncState();
      const route = window.MuseHub.Router.parseHash().route;
      if (["loading", "songpending", "songchange", "playstate", "lyric", "metadata", "error", "mode", "queue"].includes(reason) && ["search", "favorites", "player", "lyrics", "playlists", "playlist"].includes(route)) {
        window.MuseHub.Router.renderCurrent();
      }
    });
    window.MuseHub.Router.start();
  });
})();
