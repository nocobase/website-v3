// 博客列表页、每篇文章的详情页，以及客户案例的列表和详情页：从 content/blog/posts.json、cs-posts.json 生成中英双语的正文，构建时再和其他页面一样按语言生成（博客和客户案例有英文和简体中文）。
// 日文版：有日文正文的文章（posts.json 里带 ja，来自 CMS 的 index.ja.md）另有 /ja-JP/ 下的详情页，博客列表和客户案例列表也各有一份日文的，只列有日文版的文章。
// 日文版用同一套模板再生成一遍：ja 为 true 时 T() 取 JA 里的日文界面文字（键是英文原文），文章的 en、cn 都换成 ja 那份，日期按日文写；结果挂在同一页的 ja 上（{ title, desc, main }）。
// 站内链接写成源文件名（blog/<slug>.html、customers.html、contact.html#contact），构建时换成各语言的地址。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { legacyDocLinks, legacySiteLinks } from './links.mjs';
import { CONTENT } from './paths.mjs';

let ja = false;
const JA = {
  'Blog': 'ブログ',
  'Blog — NocoBase': 'ブログ — NocoBase',
  'The NocoBase blog: building business systems with AI, release notes, and customer stories.': 'NocoBase ブログ：AI で業務システムを構築する方法、リリース情報、導入事例。',
  'Customer Stories — NocoBase': '導入事例 — NocoBase',
  'How teams worldwide build core business systems on NocoBase.': '世界各地のチームが NocoBase で基幹業務システムを構築した事例。',
  'All': 'すべて',
  'Customer stories': '導入事例',
  'Customer Stories': '導入事例',
  'Product thinking, engineering practice, <span class="m">and real customer stories.</span>': 'プロダクトの考え方、エンジニアリングの実践、<span class="m">そしてお客様の実例。</span>',
  'How to build business systems with AI, what’s new in NocoBase, and how teams in every industry build on it.': 'AI で業務システムを構築する方法、NocoBase の最新情報、そしてさまざまな業界のチームが NocoBase でシステムを構築する方法を紹介します。',
  'Read the post': '記事を読む',
  'On this page': '目次',
  'Keep reading': '関連記事',
  'Build reliable business systems with AI.': 'AI で信頼できる業務システムを構築する。',
  'Start with open-source NocoBase Core, or bring a real requirement and work with us.': 'オープンソースの NocoBase Core から始めるか、実際の要件を持ち込んで私たちと一緒に取り組みましょう。',
  'Explore NocoBase Core': 'NocoBase Core の詳細',
  'Book a Pilot': '実地検証を予約',
  'Teams worldwide <span class="m">build core business systems on NocoBase.</span>': '世界中のチームが <span class="m">NocoBase で基幹業務システムを構築しています。</span>',
  'From energy, manufacturing, and healthcare to government and universities—why they chose NocoBase, and how they built, launched, and keep improving their systems.': 'エネルギー、製造、医療から行政、大学まで。NocoBase を選んだ理由と、システムを構築・稼働させ、改善し続ける方法を紹介します。',
  'Customer Story · Sungrow': '導入事例 · Sungrow',
  'Read the story': '事例を読む',
  'The next story could be yours.': '次の事例は、あなたのチームかもしれません。',
  'Bring one real requirement and turn it into a system you’ll use for years.': '実際の要件を 1 つ持ち込み、長く使い続けられるシステムに仕上げましょう。',
  'See Solutions': 'ソリューションを見る',
  'More customer stories': 'その他の導入事例',
  'All customer stories': 'すべての導入事例',
};
// 列表页的标题和描述：日文那一轮换成 JA 里的译文
const jaText = en => (ja ? JA[en] ?? en : en);
const T = (zh, en) => (ja ? JA[en] ?? en : `<t-zh>${zh}</t-zh><t-en>${en}</t-en>`);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(d, lang) {
  const [y, m, dd] = d.split('-').map(Number);
  return lang === 'cn' || ja ? `${y}年${m}月${dd}日` : `${MONTHS[m - 1]} ${dd}, ${y}`;
}
const zip = (a, b) => a.slice(0, Math.min(a.length, b.length)).map((x, i) => [x, b[i]]);

// 新官网的文章：posts.json 里打了 Customer Stories 标签的和 cs-posts.json 的（加上阳光电源）是客户案例 /customers/<slug>/，其余是博客 /blog/<slug>/，都有英文和 zh-CN 版。正文里旧博客地址的替换（lib/links.mjs 的 legacySiteLinks）按它判断。
export function articleSlugs(allposts, cs) {
  const story = slug => allposts[slug].en.tags.includes('Customer Stories');
  const blog = new Set(Object.keys(allposts).filter(k => !story(k)));
  const customers = new Set(['sungrow', ...Object.keys(cs), ...Object.keys(allposts).filter(story)].filter(k => !blog.has(k)));
  // 另有 ja-JP 版的文章（lib/links.mjs 的 siteLink 用它换旧的 /ja/blog/ 地址）
  const withJa = set => new Set([...set].filter(k => allposts[k]?.ja));
  return { blog, customers, ja: { blog: withJa(blog), customers: withJa(customers) } };
}
const readBlog = name => JSON.parse(readFileSync(join(CONTENT, 'blog', name), 'utf8'));
export const readArticleSlugs = () => articleSlugs(readBlog('posts.json'), readBlog('cs-posts.json'));

export function blogPages() {
  const allposts = readBlog('posts.json');
  let stories = readBlog('cs-posts.json');
  const site = articleSlugs(allposts, stories);
  for (const [k, v] of Object.entries(allposts)) if (v.en.tags.includes('Customer Stories') && !(k in stories)) stories[k] = v;
  // cs-posts.json 里手工抓取的客户案例没有日文，CMS 里同一篇有日文正文的，日文版用 CMS 的
  for (const [k, v] of Object.entries(allposts)) if (v.ja && k in stories && !stories[k].ja) stories[k] = { ...stories[k], ja: v.ja };
  const posts = Object.fromEntries(Object.entries(allposts).filter(([, v]) => !v.en.tags.includes('Customer Stories')));
  // 阳光电源：官网还没有全文，先放标题与摘要
  const SUNGROW = {
    cn: { title: '阳光电源：在 NocoBase 上构建覆盖全球业务的管理系统', desc: '全球新能源龙头企业如何用一个底座支撑多个业务系统的快速搭建与长期演进。', date: '2026-10-17', author: 'NocoBase', tags: ['客户故事'], image: '', body: '' },
    en: { title: 'Sungrow: the systems behind a global business, built on NocoBase', desc: 'How a global renewable-energy leader uses one foundation to build business applications fast and keep them evolving.', date: '2026-10-17', author: 'NocoBase', tags: ['Customer Stories'], image: '', body: '' },
  };
  stories = { sungrow: SUNGROW, ...stories };
  const OUT = generate(posts, stories, site);
  // 日文版只放有 ja 的文章；阳光电源没有日文版，日文的客户案例列表照样放它（英文），但不生成日文详情页
  const jaView = (m, keep = []) => Object.fromEntries(Object.entries(m).filter(([k, v]) => v.ja || keep.includes(k)).map(([k, v]) => [k, { ...v, en: v.ja || v.en, cn: v.ja || v.en }]));
  ja = true;
  try {
    for (const it of generate(jaView(posts), jaView(stories, ['sungrow']), site)) {
      OUT.find(o => o.id === it.id).ja = { title: it.meta.title_en, desc: it.meta.desc_en, main: it.main };
    }
  } finally {
    ja = false;
  }
  return OUT;
}

function generate(posts, stories, site) {
  const OUT = [];
  const order = Object.keys(posts).sort((a, b) => (posts[a].en.date < posts[b].en.date ? 1 : posts[a].en.date > posts[b].en.date ? -1 : 0));
  // CMS 文章带 listed：false 的只有详情页，不进列表和「相关文章」（规则见 scripts/cms-import.mjs）
  const listed = order.filter(k => posts[k].listed ?? true);
  // 旧官网 hideOnBlog 的文章（onBlog：false）不进博客列表「全部」，按标签筛选时显示，和旧官网的 /blog 首页与标签页一致
  const onHome = k => posts[k] ? (posts[k].onBlog ?? true) : true;

  function localLinks(body) {
    // 指向 v2 文档的旧地址换成 nocode.docs.nocobase.com，指向旧官网的换成新地址或 nocode.nocobase.com（CMS 导入时已经换过，这里再保险一次）
    body = legacySiteLinks(legacyDocLinks(body), site);
    // 不带主机的旧博客地址换成站内链接
    return body.replace(/href="\/(?:en|cn|ja)\/blog\/([^"#?]+)"/g, (m, s) => {
      const slug = s.replace(/\/+$/, '');
      if (slug in posts) return `href="blog/${slug}.html"`;
      if (slug in stories) return `href="customers/${slug}.html"`;
      return m;
    });
  }
  function withIds(body, prefix) {
    const toc = [];
    body = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, h) => {
      const hid = `${prefix}-${toc.length + 1}`;
      toc.push([hid, h.replace(/<[^>]+>/g, '').trim()]);
      return `<h2 id="${hid}">${h}</h2>`;
    });
    return [body, toc];
  }
  const src = slug => posts[slug] || stories[slug];
  const tags = slug => zip(src(slug).cn.tags, src(slug).en.tags).map(([z, x]) => `<span class="pill">${T(esc(z), esc(x))}</span>`).join('');
  const meta = slug => {
    const { en: e, cn: c } = src(slug);
    return `<div class="bmeta">${tags(slug)}<span>${T(fmtDate(c.date, 'cn'), fmtDate(e.date, 'en'))}</span><span>${T(esc(c.author), esc(e.author))}</span></div>`;
  };
  const cover = (img, title = '') => (img ? `<img src="${img}" alt="">` : `<span class="cv-ph"><b>${title}</b></span>`);
  const href = slug => (slug in posts ? `blog/${slug}.html` : `customers/${slug}.html`);
  // inList：博客列表页的卡片，带 data-home，onBlog：false 的默认隐藏；相关文章、客户案例列表不受影响
  const card = (slug, inList) => {
    const { en: e, cn: c } = src(slug);
    const keys = e.tags.map(t => t.replaceAll(' ', '_')).join(' ');
    const home = !inList || onHome(slug);
    return `<a class="bcard" href="${href(slug)}" data-tags="${keys}"${inList ? ` data-home="${home ? 1 : 0}"${home ? '' : ' hidden'}` : ''}><span class="cv">${cover(e.image, 'SUNGROW')}</span>` +
      `${meta(slug)}<h3>${T(esc(c.title), esc(e.title))}</h3><p>${T(esc(c.desc), esc(e.desc))}</p></a>`;
  };
  // 每页一条：地址（blog、blog/<slug>……）、导航高亮、中英文标题和描述、正文
  const build = (id, page, tz, te, dz, de, main) => OUT.push({ id, meta: { page, title_zh: tz, title_en: te, desc_zh: dz, desc_en: de }, main });

  // 列表页
  const alltags = [];
  for (const s of listed) for (const [x, z] of zip(posts[s].en.tags, posts[s].cn.tags)) if (!alltags.some(a => a[0] === x)) alltags.push([x, z]);
  const feat = listed.find(onHome) || listed[0], fe = posts[feat].en, fc = posts[feat].cn;
  const chips = '<button type="button" class="on" data-f="">' + T('全部', 'All') + '</button>' + alltags.map(([x, z]) =>
    `<button type="button" data-f="${x.replaceAll(' ', '_')}">${T(esc(z), esc(x))}</button>`).join('') + `<a class="to-cs" href="customers.html">${T('客户案例', 'Customer stories')}<i data-lucide="arrow-right"></i></a>`;
  const listing = `<section class="phero">
  <div class="container">
    <p class="label"><b>${T('博客', 'Blog')}</b></p>
    <h1>${T('产品思考、工程实践，<span class="m">与客户的真实故事。</span>', 'Product thinking, engineering practice, <span class="m">and real customer stories.</span>')}</h1>
    <p class="lede">${T('关于用 AI 构建业务系统的方法、NocoBase 的版本更新，以及各行业团队怎样用 NocoBase 搭建自己的系统。', 'How to build business systems with AI, what’s new in NocoBase, and how teams in every industry build on it.')}</p>
  </div>
</section>
<section class="sec tight" style="padding-top:56px">
  <div class="container">
    <a class="bfeat" href="blog/${feat}.html"><span class="cv"><img src="${fe.image}" alt=""></span><span class="tx">${meta(feat)}<h2>${T(esc(fc.title), esc(fe.title))}</h2><p>${T(esc(fc.desc), esc(fe.desc))}</p><span class="link">${T('阅读全文', 'Read the post')}<i data-lucide="arrow-right"></i></span></span></a>
    <div class="bfilter" role="group" aria-label="Filter">${chips}</div>
    <div class="bgrid" id="bgrid">${listed.filter(s => s !== feat).map(s => card(s, true)).join('')}</div>
  </div>
</section>
<script>
(function () {
  var chips = document.querySelectorAll('.bfilter button'), cards = document.querySelectorAll('#bgrid .bcard');
  chips.forEach(function (b) { b.addEventListener('click', function () {
    chips.forEach(function (x) { x.classList.toggle('on', x === b); });
    var f = b.getAttribute('data-f');
    cards.forEach(function (c) { c.hidden = f ? (' ' + c.getAttribute('data-tags') + ' ').indexOf(' ' + f + ' ') < 0 : c.getAttribute('data-home') === '0'; });
  }); });
})();
</script>`;
  build('blog', 'blog', '博客 — NocoBase', jaText('Blog — NocoBase'), 'NocoBase 博客：用 AI 构建业务系统的方法、版本更新与客户故事。', jaText('The NocoBase blog: building business systems with AI, release notes, and customer stories.'), listing);

  const toc = t => t.map(([i, x]) => `<a href="#${i}">${esc(x)}</a>`).join('');
  // 详情页
  for (const slug of order) {
    const e = posts[slug].en, c = posts[slug].cn;
    const [bz, tz] = withIds(localLinks(c.body), 'zh');
    const [be, te] = withIds(localLinks(e.body), 'en');
    const same = listed.filter(s => s !== slug && posts[s].en.tags.some(t => e.tags.includes(t)));
    const rest = listed.filter(s => s !== slug && !same.includes(s));
    const related = [...same, ...rest].slice(0, 3);
    const body = `<div class="container">
  <header class="post-hero">
    <p class="crumb"><a href="blog.html">${T('博客', 'Blog')}</a><span>/</span>${T(esc(c.tags.join(' · ')), esc(e.tags.join(' · ')))}</p>
    <h1>${T(esc(c.title), esc(e.title))}</h1>
    <p class="lede">${T(esc(c.desc), esc(e.desc))}</p>
    ${meta(slug)}
  </header>
  <div class="post-cover"><img src="${e.image}" alt=""></div>
  <div class="post-body">
    <article><div class="prose zh-only">${bz}</div><div class="prose en-only">${be}</div></article>
    <nav class="toc" aria-label="Contents"><b>${T('本文目录', 'On this page')}</b><div class="zh-only">${toc(tz)}</div><div class="en-only">${toc(te)}</div></nav>
  </div>
  <section class="post-more">
    <h2>${T('继续阅读', 'Keep reading')}</h2>
    <div class="bgrid">${related.map(card).join('')}</div>
  </section>
  <div class="band">
    <div><h2>${T('用 AI 构建可靠的业务系统。', 'Build reliable business systems with AI.')}</h2><p>${T('从开源的 NocoBase Core 开始，或带一个真实需求和我们一起实践。', 'Start with open-source NocoBase Core, or bring a real requirement and work with us.')}</p></div>
    <div class="cta"><a class="btn btn-pri" href="core.html">${T('了解 NocoBase Core', 'Explore NocoBase Core')}<i data-lucide="arrow-right"></i></a><a class="btn btn-sec" href="contact.html#contact">${T('预约实战验证', 'Book a Pilot')}</a></div>
  </div>
</div>`;
    build('blog/' + slug, 'blog', c.title + ' — NocoBase', e.title + ' — NocoBase', c.desc.replaceAll('\n', ' '), e.desc.replaceAll('\n', ' '), body);
  }

  // ======================= 客户案例：独立的列表与详情 =======================
  const corder = ['sungrow', ...Object.keys(stories).filter(k => k !== 'sungrow').sort((a, b) => (stories[a].en.date < stories[b].en.date ? 1 : stories[a].en.date > stories[b].en.date ? -1 : 0))];
  const logos = [['nxp', 'NXP'], ['lenovo', 'Lenovo'], ['sony', 'Sony'], ['ntt-data', 'NTT DATA'], ['american-express', 'American Express'], ['smfl', 'SMFL'], ['vinfast', 'VinFast']]
    .map(([n, a]) => `<img src="https://static-docs.nocobase.com/${n}.png" alt="${a}">`).join('');
  const se = stories.sungrow.en, sc = stories.sungrow.cn;
  const clist = `<section class="phero">
  <div class="container">
    <p class="label"><b>${T('客户案例', 'Customer Stories')}</b></p>
    <h1>${T('全球各行业团队，<span class="m">用 NocoBase 构建核心业务系统。</span>', 'Teams worldwide <span class="m">build core business systems on NocoBase.</span>')}</h1>
    <p class="lede">${T('从新能源、制造、医疗到政府与高校，看他们为什么选择 NocoBase，怎样搭建、上线并持续改进自己的系统。', 'From energy, manufacturing, and healthcare to government and universities—why they chose NocoBase, and how they built, launched, and keep improving their systems.')}</p>
    <div class="cs-logos">${logos}</div>
  </div>
</section>
<section class="sec tight" style="padding-top:56px">
  <div class="container">
    <a class="bfeat" href="customers/sungrow.html"><span class="cv">${cover('', 'SUNGROW')}</span><span class="tx"><p class="label" style="margin:0"><b>${T('客户故事 · 阳光电源', 'Customer Story · Sungrow')}</b></p><h2>${T(esc(sc.title), esc(se.title))}</h2><p>${T(esc(sc.desc), esc(se.desc))}</p><span class="link">${T('阅读故事', 'Read the story')}<i data-lucide="arrow-right"></i></span></span></a>
    <div class="bgrid">${corder.slice(1).map(card).join('')}</div>
  </div>
</section>
<div class="container">
  <div class="band">
    <div><h2>${T('下一个故事，可以是你的。', 'The next story could be yours.')}</h2><p>${T('带一个真实需求，和我们一起把它做成可以长期使用的系统。', 'Bring one real requirement and turn it into a system you’ll use for years.')}</p></div>
    <div class="cta"><a class="btn btn-pri" href="contact.html#contact">${T('预约实战验证', 'Book a Pilot')}<i data-lucide="arrow-right"></i></a><a class="btn btn-sec" href="solutions.html">${T('查看解决方案', 'See Solutions')}</a></div>
  </div>
</div>`;
  build('customers', 'customers', '客户案例 — NocoBase', jaText('Customer Stories — NocoBase'), '全球各行业团队如何用 NocoBase 构建核心业务系统。', jaText('How teams worldwide build core business systems on NocoBase.'), clist);

  for (const slug of corder) {
    if (ja && !stories[slug].ja) continue;
    const e = stories[slug].en, c = stories[slug].cn;
    let bz, be, tz, te;
    if (slug === 'sungrow') {
      bz = `<p>${esc(c.desc)}</p><blockquote><p>完整故事即将发布。</p></blockquote>`;
      be = `<p>${esc(e.desc)}</p><blockquote><p>The full story is coming soon.</p></blockquote>`;
      tz = te = [];
    } else {
      [bz, tz] = withIds(localLinks(c.body), 'zh');
      [be, te] = withIds(localLinks(e.body), 'en');
    }
    const related = corder.filter(k => k !== slug).slice(0, 3);
    const nav = tz.length ? `<nav class="toc" aria-label="Contents"><b>${T('本文目录', 'On this page')}</b><div class="zh-only">${toc(tz)}</div><div class="en-only">${toc(te)}</div></nav>` : '<div></div>';
    const body = `<div class="container">
  <header class="post-hero">
    <p class="crumb"><a href="customers.html">${T('客户案例', 'Customer Stories')}</a></p>
    <h1>${T(esc(c.title), esc(e.title))}</h1>
    <p class="lede">${T(esc(c.desc), esc(e.desc))}</p>
    <div class="bmeta"><span>${T(fmtDate(c.date, 'cn'), fmtDate(e.date, 'en'))}</span><span>${T(esc(c.author), esc(e.author))}</span></div>
  </header>
  <div class="post-cover">${cover(e.image, 'SUNGROW')}</div>
  <div class="post-body">
    <article><div class="prose zh-only">${bz}</div><div class="prose en-only">${be}</div></article>
    ${nav}
  </div>
  <section class="post-more">
    <h2>${T('更多客户案例', 'More customer stories')}</h2>
    <div class="bgrid">${related.map(card).join('')}</div>
  </section>
  <div class="band">
    <div><h2>${T('下一个故事，可以是你的。', 'The next story could be yours.')}</h2><p>${T('带一个真实需求，和我们一起把它做成可以长期使用的系统。', 'Bring one real requirement and turn it into a system you’ll use for years.')}</p></div>
    <div class="cta"><a class="btn btn-pri" href="contact.html#contact">${T('预约实战验证', 'Book a Pilot')}<i data-lucide="arrow-right"></i></a><a class="btn btn-sec" href="customers.html">${T('全部客户案例', 'All customer stories')}</a></div>
  </div>
</div>`;
    build('customers/' + slug, 'customers', c.title + ' — NocoBase', e.title + ' — NocoBase', c.desc.replaceAll('\n', ' '), e.desc.replaceAll('\n', ' '), body);
  }
  return OUT;
}
