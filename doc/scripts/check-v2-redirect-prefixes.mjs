#!/usr/bin/env node
// 检查产物根目录有没有和 v2 旧地址同名的条目。docs.nocobase.com 的 CDN 会把 v2-redirect-prefixes.txt 里的一级路径
// 301 到 nocode.docs.nocobase.com，产物里如果有同名的目录（或不带扩展名的文件），它下面的页面线上永远打不开。
// CDN 按整个路径段匹配：目录 guide/ 和文件 guide 算冲突，guide.html 不算。
// build.mjs 生成完文档站后会调用它，冲突时构建失败，CI 也就不会发布；也可以单独运行：
//   node doc/scripts/check-v2-redirect-prefixes.mjs [产物目录，默认 doc/dist]
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));

export function readPrefixes(file = join(dir, 'v2-redirect-prefixes.txt')) {
  const prefixes = readFileSync(file, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
  const invalid = prefixes.filter((prefix) => !/^[A-Za-z0-9._-]+$/.test(prefix));
  if (invalid.length) throw new Error(`v2-redirect-prefixes.txt 里每行只能是一个路径段：${invalid.join('、')}`);
  if (!prefixes.length) throw new Error('v2-redirect-prefixes.txt 是空的');
  return new Set(prefixes);
}

// 返回和黑名单同名的顶层条目，目录带结尾的 /
export function findV2RedirectConflicts(outDir, prefixes = readPrefixes()) {
  return readdirSync(outDir, { withFileTypes: true })
    .filter((entry) => prefixes.has(entry.name))
    .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
    .sort();
}

export function assertNoV2RedirectConflicts(outDir) {
  const conflicts = findV2RedirectConflicts(outDir);
  if (conflicts.length) {
    throw new Error(`产物根目录有 ${conflicts.length} 个条目和 v2 旧地址同名，docs.nocobase.com 会把它们 301 到 nocode.docs.nocobase.com：${conflicts.join('、')}。换一个名字；确实要用的话，从 doc/scripts/v2-redirect-prefixes.txt 和 CDN 的 EdgeScript 规则 v2_paths_to_nocode_301 里同时去掉它。`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = resolve(process.argv[2] || join(dir, '../dist'));
  assertNoV2RedirectConflicts(outDir);
  console.log(`没有和 v2 旧地址同名的顶层条目（检查了 ${readPrefixes().size} 个路径段）：${outDir}`);
}
