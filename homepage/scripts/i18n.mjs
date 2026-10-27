// 译文条目的抽取和检查。在 homepage/ 下运行：
//
//   pnpm i18n:extract   从页面抽取要翻译的条目，更新 content/i18n/<组>.keys.yaml；繁体中文的界面文字补进 content/i18n/<组>.zh-TW.yaml 的 ui（新条目的值留空，列出来待人填写）
//   pnpm i18n:check     检查各语言的译文（构建时也会检查），列出缺的译文
//
// 条目的来源：
// - home：首页 content/pages/home.html 上写死的 <t-en>（不含模板里的界面示意和脚本画的图），以及脚本里的 M(中文, 英文)、Hero 收尾卡片、Core 图的能力和模块；
// - site：导航和页脚（src/lib/nav.mjs 的 T(中文, 英文)），表单脚本 src/scripts/public-form.js 的 T(中文, 英文)；
// - 各子页面：正文里的 <t-en>（同一段英文在页面上意思不同时写 <t-en data-k="…"> 给它单独的键），表单上 data-ph-en、data-text-en、data-ok-en 的英文，联系页下拉的选项（FORM_OPTIONS），以及页面标题和描述。
// 界面示意图（.fit-in 和 <template> 里）不翻译：繁体中文显示繁体中文界面，文字表在 <组>.zh-TW.yaml 的 ui（简体中文 → 繁体中文），由人填写，用语见 content/i18n/ui-terms.md。
//
// 已有条目的编号不变：英文原文没变的沿用原编号；页面上已经没有的标记 unused: true（译文文件里的那条可以留着）；新出现的追加在末尾，各语言要补上新编号的译文。
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSLATED } from '../src/lib/config.mjs';
import { parse, unescape } from '../src/lib/html.mjs';
import { checkAll, keysFile, langFile, PAGE_GROUPS, readKeys } from '../src/lib/i18n.mjs';
import { renderBilingual } from '../src/lib/pages.mjs';
import { CONTENT, HOMEPAGE } from '../src/lib/paths.mjs';
import { collectText, navSpec } from '../src/lib/nav.mjs';
import { readYaml, writeYaml } from '../src/lib/yaml-io.mjs';

// 联系页的两道选择题，选项由 public-form.js 从 NocoBase 2 的英文表单（service-en，ect266yzsld）读取：source、what_to_do 两个字段的 enum
const FORM_OPTIONS = {
  contact: [
    'Search Engine', 'GitHub', 'LinkedIn', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'X', 'Business Partner or Third-Party Recommendation',
    'Friends/Colleagues', 'Reddit', 'Online Community', 'AI Chat', 'Article/Blog post', 'Hacker News', 'Product Hunt', 'Review Site', 'Others',
    'Internal use for developing business systems or tools', 'Provide outsourcing services based on NocoBase',
    'Develop commercial products based on NocoBase', 'Study or research',
  ],
};
const HAN = /[一-鿿¥]/;
const homeSrc = () => readFileSync(join(CONTENT, 'pages', 'home.html'), 'utf8');

// 界面示意图（class 含 fit-in 的元素）在源码里的起止位置：[开始标签的开头, 结束标签的开头)
function fitRegions(src) {
  const out = [];
  const walk = n => {
    if ((n.attrs.class || '').split(/\s+/).includes('fit-in')) out.push([n.start, n.closeStart]);
    n.children.forEach(walk);
  };
  walk(parse(src));
  return out;
}
const inRegions = (regions, i) => regions.some(([a, b]) => a <= i && i < b);

function pageItems(group) {
  const src = renderBilingual(PAGE_GROUPS[group]);
  const body = src.indexOf('<main'), regions = fitRegions(src), items = [];
  for (const m of src.matchAll(/(?:<t-zh>((?:(?!<\/t-zh>)[\s\S])*)<\/t-zh>)?<t-en(?: data-k="([^"]*)")?>((?:(?!<\/t-en>)[\s\S])*)<\/t-en>/g)) {
    if (m.index < body || inRegions(regions, m.index)) continue;
    // 图片（视频封面、截图）按中英文各一张，其他语言用英文那张，不是文字
    if (m[3].trimStart().startsWith('<img')) continue;
    const sec = src.lastIndexOf('<section', m.index);
    const cls = sec >= 0 ? /^<section class="([^"]*)"(?: id="([^"]*)")?/.exec(src.slice(sec)) : null;
    const where = cls ? cls[2] || cls[1].split(' ').pop() : 'main';
    const item = { en: m[3], zh: m[1] || '', where };
    if (m[2]) item.k = m[2];
    items.push(item);
  }
  // 表单：输入框占位、选项文字、提交成功的提示，由 public-form.js 按语言取用
  for (const m of src.matchAll(/<[a-z]+\b[^>]*\bdata-(ph|text|ok)-en="([^"]*)"[^>]*>/g)) {
    if (m.index < body || inRegions(regions, m.index)) continue;
    const zh = new RegExp(`\\bdata-${m[1]}-zh="([^"]*)"`).exec(m[0]);
    items.push({ en: unescape(m[2]), zh: zh ? unescape(zh[1]) : '', where: 'form' });
  }
  items.push(...(FORM_OPTIONS[group] || []).map(en => ({ en, zh: '', where: 'form-options' })));
  const t = /<title data-zh="([^"]*)" data-en="([^"]*)"/.exec(src), d = /<meta name="description"[^>]*data-zh="([^"]*)" data-en="([^"]*)"/.exec(src);
  return { items, meta: { title: { zh: t[1], en: t[2] }, description: { zh: d[1], en: d[2] } } };
}

function siteItems() {
  const { header, footer } = navSpec('');
  const nav = [...collectText(header), ...collectText(footer)].map(([n, k]) => n[k]).join('\n');
  const items = [...nav.matchAll(/<t-zh>(.*?)<\/t-zh><t-en>(.*?)<\/t-en>/g)].map(m => ({ en: m[2], zh: m[1], where: 'site' }));
  const js = readFileSync(join(HOMEPAGE, 'src', 'scripts', 'public-form.js'), 'utf8'), unq = x => x.replaceAll("\\'", "'");
  for (const m of js.matchAll(/\bT\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) items.push({ en: unq(m[2]), zh: unq(m[1]), where: 'form' });
  return { items, meta: null };
}

function homeItems() {
  const src = homeSrc(), root = parse(src), items = [];
  const skip = n => n.tag === 'template' || /\bfit-in\b/.test(n.attrs.class || '') || ['heroFoot', 'apptabs'].includes(n.attrs.id) || /\bvframe\b/.test(n.attrs.class || '');
  const where = n => {
    for (let p = n.parent; p && p.tag !== '#root'; p = p.parent) if (['section', 'header', 'footer', 'nav'].includes(p.tag)) return p.attrs.id || (p.attrs.class || '').split(' ')[0] || p.tag;
    return '';
  };
  const walk = n => {
    if (skip(n)) return;
    if (n.tag === 't-en') {
      const sibs = n.parent.children, z = sibs[sibs.indexOf(n) - 1];
      items.push({ en: src.slice(n.openEnd, n.closeStart), zh: z && z.tag === 't-zh' ? src.slice(z.openEnd, z.closeStart) : '', where: where(n) });
      return;
    }
    n.children.forEach(walk);
  };
  walk(root);
  // 脚本：M(中文, 英文)、Hero 收尾卡片的三行、Core 能力（中英两组数组）、Core 图上的业务模块
  const scripts = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const js = scripts[scripts.length - 1][1], unq = x => x.replaceAll("\\'", "'");
  for (const m of js.matchAll(/\bM\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) items.push({ en: unq(m[2]), zh: unq(m[1]), where: 'figure' });
  for (const m of js.matchAll(/row\('r-\w+', '[\w-]+', '([^']*)', '([^']*)', '([^']*)', '([^']*)'\)/g)) {
    items.push({ en: m[2], zh: m[1], where: 'hero-finale' }, { en: m[4], zh: m[3], where: 'hero-finale' });
  }
  const caps = /trCaps\(\[([\s\S]*?)\]\) : \[([\s\S]*?)\];/.exec(js);
  const en = [...caps[1].matchAll(/\['[\w-]+', '([^']*)', '([^']*)'\]/g)], zh = [...caps[2].matchAll(/\['[\w-]+', '([^']*)', '([^']*)'\]/g)];
  en.forEach((e, i) => items.push({ en: e[1], zh: zh[i][1], where: 'core-caps' }, { en: e[2], zh: zh[i][2], where: 'core-caps' }));
  for (const m of js.matchAll(/\['([^']*)', '([^']*)', '([^']*)', '([^']*)', \[/g)) items.push({ en: m[2], zh: m[1], where: 'core-mods' }, { en: m[4], zh: m[3], where: 'core-mods' });
  const t = /<title data-zh="([^"]*)" data-en="([^"]*)">[^<]*<\/title>\n<meta name="description" content="[^"]*" data-zh="([^"]*)" data-en="([^"]*)">/.exec(src);
  return { items, meta: { title: { zh: unescape(t[1]), en: unescape(t[2]) }, description: { zh: unescape(t[3]), en: unescape(t[4]) } } };
}

// 繁体中文的界面文字：子页面是界面示意图（.fit-in）里含中文的文本节点（实体已解码）
function pageUiTexts(group) {
  const src = renderBilingual(PAGE_GROUPS[group]), out = [];
  for (const [a, b] of fitRegions(src)) {
    src.slice(a, b).replace(/<!--[\s\S]*?-->/g, '').split(/<[^>]*>/).forEach(seg => { const t = unescape(seg); if (HAN.test(t)) out.push(t); });
  }
  return [...new Set(out)];
}

// 首页：脚本里 L() 的中文、{ zh: … } 数据、NAMES_ZH 的人名，模板 <template> 里成对的 <t-zh>…</t-zh><t-en> 的中文（整段）
function homeUiTexts() {
  const page = homeSrc(), i = page.indexOf('var L = function'), body = page.slice(i, page.indexOf('</script>', i));
  const STR = String.raw`'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"`;
  const keys = [];
  for (const m of body.matchAll(new RegExp(String.raw`\bL\(\s*(?:${STR})\s*,`, 'g'))) keys.push(m[1] ?? m[2]);
  for (const m of body.matchAll(new RegExp(String.raw`\bzh:\s*(?:${STR})`, 'g'))) keys.push(m[1] ?? m[2]);
  for (const t of page.matchAll(/<template id="[^"]+">([\s\S]*?)<\/template>/g)) for (const m of t[1].matchAll(/<t-zh>([\s\S]*?)<\/t-zh>\s*<t-en>/g)) keys.push(m[1]);
  const nm = /NAMES_ZH\s*=\s*\{([^}]*)\}/.exec(body);
  if (nm) for (const m of nm[1].matchAll(/'([^']+)'/g)) keys.push(m[1]);
  return [...new Set(keys)].filter(k => HAN.test(k) && k !== '简体中文');
}

function updateKeys(group, { items: found, meta }) {
  const key = it => it.k ?? it.en;
  const current = new Map();
  for (const it of found) if (!current.has(key(it))) current.set(key(it), it);
  const old = existsSync(keysFile(group)) ? readKeys(group) : { meta: {}, items: {} };
  const items = old.items;
  const known = new Set(Object.values(items).map(key));
  for (const it of Object.values(items)) {
    if (current.has(key(it))) { delete it.unused; it.zh = current.get(key(it)).zh; } else it.unused = true;
  }
  const added = [...current.entries()].filter(([k]) => !known.has(k)).map(([, it]) => it);
  let next = Object.keys(items).length;
  for (const it of added) items[String(next++).padStart(3, '0')] = it;
  const out = meta ? { meta, items } : { items };
  writeYaml(keysFile(group), out);
  const all = Object.values(items);
  console.log(`${group}: ${all.length} 条，新增 ${added.length}，不再使用 ${all.filter(it => it.unused).length}`);
  for (const it of added) console.log(`  新增：${it.en}`);
}

function updateUi(group, texts) {
  const f = langFile(group, 'zh-TW');
  const data = existsSync(f) ? readYaml(f) : { strings: {} };
  const old = data.ui || {};
  const ui = Object.fromEntries(texts.map(k => [k, old[k] ?? '']));
  if (Object.keys(ui).length) data.ui = ui; else delete data.ui;
  writeYaml(f, data);
  const todo = Object.entries(ui).filter(([, v]) => !v).map(([k]) => k);
  console.log(`${group}.zh-TW ui: ${texts.length} 条（新增 ${texts.filter(k => !(k in old)).length}，删掉 ${Object.keys(old).filter(k => !(k in ui)).length}，待填写 ${todo.length}）`);
  for (const k of todo) console.log('  待填写：' + k.replaceAll('\n', '\\n'));
}

function extract() {
  updateKeys('home', homeItems());
  updateKeys('site', siteItems());
  for (const group of Object.keys(PAGE_GROUPS)) updateKeys(group, pageItems(group));
  updateUi('home', homeUiTexts());
  for (const group of Object.keys(PAGE_GROUPS)) updateUi(group, pageUiTexts(group));
  // 新出现的条目在各语言里还没有译文：列出来，构建时显示英文
  console.log(`下一步：给缺的条目补译文（content/i18n/<组>.<语言>.yaml 的 strings，语言：${TRANSLATED.join(' ')}），运行 pnpm i18n:check 查看还缺哪些。`);
}

const cmd = process.argv[2];
if (cmd === 'extract') extract();
else if (cmd === 'check') process.exit(checkAll() ? 0 : 1);
else {
  console.error('用法：node scripts/i18n.mjs extract|check');
  process.exit(2);
}
