'use strict';

/* 闲言碎语（短文）数据桥接
 *
 * 后台 Decap CMS 的 file collection 只能编辑「对象为根」的 YAML，
 * 而主题 essay.pug / bbTimeList.pug 要求 site.data.essay 是数组。
 * 所以在模板渲染前，把 source/_data/essay_admin.yml 转成模板要的形状注入进去。
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SRC = path.join(hexo.source_dir, '_data', 'essay_admin.yml');

let cache = { mtime: 0, data: null };

// 后台/手写两种写法都可能出现：Date 对象、纯字符串、带时区的 ISO
// 统一落成 "...Z"，让模板里的 toISOString() 与作者填的墙上时间一致
function toIso(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value instanceof Date) return value.toISOString();
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    return new Date(s).toISOString();
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return s;
  return m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + (m[6] || '00') + '.000Z';
}

function loadEssayData() {
  if (!fs.existsSync(SRC)) {
    hexo.log.warn('[essay_sync] 缺少 %s，闲言碎语页面将为空', SRC);
    return null;
  }
  const stat = fs.statSync(SRC);
  if (cache.data && cache.mtime === stat.mtimeMs) return cache.data;

  const raw = yaml.load(fs.readFileSync(SRC, 'utf8')) || {};
  const list = Array.isArray(raw.essay_list) ? raw.essay_list : [];

  const fallbackDate = new Date().toISOString();
  let missingDate = 0;

  const essayList = list.filter(function (item) {
    return item && item.content;
  }).map(function (item) {
    const out = { content: String(item.content) };
    let date = toIso(item.date);
    if (!date || isNaN(new Date(date).getTime())) {
      // 主题模板无条件执行 new Date(item.date).toISOString()，缺日期会整页渲染失败
      missingDate += 1;
      date = fallbackDate;
    }
    out.date = date;
    if (item.from) out.from = item.from;
    if (item.address) out.address = item.address;
    if (item.link) out.link = item.link;
    if (Array.isArray(item.image) && item.image.length) out.image = item.image.filter(Boolean);
    if (Array.isArray(item.video) && item.video.length) out.video = item.video.filter(Boolean);
    if (item.aplayer && item.aplayer.id) {
      out.aplayer = { id: item.aplayer.id, server: item.aplayer.server || 'netease' };
    }
    return out;
  });

  if (missingDate) {
    hexo.log.warn('[essay_sync] %d 条短文缺少有效日期，已用构建时间兜底', missingDate);
  }

  cache = {
    mtime: stat.mtimeMs,
    data: [{
      title: raw.title || '闲言碎语',
      subTitle: raw.subTitle || '',
      tips: raw.tips || '',
      buttonText: raw.buttonText || '全部短文',
      buttonLink: raw.buttonLink || '/essay/',
      top_background: raw.top_background || undefined,
      limit: Number(raw.limit) || 20,
      home_essay: raw.home_essay !== false,
      essay_list: essayList
    }]
  };
  return cache.data;
}

hexo.extend.filter.register('template_locals', function (locals) {
  if (!locals || !locals.site) return locals;
  const data = locals.site.data || (locals.site.data = {});
  if (!data.essay) {
    const essay = loadEssayData();
    if (essay) data.essay = essay;
  }
  return locals;
});

// 短文页顶部那张大卡片（标题/副标题/说明/全部短文按钮）不需要展示，
// 渲染后直接剥掉；列表为空时连同「只展示最近 N 条短文」一起清掉。
hexo.extend.filter.register('after_render:html', function (str) {
  if (str.indexOf('essayPage') === -1) return str;

  var out = str.replace(/<div class="author-content[^"]*essayPage[^>]*>[\s\S]*?(?=<div id="bber")/, '');

  if (out.indexOf('class="bber-item"') === -1) {
    out = out.replace(/<div id="bber-tips"[\s\S]*?<\/div>/, '');
  }
  return out;
});
