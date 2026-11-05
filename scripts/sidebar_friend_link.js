/**
 * Hexo filter to inject friend links directly below the site runtime item (建站天数)
 * in the sidebar webinfo card.
 */
hexo.extend.filter.register('after_render:html', function(html, data) {
  if (!html || !html.includes('id="runtimeshow"')) return html;

  const friendLinkHtml = [
    '<div class="webinfo-item">',
    '  <div class="webinfo-item-title">',
    '    <i class="anzhiyufont anzhiyu-icon-link"></i>',
    '    <div class="item-name">友链 :</div>',
    '  </div>',
    '  <div class="item-count">',
    '    <a href="https://moment-new.github.io/" target="_blank" rel="noopener" style="color:var(--anzhiyu-fontcolor);text-decoration:none;" onmouseover="this.style.color=\'var(--anzhiyu-main)\'" onmouseout="this.style.color=\'var(--anzhiyu-fontcolor)\'" title="陈某人的应许之地">陈某人的应许之地</a>',
    '  </div>',
    '</div>'
  ].join('');

  const regex = /(<div class="item-count" id="runtimeshow"[^>]*>[\s\S]*?<\/div>\s*<\/div>)/;

  if (regex.test(html)) {
    return html.replace(regex, '$1' + friendLinkHtml);
  }

  return html;
});
