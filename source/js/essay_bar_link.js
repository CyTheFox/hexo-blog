/* 首页「即刻短文」条修正
 * 1) 主题 bbTimeList.pug 把路径写死成 /essay/，本站 root 是 /blog/，点下去会 404
 * 2) 短文时间模板直接输出 ISO 串，这里按字符串切成 2026-11-07 17:20
 */
(function () {
  var TARGET = "/blog/essay/";

  function fixEssayBar() {
    var bar = document.getElementById("bbTimeList");
    if (!bar) return;
    bar.querySelectorAll("[onclick]").forEach(function (el) {
      el.removeAttribute("onclick");
      el.onclick = null;
    });
    bar.querySelectorAll("a").forEach(function (a) {
      a.setAttribute("href", TARGET);
    });
  }

  function fixEssayTime() {
    document.querySelectorAll("time.datatime").forEach(function (t) {
      var m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(t.textContent.trim());
      if (m) t.textContent = m[1] + " " + m[2];
    });
  }

  function run() {
    fixEssayBar();
    fixEssayTime();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  document.addEventListener("pjax:complete", run);
})();
