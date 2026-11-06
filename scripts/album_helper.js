'use strict';

const fs = require('fs');
const path = require('path');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']);

// Known external QQ robot sticker / emotion folders to auto-map on the server
const EXTERNAL_MAPPINGS = [
  { target: '/home/dsbot/qq-workspace/emotion', linkName: 'qq' },
  { target: '/home/dsbot/qq-workspace/stickers/files', linkName: 'stickers' }
];

function ensureExternalMappings(emotionDir) {
  for (const item of EXTERNAL_MAPPINGS) {
    if (!fs.existsSync(item.target)) continue;
    const linkPath = path.join(emotionDir, item.linkName);
    if (!fs.existsSync(linkPath)) {
      try {
        fs.symlinkSync(item.target, linkPath, 'dir');
      } catch (e) {}
    }
  }
}

function scanImages(dir, base) {
  const list = [];
  if (!fs.existsSync(dir)) return list;
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    return list;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    const rel = base ? base + '/' + name : name;
    try {
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        list.push(...scanImages(full, rel));
      } else if (IMAGE_EXT.has(path.extname(name).toLowerCase())) {
        list.push({
          name: name,
          rel: rel,
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

// 1. Helper patch to support root prefix (e.g. /blog) in album path_name matching and auto-mapping
hexo.on('ready', () => {
  const emotionDir = path.join(hexo.source_dir, 'album', 'emotion');
  if (!fs.existsSync(emotionDir)) {
    try { fs.mkdirSync(emotionDir, { recursive: true }); } catch (e) {}
  }
  ensureExternalMappings(emotionDir);

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
      try { fs.mkdirSync(emotionDir, { recursive: true }); } catch (e) {}
    }
    ensureExternalMappings(emotionDir);

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
