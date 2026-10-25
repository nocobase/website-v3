// The film's files, in load order. film.html (rendering) and preview.html (the review cut) both call it, so the two pages
// can never load different files. Each own file carries a fresh ?v= on every load: a simple review server (python
// http.server) sends no cache headers, and a plain reload in Chrome revalidates only the page, so it would keep playing
// yesterday's film.js.
//   <script>__load('head')</script> in <head>, <div id="stage"></div><script>__load('body')</script> in <body>
// A language version is the same page with another <html lang> (en, de, es, fr, pt, ru, id, vi, zh-TW, ja, ko): it loads
// src/film-<lang>.js (film-en.js from tools/make-en.py, film-zh-TW.js from tools/make-zh-TW.py, the others from
// tools/make-lang.py). As on the website, Chinese and Traditional Chinese show the product UI in their own script and
// every other version shows it in English, so those load src/film-en.css after film.css; then each loads its own
// src/film-<lang>.css (line breaks, sizes, the copy face). Japanese, Korean and Traditional Chinese also load Noto Sans.
(function () {
  const v = (window.__v = window.__v || Date.now());
  const lang = document.documentElement.lang || 'zh', suf = lang === 'zh' ? '' : '-' + lang;
  const NOTO = { ja: 'Noto+Sans+JP', ko: 'Noto+Sans+KR', 'zh-TW': 'Noto+Sans+TC' }[lang];
  const own = (f) => (f.endsWith('.css') ? `<link rel="stylesheet" href="${f}?v=${v}">` : `<script src="${f}?v=${v}"><\/script>`);
  const cdn = (u) => `<script src="${u}"><\/script>`;
  const PARTS = {
    // the clock first: it takes over timers and requestAnimationFrame before GSAP reads them
    head: () => [
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">',
      ...(NOTO ? [`<link href="https://fonts.googleapis.com/css2?family=${NOTO}:wght@400;500;600;700&display=swap" rel="stylesheet">`] : []),
      own('src/clock.js'), '<script>window.__VIDEO = { log: [] };<\/script>',
      cdn('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'), cdn('https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js'),
      own('src/nocobase-film.css'), own('src/film.css'), ...(suf && !/^zh\b/i.test(lang) ? [own('src/film-en.css')] : []), ...(suf && suf !== '-en' ? [own(`src/film${suf}.css`)] : []),
    ],
    // the review cut also loads its soundtrack as a script (make.sh writes it next to preview.m4a); a page opened as a file
    // can read a script but not fetch the track. A missing file is skipped.
    body: () => [...(window.__PREVIEW ? [own(window.__AUDIO_JS || 'out/film/preview-audio.js')] : []),
      ...['src/avatars.js', 'src/logo.js', 'src/kit.js', 'src/specimens.js', `src/film${suf}.js`].map(own)],
  };
  window.__load = (part) => document.write(PARTS[part]().join(''));
})();
