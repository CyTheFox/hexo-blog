'use strict';

/* 闲言碎语（短文）
 *
 * 一条短文 = source/_essays/<slug>.md，后台用和文章完全相同的 Vditor 编辑器。
 * 构建时把目录里的 md 读成 site.data.essay（主题 essay.pug 要的数组形状）。
 */

const fs = require('fs');
const path = require('path');
const frontMatter = require('hexo-front-matter');

const TZ = hexo.config.timezone || 'Asia/Shanghai';
const LIMIT = 20;          // 单页最多展示条数
const HOME_ESSAY = false;  // 首页「即刻」滚动条，改 true 可恢复
const ROOT = (hexo.config.root || '/').replace(/\/+$/, '/');

let cache = { key: null, group: null };

// 主题模板会对 date 做 new Date(x).toISOString()，这里统一回写成「墙上时间」，
// 避免时区换算后显示成 8 小时前的时刻。
function wallClock(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const d = value instanceof Date ? value : new Date(String(value));
  if (isNaN(d.getTime())) return undefined;
  const s = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(d);
  return s.replace(' ', 'T') + '.000Z';
}

function getGroup() {
  const dir = path.join(hexo.source_dir, '_essays');
  let files = [];
  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir).filter(function (f) { return /\.md$/i.test(f); }).sort();
  }

  const key = files.map(function (f) {
    try { return f + ':' + fs.statSync(path.join(dir, f)).mtimeMs; } catch (e) { return f; }
  }).join('|');
  if (cache.key === key && cache.group) return cache.group;

  const fallbackDate = new Date().toISOString();
  let missingDate = 0;

  const list = files.map(function (name) {
    const full = path.join(dir, name);
    const raw = fs.readFileSync(full, 'utf8');
    let fm = {};
    try { fm = frontMatter.parse(raw) || {}; } catch (e) {
      hexo.log.warn('[essay_sync] %s 解析失败: %s', name, e.message);
    }

    const body = String(fm._content || '').trim();
    let html = '';
    if (body) {
      try {
        html = hexo.render.renderSync({ text: body, engine: 'markdown' });
      } catch (e) {
        hexo.log.warn('[essay_sync] %s 正文渲染失败: %s', name, e.message);
      }
    }
    // 正文里的 /img/xxx 之类根路径要补上站点前缀（本站是 /blog/）
    // 正文里的站内链接要补站点前缀；<img> 由主题的懒加载过滤器自己套 url_for，不能重复加
    if (html && ROOT !== '/') {
      html = html.replace(/href="\/(?!\/)/g, 'href="' + ROOT);
    }

    const item = { content: body, html: html };
    const date = wallClock(fm.date);
    if (date) {
      item.date = date;
    } else {
      missingDate += 1;
      item.date = fallbackDate;
    }
    if (fm.from) item.from = fm.from;
    if (fm.address) item.address = fm.address;
    if (fm.link) item.link = fm.link;
    if (Array.isArray(fm.image) && fm.image.length) item.image = fm.image.filter(Boolean);
    if (Array.isArray(fm.video) && fm.video.length) item.video = fm.video.filter(Boolean);
    return item;
  });

  if (missingDate) {
    hexo.log.warn('[essay_sync] %d 条短文缺少有效 date，已用构建时间兜底', missingDate);
  }

  list.sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });

  const group = {
    title: '闲言碎语',
    subTitle: '',
    tips: '',
    buttonText: '全部短文',
    buttonLink: '/essay/',
    limit: LIMIT,
    home_essay: HOME_ESSAY,
    essay_list: list
  };

  cache = { key: key, group: group };
  return group;
}

hexo.extend.filter.register('template_locals', function (locals) {
  if (!locals || !locals.site) return locals;
  const data = locals.site.data || (locals.site.data = {});
  if (!data.essay) data.essay = [getGroup()];
  return locals;
});

hexo.extend.filter.register('after_render:html', function (str) {
  if (str.indexOf('essayPage') === -1) return str;

  const list = getGroup().essay_list;

  // 顶部大卡片（标题/副标题/说明/按钮）不需要，整块剥掉
  let out = str.replace(/<div class="author-content[^"]*essayPage[^>]*>[\s\S]*?(?=<div id="bber")/, '');

  // 一条都没有时，连「只展示最近 N 条短文」也去掉
  if (!list.length) {
    return out.replace(/<div id="bber-tips"[\s\S]*?<\/div>/, '');
  }

  // 正文是 markdown，模板只做了纯文本转义，这里换成渲染好的 HTML。
  // 注意主题把配图/视频容器嵌在 <p class="datacont"> 内部，必须原样保留尾部。
  let i = 0;
  out = out.replace(/<p class="datacont">([\s\S]*?)<\/p>/g, function (m, inner) {
    const item = list[i++];
    if (!item) return m;
    const galleryMatch = inner.match(/<div class="bber-container-img">[\s\S]*$/);
    const gallery = galleryMatch ? galleryMatch[0] : '';
    return '<div class="datacont">' + item.html + gallery + '</div>';
  });

  // 「引用回复」按钮的 onclick 里原样嵌了正文，多行/引号会打断 JS，去掉
  return out.replace(/<div class="bber-reply"[^>]*>[\s\S]*?<\/div>/g, '');
});
