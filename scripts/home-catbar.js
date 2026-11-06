/* Category bar as breadcrumb: 首页 (home) / 首页 » <category>, with correct links + selected state. */
'use strict';

hexo.extend.filter.register('after_render:html', function (str) {
  if (str.indexOf('catalog-list-item') === -1) return str;

  const root = hexo.config.root || '/';
  const rootPath = root.replace(/\/+$/, '') + '/';           // "/blog/"
  const escaped = rootPath.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hrefRe = new RegExp('href="/(?!' + escaped + ')', 'g');

  const m = str.match(/<div class="article-sort-title">\s*分类\s*-\s*([^<]+?)\s*<\/div>/);
  const current = m ? m[1].trim() : null;

  const fixItem = function (item, isCurrent) {
    item = item.replace(hrefRe, 'href="' + rootPath);
    if (isCurrent) {
      item = item.replace('class="catalog-list-item"', 'class="catalog-list-item selected"');
    }
    return item;
  };

  str = str.replace(/<div class="catalog-list-item"[^>]*>[\s\S]*?<\/div>/g, function (item) {
    const isHome = item.indexOf('>首页<') >= 0 || item.indexOf('id="首页"') >= 0;
    if (isHome) return fixItem(item, !current);            // home page: 首页 is active
    if (current && item.indexOf(current) >= 0) return fixItem(item, true);
    return '';
  });

  if (current) {
    str = str.replace(
      /(<div class="catalog-list-item"[^>]*>\s*<a href="[^"]*">首页<\/a>\s*<\/div>)/,
      '$1<span class="catalog-sep">&raquo;</span>'
    );
  }

  str = str.replace(/(<div id="catalog-bar">)\s*<i class="anzhiyufont[^>]*><\/i>/g, '$1');
  str = str.replace(/<div class="category-bar-next"[\s\S]*?<\/div>/g, '');
  str = str.replace(/<a class="catalog-more"[\s\S]*?<\/a>/g, '');

  return str;
});
