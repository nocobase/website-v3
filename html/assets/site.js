/* 官网子页面共用：顶部导航、页脚、中英切换、图纸缩放、图标。页面用 <body data-page="..."> 标明自己是哪一页。 */
(function () {
  var page = document.body.getAttribute('data-page') || '';
  var T = function (zh, en) { return '<t-zh>' + zh + '</t-zh><t-en>' + en + '</t-en>'; };
  var on = function (k) { return k === page ? ' class="on"' : ''; };
  var DOCS = 'https://docs.nocobase.com/';  /* 顶部导航、手机菜单和页脚的「文档」 */
  var GH = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12.02c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0 1 12 6.84c.85 0 1.71.11 2.51.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.02C22 6.48 17.52 2 12 2z"/></svg>';

  var products = [
    /* 和首页的静态导航一致，短句取自《NocoBase 产品定义与标准表述》 */
    ['core', 'core.html', 'layers', 'NocoBase Core', T('AI 开发和运行业务系统的开源应用底座', 'The open-source foundation for AI-built business systems')],
    ['studio', 'studio.html', 'git-pull-request', 'NocoBase Studio', T('人与 Agent 协同开发的治理平台', 'The governance platform for people and agents building software together')],
    ['solutions', 'solutions.html', 'layout-grid', 'NocoBase Solution', T('由 Agent 驱动的企业业务应用', 'Agent-driven business apps')]
  ];
  var apps = [
    ['crm', 'solution-crm.html', 'handshake', 'NocoCRM', T('销售管理 · 配备 6 个销售 Agent', 'Sales · 6 Sales Agents')],
    ['itam', 'solution-itam.html', 'monitor-smartphone', 'NocoITAM', T('IT 资产台账与管理 · 配备 3 个资产 Agent', 'IT Asset Management · 3 IT Agents')],
    ['reach', 'solution-reach.html', 'megaphone', 'NocoReach', T('内容与增长 · 配备内容运营 Agent', 'Growth · Content Agent')],
    ['', '', 'headset', 'NocoSupport', T('客户服务 · 配备工单与客服 Agent', 'Support · Triage &amp; Reply Agents'), 1],
    ['', '', 'folder-kanban', 'NocoProject', T('项目协作 · 配备调研与文书 Agent', 'Projects · Research &amp; Doc Agents'), 1],
    ['', '', 'users', 'NocoHR', T('人事管理 · 配备入职与人事 Agent', 'HR · Onboarding Agent'), 1]
  ];
  /* 语言列表。页面在 <head> 里设了 window.__i18nPage 的（Core、Studio、Solution、NocoCRM、NocoITAM、定价、伙伴、联系，由 wrap.py 的 i18n: 生成）有 12 种语言，
     其他语言的译文由 _src/i18n/pages.py 生成在 assets/i18n/site.<语言>.js 和 <页面>.<语言>.js，见下方 applyI18n；
     其余页面（博客、客户案例、NocoReach）只有中文、英文内容，其他语言先显示英文 */
  var I18N = window.__i18nPage || '';
  var LANG_NAMES = { zh: '简体中文', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português', ru: 'Русский', id: 'Bahasa Indonesia', vi: 'Tiếng Việt', 'zh-TW': '繁體中文', ja: '日本語', ko: '한국어' };
  if (I18N && !LANG_NAMES[window.__lang]) window.__lang = 'en';
  var LANGS = [['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['pt', 'Português'], ['ru', 'Русский'], ['id', 'Bahasa Indonesia'], ['vi', 'Tiếng Việt'], ['zh', '简体中文'], ['zh-TW', '繁體中文'], ['ja', '日本語'], ['ko', '한국어']];
  var SOON = '<em class="soon-tag">Coming soon</em>';
  var NOCODE = 'https://nocode.nocobase.com/';
  var v2 = '<div class="dd-sep"></div><a class="ext" href="' + NOCODE + '" target="_blank" rel="noopener"><i data-lucide="mouse-pointer-click"></i><b>NocoBase 2<em class="kind-tag">' + T('无代码', 'No-code') + '</em><i data-lucide="arrow-up-right"></i></b><span>' + T('可视化配置搭建，与 NocoBase 3 并行维护', 'Visual configuration platform, maintained alongside v3') + '</span></a>';
  var dd = function (list) { return list.map(function (x) {
    if (x[5]) return '<div class="soon" aria-disabled="true"><i data-lucide="' + x[2] + '"></i><b>' + x[3] + SOON + '</b><span>' + x[4] + '</span></div>';
    return '<a href="' + x[1] + '"' + on(x[0]) + '><i data-lucide="' + x[2] + '"></i><b>' + x[3] + '</b><span>' + x[4] + '</span></a>';
  }).join(''); };

  var header = '<header class="nav" id="nav"><div class="container in">' +
    '<a class="logo" href="homepage.html" aria-label="NocoBase"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase" width="150" height="22"></a>' +
    '<div class="mi ver"><button type="button" aria-haspopup="true" aria-label="NocoBase 3">3<i data-lucide="chevron-down"></i></button><div class="dd"><a class="cur" href="homepage.html"><i data-lucide="check"></i><b>NocoBase 3<em class="kind-tag">' + T('当前', 'Current') + '</em></b><span>' + T('面向 Agent 的开发平台', 'The development platform for agents') + '</span></a><a class="ext" href="' + NOCODE + '" target="_blank" rel="noopener"><i data-lucide="mouse-pointer-click"></i><b>NocoBase 2<i data-lucide="arrow-up-right"></i></b><span>' + T('AI + 无代码开发平台', 'AI + no-code development platform') + '</span></a></div></div>' +
    '<nav class="menu" aria-label="Primary">' +
      '<div class="mi"><button type="button" aria-haspopup="true">' + T('产品', 'Products') + '<i data-lucide="chevron-down"></i></button><div class="dd">' + dd(products) + v2 + '</div></div>' +
      '<div class="mi"><button type="button" aria-haspopup="true">' + T('解决方案', 'Solutions') + '<i data-lucide="chevron-down"></i></button><div class="dd two">' + dd(apps) + '</div></div>' +
      '<div class="mi"><button type="button" aria-haspopup="true">' + T('资源', 'Resources') + '<i data-lucide="chevron-down"></i></button><div class="dd">' +
        '<a href="' + DOCS + '" target="_blank" rel="noopener"><i data-lucide="book-open"></i><b>' + T('文档', 'Docs') + '</b><span>' + T('上手指南、核心能力与扩展开发参考', 'Guides, core capabilities, and API reference') + '</span></a>' +
        '<a href="customers.html"' + on('customers') + '><i data-lucide="building-2"></i><b>' + T('客户案例', 'Customers') + '</b><span>' + T('看看各行业团队如何用 NocoBase 搭建核心系统', 'How teams run core systems on NocoBase') + '</span></a>' +
        '<a href="blog.html"' + on('blog') + '><i data-lucide="newspaper"></i><b>' + T('博客', 'Blog') + '</b><span>' + T('产品思考、工程实践与方法论', 'Product thinking and engineering practices') + '</span></a>' +
        /* 更新日志暂不开放：置灰，不可点击 */
        '<div class="soon" aria-disabled="true"><i data-lucide="history"></i><b>' + T('更新日志', 'Changelog') + '</b><span>' + T('每次版本迭代的新能力与改进', 'What shipped in every release') + '</span></div>' +
        '<a href="https://forum.nocobase.com/" target="_blank" rel="noopener"><i data-lucide="messages-square"></i><b>' + T('社区', 'Community') + '</b><span>' + T('在论坛提问、交流经验与反馈建议', 'Ask questions and share patterns') + '</span></a>' +
        '<a href="contact.html"><i data-lucide="mail"></i><b>' + T('联系我们', 'Contact Us') + '</b><span>' + T('商务合作、产品咨询与技术支持', 'Partnerships, product questions, and support') + '</span></a>' +
      '</div></div>' +
      '<div class="mi"><button type="button" aria-haspopup="true">' + T('伙伴', 'Partners') + '<i data-lucide="chevron-down"></i></button><div class="dd">' +
        '<a href="find-partner.html"' + on('find-partner') + '><i data-lucide="search"></i><b>' + T('寻找 NocoBase 伙伴', 'Find a Partner') + '</b><span>' + T('和懂行的伙伴一起，把系统做出来、用起来', 'Get your system built and running with an expert') + '</span></a>' +
        '<a href="partner.html"' + on('partner') + '><i data-lucide="handshake"></i><b>' + T('成为合作伙伴', 'Become a Partner') + '</b><span>' + T('用 Agent 团队交付更多客户项目', 'Deliver more client projects with an agent team') + '</span></a>' +
      '</div></div>' +
      '<div class="mi"><a href="pricing.html"' + on('pricing') + '>' + T('定价', 'Pricing') + '</a></div>' +
    '</nav>' +
    '<div class="right">' +
      '<div class="mi lang" id="langMenu"><button class="plain" type="button" aria-haspopup="true" aria-label="Language"><i data-lucide="globe"></i>' + (I18N ? '<span id="langName">' + LANG_NAMES[window.__lang] + '</span>' : T('简体中文', 'English')) + '<i data-lucide="chevron-down"></i></button><div class="dd">' + LANGS.map(function (x) { return '<a href="#" data-lang="' + x[0] + '" lang="' + x[0] + '"><i data-lucide="check"></i>' + x[1] + '</a>'; }).join('') + '</div></div>' +
      '<a class="plain" href="https://github.com/nocobase/nocobase" target="_blank" rel="noopener">' + GH + '24.6K</a>' +
      '<button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" id="menuBtn"><i data-lucide="menu"></i></button>' +
    '</div></div>' +
    '<div class="container mnav" id="mnav">' +
      products.map(function (x) { return '<a href="' + x[1] + '"' + on(x[0]) + '>' + x[3] + '</a>'; }).join('') +
      '<a href="' + NOCODE + '" target="_blank" rel="noopener">NocoBase 2<small>' + T('无代码 ↗', 'No-code ↗') + '</small></a>' +
      '<a href="solutions.html">' + T('全部解决方案', 'All Solutions') + '</a>' +
      '<a href="' + DOCS + '" target="_blank" rel="noopener">' + T('文档', 'Docs') + '</a>' +
      '<a href="customers.html"' + on('customers') + '>' + T('客户案例', 'Customers') + '</a>' +
      '<a href="blog.html"' + on('blog') + '>' + T('博客', 'Blog') + '</a>' +
      '<a href="find-partner.html"' + on('find-partner') + '>' + T('寻找 NocoBase 伙伴', 'Find a Partner') + '</a>' +
      '<a href="partner.html"' + on('partner') + '>' + T('成为合作伙伴', 'Become a Partner') + '</a>' +
      '<a href="pricing.html"' + on('pricing') + '>' + T('定价', 'Pricing') + '</a>' +
      '<a href="contact.html">' + T('联系我们', 'Contact Us') + '</a>' +
      '<a href="https://github.com/nocobase/nocobase" target="_blank" rel="noopener">GitHub<small>24.6K</small></a>' +
      (I18N ? '<label class="lang-switch-m"><i data-lucide="globe"></i><select id="langSelM" aria-label="Language">' + LANGS.map(function (x) { return '<option value="' + x[0] + '" lang="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</select></label>'
        : '<button class="lang-switch-m" type="button" id="langBtnM"><i data-lucide="globe"></i>' + T('Switch to English', '切换为中文') + '</button>') +
    '</div></header>';

  var footer = '<footer><div class="container"><div class="fgrid">' +
    '<div><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase" width="150" height="22"><p class="tag-line">' + T('AI + NocoBase，构建可靠的业务系统。', 'AI + NocoBase. Build reliable business systems.') + '</p></div>' +
    '<div><h4>' + T('产品', 'Products') + '</h4><ul>' + products.map(function (x) { return '<li><a href="' + x[1] + '">' + x[3] + '</a></li>'; }).join('') + '<li><a href="' + NOCODE + '" target="_blank" rel="noopener">' + T('NocoBase 2 无代码 ↗', 'NocoBase 2 No-code ↗') + '</a></li></ul></div>' +
    '<div><h4>' + T('定价与许可', 'Pricing &amp; License') + '</h4><ul><li><a href="pricing.html">' + T('版本与价格', 'Editions &amp; Pricing') + '</a></li><li><a href="#">' + T('许可协议', 'License') + '</a></li><li><a href="' + NOCODE + '" target="_blank" rel="noopener">NocoBase 2.x ↗</a></li></ul></div>' +
    '<div><h4>' + T('伙伴', 'Partners') + '</h4><ul><li><a href="partner.html">' + T('合作伙伴计划', 'Partner Program') + '</a></li><li><a href="find-partner.html">' + T('寻找 NocoBase 伙伴', 'Find a Partner') + '</a></li><li><a href="customers.html">' + T('客户案例', 'Customers') + '</a></li></ul></div>' +
    '<div><h4>' + T('资源', 'Resources') + '</h4><ul><li><a href="' + DOCS + '" target="_blank" rel="noopener">' + T('文档', 'Docs') + '</a></li><li><a href="blog.html">' + T('博客', 'Blog') + '</a></li><li><a href="#">' + T('更新日志', 'Changelog') + '</a></li></ul></div>' +
    '<div><h4>' + T('联系', 'Connect') + '</h4><ul><li><a href="contact.html">' + T('联系我们', 'Contact Us') + '</a></li><li><a href="https://forum.nocobase.com/" target="_blank" rel="noopener">' + T('社区论坛', 'Forum') + '</a></li><li><a href="https://github.com/nocobase/nocobase" target="_blank" rel="noopener">GitHub</a></li></ul></div>' +
    '</div><div class="fbot"><span>© 2020-2026 NocoBase. All rights reserved.</span></div></div></footer>';

  /* 子目录里的页面（blog/、customers/）在 body 上写 data-root="../"，站内链接和图片都从那里往上找 */
  var ROOT = document.body.getAttribute('data-root') || '';
  var rooted = function (html) { return ROOT ? html.replace(/(href|src)="(?!https?:|#|mailto:|\/)([^"]*)"/g, '$1="' + ROOT + '$2"') : html; };
  header = rooted(header);
  footer = rooted(footer);
  var h = document.getElementById('site-header'); if (h) h.outerHTML = header;
  var f = document.getElementById('site-footer'); if (f) f.outerHTML = footer;
  if (document.querySelector('main .band')) document.body.classList.add('has-band');

  var $ = function (id) { return document.getElementById(id); };
  var titleEl = document.querySelector('title');
  function syncMeta(lang) {
    var p = I18N && lang !== 'zh' && lang !== 'en' && window.NB_I18N && window.NB_I18N[lang] && window.NB_I18N[lang].pages[I18N];
    var key = lang === 'zh' ? 'zh' : 'en';
    if (titleEl && titleEl.dataset[key]) document.title = (p && p.title) || titleEl.dataset[key];
    var m = document.querySelector('meta[name="description"]');
    if (m && m.dataset[key]) m.setAttribute('content', (p && p.description) || m.dataset[key]);
  }
  /* 文档站：英文在根目录，中文在 zh-CN/。指向文档站的链接按当前语言补上或去掉 zh-CN/（繁体中文也看中文文档） */
  function docsLinks(lang) {
    var zh = lang === 'zh' || lang === 'zh-TW';
    document.querySelectorAll('a[href^="https://docs.nocobase.com/"]').forEach(function (a) {
      var path = a.getAttribute('href').replace(/^https:\/\/docs\.nocobase\.com\/(zh-CN\/)?/, '');
      a.setAttribute('href', 'https://docs.nocobase.com/' + (zh ? 'zh-CN/' : '') + path);
    });
  }
  /* 其他语言：页面上写死的英文（<t-en>）记下原文，换成译文。缺的译文显示英文。
     界面示意图（.fit-in）不翻译，和首页一样：繁体中文显示繁体中文界面（把中文那份转成繁体，放进英文的位置：<t-zh>/<t-en>、.zh-only/.en-only 成对的），
     其他语言显示英文界面。繁体的界面文字按文本节点查 NB_I18N['zh-TW'].ui（pages.py 生成） */
  var STATIC_EN = I18N ? [].slice.call(document.querySelectorAll('t-en')).filter(function (n) { return !n.closest('.fit-in'); }) : [];
  STATIC_EN.forEach(function (n) { n.__en = n.innerHTML; });
  var UI_EN = I18N ? [].slice.call(document.querySelectorAll('.fit-in t-en, .fit-in .en-only')).filter(function (n) {
    var z = n.previousElementSibling;
    if (n.tagName === 'T-EN') return z && z.tagName === 'T-ZH' && !n.closest('.fit-in .en-only');
    return z && z.classList.contains('zh-only');
  }) : [];
  UI_EN.forEach(function (n) { n.__en = n.innerHTML; });
  function twHTML(h, ui) {
    var t = document.createElement('template');
    t.innerHTML = h;
    var w = document.createTreeWalker(t.content, NodeFilter.SHOW_TEXT);
    for (var n = w.nextNode(); n; n = w.nextNode()) if (ui[n.nodeValue]) n.nodeValue = ui[n.nodeValue];
    return t.innerHTML;
  }
  function applyI18n(lang) {
    var d = window.NB_I18N && window.NB_I18N[lang];
    var tr = function (en, k) { return (lang !== 'zh' && lang !== 'en' && d && d.strings[k || en]) || en; };
    STATIC_EN.forEach(function (n) { var v = tr(n.__en, n.dataset.k); if (n.innerHTML !== v) n.innerHTML = v; });
    var ui = lang === 'zh-TW' && d && d.ui;
    UI_EN.forEach(function (n) {
      var v = ui ? (n.__tw || (n.__tw = twHTML(n.previousElementSibling.innerHTML, ui))) : n.__en;
      if (n.innerHTML !== v) n.innerHTML = v;
    });
    if (UI_EN.length && window.lucide) lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    var name = $('langName');
    if (name) name.textContent = LANG_NAMES[lang];
    document.querySelectorAll('#langMenu [data-lang]').forEach(function (a) { a.classList.toggle('cur', a.dataset.lang === lang); });
    if ($('langSelM')) $('langSelM').value = lang;
  }
  /* 译文按需加载：先共用的导航和页脚，再本页 */
  function loadI18n(lang, done) {
    var files = ['site', I18N], n = files.length;
    files.forEach(function (f) {
      var sc = document.createElement('script');
      sc.src = ROOT + 'assets/i18n/' + f + '.' + lang + '.js';
      sc.async = false;
      sc.onload = sc.onerror = function () { if (--n === 0) done(); };
      document.head.appendChild(sc);
    });
  }
  /* 手机上（视口窄于 640px）界面图最小按 PAN_MIN 倍显示，字不会小到看不清；超出屏幕的部分左右滑动查看。
     初始位置停在界面主体：有 data-focus（设计稿横坐标）就用它，否则跳过最左侧的导航栏 */
  var PAN_MIN = 0.72;
  function panHint(box, on) {
    var h = box.nextElementSibling;
    if (!h || !h.classList.contains('pan-hint')) {
      if (!on) return;
      h = document.createElement('p');
      h.className = 'pan-hint';
      h.innerHTML = '<i data-lucide="move-horizontal"></i><t-zh>左右滑动查看完整界面</t-zh><t-en>Swipe to see the full screen</t-en>';
      box.after(h);
      if (window.lucide) lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    }
    h.hidden = !on;
  }
  function fit() {
    var narrow = window.innerWidth < 640;
    var capH = Math.max(480, Math.min(640, window.innerHeight - 150));
    document.querySelectorAll('.fit').forEach(function (box) {
      var inner = box.querySelector('.fit-in'), w = +box.dataset.w;
      var clip = inner.parentNode !== box ? inner.parentNode : null;
      inner.style.width = w + 'px';
      /* 可滑动时容器向两侧多出的宽度正好是内边距，减掉后就是版心宽度 */
      var cs = getComputedStyle(box);
      var s = (box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / w;
      /* 台面去掉了留白，图纸里的图和首页一样按容器宽度等比缩放（可放大）；其他地方的图只缩小不放大 */
      if (!box.hasAttribute('data-up') && !box.closest('.sheet')) s = Math.min(1, s);
      var pan = narrow && s < PAN_MIN;
      if (pan) s = PAN_MIN;
      /* 桌面上图纸里的大图不超过一屏：高度超过 640px 或「窗口高度 − 导航与留白」时等比缩小，水平居中 */
      var ih = inner.offsetHeight, capped = false;
      if (!narrow && box.closest('.sheet') && ih * s > capH) { s = capH / ih; capped = true; }
      inner.style.marginLeft = capped ? Math.floor((box.clientWidth - w * s) / 2) + 'px' : '';
      box.classList.toggle('pan', pan);
      if (pan && !clip) { clip = document.createElement('div'); clip.className = 'fit-clip'; box.insertBefore(clip, inner); clip.appendChild(inner); }
      if (!pan && clip) { box.insertBefore(inner, clip); clip.remove(); clip = null; }
      inner.style.transform = s !== 1 ? 'scale(' + s + ')' : '';
      var h = Math.ceil(inner.offsetHeight * s);
      if (clip) { clip.style.width = Math.ceil(w * s) + 'px'; clip.style.height = h + 24 + 'px'; }
      box.style.height = h + (pan ? 24 : 0) + 'px';
      if (pan && !box.dataset.panned) {
        var side = inner.querySelector('.sb, .sx-side');
        var f = box.dataset.focus ? +box.dataset.focus : (side && side.getBoundingClientRect().left - inner.getBoundingClientRect().left < 4 ? side.offsetWidth : 0);
        box.scrollLeft = f * s;
        box.dataset.panned = '1';
      }
      panHint(box, pan);
    });
  }
  function setLanguage(lang) {
    if (I18N && lang !== 'zh' && lang !== 'en' && !(window.NB_I18N && window.NB_I18N[lang])) {
      loadI18n(lang, function () { setLanguage(lang); });
      return;
    }
    if (I18N && window.__font) window.__font(lang);
    if (I18N) applyI18n(lang);
    window.__lang = lang;
    document.documentElement.lang = lang;
    try { localStorage.setItem('nb3_lang', lang); } catch (e) {}
    syncMeta(lang);
    docsLinks(lang);
    fit();
  }
  var toggle = function () { setLanguage(window.__lang === 'en' ? 'zh' : 'en'); };
  $('langMenu').addEventListener('click', function (e) {
    var a = e.target.closest('[data-lang]');
    if (!a) return;
    e.preventDefault();
    /* 多数页面只有中英文：其他语言显示英文，但记住用户选的语言，回到首页时按它显示 */
    if (I18N) setLanguage(a.dataset.lang);
    else setLanguage(a.dataset.lang === 'zh' ? 'zh' : 'en');
    try { localStorage.setItem('nb3_lang', a.dataset.lang); } catch (err) {}
    a.blur();
  });
  var closeMenu = function () { $('nav').classList.remove('open'); $('menuBtn').setAttribute('aria-expanded', 'false'); };
  if ($('langBtnM')) $('langBtnM').addEventListener('click', function () { toggle(); closeMenu(); });
  if ($('langSelM')) $('langSelM').addEventListener('change', function () { setLanguage(this.value); closeMenu(); });
  $('menuBtn').addEventListener('click', function () {
    var nav = $('nav'), open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    this.setAttribute('aria-expanded', String(open));
  });
  /* Core 图：悬停或聚焦业务模块时，点亮它用到的底座能力 */
  function coreHot(mod) {
    var fig = mod && mod.closest('.cx');
    document.querySelectorAll('.cx').forEach(function (c) {
      var keys = c === fig ? mod.dataset.caps.split(' ') : [];
      c.classList.toggle('hot', c === fig);
      c.querySelectorAll('.cx-mod').forEach(function (n) { n.classList.toggle('on', n === mod); });
      c.querySelectorAll('.caps [data-cap]').forEach(function (n) { n.classList.toggle('on', keys.indexOf(n.dataset.cap) >= 0); });
    });
  }
  document.addEventListener('mouseover', function (e) { var m = e.target.closest && e.target.closest('.cx-mod'); if (m) coreHot(m); else if (e.target.closest && !e.target.closest('.cx')) coreHot(null); });
  document.addEventListener('focusin', function (e) { var m = e.target.closest && e.target.closest('.cx-mod'); coreHot(m || null); });
  /* 竖排标签（Solution 页的应用列表）：左侧选一项，右侧换成它的图；各图叠在同一格里，切换时页面高度不变 */
  document.querySelectorAll('.vtabs').forEach(function (box) {
    var tabs = [].slice.call(box.querySelectorAll('.apptab'));
    function show(i, focus) {
      tabs.forEach(function (b, j) {
        var on = j === i;
        b.parentNode.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
        var pane = document.getElementById(b.getAttribute('aria-controls'));
        pane.classList.toggle('on', on);
        pane.setAttribute('aria-hidden', String(!on));
      });
    }
    box.addEventListener('click', function (e) { var b = e.target.closest('.apptab'); if (b) show(tabs.indexOf(b)); });
    box.addEventListener('keydown', function (e) {
      var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      var b = e.target.closest && e.target.closest('.apptab');
      if (!d || !b) return;
      e.preventDefault();
      show((tabs.indexOf(b) + d + tabs.length) % tabs.length, true);
    });
  });
  if (I18N) applyI18n(window.__lang);
  syncMeta(window.__lang);
  docsLinks(window.__lang);
  if (window.lucide) lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
