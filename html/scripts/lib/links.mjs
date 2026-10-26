// 链接：源文件里的站内链接（core.html、blog/<slug>.html）换成各语言的地址，资源换成根路径，文档站链接按语言处理；构建后检查站内链接。
import { DOCS_V3, V2_DOC_PREFIXES } from './config.mjs';
import { unescape } from './html.mjs';

const NOCODE_DOCS = 'https://nocode.docs.nocobase.com';

// 指向 v2 文档的旧地址换成 v2 文档站 nocode.docs.nocobase.com（英文在根目录）：docs.nocobase.com/en/… 去掉 en/；docs.nocobase.com 上 v2 的一级路径和语言前缀换主机、路径不变；docs-cn.nocobase.com/… 换成 /cn/…。
// 指向 v3 文档的（根目录、zh-CN/、core/、start/、studio/）不变。CMS 导入（scripts/cms-import.mjs）用的也是它。
export function legacyDocLinks(text) {
  return text
    .replace(/https?:\/\/docs-cn\.nocobase\.com(?![\w.-])(\/[^\s"'<>()\]\\]*)?/g, (m, path) => `${NOCODE_DOCS}/cn${path || '/'}`)
    .replace(/https?:\/\/docs\.nocobase\.com\/en(?![\w-])(\/[^\s"'<>()\]\\]*)?/g, (m, path) => `${NOCODE_DOCS}${path || '/'}`)
    .replace(/https?:\/\/docs\.nocobase\.com\/([\w-]+)(?![\w-])/g, (m, seg) => (V2_DOC_PREFIXES.has(seg) ? `${NOCODE_DOCS}/${seg}` : m));
}

const SITE = 'https://www.nocobase.com';
const NOCODE_SITE = 'https://nocode.nocobase.com';
// 旧官网（NocoBase 2）的语言前缀
const LEGACY_LANGS = new Set(['en', 'cn', 'tw', 'ja', 'ko', 'ru', 'es', 'fr', 'de', 'pt', 'id', 'vi']);
// 插件页和 www.nocobase.com 上 CDN EdgeScript 的跳转一致：旧语言前缀下的 plugins（含子路径）和 plugins.html、plugins-cn.html 指向 v2 文档站的插件列表
const PLUGINS = { en: '/plugins', cn: '/cn/plugins', ja: '/ja/plugins', fr: '/fr/plugins' };
const PLUGINS_HTML = { 'plugins.html': '/plugins', 'plugins-cn.html': '/cn/plugins' };

// 一条指向 www.nocobase.com（或 nocobase.com）的地址怎么换，返回 { kind, url }。site 是新官网的文章：{ blog: Set<slug>, customers: Set<slug> }，每篇都有英文和 zh-CN 版。
// kind：blog、customers（旧博客地址换成新站文章）、home（旧首页）、plugins（v2 文档站的插件列表）、nocode（其余旧页面搬到 nocode.nocobase.com，路径不变）、keep（新站的地址或认不出的，不动）。
// 换掉的地址一律用 https，保留查询串和锚点。
export function siteLink(url, site) {
  const m = /^https?:\/\/(?:www\.)?nocobase\.com((?:\/[^?#]*)?)((?:[?#].*)?)$/.exec(url);
  if (!m) return { kind: 'keep', url };
  const path = m[1] || '/', rest = m[2];
  const segs = path.split('/').filter(Boolean);
  const lang = segs[0];
  const blog = /^\/(en|cn)\/blog\/([^/]+)\/?$/.exec(path);
  if (blog) {
    const [, l, slug] = blog, zh = l === 'cn' ? '/zh-CN' : '';
    if (site.blog.has(slug)) return { kind: 'blog', url: `${SITE}${zh}/blog/${slug}/${rest}` };
    if (site.customers.has(slug)) return { kind: 'customers', url: `${SITE}${zh}/customers/${slug}/${rest}` };
  }
  if (segs.length === 1 && (lang === 'en' || lang === 'cn')) return { kind: 'home', url: `${SITE}${lang === 'cn' ? '/zh-CN/' : '/'}${rest}` };
  if (segs.length === 1 && segs[0] in PLUGINS_HTML) return { kind: 'plugins', url: NOCODE_DOCS + PLUGINS_HTML[segs[0]] + rest };
  if (segs[1] === 'plugins' && lang in PLUGINS) return { kind: 'plugins', url: NOCODE_DOCS + PLUGINS[lang] + rest };
  if (LEGACY_LANGS.has(lang) || /\.html$/.test(path)) return { kind: 'nocode', url: NOCODE_SITE + path + rest };
  return { kind: 'keep', url };
}

// 正文里的地址：主机后面不能紧跟域名字符（nocobase.com.cn 之类不算），句末的标点不算地址
const SITE_URL = /https?:\/\/(?:www\.)?nocobase\.com(?![\w.-])(?:[/?#][^\s"'<>()\]\\`]*)?/g;
const urlParts = u => {
  const tail = /[.,;:!?]+$/.exec(u);
  return tail ? [u.slice(0, tail.index), tail[0]] : [u, ''];
};

// 博客、客户案例、更新日志正文里指向旧官网的地址换成新地址（规则见 siteLink）。CMS 导入（scripts/cms-import.mjs）用它，构建生成文章页时再换一次。
export function legacySiteLinks(text, site) {
  return text.replace(SITE_URL, m => {
    const [u, tail] = urlParts(m);
    return siteLink(u, site).url + tail;
  });
}

// 统计和检查用：正文里每条 www.nocobase.com 地址和它的换法
export function siteLinksIn(text, site) {
  return [...text.matchAll(SITE_URL)].map(([m]) => ({ from: urlParts(m)[0], ...siteLink(urlParts(m)[0], site) }));
}

// 中文页面（简体、繁体）上指向 v3 文档站的链接补上 zh-CN/（文档站英文在根目录，中文在 zh-CN/）
export function zhDocLinks(text) {
  return text.replace(/https:\/\/docs\.nocobase\.com\/(?!zh-CN\/)([^"'\s<>]*)/g, (m, path) => (DOCS_V3.has(path.split(/[/#?]/)[0]) ? `https://docs.nocobase.com/zh-CN/${path}` : m));
}

// 源文件里的站内链接：core.html、index.html、blog/<slug>.html，前面可能带 ../
const SRC_LINK = String.raw`(?:\.\./)*((?:blog|customers|changelog)/[^"'#?/\s]+|[a-z][a-z0-9-]*)\.html((?:#[^"'\s]*)?)`;

// resolve(源文件名) 返回该页在本页语言的地址，没有这页时返回 null（链接保留原样，由 check 报错）
export function rewrite(text, resolve) {
  text = text.replace(new RegExp(`((?:href|src)=")${SRC_LINK}(?=")`, 'g'), (m, attr, name, hash) => {
    const u = resolve(name);
    return u ? attr + u + hash : m;
  });
  // 脚本里的字符串（首页 getAPPS 的 href: 'solution-crm.html'）
  text = text.replace(new RegExp(`(['"])${SRC_LINK}\\1`, 'g'), (m, q, name, hash) => {
    const u = resolve(name);
    return u ? q + u + hash + q : m;
  });
  // 资源：assets/… 换成根路径
  return text.replace(/((?:href|src)=")(?:\.\.\/)*assets\//g, '$1/assets/');
}

// files：{地址: html}；exists(路径) 判断产物里有没有这个地址；isArticle(地址) 是不是博客、客户案例、更新日志的文章页。
// 返回 { errors, warnings }：站内链接指向不存在的页面或文件是错误；留着相对链接是错误，文章正文（来自 CMS）里的只是警告。
export function check(files, exists, isArticle) {
  const errors = [], warnings = [];
  for (const [url, text] of Object.entries(files)) {
    const html = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    for (const m of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
      const u = unescape(m[1]);
      if (!u || /^(#|mailto:|tel:|javascript:|data:|[a-z][a-z0-9+.-]*:|\/\/)/i.test(u)) continue;
      if (!u.startsWith('/')) {
        (isArticle(url) ? warnings : errors).push(`${url}: 相对链接 ${u}` + (isArticle(url) ? '（文章正文里的，在 CMS 里改）' : '（站内链接写成 core.html 这样的源文件名，构建时换成根路径）'));
        continue;
      }
      const path = u.split(/[?#]/)[0];
      if (!exists(path)) errors.push(`${url}: 链接指向不存在的地址 ${u}`);
    }
    // 脚本里写的站内地址（首页的应用链接）
    for (const m of text.matchAll(/(['"])(\/(?:[a-zA-Z]{2}-[A-Z]{2}\/)?(?:[a-z0-9-]+\/)*)\1/g)) {
      if (!exists(m[2])) errors.push(`${url}: 脚本里的地址 ${m[2]} 不存在`);
    }
  }
  return { errors, warnings };
}
