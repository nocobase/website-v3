// Directories of the website: html/src holds the sources, html/dist the generated site (not committed).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HTML = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const SRC = process.env.SITE_SRC_DIR ? resolve(process.env.SITE_SRC_DIR) : join(HTML, 'src');
export const REPO = resolve(HTML, '..');
export const DIST = process.env.SITE_OUT_DIR ? resolve(process.env.SITE_OUT_DIR) : join(HTML, 'dist');
