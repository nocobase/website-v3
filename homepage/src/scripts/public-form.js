/* 把页面里的表单提交到 NocoBase 2 的公开表单。
   表单上写 data-public-form-zh / data-public-form-en，值为「实例地址|表单 key」：中文页提交到前者，其他语言提交到后者。
   流程与公开表单页面相同：先用 publicForms:getMeta 换取一小时有效的 token，再带 X-Form-Token 调用 <数据表>:publicSubmit。
   只在当前语言显示的字段放在 data-lang-only="zh|en" 的元素里，另一种语言下会被禁用，不参与校验和提交。
   两种语言字段名不同时，在字段上写 data-name-zh / data-name-en。
   选项来自 NocoBase 2 的字段：<select data-options="enum" data-field="字段名"> 生成下拉选项，<fieldset class="opts" data-options="enum" data-field="字段名"> 生成多选；
   多选的 fieldset 加 data-required 表示至少选一项。
   每种语言是一个单独生成的页面，window.__lang 是本页语言（zh、en、de……）。简体中文页提交到中文表单，其他语言（含繁体中文）提交到英文表单。
   中文、英文以外的语言：表单上 data-ph-en / data-text-en / data-ok-en 的英文在构建时已经换成译文；这里 T(中文, 英文) 里的提示语和下拉、多选的选项（来自英文表单），
   按构建（scripts/build.mjs）内联在页面里的 window.NB_STRINGS（以英文原文为键）换成译文（tx），缺的显示英文。条目由 pnpm i18n:extract 抽取。国家列表保持英文。 */
(function () {
  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-public-form-zh][data-public-form-en]'));
  if (!forms.length) return;

  var lang = function () { return window.__lang === 'zh' ? 'zh' : 'en'; };
  var tx = function (en) { return (window.NB_STRINGS && window.NB_STRINGS[en]) || en; };
  var T = function (zh, en) { return [zh, en]; };
  var pick = function (zhEn) { return lang() === 'zh' ? zhEn[0] : tx(zhEn[1]); };
  var target = function (form) {
    var v = form.getAttribute('data-public-form-' + lang()).split('|');
    return { host: v[0], key: v[1] };
  };
  var getMeta = function (t) {
    return fetch(t.host + '/api/publicForms:getMeta?filterByTk=' + encodeURIComponent(t.key), { credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.data || !j.data.token) throw new Error('form unavailable');
        return j.data;
      });
  };
  var say = function (form, state, msg, mail) {
    var box = form.querySelector('.form-msg');
    if (!box) return;
    var fill = function (s) { return s.replace('{mail}', mail || ''); };
    box.hidden = false;
    box.dataset.state = state;
    box.textContent = lang() === 'zh' ? fill(msg[0]) : fill(tx(msg[1]));
  };

  /* 国家列表取自英文表单关联的 countries_and_regions，与 NocoBase 2 后台保持一致 */
  var loadCountries = function (form) {
    var select = form.querySelector('select[data-options="countries"]');
    if (!select || select.dataset.loaded) return;
    select.dataset.loaded = 'loading';
    var t = { host: form.getAttribute('data-public-form-en').split('|')[0], key: form.getAttribute('data-public-form-en').split('|')[1] };
    getMeta(t)
      .then(function (meta) {
        return fetch(t.host + '/api/countries_and_regions:list?pageSize=500&sort=name', {
          credentials: 'omit',
          headers: { 'X-Form-Token': meta.token }
        }).then(function (r) { return r.json(); });
      })
      .then(function (j) {
        (j.data || []).forEach(function (c) {
          var o = document.createElement('option');
          o.value = c.country;
          o.textContent = c.name;
          select.appendChild(o);
        });
        select.dataset.loaded = '1';
      })
      .catch(function () { delete select.dataset.loaded; });
  };

  /* 下拉和多选的选项按当前语言取自对应表单的字段定义，中英文的选项不完全相同 */
  var loadEnums = function (form) {
    var boxes = form.querySelectorAll('[data-options="enum"]');
    if (!boxes.length) return;
    var l = lang();
    form._meta = form._meta || {};
    var meta = form._meta[l] || (form._meta[l] = getMeta(target(form)));
    meta.then(function (m) {
      if (lang() !== l) return;
      var fields = m.dataSource.collections[0].fields;
      boxes.forEach(function (box) {
        var name = box.getAttribute('data-field');
        var f = fields.filter(function (x) { return x.name === name; })[0];
        var items = (f && f.uiSchema && f.uiSchema.enum) || [];
        box.querySelectorAll('.opt').forEach(function (o) { o.remove(); });
        items.forEach(function (it) {
          if (box.tagName === 'SELECT') {
            var o = document.createElement('option');
            o.className = 'opt';
            o.value = it.value;
            o.textContent = l === 'zh' ? it.label : tx(it.label);
            box.appendChild(o);
          } else {
            var lb = document.createElement('label');
            lb.className = 'opt';
            var i = document.createElement('input');
            i.type = 'checkbox';
            i.name = name;
            i.value = it.value;
            lb.appendChild(i);
            lb.appendChild(document.createTextNode(l === 'zh' ? it.label : tx(it.label)));
            box.appendChild(lb);
          }
        });
      });
    }).catch(function () { delete form._meta[l]; });
  };

  var sync = function (form) {
    var l = lang();
    form.querySelectorAll('[data-lang-only]').forEach(function (el) {
      var on = el.getAttribute('data-lang-only') === l;
      el.querySelectorAll('input, select, textarea').forEach(function (i) { i.disabled = !on; });
    });
    form.querySelectorAll('[data-ph-zh]').forEach(function (el) {
      el.placeholder = pick([el.getAttribute('data-ph-zh') || '', el.getAttribute('data-ph-en') || '']);
    });
    form.querySelectorAll('[data-text-zh]').forEach(function (el) {
      el.textContent = pick([el.getAttribute('data-text-zh') || '', el.getAttribute('data-text-en') || '']);
    });
    if (l === 'en') loadCountries(form);
    loadEnums(form);
  };

  forms.forEach(function (form) {
    form.removeAttribute('onsubmit');
    sync(form);
    form.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox') e.target.closest('fieldset').querySelectorAll('input').forEach(function (i) { i.setCustomValidity(''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.querySelectorAll('fieldset[data-required]').forEach(function (fs) {
        var first = fs.querySelector('input[type="checkbox"]');
        if (first) first.setCustomValidity(fs.querySelector('input:checked') ? '' : pick(T('请至少选择一项', 'Please choose at least one option')));
      });
      if (!form.reportValidity()) return;
      var data = {};
      var l = lang();
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.disabled) return;
        var k = el.getAttribute('data-name-' + l) || el.name;
        if (el.type === 'checkbox') {
          if (el.checked) (data[k] = data[k] || []).push(el.value);
          return;
        }
        var v = String(el.value).trim();
        if (v) data[k] = v;
      });
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      say(form, 'busy', T('正在提交…', 'Submitting…'));
      var t = target(form);
      getMeta(t)
        .then(function (meta) {
          var collection = meta.dataSource.collections[0].name;
          return fetch(t.host + '/api/' + collection + ':publicSubmit', {
            method: 'POST',
            credentials: 'omit',
            headers: { 'Content-Type': 'application/json', 'X-Form-Token': meta.token },
            body: JSON.stringify(data)
          });
        })
        .then(function (r) {
          if (!r.ok) throw new Error('submit failed: ' + r.status);
          form.reset();
          var ok = T('已收到你的需求，我们会尽快与你联系。', 'Thanks! We’ve received your request and will be in touch soon.');
          say(form, 'ok', [form.getAttribute('data-ok-zh') || ok[0], form.getAttribute('data-ok-en') || ok[1]]);
        })
        .catch(function () {
          var mail = form.getAttribute('data-mail') || 'partner@nocobase.com';
          say(form, 'error', T('提交没有成功，请稍后再试，或写信到 {mail}。', 'Something went wrong. Please try again, or email {mail}.'), mail);
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });

})();
