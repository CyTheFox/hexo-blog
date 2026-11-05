// Helper patch to support root prefix (e.g. /blog) in album path_name matching
hexo.on('ready', () => {
  const originalIsCurrent = hexo.extend.helper.get('is_current');
  hexo.extend.helper.register('is_current', function(path, strict) {
    if (typeof path === 'string') {
      const root = hexo.config.root || '/';
      if (root !== '/' && path.startsWith(root)) {
        path = path.slice(root.length - 1);
      }
    }
    return originalIsCurrent.call(this, path, strict);
  });
});
