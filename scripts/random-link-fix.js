/* Fix the theme's "random post" wiring for a site served under a sub-path (/blog/). */
'use strict';

const fs = require('fs');
const path = require('path');

hexo.extend.filter.register('after_render:html', function (str) {
  if (str.indexOf('/anzhiyu/random.js') === -1) return str;
  const root = hexo.config.root || '/';
  return str.split('src="/anzhiyu/random.js"').join('src="' + root + 'anzhiyu/random.js"');
});

hexo.extend.filter.register('after_generate', function () {
  const root = hexo.config.root || '/';
  const file = path.join(hexo.public_dir, 'anzhiyu', 'random.js');
  if (!fs.existsSync(file)) return;
  let s = fs.readFileSync(file, 'utf8');
  const before = s;
  s = s.replace("pjax.loadUrl('/'+posts", "pjax.loadUrl('" + root + "'+posts");
  s = s.replace("window.location.href='/'+posts", "window.location.href='" + root + "'+posts");
  if (s !== before) fs.writeFileSync(file, s);
});
