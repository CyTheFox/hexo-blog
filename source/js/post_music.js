/**
 * Blog Article Custom Music Player Auto-Play Controller
 * Listens for #post-custom-music in post content, connects to #nav-music APlayer,
 * resolves song info (via Meting or direct URL), and automatically switches & plays.
 */
(function() {
  'use strict';

  // Parse raw music config from article
  function parseMusicInput(rawInput) {
    if (!rawInput) return null;
    var input = rawInput.trim();

    // 1. Direct audio file URL
    if (/^https?:\/\/.*\.(mp3|wav|flac|ogg|m4a|aac)(\?.*)?$/i.test(input)) {
      return {
        type: 'direct',
        url: input,
        name: document.title ? document.title.replace(/\s*\|.*$/, '') : '文章专属音乐',
        artist: '文章背景音乐',
        cover: '',
        lrc: ''
      };
    }

    // 2. NetEase song URL
    var neteaseSongMatch = input.match(/(?:music\.163\.com\/(?:#\/)?song\?(?:.*&)?id=(\d+))|(?:music\.163\.com\/song\/(\d+))/i);
    if (neteaseSongMatch) {
      return {
        type: 'meting',
        server: 'netease',
        songType: 'song',
        id: neteaseSongMatch[1] || neteaseSongMatch[2]
      };
    }

    // 3. NetEase playlist URL
    var neteaseListMatch = input.match(/(?:music\.163\.com\/(?:#\/)?playlist\?(?:.*&)?id=(\d+))|(?:music\.163\.com\/playlist\/(\d+))/i);
    if (neteaseListMatch) {
      return {
        type: 'meting',
        server: 'netease',
        songType: 'playlist',
        id: neteaseListMatch[1] || neteaseListMatch[2]
      };
    }

    // 4. QQ / Tencent music song URL
    var qqSongMatch = input.match(/y\.qq\.com\/.*\/songDetail\/([a-zA-Z0-9_-]+)/i);
    if (qqSongMatch) {
      return {
        type: 'meting',
        server: 'tencent',
        songType: 'song',
        id: qqSongMatch[1]
      };
    }

    // 5. Explicit "server:id" or "server:type:id" (e.g. netease:186016 or tencent:003aAPG90NW2Kj)
    var serverIdMatch = input.match(/^(netease|tencent|kugou|baidu|xiami):(?:(song|playlist):)?([a-zA-Z0-9_-]+)$/i);
    if (serverIdMatch) {
      return {
        type: 'meting',
        server: serverIdMatch[1].toLowerCase(),
        songType: serverIdMatch[2] ? serverIdMatch[2].toLowerCase() : 'song',
        id: serverIdMatch[3]
      };
    }

    // 6. Pure digits -> assume NetEase song ID
    if (/^\d+$/.test(input)) {
      return {
        type: 'meting',
        server: 'netease',
        songType: 'song',
        id: input
      };
    }

    // 7. Generic URL fallback
    if (/^https?:\/\//i.test(input)) {
      return {
        type: 'direct',
        url: input,
        name: document.title ? document.title.replace(/\s*\|.*$/, '') : '文章专属音乐',
        artist: '文章背景音乐',
        cover: '',
        lrc: ''
      };
    }

    return null;
  }

  // Poll for the global APlayer instance
  function waitForAPlayer(callback, maxAttempts) {
    maxAttempts = maxAttempts || 80; // 80 * 100ms = 8s
    var attempts = 0;
    var timer = setInterval(function() {
      attempts++;
      var metingEl = document.querySelector('#nav-music meting-js');
      if (metingEl && metingEl.aplayer) {
        clearInterval(timer);
        callback(metingEl.aplayer);
        return;
      }
      if (window.aplayers && window.aplayers.length > 0) {
        clearInterval(timer);
        callback(window.aplayers[0]);
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.warn('[PostMusic] APlayer instance not found after waiting.');
      }
    }, 100);
  }

  // Play songs using the player and handle browser autoplay policy
  function playSongInPlayer(ap, songs, musicKey) {
    if (!ap || !songs || songs.length === 0) return;

    var firstSongUrl = songs[0].url;
    var targetIndex = -1;

    // Check if song is already in the playlist
    if (ap.list && ap.list.audios) {
      for (var i = 0; i < ap.list.audios.length; i++) {
        var audio = ap.list.audios[i];
        if (audio._customMusicKey === musicKey || (firstSongUrl && audio.url === firstSongUrl)) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex === -1) {
      songs.forEach(function(s) {
        s._customMusicKey = musicKey;
      });
      targetIndex = ap.list ? ap.list.audios.length : 0;
      ap.list.add(songs);
    }

    // Switch to track and play
    ap.list.switch(targetIndex);

    var playPromise = ap.play();
    if (playPromise !== undefined) {
      playPromise.catch(function(err) {
        console.log('[PostMusic] Autoplay policy blocked immediate playback. Waiting for interaction:', err);
        var events = ['click', 'touchstart', 'keydown', 'scroll'];
        var resumeOnInteraction = function() {
          ap.play().catch(function() {});
          events.forEach(function(evt) {
            window.removeEventListener(evt, resumeOnInteraction, true);
          });
        };
        events.forEach(function(evt) {
          window.addEventListener(evt, resumeOnInteraction, { once: true, capture: true });
        });
      });
    }
  }

  // Process current article music
  function checkAndPlayPostMusic() {
    var musicEl = document.getElementById('post-custom-music');
    if (!musicEl) {
      return;
    }

    var rawMusic = '';
    try {
      rawMusic = decodeURIComponent(musicEl.getAttribute('data-music') || '').trim();
    } catch (e) {
      rawMusic = (musicEl.getAttribute('data-music') || '').trim();
    }

    if (!rawMusic) {
      return;
    }

    // Avoid duplicate execution if already playing this exact music
    if (window._currentPostMusicPlaying === rawMusic) {
      return;
    }

    var parsed = parseMusicInput(rawMusic);
    if (!parsed) {
      console.warn('[PostMusic] Unrecognized music config:', rawMusic);
      return;
    }

    waitForAPlayer(function(ap) {
      window._currentPostMusicPlaying = rawMusic;

      if (parsed.type === 'direct') {
        var song = {
          name: parsed.name,
          artist: parsed.artist,
          url: parsed.url,
          cover: parsed.cover,
          lrc: parsed.lrc
        };
        playSongInPlayer(ap, [song], rawMusic);
      } else if (parsed.type === 'meting') {
        var apiUrl = '/meting/?server=' + parsed.server + '&type=' + parsed.songType + '&id=' + parsed.id + '&r=' + Math.random();
        fetch(apiUrl)
          .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          })
          .then(function(data) {
            if (Array.isArray(data) && data.length > 0) {
              var songs = data.map(function(item) {
                return {
                  name: item.name || '专属音乐',
                  artist: item.artist || '未知歌手',
                  url: item.url,
                  cover: item.pic || item.cover || '',
                  lrc: item.lrc || ''
                };
              });
              playSongInPlayer(ap, songs, rawMusic);
            } else {
              console.warn('[PostMusic] Meting returned empty or invalid data:', data);
            }
          })
          .catch(function(err) {
            console.error('[PostMusic] Failed to fetch song from Meting:', err);
          });
      }
    });
  }

  // 1. Initial Page Load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndPlayPostMusic);
  } else {
    checkAndPlayPostMusic();
  }

  // 2. PJAX Page Transitions
  document.addEventListener('pjax:complete', function() {
    var musicEl = document.getElementById('post-custom-music');
    var currentMusic = '';
    if (musicEl) {
      try {
        currentMusic = decodeURIComponent(musicEl.getAttribute('data-music') || '').trim();
      } catch (e) {
        currentMusic = (musicEl.getAttribute('data-music') || '').trim();
      }
    }
    // If navigating to a page with different music or no music, reset current playing key
    if (currentMusic !== window._currentPostMusicPlaying) {
      window._currentPostMusicPlaying = null;
    }
    checkAndPlayPostMusic();
  });
})();
