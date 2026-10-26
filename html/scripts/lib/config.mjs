// 语言、站点地址和文档站的约定。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from './paths.mjs';

export const ORIGIN = (process.env.SITE_ORIGIN || 'https://www.nocobase.com').replace(/\/+$/, '');

// code：源文件、译文文件和页面脚本里的 window.__lang 用的语言代码；dir：地址里的目录（英文在根目录）；html：<html lang> 和 hreflang。
// 顺序就是语言菜单的顺序；目录名和 NocoBase 3 插件的语言文件同名。
const L = (code, dir, name) => ({ code, dir, html: dir || 'en', name });
export const LANGS = [L('en', '', 'English'), L('es', 'es-ES', 'Español'), L('fr', 'fr-FR', 'Français'), L('de', 'de-DE', 'Deutsch'),
  L('pt', 'pt-BR', 'Português'), L('ru', 'ru-RU', 'Русский'), L('id', 'id-ID', 'Bahasa Indonesia'), L('vi', 'vi-VN', 'Tiếng Việt'),
  L('zh', 'zh-CN', '简体中文'), L('zh-TW', 'zh-TW', '繁體中文'), L('ja', 'ja-JP', '日本語'), L('ko', 'ko-KR', '한국어')];
export const BY_CODE = Object.fromEntries(LANGS.map(l => [l.code, l]));
export const ALL = LANGS.map(l => l.code);
export const ZH_EN = ['en', 'zh'];
// 中文、英文以外的语言，译文在 src/i18n/<组>.<语言>.yaml
export const TRANSLATED = ALL.filter(c => c !== 'en' && c !== 'zh');
// 俄语用 Inter（Archivo 没有西里尔字母）；日文、韩文、繁体中文用系统字体
export const FONTS = { ru: 'inter' };

// docs.nocobase.com 上 301 到 v2 文档 nocode.docs.nocobase.com 的一级路径（和文档站共用一份名单）
export const V2_DOC_PREFIXES = new Set(readFileSync(join(REPO, 'doc', 'scripts', 'v2-redirect-prefixes.txt'), 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')));
// v3 文档站的一级目录（英文在根目录，中文在 zh-CN/）：中文页面上指向这些的链接补上 zh-CN/
export const DOCS_V3 = new Set(['', 'core', 'start', 'studio']);
