// 官网的顶部导航和页脚：内容（中英双语的 T(中文, 英文)）和 Header.astro、Footer.astro 的参数。首页和所有子页面共用，只有这一份。
// 其他语言的译文在 content/i18n/site.<语言>.yaml（键是这里的英文原文，pnpm i18n:extract 从这里抽取）。
// 站内链接写成 core.html 这样的源文件名，生成页面时换成各语言的地址。
import { githubStars } from '@nocobase/site-shared/config';
import { hasChangelog } from './changelog.mjs';
import { LANGS } from './config.mjs';
import { zhDocLinks } from './links.mjs';

export const T = (zh, en) => '<t-zh>' + zh + '</t-zh><t-en>' + en + '</t-en>';

const DOCS = 'https://docs.nocobase.com/';
const NOCODE = 'https://nocode.nocobase.com/';
const GITHUB = 'https://github.com/nocobase/nocobase';
const FORUM = 'https://forum.nocobase.com/';
const LOGO = 'https://static-docs.nocobase.com/logo-nocobase.png';

// 访问统计：Google Analytics 4、Microsoft Clarity，编号和旧官网 nocode.nocobase.com 的相同，数据进同一个账号，报表里按「主机名」区分新旧官网。文档站在自己的配置里写自己的编号。
export const ANALYTICS = { ga4: 'G-237XXSVYHE', clarity: 'y0qzc9z3xg' };

// 短句取自《NocoBase 产品定义与标准表述》
const APPS = [
  ['crm', 'solution-crm.html', 'handshake', 'NocoCRM', T('销售管理 · 开源即用，配备 6 个销售 Agent', 'Sales CRM · Open source, 6 Sales Agents')],
  ['itam', 'solution-itam.html', 'monitor-smartphone', 'NocoITAM', T('IT 资产管理 · 开源即用，配备 3 个资产 Agent', 'IT Asset Management · Open source, 3 IT Agents')],
  ['reach', 'solution-reach.html', 'megaphone', 'NocoReach', T('内容与增长 · 开源即用，配备内容运营 Agent', 'Growth · Open source, Content Agent')],
];

// 站内链接 core.html#x 换成 lang 的地址；resolve(源文件名) 返回地址或 null。其他链接原样，中文页面的文档站链接补 zh-CN/。
export function makeHref(resolve, lang) {
  return h => {
    const m = /^([a-z][a-z0-9-]*)\.html(#.*)?$/.exec(h);
    if (m) return (resolve(m[1]) ?? h) + (m[2] || '');
    return lang === 'zh' || lang === 'zh-TW' ? zhDocLinks(h) : h;
  };
}

/**
 * 导航和页脚的参数，文字还是中英双语的 HTML。active 是本页的 page（core、blog……，首页是 home）。
 * changelog：content/changelog/ 里有没有条目；有才把「更新日志」做成链接，没有时置灰（空的更新日志页不值得从导航点进去）。
 * 返回 { header, footer }，字符串字段里的 <t-zh>/<t-en> 由调用方一次处理完（见 site.mjs 的 localizeAll），href 是源文件名。
 */
export function navSpec(active, { stars = githubStars(), changelog = hasChangelog() } = {}) {
  const on = k => k === active;
  const item = x => (x[5]
    ? { icon: x[2], title: x[3], desc: x[4], soon: 'Coming soon' }
    : { href: x[1], icon: x[2], title: x[3], desc: x[4], active: on(x[0]) });
  const sep = { sep: true };
  const header = {
    logo: { href: 'index.html', src: LOGO, alt: 'NocoBase', width: 150, height: 22 },
    version: {
      label: '3', ariaLabel: 'NocoBase 3',
      items: [
        { href: 'index.html', icon: 'check', title: 'NocoBase 3', tag: T('当前', 'Current'), kind: 'cur', desc: T('AI 时代的企业软件开发方式', 'The new way to build business software with AI') },
        { href: NOCODE, icon: 'mouse-pointer-click', title: 'NocoBase 2', arrow: true, external: true, kind: 'ext', desc: T('AI + 无代码开发平台', 'AI + no-code development platform') },
      ],
    },
    menu: [
      { label: 'Studio', href: 'studio.html', active: on('studio') },
      { label: 'Core', href: 'core.html', active: on('core') },
      {
        label: T('应用', 'Apps'),
        items: [
          ...APPS.map(item),
          sep,
          { href: 'solutions.html', icon: 'layout-grid', title: T('全部开源应用', 'All Open-Source Apps'), desc: T('装上即用，也能用 Studio 按需二次开发', 'Install and use right away, or customize in Studio'), active: on('solutions') },
        ],
      },
      {
        label: T('资源', 'Resources'),
        items: [
          { href: 'customers.html', icon: 'building-2', title: T('客户案例', 'Customers'), desc: T('看看各行业团队如何用 NocoBase 搭建核心系统', 'How teams run core systems on NocoBase'), active: on('customers') },
          { href: 'blog.html', icon: 'newspaper', title: T('博客', 'Blog'), desc: T('产品思考、工程实践与方法论', 'Product thinking and engineering practices'), active: on('blog') },
          // 更新日志：content/changelog/ 里还没有条目时置灰不可点击，有了自动变成链接（页脚的同样处理）
          { ...(changelog ? { href: 'changelog.html', active: on('changelog') } : { soon: '' }), icon: 'history', title: T('更新日志', 'Changelog'), desc: T('每次版本迭代的新能力与改进', 'What shipped in every release') },
          { href: FORUM, icon: 'messages-square', title: T('社区', 'Community'), desc: T('在论坛提问、交流经验与反馈建议', 'Ask questions and share patterns'), external: true },
          sep,
          { href: 'find-partner.html', icon: 'search', title: T('寻找 NocoBase 伙伴', 'Find a Partner'), desc: T('和懂行的伙伴一起，把系统做出来、用起来', 'Get your system built and running with an expert'), active: on('find-partner') },
          { href: 'partner.html', icon: 'handshake', title: T('成为合作伙伴', 'Become a Partner'), desc: T('用 Agent 团队交付更多客户项目', 'Deliver more client projects with an agent team'), active: on('partner') },
          { href: 'contact.html', icon: 'mail', title: T('联系我们', 'Contact Us'), desc: T('商务合作、产品咨询与技术支持', 'Partnerships, product questions, and support') },
        ],
      },
      { label: T('定价', 'Pricing'), href: 'pricing.html', active: on('pricing') },
      { label: T('文档', 'Docs'), href: DOCS, external: true },
    ],
    // 手机菜单：和桌面菜单同样分组，点组名展开（和旧官网 NocoBase 2 一样）；置灰的未上线项不放
    mobile: [],
    cta: { href: 'index.html#start', label: T('开始使用', 'Get Started') },
    links: [{ href: GITHUB, icon: 'github', label: stars, external: true }],
  };
  const mItem = it => ({ href: it.href, label: it.title, small: it.tag && it.tag + (it.external ? ' ↗' : ''), external: it.external, active: it.active });
  header.mobile = [
    ...header.menu.map(m => m.items
      ? { label: m.label, items: m.items.filter(it => it.href).map(mItem) }
      : { href: m.href, label: m.label, external: /^https?:/.test(m.href || ''), active: m.active }),
    { href: 'index.html#start', label: T('开始使用', 'Get Started') },
    { href: GITHUB, label: 'GitHub', small: stars, external: true },
  ];
  const footer = {
    logo: { src: LOGO, alt: 'NocoBase', width: 150, height: 22 },
    tagline: T('AI 时代的企业软件开发方式。', 'The new way to build business software with AI.'),
    columns: [
      {
        title: T('产品', 'Products'),
        links: [
          { href: 'studio.html', label: 'NocoBase Studio' },
          { href: 'core.html', label: 'NocoBase Core' },
          { href: 'solutions.html', label: T('开源应用', 'Open-Source Apps') },
          { href: NOCODE, label: T('NocoBase 2 无代码 ↗', 'NocoBase 2 No-code ↗'), external: true },
        ],
      },
      { title: T('定价与许可', 'Pricing &amp; License'), links: [{ href: 'pricing.html', label: T('版本与价格', 'Editions &amp; Pricing') }, { href: 'license.html', label: T('许可协议', 'License') }, { href: NOCODE, label: 'NocoBase 2.x ↗', external: true }] },
      { title: T('伙伴', 'Partners'), links: [{ href: 'partner.html', label: T('合作伙伴计划', 'Partner Program') }, { href: 'find-partner.html', label: T('寻找 NocoBase 伙伴', 'Find a Partner') }, { href: 'customers.html', label: T('客户案例', 'Customers') }] },
      { title: T('资源', 'Resources'), links: [{ href: DOCS, label: T('文档', 'Docs'), external: true }, { href: 'blog.html', label: T('博客', 'Blog') }, { ...(changelog && { href: 'changelog.html' }), label: T('更新日志', 'Changelog') }] },
      { title: T('联系', 'Connect'), links: [{ href: 'contact.html', label: T('联系我们', 'Contact Us') }, { href: FORUM, label: T('社区论坛', 'Forum'), external: true }, { href: GITHUB, label: 'GitHub', external: true }] },
    ],
    copyright: '© 2020-2026 NocoBase. All rights reserved.',
  };
  return { header, footer };
}

// 语言菜单的数据：urls 是语言代码 → 本页在该语言的地址（没有这种语言的页面给英文地址）
export const languageList = (cur, urls) => LANGS.map(l => ({ code: l.code, name: l.name, html: l.html, url: urls[l.code], current: l.code === cur }));

// nav 规格里所有要翻译的字符串（标题、说明、标签），按固定顺序列出，localizeAll 靠它整体处理再放回去
const TEXT_KEYS = ['title', 'desc', 'tag', 'label', 'small', 'tagline', 'copyright'];
export function collectText(node, out = []) {
  if (Array.isArray(node)) node.forEach(n => collectText(n, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && TEXT_KEYS.includes(k)) out.push([node, k]);
      else if (typeof v === 'object') collectText(v, out);
    }
  }
  return out;
}
