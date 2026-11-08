'use strict';

/*
 * 把首页顶部「随便逛逛」大 banner 换成 3x3 小磁贴。
 * 第一个「想法」跳 /notes/，其余 8 个都叫「分类」，跳分类页。
 * 复用主题 .categoryButton / .categoryItem 的视觉（渐变、图标、下划线、彩色投影）。
 */

const TILE = (name, href, icon, cls) =>
  '<div class="ideaTile" style="box-shadow:var(--anzhiyu-shadow-' + cls + ')">' +
  '<a class="categoryButton ' + cls + '" href="' + href + '">' +
  '<span class="categoryButtonText">' + name + '</span>' +
  '<i class="anzhiyufont ' + icon + '"></i></a></div>';

const STYLE =
  '<style>' +
  '#ideaGrid{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);' +
  'gap:.5rem;width:100%;height:76%;margin-bottom:.5rem}' +
  '#ideaGrid .ideaTile{position:relative;overflow:hidden;border-radius:12px;min-width:0;' +
  'transition:transform .3s}' +
  '#ideaGrid .ideaTile:hover{transform:translateY(-3px)}' +
  '#ideaGrid .ideaTile a.categoryButton{position:relative;display:block;height:100%;width:100%}' +
  '#ideaGrid .ideaTile:hover a.categoryButton i{opacity:.8;filter:blur(0);font-size:2.5rem;top:15%}' +
  '@media screen and (max-width:1200px){#ideaGrid{display:none}}' +
  '</style>';

hexo.extend.filter.register('after_render:html', function (str) {
  if (str.indexOf('id="random-banner"') === -1) return str;

  const root = hexo.config.root || '/';
  const cat = root + 'categories/';
  const colors = ['red', 'green', 'blue'];

  let tiles = TILE('\u60f3\u6cd5', '/notes/', 'anzhiyu-icon-paper-plane', 'blue');
  for (let i = 0; i < 8; i++) {
    const c = colors[i % 3];
    tiles += TILE('\u5206\u7c7b', cat, 'anzhiyu-icon-cube', c);
  }

  const grid = STYLE + '<div id="ideaGrid">' + tiles + '</div>';
  const re = /<div id="random-banner">[\s\S]*?<\/div>(?=\s*<div class="categoryGroup">)/;
  return str.replace(re, grid);
});
