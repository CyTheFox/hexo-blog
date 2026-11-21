/**
 * Protect LaTeX formulas from hexo-renderer-marked (preventing \\ -> \, _ -> <em>, etc.)
 * and wrap them in clean delimiters for MathJax 3 client-side rendering.
 */
'use strict';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data || typeof data.content !== 'string') return data;
  var content = data.content;

  // Quick bailout if no math delimiters exist
  if (content.indexOf('$') === -1 && content.indexOf('\\(') === -1 && content.indexOf('\\[') === -1) {
    return data;
  }

  var codeBlocks = [];
  function saveCode(match) {
    var idx = codeBlocks.length;
    codeBlocks.push(match);
    return 'HEXOCODEPH' + idx + 'ENDHEXOCODE';
  }

  // 1. Protect fenced code blocks (``` or ~~~) and inline code (`...`)
  content = content.replace(/(^|\n)([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\2\3[ \t]*(?=\n|$)/g, saveCode);
  content = content.replace(/(`+)([^\n`]|[^\n`][\s\S]*?[^\n`])\1/g, saveCode);

  var mathItems = [];
  function saveBlockMath(match, tex) {
    var idx = mathItems.length;
    mathItems.push({ display: true, tex: tex });
    return '\n\nHEXOMATHBLOCK' + idx + 'ENDHEXOMATH\n\n';
  }
  function saveInlineMath(match, tex) {
    var idx = mathItems.length;
    mathItems.push({ display: false, tex: tex });
    return 'HEXOMATHINLINE' + idx + 'ENDHEXOMATH';
  }

  // 2. Protect block math: $$...$$ and \[...\]
  content = content.replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, saveBlockMath);
  content = content.replace(/\\\[([\s\S]*?)\\\]/g, saveBlockMath);

  // 3. Protect inline math: $...$ (Obsidian/Pandoc-compatible) and \(...\)
  content = content.replace(/(?<!\\)\$(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)(?<!\\)\$(?!\d)/g, saveInlineMath);
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, saveInlineMath);

  // 4. Restore protected code blocks before markdown rendering
  for (var i = 0; i < codeBlocks.length; i++) {
    content = content.replace('HEXOCODEPH' + i + 'ENDHEXOCODE', function () {
      return codeBlocks[i];
    });
  }

  if (mathItems.length > 0) {
    data._hexoMathItems = mathItems;
    data.content = content;
  }
  return data;
}, 5);

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data || !Array.isArray(data._hexoMathItems) || data._hexoMathItems.length === 0) {
    return data;
  }
  var items = data._hexoMathItems;
  var html = data.content;

  // Replace wrapped <p>HEXOMATHBLOCK...</p> first to avoid invalid <p><div> nesting
  html = html.replace(/<p>\s*HEXOMATHBLOCK(\d+)ENDHEXOMATH\s*<\/p>/g, function (_, idx) {
    var item = items[Number(idx)];
    if (!item) return _;
    return '<div class="math-display">\\[\n' + escapeHtml(item.tex.trim()) + '\n\\]</div>';
  });

  html = html.replace(/HEXOMATHBLOCK(\d+)ENDHEXOMATH/g, function (_, idx) {
    var item = items[Number(idx)];
    if (!item) return _;
    return '<div class="math-display">\\[\n' + escapeHtml(item.tex.trim()) + '\n\\]</div>';
  });

  html = html.replace(/HEXOMATHINLINE(\d+)ENDHEXOMATH/g, function (_, idx) {
    var item = items[Number(idx)];
    if (!item) return _;
    return '<span class="math-inline">\\(' + escapeHtml(item.tex) + '\\)</span>';
  });

  data.content = html;
  delete data._hexoMathItems;
  return data;
}, 5);
