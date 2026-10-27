/* 官网子页面共用的交互：图纸缩放、Core 图的联动、竖排标签、联系和伙伴页的表单。首页有自己的脚本，不加载它。
   导航、页脚和语言菜单由 Astro 在构建时写进每个页面（手机菜单和语言下拉框的交互在 packages/shared/src/shell.js），每种语言是一个单独的页面，这里不再切换语言。 */
import './lucide.js';

if (document.querySelector('form[data-public-form-zh][data-public-form-en]')) import('./public-form.js');

(function () {
  var $ = function (id) { return document.getElementById(id); };
  /* 手机上（视口窄于 640px）界面图最小按 PAN_MIN 倍显示，字不会小到看不清；超出屏幕的部分左右滑动查看。
     初始位置停在界面主体：有 data-focus（设计稿横坐标）就用它，否则跳过最左侧的导航栏 */
  var PAN_MIN = 0.72;
  function panHint(box, on) {
    var h = box.nextElementSibling;
    if (!h || !h.classList.contains('pan-hint')) {
      if (!on) return;
      h = document.createElement('p');
      h.className = 'pan-hint';
      h.innerHTML = '<i data-lucide="move-horizontal"></i><t-zh>左右滑动查看完整界面</t-zh><t-en>Swipe to see the full screen</t-en>';
      box.after(h);
      if (window.lucide) lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    }
    h.hidden = !on;
  }
  function fit() {
    var narrow = window.innerWidth < 640;
    var capH = Math.max(480, Math.min(640, window.innerHeight - 150));
    document.querySelectorAll('.fit').forEach(function (box) {
      var inner = box.querySelector('.fit-in'), w = +box.dataset.w;
      var clip = inner.parentNode !== box ? inner.parentNode : null;
      inner.style.width = w + 'px';
      /* 可滑动时容器向两侧多出的宽度正好是内边距，减掉后就是版心宽度 */
      var cs = getComputedStyle(box);
      var s = (box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / w;
      /* 台面去掉了留白，图纸里的图和首页一样按容器宽度等比缩放（可放大）；其他地方的图只缩小不放大 */
      if (!box.hasAttribute('data-up') && !box.closest('.sheet')) s = Math.min(1, s);
      var pan = narrow && s < PAN_MIN;
      if (pan) s = PAN_MIN;
      /* 桌面上图纸里的大图不超过一屏：高度超过 640px 或「窗口高度 − 导航与留白」时等比缩小，水平居中 */
      var ih = inner.offsetHeight, capped = false;
      if (!narrow && box.closest('.sheet') && ih * s > capH) { s = capH / ih; capped = true; }
      inner.style.marginLeft = capped ? Math.floor((box.clientWidth - w * s) / 2) + 'px' : '';
      box.classList.toggle('pan', pan);
      if (pan && !clip) { clip = document.createElement('div'); clip.className = 'fit-clip'; box.insertBefore(clip, inner); clip.appendChild(inner); }
      if (!pan && clip) { box.insertBefore(inner, clip); clip.remove(); clip = null; }
      inner.style.transform = s !== 1 ? 'scale(' + s + ')' : '';
      var h = Math.ceil(inner.offsetHeight * s);
      if (clip) { clip.style.width = Math.ceil(w * s) + 'px'; clip.style.height = h + 24 + 'px'; }
      box.style.height = h + (pan ? 24 : 0) + 'px';
      if (pan && !box.dataset.panned) {
        var side = inner.querySelector('.sb, .sx-side');
        var f = box.dataset.focus ? +box.dataset.focus : (side && side.getBoundingClientRect().left - inner.getBoundingClientRect().left < 4 ? side.offsetWidth : 0);
        box.scrollLeft = f * s;
        box.dataset.panned = '1';
      }
      panHint(box, pan);
    });
  }
  /* Core 图：悬停或聚焦业务模块时，点亮它用到的底座能力 */
  function coreHot(mod) {
    var fig = mod && mod.closest('.cx');
    document.querySelectorAll('.cx').forEach(function (c) {
      var keys = c === fig ? mod.dataset.caps.split(' ') : [];
      c.classList.toggle('hot', c === fig);
      c.querySelectorAll('.cx-mod').forEach(function (n) { n.classList.toggle('on', n === mod); });
      c.querySelectorAll('.caps [data-cap]').forEach(function (n) { n.classList.toggle('on', keys.indexOf(n.dataset.cap) >= 0); });
    });
  }
  document.addEventListener('mouseover', function (e) { var m = e.target.closest && e.target.closest('.cx-mod'); if (m) coreHot(m); else if (e.target.closest && !e.target.closest('.cx')) coreHot(null); });
  document.addEventListener('focusin', function (e) { var m = e.target.closest && e.target.closest('.cx-mod'); coreHot(m || null); });
  /* 竖排标签（Solution 页的应用列表）：左侧选一项，右侧换成它的图；各图叠在同一格里，切换时页面高度不变 */
  document.querySelectorAll('.vtabs').forEach(function (box) {
    var tabs = [].slice.call(box.querySelectorAll('.apptab'));
    function show(i, focus) {
      tabs.forEach(function (b, j) {
        var on = j === i;
        b.parentNode.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
        var pane = document.getElementById(b.getAttribute('aria-controls'));
        pane.classList.toggle('on', on);
        pane.setAttribute('aria-hidden', String(!on));
      });
    }
    box.addEventListener('click', function (e) { var b = e.target.closest('.apptab'); if (b) show(tabs.indexOf(b)); });
    box.addEventListener('keydown', function (e) {
      var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      var b = e.target.closest && e.target.closest('.apptab');
      if (!d || !b) return;
      e.preventDefault();
      show((tabs.indexOf(b) + d + tabs.length) % tabs.length, true);
    });
  });
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
