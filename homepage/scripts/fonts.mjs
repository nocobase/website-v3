// 把西文字体从 Google Fonts 下载到 packages/shared/src/fonts/（官网和文档站共用），页面从本地加载，不再请求 fonts.googleapis.com。
// 中日韩文不用网络字体，用系统字体（苹方、微软雅黑、Hiragino 等，见 site.css 和首页的 --f-sans）：中文字体动辄几 MB，系统字体不用下载。
// 在 homepage/ 下运行：pnpm fonts   已下载的字体文件不会重复下载；改了字体或字重，改 SETS 后重新运行。
// 每组字体生成一个 CSS（packages/shared/src/fonts/<名称>.css），字体文件按 Google 的路径放在 packages/shared/src/fonts/<字体>/<版本>/ 下，保留 Google 按 unicode-range 切好的分片（latin、latin-ext、vietnamese 等），浏览器只下载页面用到的那几片。
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SHARED } from '../src/lib/paths.mjs';

const out = join(SHARED, 'src', 'fonts');
// 所有页面共用 fonts.css；俄语页面另外加载 inter.css（Archivo 没有西里尔字母，见 packages/shared/src/styles/tokens.css）。
// Archivo 只要字重轴：页面没用到宽度轴（font-stretch），带上它文件大一倍多
const SETS = {
  fonts: 'family=Archivo:wght@100..900&family=IBM+Plex+Mono:wght@400;500&display=swap',
  inter: 'family=Inter:wght@400;500;600;700&display=swap',
};
// 用新版 Chrome 的 UA，Google 才返回 woff2 和 unicode-range 分片
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
function save(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

const families = new Set();
for (const [name, query] of Object.entries(SETS)) {
  const src = 'https://fonts.googleapis.com/css2?' + query;
  let css = (await get(src)).toString('utf8');
  const files = [...css.matchAll(/url\(https:\/\/fonts\.gstatic\.com\/s\/([^)]+)\)/g)].map(m => m[1]);
  for (const rel of files) { // <字体>/<版本>/<文件>.woff2
    families.add(rel.split('/')[0]);
    const path = join(out, rel);
    if (!existsSync(path)) save(path, await get('https://fonts.gstatic.com/s/' + rel));
  }
  css = css.replace(/url\(https:\/\/fonts\.gstatic\.com\/s\/([^)]+)\)/g, (m, rel) => `url(${rel})`);
  if (css.includes('gstatic')) throw new Error(name);
  const head = `/* 由 homepage/scripts/fonts.mjs 生成，不要手改。来源：${src}\n   许可：SIL Open Font License 1.1，见各字体目录下的 OFL.txt */\n`;
  save(join(out, name + '.css'), head + css);
  console.log('wrote', name + '.css', css.split('@font-face').length - 1, 'faces');
}
// 字体许可随字体一起分发；Google 的目录名和 google/fonts 仓库 ofl/ 下的目录名一致
for (const f of [...families].sort()) {
  const path = join(out, f, 'OFL.txt');
  if (!existsSync(path)) save(path, await get(`https://raw.githubusercontent.com/google/fonts/main/ofl/${f}/OFL.txt`));
}
console.log('fonts:', [...families].sort().join(', '));
