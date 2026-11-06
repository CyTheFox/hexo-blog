'use strict';

const fs = require('fs');
const path = require('path');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']);

// Known external QQ robot sticker / emotion folders to auto-map on the server
const EXTERNAL_MAPPINGS = [
  { target: '/home/dsbot/qq-workspace/emotion', linkName: 'qq' },
  { target: '/home/dsbot/qq-workspace/stickers/files', linkName: 'stickers' }
];

const DIR_META = {
  'emotion': { label: '默认表情 (emotion)', icon: '📂', pathDesc: 'source/album/emotion/' },
  'qq': { label: 'QQ机器人 (qq)', icon: '🤖', pathDesc: '映射自 /home/dsbot/qq-workspace/emotion' },
  'stickers': { label: '表情库 (stickers)', icon: '📦', pathDesc: '映射自 /home/dsbot/qq-workspace/stickers/files' }
};

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

function scanImages(dir, base, dirCategory) {
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
        const nextCat = dirCategory || name;
        list.push(...scanImages(full, rel, nextCat));
      } else if (IMAGE_EXT.has(path.extname(name).toLowerCase())) {
        list.push({
          name: name,
          rel: rel,
          dir: dirCategory || 'emotion',
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

    const rawImages = scanImages(emotionDir, '', '');
    rawImages.sort((a, b) => b.mtime - a.mtime);

    let html = '';
    if (rawImages.length > 0) {
      const dirCounts = {};
      for (const item of rawImages) {
        dirCounts[item.dir] = (dirCounts[item.dir] || 0) + 1;
      }
      const dirKeys = Object.keys(dirCounts);

      // 1. Directory Tabs
      const tabItems = [
        `      <button type="button" class="dir-tab active" data-dir="all">` +
        `<span class="tab-icon">✨</span><span class="tab-name">全部目录</span><span class="tab-count">${rawImages.length}</span></button>`
      ];
      for (const k of dirKeys) {
        const meta = DIR_META[k] || { label: k, icon: '📁', pathDesc: `source/album/emotion/${k}/` };
        tabItems.push(
          `      <button type="button" class="dir-tab" data-dir="${esc(k)}">` +
          `<span class="tab-icon">${meta.icon}</span><span class="tab-name">${esc(meta.label)}</span><span class="tab-count">${dirCounts[k]}</span></button>`
        );
      }

      // 2. Directory Tree Panel
      const treeItems = [
        `        <div class="tree-item active" data-dir="all">` +
        `<span class="tree-node">📂 /album/emotion/ <small>(全部目录集合)</small></span><span class="tree-meta">${rawImages.length} 张图片</span></div>`
      ];
      for (const k of dirKeys) {
        const meta = DIR_META[k] || { label: k, icon: '📁', pathDesc: `source/album/emotion/${k}/` };
        treeItems.push(
          `        <div class="tree-item" data-dir="${esc(k)}">` +
          `<span class="tree-node">├── ${meta.icon} <b>${esc(k)}/</b> <small>(${esc(meta.pathDesc)})</small></span><span class="tree-meta">${dirCounts[k]} 张</span></div>`
        );
      }

      // 3. Waterfall Cards
      const cards = rawImages.map(item => {
        const url = root + 'album/emotion/' + item.rel.split('/').map(encodeURIComponent).join('/');
        const caption = esc(item.name);
        const dirName = esc(item.dir);
        const relPath = esc(item.rel);
        return [
          `    <div class="emotion-card" data-dir="${dirName}">`,
          `      <span class="emotion-card-badge" data-target-dir="${dirName}" title="点击只看此目录">📁 ${dirName}</span>`,
          `      <a class="emotion-link" href="${url}" target="_blank" rel="noopener" data-fancybox="gallery" data-caption="${caption} (📁 ${relPath})">`,
          `        <img class="emotion-img" src="${url}" alt="${caption}" loading="lazy" decoding="async">`,
          '      </a>',
          '      <div class="emotion-card-info">',
          `        <span class="emotion-card-name" title="${caption}">${caption}</span>`,
          `        <span class="emotion-card-path">📁 ${relPath}</span>`,
          '      </div>',
          '    </div>'
        ].join('\n');
      }).join('\n');

      // 4. Interactive Script
      const script = [
        '<script>',
        '(function() {',
        '  function initEmotionDirFilter() {',
        '    var tabs = document.querySelectorAll(".emotion-dir-tabs .dir-tab");',
        '    var treeItems = document.querySelectorAll(".emotion-tree-panel .tree-item");',
        '    var cards = document.querySelectorAll(".emotion-waterfall .emotion-card");',
        '    var countBadge = document.getElementById("dir-count-badge");',
        '    var treeToggle = document.getElementById("emotion-tree-toggle");',
        '    var treePanel = document.getElementById("emotion-tree-panel");',
        '    if (!tabs.length || !cards.length) return;',
        '',
        '    if (treeToggle && treePanel && !treeToggle._bound) {',
        '      treeToggle._bound = true;',
        '      treeToggle.addEventListener("click", function(e) {',
        '        e.preventDefault();',
        '        var isHidden = (treePanel.style.display === "none" || !treePanel.style.display);',
        '        treePanel.style.display = isHidden ? "block" : "none";',
        '        treeToggle.classList.toggle("active", isHidden);',
        '      });',
        '    }',
        '',
        '    function switchDirectory(targetDir) {',
        '      var visibleCount = 0;',
        '      tabs.forEach(function(t) {',
        '        t.classList.toggle("active", t.getAttribute("data-dir") === targetDir);',
        '      });',
        '      treeItems.forEach(function(ti) {',
        '        ti.classList.toggle("active", ti.getAttribute("data-dir") === targetDir);',
        '      });',
        '      cards.forEach(function(card) {',
        '        var cardDir = card.getAttribute("data-dir");',
        '        var match = (targetDir === "all" || cardDir === targetDir);',
        '        if (match) {',
        '          card.style.display = "";',
        '          visibleCount++;',
        '        } else {',
        '          card.style.display = "none";',
        '        }',
        '      });',
        '      if (countBadge) {',
        '        countBadge.textContent = visibleCount + " 张图片";',
        '      }',
        '    }',
        '',
        '    tabs.forEach(function(t) {',
        '      if (t._bound) return;',
        '      t._bound = true;',
        '      t.addEventListener("click", function(e) {',
        '        e.preventDefault();',
        '        var dir = this.getAttribute("data-dir");',
        '        switchDirectory(dir);',
        '      });',
        '    });',
        '',
        '    treeItems.forEach(function(ti) {',
        '      if (ti._bound) return;',
        '      ti._bound = true;',
        '      ti.addEventListener("click", function(e) {',
        '        e.preventDefault();',
        '        var dir = this.getAttribute("data-dir");',
        '        switchDirectory(dir);',
        '      });',
        '    });',
        '',
        '    document.querySelectorAll(".emotion-card-badge").forEach(function(b) {',
        '      if (b._bound) return;',
        '      b._bound = true;',
        '      b.addEventListener("click", function(e) {',
        '        e.preventDefault();',
        '        e.stopPropagation();',
        '        var dir = this.getAttribute("data-target-dir");',
        '        if (dir) switchDirectory(dir);',
        '      });',
        '    });',
        '  }',
        '',
        '  if (document.readyState === "loading") {',
        '    document.addEventListener("DOMContentLoaded", initEmotionDirFilter);',
        '  } else {',
        '    initEmotionDirFilter();',
        '  }',
        '  document.addEventListener("pjax:complete", initEmotionDirFilter);',
        '})();',
        '</script>'
      ].join('\n');

      html = [
        '<div id="album">',
        '  <div class="emotion-dir-container">',
        '    <div class="emotion-dir-header">',
        '      <div class="emotion-dir-title">',
        '        <span class="dir-icon">📂</span>',
        '        <span class="dir-title-text">图片目录</span>',
        `        <span class="dir-total-count" id="dir-count-badge">${rawImages.length} 张图片</span>`,
        '      </div>',
        '      <button type="button" class="emotion-tree-toggle" id="emotion-tree-toggle" title="展开/收起目录路径详情">',
        '        <span class="tree-toggle-icon">🗂️</span> 目录结构详情',
        '      </button>',
        '    </div>',
        '    <div class="emotion-dir-tabs" id="emotion-dir-tabs">',
        tabItems.join('\n'),
        '    </div>',
        '    <div class="emotion-tree-panel" id="emotion-tree-panel" style="display: none;">',
        '      <div class="tree-panel-inner">',
        treeItems.join('\n'),
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div class="emotion-waterfall" id="emotion-waterfall">',
        cards,
        '  </div>',
        script,
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

// 3. Expose static JSON index of all images for Decap CMS / admin image directory modal
hexo.extend.generator.register('images_directory_api', function() {
  const root = (hexo.config.root || '/').replace(/\/?$/, '/');
  const emotionDir = path.join(hexo.source_dir, 'album', 'emotion');
  const imgDir = path.join(hexo.source_dir, 'img');

  ensureExternalMappings(emotionDir);

  const emotionImages = scanImages(emotionDir, '', '').map(it => ({
    name: it.name,
    dir: it.dir || 'emotion',
    rel: it.rel,
    url: root + 'album/emotion/' + it.rel.split('/').map(encodeURIComponent).join('/')
  }));

  const postImages = scanImages(imgDir, '', 'img').map(it => ({
    name: it.name,
    dir: 'img',
    rel: it.rel,
    url: root + 'img/' + it.rel.split('/').map(encodeURIComponent).join('/')
  }));

  return {
    path: 'api/images.json',
    data: JSON.stringify({
      total: emotionImages.length + postImages.length,
      directories: [
        { key: 'img', label: '文章插图 (source/img/)', count: postImages.length, images: postImages },
        { key: 'emotion', label: '默认表情 (source/album/emotion/)', count: emotionImages.filter(i => i.dir === 'emotion').length, images: emotionImages.filter(i => i.dir === 'emotion') },
        { key: 'qq', label: 'QQ机器人表情 (qq/)', count: emotionImages.filter(i => i.dir === 'qq').length, images: emotionImages.filter(i => i.dir === 'qq') },
        { key: 'stickers', label: 'QQ机器人表情库 (stickers/)', count: emotionImages.filter(i => i.dir === 'stickers').length, images: emotionImages.filter(i => i.dir === 'stickers') }
      ]
    })
  };
});

