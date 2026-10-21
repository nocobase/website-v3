# 从 posts.json 生成博客列表页与每篇文章的详情页（中英双语），交给 pages/wrap.py 套上共用 head。
import json, re, os, subprocess, html, sys
here = os.path.dirname(os.path.abspath(__file__))
site = sys.argv[1]
allposts = json.load(open(os.path.join(here, 'posts.json'), encoding='utf-8'))
stories = json.load(open(os.path.join(here, 'cs-posts.json'), encoding='utf-8'))
for k, v in allposts.items():
    if 'Customer Stories' in v['en']['tags'] and k not in stories: stories[k] = v
posts = {k: v for k, v in allposts.items() if 'Customer Stories' not in v['en']['tags']}
# 阳光电源：官网还没有全文，先放标题与摘要
SUNGROW = {'cn': {'title': '阳光电源：在 NocoBase 上构建覆盖全球业务的管理系统', 'desc': '全球新能源龙头企业如何用一个底座支撑多个业务系统的快速搭建与长期演进。', 'date': '2026-10-17', 'author': 'NocoBase', 'tags': ['客户故事'], 'image': '', 'body': ''},
           'en': {'title': 'Sungrow: the systems behind a global business, built on NocoBase', 'desc': 'How a global renewable-energy leader uses one foundation to build business applications fast and keep them evolving.', 'date': '2026-10-17', 'author': 'NocoBase', 'tags': ['Customer Stories'], 'image': '', 'body': ''}}
stories = {'sungrow': SUNGROW, **stories}
wrap = os.path.join(here, '..', 'pages', 'wrap.py')
tmp = os.path.join(here, 'out'); os.makedirs(tmp, exist_ok=True)
T = lambda zh, en: f'<t-zh>{zh}</t-zh><t-en>{en}</t-en>'
esc = lambda s: html.escape(s, quote=False)
order = sorted(posts, key=lambda k: posts[k]['en']['date'], reverse=True)

def fmt_date(d, lang):
    y, m, dd = d.split('-')
    if lang == 'cn': return f'{int(y)}年{int(m)}月{int(dd)}日'
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][int(m)-1] + f' {int(dd)}, {y}'

def local_links(body):
    def rep(m):
        slug = m.group(2).rstrip('/')
        if slug in posts: return f'href="blog/{slug}.html"'
        if slug in stories: return f'href="customers/{slug}.html"'
        return m.group(0)
    return re.sub(r'href="(https://www\.nocobase\.com)?/(?:en|cn)/blog/([^"#?]+)"', rep, body)

def with_ids(body, prefix):
    toc = []
    def rep(m):
        i = len(toc) + 1; hid = f'{prefix}-{i}'
        toc.append((hid, re.sub(r'<[^>]+>', '', m.group(1)).strip()))
        return f'<h2 id="{hid}">{m.group(1)}</h2>'
    return re.sub(r'<h2>(.*?)</h2>', rep, body, flags=re.S), toc

def src(slug): return posts.get(slug) or stories[slug]

def tags(slug):
    e, c = src(slug)['en']['tags'], src(slug)['cn']['tags']
    return ''.join(f'<span class="pill">{T(esc(z), esc(x))}</span>' for z, x in zip(c, e))

def meta(slug):
    e, c = src(slug)['en'], src(slug)['cn']
    return f'<div class="bmeta">{tags(slug)}<span>{T(fmt_date(c["date"], "cn"), fmt_date(e["date"], "en"))}</span><span>{T(esc(c["author"]), esc(e["author"]))}</span></div>'

def cover(img, title=''):
    if img: return f'<img src="{img}" alt="">'
    return f'<span class="cv-ph"><b>{title}</b></span>'

def href(slug): return f'blog/{slug}.html' if slug in posts else f'customers/{slug}.html'

def card(slug):
    e, c = src(slug)['en'], src(slug)['cn']
    keys = ' '.join(t.replace(' ', '_') for t in e['tags'])
    return (f'<a class="bcard" href="{href(slug)}" data-tags="{keys}"><span class="cv">{cover(e["image"], "SUNGROW")}</span>'
            f'{meta(slug)}<h3>{T(esc(c["title"]), esc(e["title"]))}</h3><p>{T(esc(c["desc"]), esc(e["desc"]))}</p></a>')

# 详情页放在 blog/、customers/ 子目录里：站内相对链接都往上一级找
def build(name, page, tz, te, dz, de, body):
    root = '../' if '/' in name else ''
    if root: body = re.sub(r'(href|src)="(?!https?:|#|mailto:|/)([^"]*)"', lambda m: f'{m.group(1)}="{root}{m.group(2)}"', body)
    src = os.path.join(tmp, name.replace('/', '__') + '.body.html')
    open(src, 'w', encoding='utf-8').write(f'page: {page}\nroot: {root}\ntitle_zh: {tz}\ntitle_en: {te}\ndesc_zh: {dz}\ndesc_en: {de}\n---\n{body}')
    out = os.path.join(site, name + '.html'); os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run([sys.executable, '-I', wrap, src, out], check=True, capture_output=True)

# 列表页
alltags = []
for s in order:
    for x, z in zip(posts[s]['en']['tags'], posts[s]['cn']['tags']):
        if x not in [a[0] for a in alltags]: alltags.append((x, z))
feat = order[0]; fe, fc = posts[feat]['en'], posts[feat]['cn']
chips = '<button type="button" class="on" data-f="">' + T('全部', 'All') + '</button>' + ''.join(
    f'<button type="button" data-f="{x.replace(" ", "_")}">{T(esc(z), esc(x))}</button>' for x, z in alltags) + f'<a class="to-cs" href="customers.html">{T("客户案例", "Customer stories")}<i data-lucide="arrow-right"></i></a>'
listing = f'''<section class="phero">
  <div class="container">
    <p class="label"><b>{T('博客', 'Blog')}</b></p>
    <h1>{T('产品思考、工程实践，<span class="m">与客户的真实故事。</span>', 'Product thinking, engineering practice, <span class="m">and real customer stories.</span>')}</h1>
    <p class="lede">{T('关于用 AI 构建业务系统的方法、NocoBase 的版本更新，以及各行业团队怎样用 NocoBase 搭建自己的系统。', 'How to build business systems with AI, what’s new in NocoBase, and how teams in every industry build on it.')}</p>
  </div>
</section>
<section class="sec tight" style="padding-top:56px">
  <div class="container">
    <a class="bfeat" href="blog/{feat}.html"><span class="cv"><img src="{fe["image"]}" alt=""></span><span class="tx">{meta(feat)}<h2>{T(esc(fc["title"]), esc(fe["title"]))}</h2><p>{T(esc(fc["desc"]), esc(fe["desc"]))}</p><span class="link">{T('阅读全文', 'Read the post')}<i data-lucide="arrow-right"></i></span></span></a>
    <div class="bfilter" role="group" aria-label="Filter">{chips}</div>
    <div class="bgrid" id="bgrid">{''.join(card(s) for s in order[1:])}</div>
  </div>
</section>
<script>
(function () {{
  var chips = document.querySelectorAll('.bfilter button'), cards = document.querySelectorAll('#bgrid .bcard');
  chips.forEach(function (b) {{ b.addEventListener('click', function () {{
    chips.forEach(function (x) {{ x.classList.toggle('on', x === b); }});
    var f = b.getAttribute('data-f');
    cards.forEach(function (c) {{ c.hidden = !!f && (' ' + c.getAttribute('data-tags') + ' ').indexOf(' ' + f + ' ') < 0; }});
  }}); }});
}})();
</script>'''
build('blog', 'blog', '博客 — NocoBase', 'Blog — NocoBase', 'NocoBase 博客：用 AI 构建业务系统的方法、版本更新与客户故事。', 'The NocoBase blog: building business systems with AI, release notes, and customer stories.', listing)

# 详情页
for slug in order:
    e, c = posts[slug]['en'], posts[slug]['cn']
    bz, tz = with_ids(local_links(c['body']), 'zh')
    be, te = with_ids(local_links(e['body']), 'en')
    toc = lambda t: ''.join(f'<a href="#{i}">{esc(x)}</a>' for i, x in t)
    same = [s for s in order if s != slug and set(posts[s]['en']['tags']) & set(e['tags'])]
    rest = [s for s in order if s != slug and s not in same]
    related = (same + rest)[:3]
    body = f'''<div class="container">
  <header class="post-hero">
    <p class="crumb"><a href="blog.html">{T('博客', 'Blog')}</a><span>/</span>{T(esc(' · '.join(c['tags'])), esc(' · '.join(e['tags'])))}</p>
    <h1>{T(esc(c['title']), esc(e['title']))}</h1>
    <p class="lede">{T(esc(c['desc']), esc(e['desc']))}</p>
    {meta(slug)}
  </header>
  <div class="post-cover"><img src="{e['image']}" alt=""></div>
  <div class="post-body">
    <article><div class="prose zh-only">{bz}</div><div class="prose en-only">{be}</div></article>
    <nav class="toc" aria-label="Contents"><b>{T('本文目录', 'On this page')}</b><div class="zh-only">{toc(tz)}</div><div class="en-only">{toc(te)}</div></nav>
  </div>
  <section class="post-more">
    <h2>{T('继续阅读', 'Keep reading')}</h2>
    <div class="bgrid">{''.join(card(s) for s in related)}</div>
  </section>
  <div class="band">
    <div><h2>{T('用 AI 构建可靠的业务系统。', 'Build reliable business systems with AI.')}</h2><p>{T('从开源的 NocoBase Core 开始，或带一个真实需求和我们一起实践。', 'Start with open-source NocoBase Core, or bring a real requirement and work with us.')}</p></div>
    <div class="cta"><a class="btn btn-pri" href="core.html">{T('了解 NocoBase Core', 'Explore NocoBase Core')}<i data-lucide="arrow-right"></i></a><a class="btn btn-sec" href="launch.html#book">{T('预约实战验证', 'Book a Pilot')}</a></div>
  </div>
</div>'''
    build('blog/' + slug, 'blog', c['title'] + ' — NocoBase', e['title'] + ' — NocoBase', c['desc'].replace('\n', ' '), e['desc'].replace('\n', ' '), body)
    print('ok', slug, len(tz), len(te))

# ======================= 客户案例：独立的列表与详情 =======================
corder = ['sungrow'] + sorted([k for k in stories if k != 'sungrow'], key=lambda k: stories[k]['en']['date'], reverse=True)
logos = ''.join(f'<img src="assets/logos/{n}.png" alt="{a}">' for n, a in [('nxp', 'NXP'), ('lenovo', 'Lenovo'), ('sony', 'Sony'), ('ntt-data', 'NTT DATA'), ('american-express', 'American Express'), ('smfl', 'SMFL'), ('vinfast', 'VinFast')])
fe, fc = stories['sungrow']['en'], stories['sungrow']['cn']
clist = f'''<section class="phero">
  <div class="container">
    <p class="label"><b>{T('客户案例', 'Customer Stories')}</b></p>
    <h1>{T('全球各行业团队，<span class="m">用 NocoBase 构建核心业务系统。</span>', 'Teams worldwide <span class="m">build core business systems on NocoBase.</span>')}</h1>
    <p class="lede">{T('从新能源、制造、医疗到政府与高校，看他们为什么选择 NocoBase，怎样搭建、上线并持续改进自己的系统。', 'From energy, manufacturing, and healthcare to government and universities—why they chose NocoBase, and how they built, launched, and keep improving their systems.')}</p>
    <div class="cs-logos">{logos}</div>
  </div>
</section>
<section class="sec tight" style="padding-top:56px">
  <div class="container">
    <a class="bfeat" href="customers/sungrow.html"><span class="cv">{cover('', 'SUNGROW')}</span><span class="tx"><p class="label" style="margin:0"><b>{T('客户故事 · 阳光电源', 'Customer Story · Sungrow')}</b></p><h2>{T(esc(fc['title']), esc(fe['title']))}</h2><p>{T(esc(fc['desc']), esc(fe['desc']))}</p><span class="link">{T('阅读故事', 'Read the story')}<i data-lucide="arrow-right"></i></span></span></a>
    <div class="bgrid">{''.join(card(k) for k in corder[1:])}</div>
  </div>
</section>
<div class="container">
  <div class="band">
    <div><h2>{T('下一个故事，可以是你的。', 'The next story could be yours.')}</h2><p>{T('带一个真实需求，和我们一起把它做成可以长期使用的系统。', 'Bring one real requirement and turn it into a system you’ll use for years.')}</p></div>
    <div class="cta"><a class="btn btn-pri" href="launch.html#book">{T('预约实战验证', 'Book a Pilot')}<i data-lucide="arrow-right"></i></a><a class="btn btn-sec" href="solutions.html">{T('查看解决方案', 'See Solutions')}</a></div>
  </div>
</div>'''
build('customers', 'customers', '客户案例 — NocoBase', 'Customer Stories — NocoBase', '全球各行业团队如何用 NocoBase 构建核心业务系统。', 'How teams worldwide build core business systems on NocoBase.', clist)

for slug in corder:
    e, c = stories[slug]['en'], stories[slug]['cn']
    if slug == 'sungrow':
        bz = f'<p>{esc(c["desc"])}</p><blockquote><p>完整故事即将发布。</p></blockquote>'
        be = f'<p>{esc(e["desc"])}</p><blockquote><p>The full story is coming soon.</p></blockquote>'
        tz = te = []
    else:
        bz, tz = with_ids(local_links(c['body']), 'zh')
        be, te = with_ids(local_links(e['body']), 'en')
    toc = lambda t: ''.join(f'<a href="#{i}">{esc(x)}</a>' for i, x in t)
    related = [k for k in corder if k != slug][:3]
    nav = f'<nav class="toc" aria-label="Contents"><b>{T("本文目录", "On this page")}</b><div class="zh-only">{toc(tz)}</div><div class="en-only">{toc(te)}</div></nav>' if tz else '<div></div>'
    body = f'''<div class="container">
  <header class="post-hero">
    <p class="crumb"><a href="customers.html">{T('客户案例', 'Customer Stories')}</a></p>
    <h1>{T(esc(c['title']), esc(e['title']))}</h1>
    <p class="lede">{T(esc(c['desc']), esc(e['desc']))}</p>
    <div class="bmeta"><span>{T(fmt_date(c["date"], "cn"), fmt_date(e["date"], "en"))}</span><span>{T(esc(c["author"]), esc(e["author"]))}</span></div>
  </header>
  <div class="post-cover">{cover(e['image'], 'SUNGROW')}</div>
  <div class="post-body">
    <article><div class="prose zh-only">{bz}</div><div class="prose en-only">{be}</div></article>
    {nav}
  </div>
  <section class="post-more">
    <h2>{T('更多客户案例', 'More customer stories')}</h2>
    <div class="bgrid">{''.join(card(k) for k in related)}</div>
  </section>
  <div class="band">
    <div><h2>{T('下一个故事，可以是你的。', 'The next story could be yours.')}</h2><p>{T('带一个真实需求，和我们一起把它做成可以长期使用的系统。', 'Bring one real requirement and turn it into a system you’ll use for years.')}</p></div>
    <div class="cta"><a class="btn btn-pri" href="launch.html#book">{T('预约实战验证', 'Book a Pilot')}<i data-lucide="arrow-right"></i></a><a class="btn btn-sec" href="customers.html">{T('全部客户案例', 'All customer stories')}</a></div>
  </div>
</div>'''
    build('customers/' + slug, 'customers', c['title'] + ' — NocoBase', e['title'] + ' — NocoBase', c['desc'].replace('\n', ' '), e['desc'].replace('\n', ' '), body)
print('customers:', len(corder))
