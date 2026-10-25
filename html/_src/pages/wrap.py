# 把页面正文包上共用的 head，并把 {{FIG:名称:宽度}} 换成首页图纸的中英两份静态 HTML。
import sys, re, os, html
src, out = sys.argv[1], sys.argv[2]
figdir = os.path.join(os.path.dirname(__file__), '..', 'sol', 'figs')
text = open(src, encoding='utf-8').read()
meta, body = text.split('\n---\n', 1)
m = dict(l.split(': ', 1) for l in meta.strip().split('\n'))
# 放在子目录里的页面（blog/、customers/）写 root: ../，资源与导航链接都从这里往上找
root = m.get('root', '')
def fig(mo):
    name, w = mo.group(1), mo.group(2)
    zh = open(os.path.join(figdir, name + '.zh.html'), encoding='utf-8').read()
    en = open(os.path.join(figdir, name + '.en.html'), encoding='utf-8').read()
    return '<div class="fit" data-w="%s"><div class="fit-in"><div class="zh-only">%s</div><div class="en-only">%s</div></div></div>' % (w, zh, en)
body = re.sub(r'\{\{FIG:(\w+):(\d+)\}\}', fig, body)
snipdir = os.path.join(os.path.dirname(__file__), 'snips')
body = re.sub(r'\{\{SNIP:(\w+):(\d+)\}\}', lambda mo: '<div class="fit" data-w="%s"><div class="fit-in">%s</div></div>' % (mo.group(2), open(os.path.join(snipdir, mo.group(1) + '.html'), encoding='utf-8').read()), body)
DOCS = 'https://v3.docs.nocobase.com/zh-CN/'
body = body.replace('{{DOCS}}', DOCS)
q = lambda s: html.escape(s, quote=True)
page = f'''<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title data-zh="{q(m['title_zh'])}" data-en="{q(m['title_en'])}">{html.escape(m['title_zh'])}</title>
<meta name="description" content="{q(m['desc_zh'])}" data-zh="{q(m['desc_zh'])}" data-en="{q(m['desc_en'])}">
<script>
(function () {{
  try {{
    var u = new URLSearchParams(window.location.search).get('lang');
    var s = localStorage.getItem('nb3_lang');
    var ok = /^(zh|en|es|fr|de|pt|ru|id|vi|zh-TW|ja|ko)$/, v = ok.test(u) ? u : (ok.test(s) ? s : 'zh'), lang = v === 'zh' ? 'zh' : 'en';
    window.__lang = lang;
    document.documentElement.lang = lang;
  }} catch (e) {{
    window.__lang = 'zh';
  }}
}})();
</script>
<link rel="icon" type="image/png" sizes="32x32" href="https://static-docs.nocobase.com/nocobase-favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="https://static-docs.nocobase.com/nocobase-favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="https://static-docs.nocobase.com/nocobase-apple-touch-icon.png">
<link rel="stylesheet" href="{root}assets/fonts/fonts.css">
<script src="{root}assets/vendor/lucide-0.460.0/lucide.min.js"></script>
<link rel="stylesheet" href="{root}assets/site.css">
</head>
<body data-page="{m['page']}" data-root="{root}">
<div id="site-header"></div>
<main>
{body.strip()}
</main>
<div id="site-footer"></div>
<script src="{root}assets/site.js"></script>
</body>
</html>
'''
open(out, 'w', encoding='utf-8').write(page)
print('wrote', out, len(page))
