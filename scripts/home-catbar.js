/* Strip the home category bar down to 首页 + 哈姆宇宙 at build time. */
'use strict';

const KEEP = ['首页', '/categories/哈姆宇宙/'];

hexo.extend.filter.register('after_render:html', function (str, data) {
  const path = (data && data.path) || '';
  if (path !== 'index.html' && path !== '') return str;
  if (str.indexOf('id="categoryBar"') === -1) return str;

  // drop every catalog item except the kept ones
  str = str.replace(/<div class="catalog-list-item"[^>]*id="([^"]*)"[^>]*>[\s\S]*?<\/div>/g,
    function (m, id) {
      return KEEP.indexOf(id) >= 0 ? m : '';
    });

  // drop the scroll arrow and the "更多" link
  str = str.replace(/<div class="category-bar-next"[\s\S]*?<\/div>/g, '');
  str = str.replace(/<a class="catalog-more"[\s\S]*?<\/a>/g, '');

  return str;
});
