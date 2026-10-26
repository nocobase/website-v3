// 读取和检查译文。src/i18n/ 里每个组（home 是首页，site 是导航、页脚和表单提示，其他是各子页面）有：
//   <组>.keys.yaml     要翻译的条目：编号 → 英文原文、中文原文、位置（where），以及页面标题和描述的中英文（meta）。由 pnpm i18n:extract 从页面抽取，不要手改
//   <组>.<语言>.yaml   一种语言的译文：notes（这种语言的写法和固定用语）、title、description、strings（编号 → 译文）；繁体中文另有 ui（简体中文界面文字 → 繁体中文）
// 缺译文时页面显示英文（繁体中文的界面文字缺了显示简体中文），只打印警告；编号重复、标记和原文不一致这类错误让检查和构建失败。
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSLATED } from './config.mjs';
import { SRC } from './paths.mjs';
import { readYaml } from './yaml-io.mjs';

export const I18N = join(SRC, 'i18n');
// 子页面的组 → 正文源文件 src/pages/<名称>.body.html（首页是 src/pages/home.html，site 是导航和页脚）
export const PAGE_GROUPS = { core: 'core', studio: 'studio', solutions: 'solutions', crm: 'solution-crm', itam: 'solution-itam', pricing: 'pricing', partner: 'partner', 'find-partner': 'find-partner', contact: 'contact' };
export const GROUPS = ['home', 'site', ...Object.keys(PAGE_GROUPS)];
// 首页脚本里用到的条目（M()、Hero 收尾卡片、Core 图）：这些要内联进页面，其余的在构建时已经写进 HTML
export const SCRIPT_WHERE = new Set(['figure', 'hero-finale', 'core-caps', 'core-mods']);

// ---- 文件格式 ----

export const keysFile = group => join(I18N, `${group}.keys.yaml`);
export const langFile = (group, lang) => join(I18N, `${group}.${lang}.yaml`);

// <组>.keys.yaml：{ meta: { title: {zh, en}, description: {zh, en} }, items: { 编号: { en, zh, where, k?, unused? } } }
export function readKeys(group) {
  const d = readYaml(keysFile(group));
  return { meta: d.meta || {}, items: d.items || {} };
}

// <组>.<语言>.yaml：{ notes, title, description, strings: { 编号: 译文 }, ui: { 简体中文: 繁体中文 } }（ui 只在 zh-TW）
export function readLang(group, lang) {
  const f = langFile(group, lang), errors = [];
  if (!existsSync(f)) return { data: { strings: {} }, errors: [`缺少 ${f}`] };
  let data;
  try { data = readYaml(f); } catch (e) { return { data: { strings: {} }, errors: [`${f}：${e.message.split('\n')[0]}`] }; }
  data.strings = data.strings || {};
  for (const [k, v] of Object.entries(data.strings)) {
    if (!/^\d{3}$/.test(k)) errors.push(`${f} 不认识的编号 ${k}`);
    if (typeof v !== 'string') errors.push(`${f} ${k} 的译文不是字符串（含冒号、引号等的译文要加引号）：${v}`);
  }
  for (const k of ['title', 'description']) if (data[k] !== undefined && typeof data[k] !== 'string') errors.push(`${f} ${k} 不是字符串`);
  return { data, errors };
}

// ---- 加载和检查 ----

const tags = s => (s.match(/<(?!br>)[^>]+>/g) || []).sort();

// 法文的 ? ! : ; 前用不换行空格；数字和 % 之间不断行
function typeset(v, lang) {
  if (lang === 'fr') v = v.replace(/ ([?!:;»])/g, ' $1').replaceAll('« ', '« ');
  return v.replace(/(\d) %/g, '$1 %');
}

// 一组在一种语言的译文：{ strings（以英文原文或 data-k 为键）, meta: {title, description}, ui, errors, missing }
export function load(group, lang) {
  const keys = readKeys(group);
  const { data, errors } = readLang(group, lang);
  const tr = Object.fromEntries(Object.entries(data.strings).map(([k, v]) => [k, typeset(v, lang)]));
  const missing = [];
  // 子页面：和首页英文原文相同的条目，没写译文时沿用首页的译文
  if (group !== 'home') {
    const home = readKeys('home'), homeTr = readLang('home', lang).data.strings;
    const homeByEn = {};
    for (const [id, it] of Object.entries(home.items)) if (id in homeTr) homeByEn[it.en] = typeset(homeTr[id], lang);
    for (const [id, it] of Object.entries(keys.items)) if (!(id in tr) && !('k' in it) && it.en in homeByEn) tr[id] = homeByEn[it.en];
  }
  for (const [id, it] of Object.entries(keys.items)) {
    if (it.unused) continue;
    if (!(id in tr)) { missing.push(it.en); continue; }
    const v = tr[id], en = it.en;
    if (JSON.stringify(tags(v)) !== JSON.stringify(tags(en)) && !(['zh-TW', 'ja', 'ko'].includes(lang) && JSON.stringify(tags(v)) === JSON.stringify(tags(it.zh))))
      errors.push(`${group}.${lang} ${id} 标记和原文不一致：${v}`);
    if (group === 'home') for (const ph of en.match(/\{\w+\}/g) || []) if (!v.includes(ph)) errors.push(`${group}.${lang} ${id} 少了占位符 ${ph}`);
    if (/&(?!amp;|lt;|gt;|quot;|#\d+;)/.test(v) && en.includes('&amp;')) errors.push(`${group}.${lang} ${id} 的 & 要写成 &amp;`);
  }
  for (const id of Object.keys(tr)) if (!(id in keys.items)) errors.push(`${group}.${lang} 多出的编号 ${id}`);
  if (group !== 'site' && (data.title === undefined || data.description === undefined)) errors.push(`${group}.${lang} 缺 title 或 description`);
  const strings = {};
  for (const [id, it] of Object.entries(keys.items)) if (id in tr && !it.unused) strings[it.k || it.en] = tr[id];
  const ui = Object.fromEntries(Object.entries(data.ui || {}).filter(([, v]) => v));
  // 首页的标题和描述照原样用（首页只给条目加不换行空格），子页面的标题和描述也加
  const meta = group === 'home' ? { title: data.title, description: data.description } : { title: data.title === undefined ? undefined : typeset(data.title, lang), description: data.description === undefined ? undefined : typeset(data.description, lang) };
  return { strings, meta, ui, errors, missing };
}

// 表单脚本 public-form.js 在浏览器里要用的条目（提示语、下拉和多选的选项）
export function formKeys(group) {
  return new Set(Object.values(readKeys(group).items).filter(it => ['form', 'form-options'].includes(it.where) && !it.unused).map(it => it.en));
}

export function scriptKeys() {
  return new Set(Object.values(readKeys('home').items).filter(it => SCRIPT_WHERE.has(it.where) && !it.unused).map(it => it.en));
}

export function checkAll(log = console.log) {
  let ok = true;
  for (const group of GROUPS) for (const lang of TRANSLATED) {
    const { strings, errors, missing } = load(group, lang);
    for (const e of errors) log('错误：' + e);
    for (const m of missing) log(`缺译文：${group}.${lang}：${m}`);
    if (errors.length) ok = false;
    log(`${group}.${lang}: ${Object.keys(strings).length} 条`);
  }
  return ok;
}
