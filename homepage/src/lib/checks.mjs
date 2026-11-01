// 构建结束后对产物的检查，build 的 astro:build:done 钩子（src/integrations/checks.mjs）调用；逻辑都在这里，方便测试。
// - 站内链接指向的页面和文件都存在（地址按 CDN 回源规则映射到文件：以 / 结尾或最后一段不带点号的读 index.html）；
// - 译文格式正确；
// - 每种语言的页面数一致（12 种语言的页面每种语言一样多；中英文的页面（博客等，部分另有日文版）英文和简体中文一样多），产物里每个页面都在；
// - 产物根目录没有会被 CDN 回源规则误处理的名字（/en/ 会被去掉前缀映射到根目录，/api/ai/ 原样透传），也没有带点号的目录。
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ALL, LANGS, TRANSLATED, ZH_EN } from './config.mjs';
import { GROUPS, load } from './i18n.mjs';
import * as links from './links.mjs';

// CDN 不允许出现在产物根目录的名字
export const RESERVED_ROOT_NAMES = ['en', 'api'];

// 产物里所有的 HTML：{ 地址: 内容 }
export function readOutput(dist) {
  const files = {};
  const walk = (dir, rel) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name), rel + e.name + '/');
      else if (e.name.endsWith('.html')) files[e.name === 'index.html' ? '/' + rel : '/' + rel + e.name] = readFileSync(join(dir, e.name), 'utf8');
    }
  };
  walk(dist, '');
  return files;
}

// 地址（以 / 开头，可能不带 / 结尾）在产物里对应的文件存在吗
export const makeExists = dist => path => {
  path = path.replace(/\/+/g, '/');
  const last = path.slice(path.lastIndexOf('/') + 1);
  const f = path.endsWith('/') ? join(dist, path.slice(1), 'index.html') : last.includes('.') ? join(dist, path.slice(1)) : join(dist, path.slice(1), 'index.html');
  return existsSync(f) && statSync(f).isFile();
};

export const isArticleUrl = url => /^\/(?:zh-CN\/|ja-JP\/)?(?:blog|customers|changelog)\/[^/]+\/$/.test(url);

export function checkTranslations() {
  const errors = [];
  for (const group of GROUPS) for (const lang of TRANSLATED) errors.push(...load(group, lang).errors);
  return errors;
}

// 每种语言各类页面的数量：{ 语言: { all, 'zh-en', 'en-only' } }。zh-en 是有英文和简体中文的页面（含另有日文版的博客文章），日文那份也记在 zh-en 里
export function countPages(pages) {
  const counts = Object.fromEntries(ALL.map(c => [c, { all: 0, 'zh-en': 0, 'en-only': 0 }]));
  for (const page of pages) {
    const kind = page.langs.length === ALL.length ? 'all' : ZH_EN.every(l => page.langs.includes(l)) ? 'zh-en' : 'en-only';
    for (const lang of page.langs) counts[lang][kind]++;
  }
  return counts;
}

export function checkCounts(counts) {
  const errors = [];
  if (new Set(ALL.map(c => counts[c].all)).size !== 1) errors.push('各语言的页面数不一致：' + JSON.stringify(Object.fromEntries(ALL.map(c => [c, counts[c].all]))));
  if (counts.en['zh-en'] !== counts.zh['zh-en']) errors.push(`只有中英文的页面，英文 ${counts.en['zh-en']} 页、简体中文 ${counts.zh['zh-en']} 页，不一致`);
  return errors;
}

// 根目录的名字：不能有 en、api，目录名不能带点号（不带 / 的地址会被 CDN 当成文件）
export function checkRoot(names, isDir = () => true) {
  const errors = [];
  for (const bad of RESERVED_ROOT_NAMES) if (names.includes(bad)) errors.push(`产物根目录不能有 ${bad}/（CDN 回源规则会把 /${bad}/… 映射到别处）`);
  for (const name of names) if (name.includes('.') && isDir(name)) errors.push(`根目录的 ${name}/ 名字里有点号，不带 / 的地址会被 CDN 当成文件`);
  return errors;
}

// 产物里应该有的每个页面
export function expectedFiles(pages) {
  return pages.flatMap(p => p.langs.map(l => p.path(l)));
}

export function runChecks(dist, pages) {
  const errors = [], warnings = [];
  errors.push(...checkTranslations());
  const counts = countPages(pages);
  errors.push(...checkCounts(counts));
  const files = readOutput(dist);
  for (const url of expectedFiles(pages)) if (!(url in files)) errors.push(`产物里缺少页面 ${url}`);
  const checked = links.check(files, makeExists(dist), isArticleUrl);
  errors.push(...checked.errors);
  if (checked.warnings.length) warnings.push(`文章正文里有 ${checked.warnings.length} 个相对链接（多是 CMS 里写坏的 Markdown 链接，构建前就是坏的）：\n    ` + checked.warnings.join('\n    '));
  errors.push(...checkRoot(readdirSync(dist), n => statSync(join(dist, n)).isDirectory()));
  const dotted = Object.keys(files).filter(u => u.endsWith('/') && u.slice(0, -1).split('/').pop().includes('.')).sort();
  if (dotted.length) warnings.push(`${dotted.length} 个地址的最后一段带点号（如 ${dotted[0]}），只有以 / 结尾的写法能访问：CDN 规则把不带 / 且含点号的地址当成文件`);
  const summary = ['页面数（12 种语言的页面 / 中英文的页面（日文是其中另有日文版的）/ 只有英文的页面）：', ...LANGS.map(l => `  ${l.code.padEnd(6)} ${(l.dir || '(根)').padEnd(6)} ${String(counts[l.code].all).padStart(3)} / ${String(counts[l.code]['zh-en']).padStart(3)} / ${counts[l.code]['en-only']}`), `共 ${Object.keys(files).length} 个 HTML 文件，输出到 ${dist}`];
  return { errors, warnings, summary };
}
