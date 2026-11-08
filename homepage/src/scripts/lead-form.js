/* 联系页的表单：浏览器直接把线索提交到 Customer Portal（POST <地址>，JSON，不带 Cookie），不经过 NocoBase 2。
   地址在构建时写进页面（window.NB_LEADS_ENDPOINT，默认 https://customer.nocobase.com/api/leads/submissions，环境变量 LEADS_ENDPOINT 可换成预览或本地地址）。
   简体中文页 language 为 zh（必填电话），其他语言页为 en（必填邮箱）。只在一种语言下使用的字段放在 data-lang-only="zh|en" 的元素里，另一种语言下被禁用，不参与校验和提交。
   字段名就是请求体的字段名；勾选框按 name 汇成数组（intents），值是选项文字（中文页中文，其他语言英文）。website 是对人隐藏的蜜罐字段，照常发送，由 Portal 丢弃填了它的提交。
   submissionId：一次提交一个 UUID，重试沿用，成功后清空。结果：201、409（同一 submissionId 已收到）都算成功；网络错误或 5xx 用同一个 submissionId 自动重试一次；其余（含 429）显示失败提示。
   T(中文, 英文) 的提示语与 public-form.js 共用，其他语言按 window.NB_STRINGS 换成译文（条目由 pnpm i18n:extract 从两个脚本抽取）。 */
import COUNTRIES from './countries.js';

(function () {
  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-lead-form]'));
  if (!forms.length) return;

  var ENDPOINT = window.NB_LEADS_ENDPOINT || 'https://customer.nocobase.com/api/leads/submissions';
  var lang = function () { return window.__lang === 'zh' ? 'zh' : 'en'; };
  var tx = function (en) { return (window.NB_STRINGS && window.NB_STRINGS[en]) || en; };
  var T = function (zh, en) { return [zh, en]; };
  var pick = function (zhEn) { return lang() === 'zh' ? zhEn[0] : tx(zhEn[1]); };
  var uuid = function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15);
      return (c === 'x' ? r : (r & 3) | 8).toString(16);
    });
  };
  var say = function (form, state, msg, mail) {
    var box = form.querySelector('.form-msg');
    if (!box) return;
    box.hidden = false;
    box.dataset.state = state;
    box.textContent = pick(msg).replace('{mail}', mail || '');
  };

  /* 一次请求：201/409 → 'ok'，网络错误或 5xx → 'retry'，其他 → 'fail' */
  var post = function (body) {
    return fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (r.status === 201 || r.status === 409) return 'ok';
      return r.status >= 500 ? 'retry' : 'fail';
    }, function () { return 'retry'; });
  };

  var setup = function (form) {
    var l = lang();
    form.querySelectorAll('[data-lang-only]').forEach(function (el) {
      var on = el.getAttribute('data-lang-only') === l;
      if (el.tagName === 'FIELDSET') el.disabled = !on;
      el.querySelectorAll('input, select, textarea').forEach(function (i) { i.disabled = !on; });
    });
    form.querySelectorAll('select[data-options="countries"]').forEach(function (select) {
      COUNTRIES.forEach(function (name) {
        var o = document.createElement('option');
        o.value = name;
        o.textContent = name;
        select.appendChild(o);
      });
    });
  };

  forms.forEach(function (form) {
    setup(form);
    var submissionId = null;
    form.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox') e.target.closest('fieldset').querySelectorAll('input').forEach(function (i) { i.setCustomValidity(''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.querySelectorAll('fieldset[data-required]:not(:disabled)').forEach(function (fs) {
        var first = fs.querySelector('input[type="checkbox"]');
        if (first) first.setCustomValidity(fs.querySelector('input:checked') ? '' : pick(T('请至少选择一项', 'Please choose at least one option')));
      });
      if (!form.reportValidity()) return;
      var body = { language: lang() };
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.disabled) return;
        if (el.type === 'checkbox') {
          body[el.name] = body[el.name] || [];
          if (el.checked) body[el.name].push(el.value);
          return;
        }
        var v = String(el.value).trim();
        if (v || el.name === 'website') body[el.name] = v;
      });
      body.pageUrl = location.href;
      submissionId = submissionId || uuid();
      body.submissionId = submissionId;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      say(form, 'busy', T('正在提交…', 'Submitting…'));
      post(body)
        .then(function (res) { return res === 'retry' ? post(body) : res; })
        .then(function (res) {
          if (res === 'ok') {
            submissionId = null;
            form.reset();
            var ok = T('已收到你的需求，我们会尽快与你联系。', 'Thanks! We’ve received your request and will be in touch soon.');
            say(form, 'ok', [form.getAttribute('data-ok-zh') || ok[0], form.getAttribute('data-ok-en') || ok[1]]);
          } else {
            var mail = form.getAttribute('data-mail') || 'hello@nocobase.com';
            say(form, 'error', T('提交没有成功，请稍后再试，或写信到 {mail}。', 'Something went wrong. Please try again, or email {mail}.'), mail);
          }
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
})();
