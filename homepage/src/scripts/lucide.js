// 图标：页面里写 <i data-lucide="名称"></i>，这里把它们换成 SVG。用 npm 上的 lucide 包（版本和以前随站点分发的 0.460.0 一致，图标不变），
// 同时挂到 window.lucide，首页脚本和 site.js 里动态生成的图标要调 lucide.createIcons()。
import { createIcons, icons } from 'lucide';

window.lucide = { createIcons: opts => createIcons({ icons, ...opts }) };
window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
