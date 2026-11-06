/* Strip category bars down to 首页 + 哈姆宇宙, on every page. */
'use strict';

const KEEP_WORDS = ['哈姆宇宙', '首页'];

hexo.extend.filter.register('after_render:html', function (str, data) {
  if (str.indexOf('catalog-list-item') === -1) return str;

  // keep only the items we want
  str = str.replace(/<div class="catalog-list-item"[^>]*>[\s\S]*?<\/div>/g, function (m) {
    for (const w of KEEP_WORDS) {
      if (m.indexOf(w) >= 0) return m;
    }
    return '';
  });

  // drop the leading decorative icon inside the category page bar
  str = str.replace(/(<div id="catalog-bar">)\s*<i class="anzhiyufont[^>]*><\/i>/g, '$1');

  // drop the scroll arrow and the "更多" link
  str = str.replace(/<div class="category-bar-next"[\s\S]*?<\/div>/g, '');
  str = str.replace(/<a class="catalog-more"[\s\S]*?<\/a>/g, '');

  return str;
});
