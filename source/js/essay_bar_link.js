/* 首页「即刻短文」条链接修正
 * 主题 bbTimeList.pug 把路径写死成 /essay/，本站 root 是 /blog/，点下去会 404。
 * 这里统一改写成 /blog/essay/ 并去掉内联 onclick，交给 pjax 正常接管。
 */
(function () {
  var TARGET = "/blog/essay/";
  function fix() {
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fix);
  } else {
    fix();
  }
  document.addEventListener("pjax:complete", fix);
})();
