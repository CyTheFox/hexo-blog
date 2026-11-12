'use strict';

const fs = require('fs');
const path = require('path');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

// QQ robot sticker library directory on server
const STICKERS_DIR = '/home/blog/stickers/files';

function scanStickerImages(dir) {
  const list = [];
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    return list;
  }

  for (const name of entries) {
    if (!IMAGE_EXT.has(path.extname(name).toLowerCase())) continue;
    const full = path.join(dir, name);
    try {
      const st = fs.statSync(full);
      // Filter out invalid or dummy test files (< 500 bytes)
      if (st.isFile() && st.size > 500) {
        list.push({
          name: name,
          size: st.size,
          mtime: st.mtimeMs
        });
      }
    } catch (e) {}
  }
  return list;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// 1. Helper patch to support root prefix (e.g. /blog) in album path_name matching
hexo.on('ready', () => {
  const originalIsCurrent = hexo.extend.helper.get('is_current');
  if (originalIsCurrent) {
    hexo.extend.helper.register('is_current', function(p, strict) {
      if (typeof p === 'string') {
        const root = hexo.config.root || '/';
        if (root !== '/' && p.startsWith(root)) {
          p = p.slice(root.length - 1);
        }
      }
      return originalIsCurrent.call(this, p, strict);
    });
  }
});

// 2. Inject responsive waterfall gallery HTML for source/album/index.md
hexo.extend.filter.register('before_post_render', function(data) {
  if (data.source && (data.source === 'album/index.md' || data.source === 'album\\index.md')) {
    const root = (hexo.config.root || '/').replace(/\/?$/, '/');

    // Scan QQ robot sticker files directly
    const rawImages = scanStickerImages(STICKERS_DIR);
    rawImages.sort((a, b) => b.mtime - a.mtime);

    const cards = rawImages.map(item => {
      const url = root + 'stickers/' + encodeURIComponent(item.name);
      const caption = esc(item.name);
      return [
        '    <div class="emotion-card">',
        `      <a class="emotion-link" href="${url}" target="_blank" rel="noopener" data-fancybox="gallery" data-caption="${caption}">`,
        `        <img class="emotion-img" src="${url}" alt="${caption}" loading="lazy" decoding="async">`,
        '      </a>',
        '    </div>'
      ].join('\n');
    }).join('\n');

    // Dynamic runtime loader: automatically pulls any newly added stickers from /blog/stickers/
    const dynamicLoader = `
<script>
(async function () {
  var grid = document.querySelector('.emotion-waterfall');
  if (!grid) return;
  // 同一份 DOM 只渲染一次：pjax 重新进入或脚本重复执行都不会叠加卡片
  if (grid.dataset.emotionLoaded === '1') return;
  grid.dataset.emotionLoaded = '1';
  Array.prototype.forEach.call(grid.querySelectorAll('.emotion-card[data-emotion="1"]'), function (el) { el.remove(); });
  var root = ${JSON.stringify(root)};
  var exts = /\\.(jpe?g|png|gif|webp|avif)$/i;
  var known = new Set(Array.prototype.map.call(grid.querySelectorAll('img'), function (i) {
    return decodeURIComponent(i.getAttribute('src') || '');
  }));
  var res, list;
  try {
    res = await fetch(root + 'stickers/?t=' + Date.now());
    if (!res.ok) return;
    list = await res.json();
  } catch (e) { return; }
  if (!Array.isArray(list)) return;
  list.sort(function (a, b) { return (new Date(b.mtime).getTime() || 0) - (new Date(a.mtime).getTime() || 0); });
  list.forEach(function (it) {
    if (it.type !== 'file' || !exts.test(it.name)) return;
    if (it.size && it.size < 500) return; // skip dummy test files
    var url = root + 'stickers/' + encodeURIComponent(it.name);
    if (known.has(url) || known.has('/' + url)) return;
    known.add(url);
    var card = document.createElement('div');
    card.className = 'emotion-card';
    card.setAttribute('data-emotion', '1');
    card.innerHTML = '<a class="emotion-link" href="' + url + '" target="_blank" rel="noopener"' +
      ' data-fancybox="gallery" data-caption="' + it.name + '">' +
      '<img class="emotion-img nolazyload" src="' + url + '" data-lazy-src="' + url + '" alt="' + it.name + '" loading="lazy" decoding="async"></a>';
    grid.appendChild(card);
  });
  if (window.Fancybox && typeof window.Fancybox.bind === 'function') {
    try { window.Fancybox.bind('[data-fancybox="gallery"]'); } catch (e) {}
  }
  if (window.lazyLoadInstance && typeof window.lazyLoadInstance.update === 'function') {
    try { window.lazyLoadInstance.update(); } catch (e) {}
  }
})();
</script>`;

    const html = [
      '<div id="album">',
      '  <div class="emotion-waterfall">',
      cards,
      '  </div>',
      dynamicLoader,
      '</div>'
    ].join('\n');

    data.content = html;
  }
  return data;
});
