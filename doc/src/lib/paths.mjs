// The docs directories: content/ (pages and menus), figures/ (figure fragments), dist/ (the generated site, not committed).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Astro bundles the page code into dist/.prerender/ before running it, and import.meta.url no longer points at src/lib then: astro.config loads this file at its real location and keeps the directory in an environment variable that the bundled code reads.
export const DOC_ROOT = process.env.NB_DOC_DIR ?? (process.env.NB_DOC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..'));
export const CONTENT_DIR = join(DOC_ROOT, 'content');
export const FIGURES_DIR = join(DOC_ROOT, 'figures');
export const REPO_ROOT = resolve(DOC_ROOT, '..');
// DOCS_OUT_DIR overrides the output directory (the CDN contract is doc/dist, which CI uploads)
export const DIST = process.env.DOCS_OUT_DIR ? resolve(process.env.DOCS_OUT_DIR) : join(DOC_ROOT, 'dist');
