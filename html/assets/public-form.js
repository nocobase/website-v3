/* 把页面里的表单提交到 NocoBase 2 的公开表单。
   表单上写 data-public-form-zh / data-public-form-en，值为「实例地址|表单 key」：中文页提交到前者，其他语言提交到后者。
   流程与公开表单页面相同：先用 publicForms:getMeta 换取一小时有效的 token，再带 X-Form-Token 调用 <数据表>:publicSubmit。
   只在当前语言显示的字段放在 data-lang-only="zh|en" 的元素里，另一种语言下会被禁用，不参与校验和提交。 */
(function () {
  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-public-form-zh][data-public-form-en]'));
  if (!forms.length) return;

  var lang = function () { return document.documentElement.lang === 'zh' ? 'zh' : 'en'; };
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
  var say = function (form, state, zh, en) {
    var box = form.querySelector('.form-msg');
    if (!box) return;
    box.hidden = false;
    box.dataset.state = state;
    box.innerHTML = '<t-zh>' + zh + '</t-zh><t-en>' + en + '</t-en>';
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

  var sync = function (form) {
    var l = lang();
    form.querySelectorAll('[data-lang-only]').forEach(function (el) {
      var on = el.getAttribute('data-lang-only') === l;
      el.querySelectorAll('input, select, textarea').forEach(function (i) { i.disabled = !on; });
    });
    form.querySelectorAll('[data-ph-zh]').forEach(function (el) {
      el.placeholder = el.getAttribute('data-ph-' + l) || '';
    });
    if (l === 'en') loadCountries(form);
  };

  forms.forEach(function (form) {
    form.removeAttribute('onsubmit');
    sync(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = {};
      new FormData(form).forEach(function (v, k) {
        v = String(v).trim();
        if (v) data[k] = v;
      });
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      say(form, 'busy', '正在提交…', 'Submitting…');
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
          say(form, 'ok', form.getAttribute('data-ok-zh') || '已收到你的需求，我们会尽快与你联系。', form.getAttribute('data-ok-en') || 'Thanks! We’ve received your request and will be in touch soon.');
        })
        .catch(function () {
          say(form, 'error', '提交没有成功，请稍后再试，或写信到 partner@nocobase.com。', 'Something went wrong. Please try again, or email partner@nocobase.com.');
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });

  new MutationObserver(function () { forms.forEach(sync); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
