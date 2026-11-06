/* Make the theme's "随机文章 / 随便逛逛" work on a site served from /blog/. */
'use strict';

const ROOT_SCRIPT =
  '<script>(function(){' +
  'function fix(){' +
  'if(typeof window.posts==="undefined"||typeof window.toRandomPost!=="function")return false;' +
  'window.toRandomPost=function(){' +
  'var p=window.posts[Math.floor(Math.random()*window.posts.length)];' +
  'var u="' + '/blog/' + '"+p;' +
  'if(window.pjax&&typeof window.pjax.loadUrl==="function"){window.pjax.loadUrl(u);}else{window.location.href=u;}' +
  '};return true;}' +
  'if(!fix()){var n=0;var t=setInterval(function(){if(fix()||++n>50){clearInterval(t);}},100);}' +
  '})();</script>';

hexo.extend.filter.register('after_render:html', function (str) {
  const root = hexo.config.root || '/';

  // 1. the async loader points at /anzhiyu/random.js without the site root
  if (str.indexOf('src="/anzhiyu/random.js"') !== -1) {
    str = str.split('src="/anzhiyu/random.js"').join('src="' + root + 'anzhiyu/random.js"');
  }

  // 2. the generated function jumps to "/<post>" (missing the site root): override it
  if (str.indexOf('</body>') !== -1 && str.indexOf('toRandomPost=function') === -1) {
    const script = ROOT_SCRIPT.replace("'/blog/'", "'" + root + "'");
    str = str.replace('</body>', script + '</body>');
  }

  return str;
});
