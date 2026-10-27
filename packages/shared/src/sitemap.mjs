// @astrojs/sitemap 的 serialize() 和 filter()：给每个地址的 hreflang 列表加上 x-default（指向默认语言的版本），并把 noindex 的页面挡在 sitemap 外。
// 用法（astro.config）：sitemap({ i18n, serialize: xDefaultSerializer({ origin, dirs }), filter: noindexFilter(urls) })

const stripTrailing = p => p.replace(/\/+$/, '');

// 一个地址属于默认语言（不在任何语言目录下）吗
const isDefaultLocaleUrl = (url, dirs) => {
  const first = new URL(url).pathname.split('/').filter(Boolean)[0];
  return !(first && dirs.includes(first));
};

/**
 * 返回 serialize(item)：item.links 是 @astrojs/sitemap 按 i18n 配置找到的这个页面在各语言的地址 [{ url, lang }]。
 * 加上 { lang: 'x-default', url: 默认语言那条 }；页面只有默认语言一个版本时 sitemap 不给 links，这里补上它自己和 x-default。
 * @param {{ dirs: string[], defaultLang?: string }} options dirs：非默认语言的地址目录（zh-CN、ja-JP……）
 */
export function xDefaultSerializer({ dirs, defaultLang = 'en' }) {
  return item => {
    const links = [...(item.links || [])];
    if (links.some(l => l.lang === 'x-default')) return item;
    let target = links.find(l => l.lang === defaultLang)?.url;
    if (!target && !links.length && isDefaultLocaleUrl(item.url, dirs)) {
      target = item.url;
      links.push({ url: item.url, lang: defaultLang });
    }
    if (!target) return { ...item, links: links.length ? links : undefined };
    links.push({ url: target, lang: 'x-default' });
    return { ...item, links };
  };
}

/**
 * 返回 filter(url)：noindexPaths 是不进 sitemap 的页面地址（以 / 开头，如 /404.html、/zh-CN/secret/），比较时忽略结尾的 /。
 */
export function noindexFilter(noindexPaths) {
  const bad = new Set(noindexPaths.map(stripTrailing));
  return url => !bad.has(stripTrailing(new URL(url).pathname));
}
