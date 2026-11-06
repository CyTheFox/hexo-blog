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

function getPugTemplate() {
  return [
    '#album',
    '  - let images = (site.data && site.data.emotion_images) ? site.data.emotion_images : ((site.emotion_images) ? site.emotion_images : [])',
    '  if images && images.length',
    '    .emotion-waterfall',
    '      each img in images',
    '        .emotion-card',
    '          a.emotion-link(href=img.url, target="_blank", rel="noopener", data-fancybox="gallery", data-caption=img.name)',
    '            img.emotion-img(src=img.url, alt=img.name, loading="lazy", decoding="async")',
    '  else',
    '    .emotion-empty',
    '      p 暂无表情图片，请将图片放置在 source/album/emotion/ 目录下'
  ].join('\n');
}

function registerAlbumView() {
  if (hexo.theme && typeof hexo.theme.setView === 'function') {
    hexo.theme.setView('includes/page/album.pug', getPugTemplate());
  }
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

  registerAlbumView();
});

// 2. Scan images before every generation
hexo.extend.filter.register('before_generate', function() {
  const root = (hexo.config.root || '/').replace(/\/?$/, '/');
  const emotionDir = path.join(hexo.source_dir, 'album', 'emotion');

  if (!fs.existsSync(emotionDir)) {
    fs.mkdirSync(emotionDir, { recursive: true });
  }

  const rawImages = scanImages(emotionDir, '');
  // Sort newest first
  rawImages.sort((a, b) => b.mtime - a.mtime);

  const images = rawImages.map(item => ({
    name: item.name,
    url: root + 'album/emotion/' + item.rel.split('/').map(encodeURIComponent).join('/'),
    mtime: item.mtime
  }));

  // Attach to locals so Pug templates have access
  hexo.locals.set('emotion_images', () => images);
  const data = hexo.locals.get('data') || {};
  data.emotion_images = images;
  hexo.locals.set('data', () => data);

  registerAlbumView();
});
