// 官网的语言、站点地址和文档站的约定。语言表在 packages/shared/src/languages.mjs，和文档站共用。
import { readV2RedirectPrefixes } from '@nocobase/site-shared/config';
import { ALL } from '@nocobase/site-shared/languages';

export { ALL, BY_CODE, LANGS } from '@nocobase/site-shared/languages';

export const ORIGIN = (process.env.SITE_ORIGIN || 'https://www.nocobase.com').replace(/\/+$/, '');
export const ZH_EN = ['en', 'zh'];
// 中文、英文以外的语言，译文在 content/i18n/<组>.<语言>.yaml
export const TRANSLATED = ALL.filter(c => c !== 'en' && c !== 'zh');

// docs.nocobase.com 上 301 到 v2 文档 nocode.docs.nocobase.com 的一级路径（和文档站共用一份名单，在 packages/shared/v2-redirect-prefixes.txt）
export const V2_DOC_PREFIXES = readV2RedirectPrefixes();
// v3 文档站的一级目录（英文在根目录，中文在 zh-CN/）：中文页面上指向这些的链接补上 zh-CN/
export const DOCS_V3 = new Set(['', 'core', 'start', 'studio']);
