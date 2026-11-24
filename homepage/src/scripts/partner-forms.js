/* 伙伴页（partner）的「伙伴申请」和寻找伙伴页（find-partner）的「提交需求」：浏览器直接把表单提交到 Customer Portal，不经过 NocoBase 2。
   两个表单与联系页共用线索接口 window.NB_LEADS_ENDPOINT（默认 https://customer.nocobase.com/api/leads/submissions，构建时用环境变量 LEADS_ENDPOINT 换成预览或本地地址），
   用请求体的 form 区分：<form data-partner-form="partnerApplication | findPartner">。字段与取值见 Portal 的 docs/partner-website-intake.md。
   - 字段名就是请求体的字段名；伙伴申请里写了 data-answer 的字段放进 answers（问卷）。选填的文字留空时不发送，多选没有勾选时不发送。
   - language 是页面语言（en-US、zh-CN、zh-TW、ja-JP…）；hp 是对人隐藏的防机器人字段，照常发送，由 Portal 丢弃填了它的提交（伙伴表单的 website 是真实字段）。
   - 国家或地区的选项来自 Portal 的 GET /api/partnerProgram/countries（与线索接口同一个地址前缀），读不到时用 country-codes.js；名称按页面语言显示（Intl.DisplayNames），发送两位代码。
     简体中文页不显示国家或地区，用隐藏字段固定提交 CN（页面里 .zh-only / .en-only 在构建时按语言取舍）；其他语言照常选择，但选项里没有中国大陆（港澳台照常可选）。电话只在简体中文页显示且必填，其他语言不收集。
   - 寻找伙伴的预算随国家切换：中国大陆是人民币档位，其他国家和地区（含港澳台）是美元档位；切换国家时清掉另一种币种的选择。
   - 下拉（data-options）的选项由这里生成，值是 Portal 的选项值，文字写成 T(中文, 英文)，其他语言按 window.NB_STRINGS 换成译文（条目由 pnpm i18n:extract 抽取）。
   - 多选（<select multiple>）换成和单选下拉同样外观的按钮，点开是带勾选框的下拉面板（选项多时带搜索框）；原 select 隐藏但保留，勾选同步到它的 selected。
   - 选填的分区放在 <details class="more"> 里，默认收起；收起时已填的内容照常提交。
   - submissionId：一次提交一个 UUID，重试沿用，成功后清空。201、409（已收到过）都显示感谢；网络错误或 5xx 用同一个 submissionId 自动重试一次；
     400 提示检查填写，429 提示稍后再试，其余显示失败提示。 */
import FALLBACK_COUNTRIES from './country-codes.js';

(function () {
  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-partner-form]'));
  if (!forms.length) return;

  var ENDPOINT = window.NB_LEADS_ENDPOINT || 'https://customer.nocobase.com/api/leads/submissions';
  var COUNTRIES_URL = ENDPOINT.replace(/\/leads\/submissions\/?$/, '/partnerProgram/countries');
  var zh = window.__lang === 'zh';
  var html = document.documentElement.lang || 'en';
  var LOCALE = html === 'en' ? 'en-US' : html;
  var tx = function (en) { return (window.NB_STRINGS && window.NB_STRINGS[en]) || en; };
  var T = function (zhText, en) { return [zhText, en]; };
  var pick = function (zhEn) { return zh ? zhEn[0] : tx(zhEn[1]); };

  /* 选项值与 Portal 一致；文字是官网自己的译文 */
  var OPTIONS = {
    teamSize: [
      ['1-10', T('1–10 人', '1–10 people')],
      ['11-50', T('11–50 人', '11–50 people')],
      ['51-200', T('51–200 人', '51–200 people')],
      ['201-500', T('201–500 人', '201–500 people')],
      ['500+', T('500 人以上', '500+ people')]
    ],
    nocobaseExperience: [
      ['evaluating', T('正在评估', 'Evaluating it')],
      ['learning', T('正在学习', 'Learning it')],
      ['internal_use', T('内部使用', 'Using it internally')],
      ['commercial_use', T('为客户交付过', 'Delivered client projects')],
      ['expert', T('专家，能做二次开发', 'Expert, building extensions')]
    ],
    targetCustomerSizes: [
      ['startups', T('初创企业', 'Startups')],
      ['smb', T('中小企业', 'Small and mid-sized businesses')],
      ['enterprise', T('大型企业', 'Large enterprises')],
      ['individual', T('个人', 'Individuals')]
    ],
    targetIndustries: [
      ['it_software', T('IT 与软件', 'IT and software')],
      ['finance', T('金融', 'Finance')],
      ['education', T('教育', 'Education')],
      ['healthcare', T('医疗健康', 'Healthcare')],
      ['manufacturing', T('制造业', 'Manufacturing')],
      ['retail_ecommerce', T('零售与电商', 'Retail and e-commerce')],
      ['real_estate', T('房地产', 'Real estate')],
      ['government_public', T('政府与公共事业', 'Government and public sector')],
      ['media_entertainment', T('传媒与娱乐', 'Media and entertainment')],
      ['other', T('其他', 'Other')]
    ],
    timeline: [
      ['asap', T('尽快', 'As soon as possible')],
      ['within1Month', T('1 个月内', 'Within 1 month')],
      ['within3Months', T('3 个月内', 'Within 3 months')],
      ['within6Months', T('6 个月内', 'Within 6 months')],
      ['flexible', T('时间灵活', 'Flexible')]
    ],
    serviceTypes: [
      ['solution_delivery', T('方案交付', 'Solution delivery')],
      ['system_implementation', T('系统实施', 'System implementation')],
      ['training_support', T('培训与支持', 'Training and support')],
      ['consulting', T('咨询', 'Consulting')]
    ]
  };
  /* 预算：中国大陆（CN）人民币，其他国家和地区美元；「未定」两边都有 */
  var BUDGET = {
    cny: [
      ['under10k', T('¥1 万以下', 'Under ¥10,000')],
      ['10k_50k', T('¥1–5 万', '¥10,000–50,000')],
      ['50k_200k', T('¥5–20 万', '¥50,000–200,000')],
      ['over200k', T('¥20 万以上', 'Over ¥200,000')],
      ['undecided', T('未定', 'Not decided')]
    ],
    usd: [
      ['usd_under3k', T('$3,000 以下', 'Under $3,000')],
      ['usd_3k_10k', T('$3,000–$10,000', '$3,000–$10,000')],
      ['usd_10k_30k', T('$10,000–$30,000', '$10,000–$30,000')],
      ['usd_over30k', T('$30,000 以上', 'Over $30,000')],
      ['undecided', T('未定', 'Not decided')]
    ]
  };

  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var addOption = function (select, value, text) {
    var o = document.createElement('option');
    o.value = value;
    o.textContent = text;
    select.appendChild(o);
  };

  /* 国家或地区：先读 Portal 的国家表，读不到用后备名单；名称按页面语言 */
  var regionName = (function () {
    try {
      var dn = new Intl.DisplayNames([LOCALE], { type: 'region' });
      return function (c) {
        var n = dn.of(c.code);
        return n && n !== c.code ? n : (zh ? c.nameZh : c.nameEn) || c.code;
      };
    } catch (e) {
      return function (c) { return (zh ? c.nameZh : c.nameEn) || c.code; };
    }
  })();
  var countries = fetch(COUNTRIES_URL, { credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (j) { return j && j.data && j.data.length ? j.data : Promise.reject('empty'); })
    .catch(function () {
      return FALLBACK_COUNTRIES.map(function (c) { return { code: c[0], nameEn: c[1], nameZh: c[2] }; });
    })
    .then(function (list) {
      return list
        .map(function (c) { return { code: c.code, name: regionName(c) }; })
        .sort(function (a, b) { return a.name.localeCompare(b.name, LOCALE); });
    });

  /* 多选下拉：按钮显示已选项（多于两项显示「已选 N 项」），面板里勾选；点外面或按 Esc 收起 */
  var multi = function (select) {
    var box = document.createElement('div');
    box.className = 'ms';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ms-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    var label = select.closest('label');
    if (label) {
      var cap = label.querySelector('span');
      if (cap) {
        cap.id = cap.id || 'ms-' + Math.random().toString(36).slice(2);
        btn.setAttribute('aria-labelledby', cap.id);
      }
    }
    var pop = document.createElement('div');
    pop.className = 'ms-pop';
    pop.hidden = true;
    var search = null;
    if (select.options.length > 15) {
      search = document.createElement('input');
      search.type = 'search';
      search.className = 'ms-search';
      search.placeholder = pick(T('搜索', 'Search'));
      pop.appendChild(search);
    }
    var list = document.createElement('div');
    list.className = 'ms-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-multiselectable', 'true');
    pop.appendChild(list);
    var render = function () {
      var picked = Array.prototype.filter.call(select.options, function (o) { return o.selected; });
      btn.textContent = !picked.length ? pick(T('请选择', 'Select'))
        : picked.length <= 2 ? picked.map(function (o) { return o.textContent; }).join(zh ? '、' : ', ')
        : pick(T('已选 {n} 项', '{n} selected')).replace('{n}', picked.length);
      btn.classList.toggle('empty', !picked.length);
      if (select.required) select.setCustomValidity(picked.length ? '' : pick(T('请至少选择一项', 'Choose at least one')));
    };
    each(select.options, function (o) {
      var lb = document.createElement('label');
      lb.className = 'ms-opt';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = o.value;
      cb.addEventListener('change', function () { o.selected = cb.checked; render(); });
      lb.appendChild(cb);
      lb.appendChild(document.createTextNode(o.textContent));
      list.appendChild(lb);
      o._cb = cb;
    });
    if (search) search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      each(list.children, function (lb) { lb.hidden = !!q && lb.textContent.toLowerCase().indexOf(q) < 0; });
    });
    var open = function (on) {
      pop.hidden = !on;
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      box.classList.toggle('open', on);
      if (on && search) search.focus();
    };
    btn.addEventListener('click', function () { open(pop.hidden); });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) open(false); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { open(false); btn.focus(); } });
    /* 必填的多选：原 select 隐藏后浏览器的校验提示没有落点，提交时把提示挂到按钮上 */
    select.addEventListener('invalid', function () {
      var d = select.closest('details');
      if (d) d.open = true;
      btn.focus();
      box.classList.add('bad');
    });
    select.addEventListener('change', function () { box.classList.remove('bad'); });
    select.classList.add('ms-native');
    select.tabIndex = -1;
    select.parentNode.insertBefore(box, select);
    box.appendChild(btn);
    box.appendChild(pop);
    select._sync = function () {
      each(select.options, function (o) { if (o._cb) o._cb.checked = o.selected; });
      render();
    };
    each(list.querySelectorAll('input'), function (cb) { cb.addEventListener('change', function () { select.dispatchEvent(new Event('change')); }); });
    render();
  };

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

  /* 一次请求：201/409 → 'ok'，网络错误或 5xx → 'retry'，400 → 'invalid'，429 → 'busy'，其他 → 'fail' */
  var post = function (body) {
    return fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (r.status === 201 || r.status === 409) return 'ok';
      if (r.status >= 500) return 'retry';
      if (r.status === 400 || r.status === 413) return 'invalid';
      if (r.status === 429) return 'busy';
      return 'fail';
    }, function () { return 'retry'; });
  };

  /* 国家决定电话是否必填、寻找伙伴的预算币种 */
  var onCountry = function (form) {
    var country = form.querySelector('[name="countryCode"]');
    var cn = country && country.value === 'CN';
    var phone = form.querySelector('input[name="contactPhone"]');
    if (phone) phone.required = cn;
    each(form.querySelectorAll('.phone-opt'), function (el) { el.hidden = cn; });
    var budget = form.querySelector('select[name="budget"]');
    if (!budget) return;
    var cur = budget.value;
    var want = !country || !country.value ? null : cn ? 'cny' : 'usd';
    if (budget.dataset.cur === String(want)) return;
    budget.dataset.cur = String(want);
    budget.innerHTML = '';
    addOption(budget, '', want ? pick(T('请选择', 'Select')) : pick(T('请先选择国家或地区', 'Choose a country or region first')));
    budget.disabled = !want;
    if (!want) return;
    BUDGET[want].forEach(function (it) { addOption(budget, it[0], pick(it[1])); });
    if (cur && BUDGET[want].some(function (it) { return it[0] === cur; })) budget.value = cur;
  };

  var setup = function (form) {
    each(form.querySelectorAll('[data-ph-zh]'), function (el) {
      el.placeholder = pick([el.getAttribute('data-ph-zh') || '', el.getAttribute('data-ph-en') || '']);
    });
    each(form.querySelectorAll('select[data-options]'), function (select) {
      var kind = select.getAttribute('data-options');
      if (!select.multiple) addOption(select, '', pick(T('请选择', 'Select')));
      (OPTIONS[kind] || []).forEach(function (it) { addOption(select, it[0], pick(it[1])); });
    });
    var ready = countries.then(function (list) {
      each(form.querySelectorAll('select[data-countries]'), function (select) {
        if (!select.multiple) addOption(select, '', pick(T('请选择', 'Select')));
        /* 中国大陆只走简体中文页（那里不显示国家，固定提交 CN）；其他语言页的国家或地区不提供中国大陆，服务区域照常可选 */
        list.forEach(function (c) { if (select.multiple || c.code !== 'CN') addOption(select, c.code, c.name); });
      });
    });
    var country = form.querySelector('select[name="countryCode"]');
    if (country) country.addEventListener('change', function () { onCountry(form); });
    return ready.then(function () {
      each(form.querySelectorAll('select[multiple]'), multi);
      onCountry(form);
    });
  };

  var collect = function (form) {
    var kind = form.getAttribute('data-partner-form');
    var body = { form: kind, language: LOCALE, pageUrl: location.href.split('#')[0] };
    var answers = {};
    each(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      var to = el.hasAttribute('data-answer') ? answers : body;
      if (el.type === 'select-multiple') {
        var vs = Array.prototype.map.call(el.selectedOptions, function (o) { return o.value; });
        if (vs.length) to[el.name] = vs;
        return;
      }
      var v = String(el.value).trim();
      if (el.name === 'hp') { body.hp = v; return; }
      if (v) to[el.name] = v;
    });
    if (kind === 'partnerApplication') body.answers = answers;
    return body;
  };

  forms.forEach(function (form) {
    setup(form);
    var submissionId = null;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        /* 第一个不合格的字段在收起的分区里时先展开，再显示浏览器的提示 */
        var bad = form.querySelector(':invalid:not(fieldset)');
        var d = bad && bad.closest('details');
        if (d) d.open = true;
        form.reportValidity();
        return;
      }
      var body = collect(form);
      submissionId = submissionId || uuid();
      body.submissionId = submissionId;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      say(form, 'busy', T('正在提交…', 'Submitting…'));
      post(body)
        .then(function (res) { return res === 'retry' ? post(body) : res; })
        .then(function (res) {
          var mail = form.getAttribute('data-mail') || 'partner@nocobase.com';
          if (res === 'ok') {
            submissionId = null;
            form.reset();
            each(form.querySelectorAll('select[multiple]'), function (s) { if (s._sync) s._sync(); });
            onCountry(form);
            say(form, 'ok', [form.getAttribute('data-ok-zh'), form.getAttribute('data-ok-en')]);
          } else if (res === 'invalid') {
            say(form, 'error', T('有内容没能通过校验，请检查后再提交，或发邮件到 {mail}。', 'Some answers could not be accepted. Please check them and try again, or email {mail}.'), mail);
          } else if (res === 'busy') {
            say(form, 'error', T('提交得太频繁了，请过几分钟再试。', 'Too many submissions. Please try again in a few minutes.'));
          } else {
            say(form, 'error', T('提交没有成功，请稍后再试，或发邮件到 {mail}。', 'Something went wrong. Please try again, or email {mail}.'), mail);
          }
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
})();
