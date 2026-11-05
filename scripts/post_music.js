/**
 * Hexo Post Custom Music Filter
 * Injects a hidden element #post-custom-music into the post body
 * containing the article's music URL / ID configuration.
 */
hexo.extend.filter.register('after_post_render', function(data) {
  if (data.music) {
    const musicStr = String(data.music).trim();
    if (musicStr) {
      data.content = '<div id="post-custom-music" style="display:none;" data-music="' + encodeURIComponent(musicStr) + '"></div>' + data.content;
    }
  }
  return data;
});
