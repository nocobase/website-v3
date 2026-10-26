// 子页面共用的顶部导航、页脚、语言菜单和 head。导航和页脚写成中英双语（T(中文, 英文)），和正文一起按语言处理；其他语言的译文在 src/i18n/site.<语言>.yaml（键是这里的英文原文，pnpm i18n:extract 从这里抽取）。
// 站内链接写成 core.html 这样的源文件名，构建时换成各语言的地址。首页的导航和页脚写在 src/pages/home.html 里，改这里时那边一起改。
import { FONTS, LANGS, ORIGIN } from './config.mjs';
import { escapeAttr } from './html.mjs';

export const T = (zh, en) => '<t-zh>' + zh + '</t-zh><t-en>' + en + '</t-en>';

const DOCS = 'https://docs.nocobase.com/';
const NOCODE = 'https://nocode.nocobase.com/';
const GH = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12.02c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0 1 12 6.84c.85 0 1.71.11 2.51.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.02C22 6.48 17.52 2 12 2z"/></svg>';

// 和首页的静态导航一致，短句取自《NocoBase 产品定义与标准表述》
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
const SOON = '<em class="soon-tag">Coming soon</em>';

export function header(page, langMenu, langMenuM) {
  const on = k => (k === page ? ' class="on"' : '');
  const dd = items => items.map(x => (x[5]
    ? '<div class="soon" aria-disabled="true"><i data-lucide="' + x[2] + '"></i><b>' + x[3] + SOON + '</b><span>' + x[4] + '</span></div>'
    : '<a href="' + x[1] + '"' + on(x[0]) + '><i data-lucide="' + x[2] + '"></i><b>' + x[3] + '</b><span>' + x[4] + '</span></a>')).join('');
  const v2 = '<div class="dd-sep"></div><a class="ext" href="' + NOCODE + '" target="_blank" rel="noopener"><i data-lucide="mouse-pointer-click"></i><b>NocoBase 2<em class="kind-tag">' + T('无代码', 'No-code') +
    '</em><i data-lucide="arrow-up-right"></i></b><span>' + T('可视化配置搭建，与 NocoBase 3 并行维护', 'Visual configuration platform, maintained alongside v3') + '</span></a>';
  return '<header class="nav" id="nav"><div class="container in">' +
    '<a class="logo" href="index.html" aria-label="NocoBase"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase" width="150" height="22"></a>' +
    '<div class="mi ver"><button type="button" aria-haspopup="true" aria-label="NocoBase 3">3<i data-lucide="chevron-down"></i></button><div class="dd"><a class="cur" href="index.html"><i data-lucide="check"></i><b>NocoBase 3<em class="kind-tag">' + T('当前', 'Current') + '</em></b><span>' + T('面向 Agent 的开发平台', 'The development platform for agents') + '</span></a><a class="ext" href="' + NOCODE + '" target="_blank" rel="noopener"><i data-lucide="mouse-pointer-click"></i><b>NocoBase 2<i data-lucide="arrow-up-right"></i></b><span>' + T('AI + 无代码开发平台', 'AI + no-code development platform') + '</span></a></div></div>' +
    '<nav class="menu" aria-label="Primary">' +
    '<div class="mi"><button type="button" aria-haspopup="true">' + T('产品', 'Products') + '<i data-lucide="chevron-down"></i></button><div class="dd">' + dd(PRODUCTS) + v2 + '</div></div>' +
    '<div class="mi"><button type="button" aria-haspopup="true">' + T('解决方案', 'Solutions') + '<i data-lucide="chevron-down"></i></button><div class="dd two">' + dd(APPS) + '</div></div>' +
    '<div class="mi"><button type="button" aria-haspopup="true">' + T('资源', 'Resources') + '<i data-lucide="chevron-down"></i></button><div class="dd">' +
    '<a href="' + DOCS + '" target="_blank" rel="noopener"><i data-lucide="book-open"></i><b>' + T('文档', 'Docs') + '</b><span>' + T('上手指南、核心能力与扩展开发参考', 'Guides, core capabilities, and API reference') + '</span></a>' +
    '<a href="customers.html"' + on('customers') + '><i data-lucide="building-2"></i><b>' + T('客户案例', 'Customers') + '</b><span>' + T('看看各行业团队如何用 NocoBase 搭建核心系统', 'How teams run core systems on NocoBase') + '</span></a>' +
    '<a href="blog.html"' + on('blog') + '><i data-lucide="newspaper"></i><b>' + T('博客', 'Blog') + '</b><span>' + T('产品思考、工程实践与方法论', 'Product thinking and engineering practices') + '</span></a>' +
    // 更新日志：还没有已发布的 v3 版本，暂不开放，置灰不可点击；有内容后改回 <a href="changelog.html">，首页 pages/home.html 一起改
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
    '<div class="right">' + langMenu +
    '<a class="plain" href="https://github.com/nocobase/nocobase" target="_blank" rel="noopener">' + GH + '24.6K</a>' +
    '<button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" id="menuBtn"><i data-lucide="menu"></i></button>' +
    '</div></div>' +
    '<div class="container mnav" id="mnav">' +
    PRODUCTS.map(x => '<a href="' + x[1] + '"' + on(x[0]) + '>' + x[3] + '</a>').join('') +
    '<a href="' + NOCODE + '" target="_blank" rel="noopener">NocoBase 2<small>' + T('无代码 ↗', 'No-code ↗') + '</small></a>' +
    '<a href="solutions.html">' + T('全部解决方案', 'All Solutions') + '</a>' +
    '<a href="' + DOCS + '" target="_blank" rel="noopener">' + T('文档', 'Docs') + '</a>' +
    '<a href="customers.html"' + on('customers') + '>' + T('客户案例', 'Customers') + '</a>' +
    '<a href="blog.html"' + on('blog') + '>' + T('博客', 'Blog') + '</a>' +
    '<a href="find-partner.html"' + on('find-partner') + '>' + T('寻找 NocoBase 伙伴', 'Find a Partner') + '</a>' +
    '<a href="partner.html"' + on('partner') + '>' + T('成为合作伙伴', 'Become a Partner') + '</a>' +
    '<a href="pricing.html"' + on('pricing') + '>' + T('定价', 'Pricing') + '</a>' +
    '<a href="contact.html">' + T('联系我们', 'Contact Us') + '</a>' +
    '<a href="https://github.com/nocobase/nocobase" target="_blank" rel="noopener">GitHub<small>24.6K</small></a>' + langMenuM +
    '</div></header>';
}

export function footer() {
  return '<footer><div class="container"><div class="fgrid">' +
    '<div><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase" width="150" height="22"><p class="tag-line">' + T('AI + NocoBase，构建可靠的业务系统。', 'AI + NocoBase. Build reliable business systems.') + '</p></div>' +
    '<div><h4>' + T('产品', 'Products') + '</h4><ul>' + PRODUCTS.map(x => '<li><a href="' + x[1] + '">' + x[3] + '</a></li>').join('') + '<li><a href="' + NOCODE + '" target="_blank" rel="noopener">' + T('NocoBase 2 无代码 ↗', 'NocoBase 2 No-code ↗') + '</a></li></ul></div>' +
    '<div><h4>' + T('定价与许可', 'Pricing &amp; License') + '</h4><ul><li><a href="pricing.html">' + T('版本与价格', 'Editions &amp; Pricing') + '</a></li><li><a href="#">' + T('许可协议', 'License') + '</a></li><li><a href="' + NOCODE + '" target="_blank" rel="noopener">NocoBase 2.x ↗</a></li></ul></div>' +
    '<div><h4>' + T('伙伴', 'Partners') + '</h4><ul><li><a href="partner.html">' + T('合作伙伴计划', 'Partner Program') + '</a></li><li><a href="find-partner.html">' + T('寻找 NocoBase 伙伴', 'Find a Partner') + '</a></li><li><a href="customers.html">' + T('客户案例', 'Customers') + '</a></li></ul></div>' +
    '<div><h4>' + T('资源', 'Resources') + '</h4><ul><li><a href="' + DOCS + '" target="_blank" rel="noopener">' + T('文档', 'Docs') + '</a></li><li><a href="blog.html">' + T('博客', 'Blog') + '</a></li><li><a href="#">' + T('更新日志', 'Changelog') + '</a></li></ul></div>' +
    '<div><h4>' + T('联系', 'Connect') + '</h4><ul><li><a href="contact.html">' + T('联系我们', 'Contact Us') + '</a></li><li><a href="https://forum.nocobase.com/" target="_blank" rel="noopener">' + T('社区论坛', 'Forum') + '</a></li><li><a href="https://github.com/nocobase/nocobase" target="_blank" rel="noopener">GitHub</a></li></ul></div>' +
    '</div><div class="fbot"><span>© 2020-2026 NocoBase. All rights reserved.</span></div></div></footer>';
}

// 桌面的语言菜单（普通链接）和手机菜单里的下拉框。urls：语言代码 → 本页在该语言的地址（没有这种语言的页面给英文地址）
export function langMenus(cur, urls) {
  const name = LANGS.find(l => l.code === cur).name;
  const links = LANGS.map(l => `<a href="${urls[l.code]}" hreflang="${l.html}" lang="${l.html}"${l.code === cur ? ' class="cur"' : ''}><i data-lucide="check"></i>${l.name}</a>`).join('');
  const desk = '<div class="mi lang" id="langMenu"><button class="plain" type="button" aria-haspopup="true" aria-label="Language"><i data-lucide="globe"></i>' +
    '<span id="langName">' + name + '</span><i data-lucide="chevron-down"></i></button><div class="dd">' + links + '</div></div>';
  const opts = LANGS.map(l => `<option value="${urls[l.code]}" lang="${l.html}"${l.code === cur ? ' selected' : ''}>${l.name}</option>`).join('');
  const mobile = '<label class="lang-switch-m"><i data-lucide="globe"></i><select id="langSelM" aria-label="Language">' + opts + '</select></label>';
  return [desk, mobile];
}

// canonical、hreflang、本页语言和要内联的数据、俄语字体。alternates：[[hreflang, 地址]]，含 x-default
export function headExtra(lang, url, alternates, noindex, inline) {
  const out = [];
  if (noindex) out.push('<meta name="robots" content="noindex">');
  else {
    out.push(`<link rel="canonical" href="${ORIGIN}${url}">`);
    for (const [h, u] of alternates) out.push(`<link rel="alternate" hreflang="${h}" href="${ORIGIN}${u}">`);
  }
  out.push('<script>' + inline + '</script>');
  if (FONTS[lang.code]) out.push(`<link rel="stylesheet" href="/assets/fonts/${FONTS[lang.code]}.css">`);
  return out.join('\n') + '\n';
}

export const esc = escapeAttr;
