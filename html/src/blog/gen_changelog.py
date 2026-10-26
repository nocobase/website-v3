# 从 releases.json（cms_import.mjs 生成）生成更新日志：列表页 changelog.html 和每个版本的详情页 changelog/*.html，交给 pages/wrap.py 套上共用 head。
# 只有 v3 的版本（筛选在 cms_import.mjs），按 Milestone / Latest / Beta / Alpha 筛选；有博客详情页的版本直接链到博客文章。
# v2 及更早的版本在旧官网的更新日志里，页面顶部有链接。
import json, re, os, subprocess, html, sys, glob
here = os.path.dirname(os.path.abspath(__file__))
site = sys.argv[1]
releases = json.load(open(os.path.join(here, 'releases.json'), encoding='utf-8'))
wrap = os.path.join(here, '..', 'pages', 'wrap.py')
tmp = os.path.join(here, 'out'); os.makedirs(tmp, exist_ok=True)
# 先清掉上次生成的详情页，CMS 里取消发布的版本才会消失
for f in glob.glob(os.path.join(site, 'changelog', '*.html')): os.remove(f)
V2 = 'https://nocode.nocobase.com/{lang}/blog/timeline'
T = lambda zh, en: f'<t-zh>{zh}</t-zh><t-en>{en}</t-en>'
esc = lambda s: html.escape(s, quote=False)
order = sorted(releases, key=lambda k: (releases[k]['en']['date'], k), reverse=True)
KINDS = [('milestone', '里程碑', 'Milestone', 'brand'), ('latest', '正式版', 'Latest', 'pass'), ('beta', '测试版', 'Beta', ''), ('alpha', '预览版', 'Alpha', 'soon')]
KIND = {k: (z, e, c) for k, z, e, c in KINDS}

def fmt_date(d, lang):
    y, m, dd = d.split('-')
    if lang == 'cn': return f'{int(y)}年{int(m)}月{int(dd)}日'
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][int(m)-1] + f' {int(dd)}, {y}'

def plain(s): return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s))).strip()

# 摘要：CMS 里大多数版本的描述只是「Release Note of vX」「vX 更新日志」，这时取正文第一条
def summary(e):
    d = e['desc'].strip()
    if d and not re.match(r'^(release note|v?\d[\w.\-]* ?更新日志)', d, re.I): return d
    m = re.search(r'<(li|p)>(.*?)</\1>', e['body'], re.S)
    s = plain(m.group(2)) if m else ''
    # 去掉自动生成的更新日志里的 [undefined] 前缀和「( #PR ) by @作者」尾巴
    s = re.sub(r'^\[undefined\]\s*', '', s)
    s = re.sub(r'\s*\(\s*#\d+\s*\)\s*by\s+@\S+.*$', '', s)
    return s if len(s) <= 140 else s[:138].rstrip() + '…'

def pill(k):
    if k not in KIND: return ''
    z, e, c = KIND[k]
    return f'<span class="pill {c}">{T(z, e)}</span>'

def href(slug): return f'blog/{slug}.html' if releases[slug]['post'] else f'changelog/{slug}.html'

def build(name, tz, te, dz, de, body):
    root = '../' if '/' in name else ''
    if root: body = re.sub(r'(href|src)="(?!https?:|#|mailto:|/)([^"]*)"', lambda m: f'{m.group(1)}="{root}{m.group(2)}"', body)
    src = os.path.join(tmp, name.replace('/', '__') + '.body.html')
    open(src, 'w', encoding='utf-8').write(f'page: changelog\nroot: {root}\ntitle_zh: {tz}\ntitle_en: {te}\ndesc_zh: {dz}\ndesc_en: {de}\n---\n{body}')
    out = os.path.join(site, name + '.html'); os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run([sys.executable, '-I', wrap, src, out], check=True, capture_output=True)

STYLE = '''<style>
.cl-list { margin-top: 32px; border-top: 1px solid var(--rule); }
.cl-year { margin: 40px 0 4px; font-size: 15px; font-weight: 600; color: var(--muted); }
.cl-row { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 4px 24px; padding: 18px 0; border-bottom: 1px solid var(--rule); color: inherit; text-decoration: none; }
.cl-row:hover b { color: var(--brand); }
.cl-row time { font-size: 14px; color: var(--muted); padding-top: 3px; }
.cl-row .hd { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.cl-row b { font-size: 17px; font-weight: 600; }
.cl-row p { margin: 6px 0 0; font-size: 14.5px; line-height: 1.7; color: var(--ink-2); }
.cl-row.milestone b { font-size: 19px; }
.cl-v2 { margin-top: 14px; font-size: 15px; color: var(--muted); }
.cl-v2 a { display: inline-flex; align-items: center; gap: 4px; color: var(--brand); }
.cl-v2 svg.lucide { width: 14px; height: 14px; }
.cl-empty { padding: 48px 0; color: var(--muted); font-size: 16px; }
@media (max-width: 640px) { .cl-row { grid-template-columns: 1fr; } }
</style>'''

# 列表页
rows, year = [], None
for s in order:
    r = releases[s]; e, c = r['en'], r['cn']
    y = e['date'][:4]
    if y != year:
        rows.append(f'<h2 class="cl-year" data-year="{y}">{y}</h2>'); year = y
    rows.append(f'<a class="cl-row {r["kind"]}" href="{href(s)}" data-k="{r["kind"]}"><time>{T(fmt_date(c["date"], "cn"), fmt_date(e["date"], "en"))}</time>'
                f'<span><span class="hd"><b>{T(esc(c["title"]), esc(e["title"]))}</b>{pill(r["kind"])}</span>'
                f'<p>{T(esc(summary(c)), esc(summary(e)))}</p></span></a>')
present = {releases[s]['kind'] for s in order}
chips = '<button type="button" class="on" data-f="">' + T('全部', 'All') + '</button>' + ''.join(
    f'<button type="button" data-f="{k}">{T(z, e)}</button>' for k, z, e, _ in KINDS if k in present)
if not order:
    rows.append(f'<p class="cl-empty">{T("NocoBase 3 的版本发布后会列在这里。", "NocoBase 3 releases will be listed here.")}</p>')
listing = f'''{STYLE}
<section class="phero">
  <div class="container">
    <p class="label"><b>{T('更新日志', 'Changelog')}</b></p>
    <h1>{T('每次版本迭代的<span class="m">新能力与改进。</span>', 'What shipped <span class="m">in every release.</span>')}</h1>
    <p class="lede">{T('NocoBase 3 每个版本的新功能、改进和问题修复。', 'New features, improvements, and fixes in every NocoBase 3 release.')}</p>
    <p class="cl-v2">{T(f'NocoBase 2 及更早版本的更新日志：<a href="{V2.format(lang="cn")}" target="_blank" rel="noopener">查看 NocoBase 2 更新日志<i data-lucide="arrow-up-right"></i></a>', f'Changelog for NocoBase 2 and earlier: <a href="{V2.format(lang="en")}" target="_blank" rel="noopener">see the NocoBase 2 changelog<i data-lucide="arrow-up-right"></i></a>')}</p>
  </div>
</section>
<section class="sec tight" style="padding-top:56px">
  <div class="container">
    {'<div class="bfilter" role="group" aria-label="Filter">' + chips + '</div>' if order else ''}
    <div class="cl-list" id="cl">{''.join(rows)}</div>
  </div>
</section>
<script>
(function () {{
  var chips = document.querySelectorAll('.bfilter button'), list = document.getElementById('cl');
  chips.forEach(function (b) {{ b.addEventListener('click', function () {{
    chips.forEach(function (x) {{ x.classList.toggle('on', x === b); }});
    var f = b.getAttribute('data-f'), shown = {{}};
    list.querySelectorAll('.cl-row').forEach(function (r) {{ r.hidden = !!f && r.getAttribute('data-k') !== f; }});
    // 筛选后没有条目的年份标题一起隐藏
    var head = null, any = false;
    Array.prototype.forEach.call(list.children, function (el) {{
      if (el.tagName === 'H2') {{ if (head) head.hidden = !any; head = el; any = false; }}
      else if (!el.hidden) any = true;
    }});
    if (head) head.hidden = !any;
  }}); }});
}})();
</script>'''
build('changelog', '更新日志 — NocoBase', 'Changelog — NocoBase', 'NocoBase 3 每个版本的新功能、改进和问题修复。', 'New features, improvements, and fixes in every NocoBase 3 release.', listing)

# 详情页（有博客文章的版本不单独生成）
n = 0
for i, s in enumerate(order):
    r = releases[s]
    if r['post']: continue
    e, c = r['en'], r['cn']
    near = [k for k in order[max(0, i - 3):i + 4] if k != s][:3]
    more = ''.join(f'<a class="cl-row {releases[k]["kind"]}" href="{href(k)}"><time>{T(fmt_date(releases[k]["cn"]["date"], "cn"), fmt_date(releases[k]["en"]["date"], "en"))}</time>'
                   f'<span><span class="hd"><b>{T(esc(releases[k]["cn"]["title"]), esc(releases[k]["en"]["title"]))}</b>{pill(releases[k]["kind"])}</span></span></a>' for k in near)
    body = f'''{STYLE}
<div class="container">
  <header class="post-hero">
    <p class="crumb"><a href="changelog.html">{T('更新日志', 'Changelog')}</a></p>
    <h1>{T(esc(c['title']), esc(e['title']))}</h1>
    <div class="bmeta">{pill(r['kind'])}<span>{T(fmt_date(c["date"], "cn"), fmt_date(e["date"], "en"))}</span></div>
  </header>
  <div class="post-body">
    <article><div class="prose zh-only">{c['body']}</div><div class="prose en-only">{e['body']}</div></article>
    <div></div>
  </div>
  <section class="post-more">
    <h2>{T('相邻版本', 'Nearby releases')}</h2>
    <div class="cl-list">{more}</div>
  </section>
</div>'''
    build('changelog/' + s, c['title'] + ' — NocoBase', e['title'] + ' — NocoBase', summary(c).replace('\n', ' '), summary(e).replace('\n', ' '), body)
    n += 1
print('changelog:', len(order), 'releases,', n, 'pages')
