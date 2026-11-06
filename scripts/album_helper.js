'use strict';

const fs = require('fs');
const path = require('path');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']);

function scanImages(dir, base) {
  const list = [];
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = base ? base + '/' + ent.name : ent.name;
    if (ent.isDirectory()) {
      list.push(...scanImages(full, rel));
    } else if (IMAGE_EXT.has(path.extname(ent.name).toLowerCase())) {
      try {
        const st = fs.statSync(full);
        list.push({
          name: ent.name,
          rel: rel,
          mtime: st.mtimeMs
        });
      } catch (e) {}
    }
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
    const emotionDir = path.join(hexo.source_dir, 'album', 'emotion');

    if (!fs.existsSync(emotionDir)) {
      fs.mkdirSync(emotionDir, { recursive: true });
    }

    const rawImages = scanImages(emotionDir, '');
    rawImages.sort((a, b) => b.mtime - a.mtime);

    let html = '';
    if (rawImages.length > 0) {
      const cards = rawImages.map(item => {
        const url = root + 'album/emotion/' + item.rel.split('/').map(encodeURIComponent).join('/');
        const caption = esc(item.name);
        return [
          '    <div class="emotion-card">',
          `      <a class="emotion-link" href="${url}" target="_blank" rel="noopener" data-fancybox="gallery" data-caption="${caption}">`,
          `        <img class="emotion-img" src="${url}" alt="${caption}" loading="lazy" decoding="async">`,
          '      </a>',
          '    </div>'
        ].join('\n');
      }).join('\n');

      html = [
        '<div id="album">',
        '  <div class="emotion-waterfall">',
        cards,
        '  </div>',
        '</div>'
      ].join('\n');
    } else {
      html = [
        '<div id="album">',
        '  <div class="emotion-empty">',
        '    <p>暂无表情图片，请将图片放置在 source/album/emotion/ 目录下</p>',
        '  </div>',
        '</div>'
      ].join('\n');
    }

    data.content = html;
  }
  return data;
});
