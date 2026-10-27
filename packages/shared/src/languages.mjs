// 12 种语言的表：官网和文档站共用。
// code：源文件、译文文件和页面脚本里的 window.__lang 用的语言代码；dir：地址里的目录（英文在根目录，没有 /en/）；html：<html lang> 和 hreflang；name：语言菜单里的名字。
// 顺序就是语言菜单的顺序；目录名和 NocoBase 3 插件的语言文件同名。
const L = (code, dir, name) => ({ code, dir, html: dir || 'en', name });
export const LANGS = [L('en', '', 'English'), L('es', 'es-ES', 'Español'), L('fr', 'fr-FR', 'Français'), L('de', 'de-DE', 'Deutsch'),
  L('pt', 'pt-BR', 'Português'), L('ru', 'ru-RU', 'Русский'), L('id', 'id-ID', 'Bahasa Indonesia'), L('vi', 'vi-VN', 'Tiếng Việt'),
  L('zh', 'zh-CN', '简体中文'), L('zh-TW', 'zh-TW', '繁體中文'), L('ja', 'ja-JP', '日本語'), L('ko', 'ko-KR', '한국어')];
export const BY_CODE = Object.fromEntries(LANGS.map(l => [l.code, l]));
export const ALL = LANGS.map(l => l.code);
export const DEFAULT_LANG = 'en';
// Astro i18n / sitemap 用：{ 目录或 en: hreflang }，英文在根目录
export const LOCALE_CODES = Object.fromEntries(LANGS.map(l => [l.dir || 'en', l.html]));
export const DIRS = LANGS.filter(l => l.dir).map(l => l.dir);
