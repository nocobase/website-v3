// 官网的顶部导航和页脚：内容（中英双语的 T(中文, 英文)）和 Header.astro、Footer.astro 的参数。首页和所有子页面共用，只有这一份。
// 其他语言的译文在 content/i18n/site.<语言>.yaml（键是这里的英文原文，pnpm i18n:extract 从这里抽取）。
// 站内链接写成 core.html 这样的源文件名，生成页面时换成各语言的地址。
import { githubStars } from '@nocobase/site-shared/config';
import { LANGS } from './config.mjs';
import { zhDocLinks } from './links.mjs';

export const T = (zh, en) => '<t-zh>' + zh + '</t-zh><t-en>' + en + '</t-en>';

const DOCS = 'https://docs.nocobase.com/';
const NOCODE = 'https://nocode.nocobase.com/';
const GITHUB = 'https://github.com/nocobase/nocobase';
const FORUM = 'https://forum.nocobase.com/';
const LOGO = 'https://static-docs.nocobase.com/logo-nocobase.png';

// 访问统计：Google Analytics 4、百度统计、Microsoft Clarity，编号和旧官网 nocode.nocobase.com 的相同，数据进同一个账号，报表里按「主机名」区分新旧官网。文档站在自己的配置里写自己的编号。
export const ANALYTICS = { ga4: 'G-237XXSVYHE', baidu: 'acfb678ac7bbc9df89e1aa4327e47907', clarity: 'y0qzc9z3xg' };

// 短句取自《NocoBase 产品定义与标准表述》
const PRODUCTS = [
  ['core', 'core.html', 'layers', 'NocoBase Core', T('AI 开发和运行业务系统的开源应用底座', 'The open-source foundation for AI-built business systems')],
  ['studio', 'studio.html', 'git-pull-request', 'NocoBase Studio', T('人与 Agent 协同开发的治理平台', 'The governance platform for people and agents building software together')],
  ['solutions', 'solutions.html', 'layout-grid', 'NocoBase Solution', T('由 Agent 驱动的企业业务应用', 'Agent-driven business apps')],
];
const APPS = [
  ['crm', 'solution-crm.html', 'handshake', 'NocoCRM', T('销售管理 · 配备 6 个销售 Agent', 'Sales · 6 Sales Agents')],
  ['itam', 'solution-itam.html', 'monitor-smartphone', 'NocoITAM', T('IT 资产台账与管理 · 配备 3 个资产 Agent', 'IT Asset Management · 3 IT Agents')],
  ['reach', 'solution-reach.html', 'megaphone', 'NocoReach', T('内容与增长 · 配备内容运营 Agent', 'Growth · Content Agent')],
  ['', '', 'headset', 'NocoSupport', T('客户服务 · 配备工单与客服 Agent', 'Support · Triage &amp; Reply Agents'), 1],
  ['', '', 'folder-kanban', 'NocoProject', T('项目协作 · 配备调研与文书 Agent', 'Projects · Research &amp; Doc Agents'), 1],
  ['', '', 'users', 'NocoHR', T('人事管理 · 配备入职与人事 Agent', 'HR · Onboarding Agent'), 1],
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
 * 返回 { header, footer }，字符串字段里的 <t-zh>/<t-en> 由调用方一次处理完（见 site.mjs 的 localizeAll），href 是源文件名。
 */
export function navSpec(active, { stars = githubStars() } = {}) {
  const on = k => k === active;
  const item = x => (x[5]
    ? { icon: x[2], title: x[3], desc: x[4], soon: 'Coming soon' }
    : { href: x[1], icon: x[2], title: x[3], desc: x[4], active: on(x[0]) });
  const v2 = { sep: true };
  const v2Item = { href: NOCODE, icon: 'mouse-pointer-click', title: 'NocoBase 2', tag: T('无代码', 'No-code'), arrow: true, external: true, kind: 'ext', desc: T('可视化配置搭建，与 NocoBase 3 并行维护', 'Visual configuration platform, maintained alongside v3') };
  const header = {
    logo: { href: 'index.html', src: LOGO, alt: 'NocoBase', width: 150, height: 22 },
    version: {
      label: '3', ariaLabel: 'NocoBase 3',
      items: [
        { href: 'index.html', icon: 'check', title: 'NocoBase 3', tag: T('当前', 'Current'), kind: 'cur', desc: T('面向 Agent 的开发平台', 'The development platform for agents') },
        { href: NOCODE, icon: 'mouse-pointer-click', title: 'NocoBase 2', arrow: true, external: true, kind: 'ext', desc: T('AI + 无代码开发平台', 'AI + no-code development platform') },
      ],
    },
    menu: [
      { label: T('产品', 'Products'), items: [...PRODUCTS.map(item), v2, v2Item] },
      { label: T('解决方案', 'Solutions'), two: true, items: APPS.map(item) },
      {
        label: T('资源', 'Resources'),
        items: [
          { href: DOCS, icon: 'book-open', title: T('文档', 'Docs'), desc: T('上手指南、核心能力与扩展开发参考', 'Guides, core capabilities, and API reference'), external: true },
          { href: 'customers.html', icon: 'building-2', title: T('客户案例', 'Customers'), desc: T('看看各行业团队如何用 NocoBase 搭建核心系统', 'How teams run core systems on NocoBase'), active: on('customers') },
          { href: 'blog.html', icon: 'newspaper', title: T('博客', 'Blog'), desc: T('产品思考、工程实践与方法论', 'Product thinking and engineering practices'), active: on('blog') },
          // 更新日志：还没有已发布的 v3 版本，暂不开放，置灰不可点击；有内容后改回 { href: 'changelog.html', … }，页脚里的也一起改
          { icon: 'history', title: T('更新日志', 'Changelog'), desc: T('每次版本迭代的新能力与改进', 'What shipped in every release'), soon: '' },
          { href: FORUM, icon: 'messages-square', title: T('社区', 'Community'), desc: T('在论坛提问、交流经验与反馈建议', 'Ask questions and share patterns'), external: true },
          { href: 'contact.html', icon: 'mail', title: T('联系我们', 'Contact Us'), desc: T('商务合作、产品咨询与技术支持', 'Partnerships, product questions, and support') },
        ],
      },
      {
        label: T('伙伴', 'Partners'),
        items: [
          { href: 'find-partner.html', icon: 'search', title: T('寻找 NocoBase 伙伴', 'Find a Partner'), desc: T('和懂行的伙伴一起，把系统做出来、用起来', 'Get your system built and running with an expert'), active: on('find-partner') },
          { href: 'partner.html', icon: 'handshake', title: T('成为合作伙伴', 'Become a Partner'), desc: T('用 Agent 团队交付更多客户项目', 'Deliver more client projects with an agent team'), active: on('partner') },
        ],
      },
      { label: T('定价', 'Pricing'), href: 'pricing.html', active: on('pricing') },
    ],
    // 手机菜单：和桌面菜单同样分组，点组名展开（和旧官网 NocoBase 2 一样）；置灰的未上线项不放
    mobile: [],
    links: [{ href: GITHUB, icon: 'github', label: stars, external: true }],
  };
  const mItem = it => ({ href: it.href, label: it.title, small: it.tag && it.tag + (it.external ? ' ↗' : ''), external: it.external, active: it.active });
  header.mobile = [
    ...header.menu.map(m => m.items
      ? { label: m.label, items: [...m.items.filter(it => it.href).map(mItem), ...(m.two ? [{ href: 'solutions.html', label: T('全部解决方案', 'All Solutions') }] : [])] }
      : { href: m.href, label: m.label, active: m.active }),
    { href: GITHUB, label: 'GitHub', small: stars, external: true },
  ];
  const footer = {
    logo: { src: LOGO, alt: 'NocoBase', width: 150, height: 22 },
    tagline: T('AI + NocoBase，构建可靠的业务系统。', 'AI + NocoBase. Build reliable business systems.'),
    columns: [
      { title: T('产品', 'Products'), links: [...PRODUCTS.map(x => ({ href: x[1], label: x[3] })), { href: NOCODE, label: T('NocoBase 2 无代码 ↗', 'NocoBase 2 No-code ↗'), external: true }] },
      { title: T('定价与许可', 'Pricing &amp; License'), links: [{ href: 'pricing.html', label: T('版本与价格', 'Editions &amp; Pricing') }, { href: '#', label: T('许可协议', 'License') }, { href: NOCODE, label: 'NocoBase 2.x ↗', external: true }] },
      { title: T('伙伴', 'Partners'), links: [{ href: 'partner.html', label: T('合作伙伴计划', 'Partner Program') }, { href: 'find-partner.html', label: T('寻找 NocoBase 伙伴', 'Find a Partner') }, { href: 'customers.html', label: T('客户案例', 'Customers') }] },
      { title: T('资源', 'Resources'), links: [{ href: DOCS, label: T('文档', 'Docs'), external: true }, { href: 'blog.html', label: T('博客', 'Blog') }, { href: '#', label: T('更新日志', 'Changelog') }] },
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
