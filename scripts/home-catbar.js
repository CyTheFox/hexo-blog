/* Category bar as a breadcrumb: 首页 (home) / 首页 » <category> (category pages). */
'use strict';

hexo.extend.filter.register('after_render:html', function (str) {
  if (str.indexOf('catalog-list-item') === -1) return str;

  const m = str.match(/<div class="article-sort-title">\s*分类\s*-\s*([^<]+?)\s*<\/div>/);
  const current = m ? m[1].trim() : null;

  // keep 首页 and the category being viewed, drop every other chip
  str = str.replace(/<div class="catalog-list-item"[^>]*>[\s\S]*?<\/div>/g, function (item) {
    if (item.indexOf('>首页<') >= 0 || item.indexOf('id="首页"') >= 0) return item;
    if (current && item.indexOf(current) >= 0) return item;
    return '';
  });

  // 首页 » <current>
  if (current) {
    str = str.replace(
      /(<div class="catalog-list-item"[^>]*>\s*<a href="\/">首页<\/a>\s*<\/div>)/,
      '$1<span class="catalog-sep">&raquo;</span>'
    );
  }

  // cosmetic cleanups
  str = str.replace(/(<div id="catalog-bar">)\s*<i class="anzhiyufont[^>]*><\/i>/g, '$1');
  str = str.replace(/<div class="category-bar-next"[\s\S]*?<\/div>/g, '');
  str = str.replace(/<a class="catalog-more"[\s\S]*?<\/a>/g, '');

  return str;
});
