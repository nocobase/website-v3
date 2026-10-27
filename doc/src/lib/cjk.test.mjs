import { expect, test } from 'vitest';
import { cjkQueries, hasCjk, spaceCjk, spaceCjkHtml, unspaceCjk } from './cjk.mjs';

const visible = text => text.replaceAll(' ', '_');

test('CJK characters are separated, Latin words are kept whole', () => {
  expect(visible(spaceCjk('创建插件'))).toBe('_创__建__插__件_');
  expect(visible(spaceCjk('使用 Docker 部署'))).toBe('_使__用_ Docker _部__署_');
  expect(spaceCjk('Deploy with Docker')).toBe('Deploy with Docker');
  expect(hasCjk('Core 是什么')).toBe(true);
  expect(hasCjk('ServiceProvider')).toBe(false);
});

test('only the text inside data-pagefind-body is spaced, and blocks without punctuation get a full stop', () => {
  const html = '<title>创建插件</title><main data-pagefind-body><h1 class="t">创建插件</h1><p>本地插件可以随 App 构建。</p><script>const a = "插件";</script></main>';
  const out = visible(spaceCjkHtml(html));
  expect(out.startsWith('<title>创建插件</title>')).toBe(true);
  expect(out).toContain('<h1 class="t">_创__建__插__件__。_</h1>');
  expect(out).toContain('<p>_本__地__插__件__可__以__随_ App _构__建__。_</p>');
  expect(out).toContain('const a = "插件";');
  expect(spaceCjkHtml('<p>没有可索引的正文</p>')).toBe('<p>没有可索引的正文</p>');
});

test('excerpts are shown without the spaces between characters, keeping the spaces next to Latin text', () => {
  expect(unspaceCjk('， 先 阅 读 ， 再 按 <mark>创 建 插 件 </mark>在 当 前 App 中 生 成')).toBe('，先阅读，再按<mark>创建插件</mark>在当前 App 中生成');
  expect(unspaceCjk('<mark>使 用 Docker 部 署 </mark>。 PM2 （ app-installer ）')).toBe('<mark>使用 Docker 部署</mark>。PM2（app-installer）');
  expect(unspaceCjk('“ 报 表 时 区 ” 的 <mark>数</mark> <mark>据</mark> <mark>表</mark>')).toBe('“报表时区”的<mark>数据表</mark>');
});

test('a query is searched as an exact phrase first, then as all of its characters', () => {
  expect(cjkQueries('什么是 Core')).toEqual(['"什 么 是 Core"', '什 么 是 Core']);
  expect(cjkQueries('"创建插件"')).toEqual(['"创 建 插 件"', '创 建 插 件']);
});
