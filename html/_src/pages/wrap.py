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
# 文档站：英文在根目录，中文在 zh-CN/；assets/site.js 按页面语言给中文补上 zh-CN/
DOCS = 'https://docs.nocobase.com/'
body = body.replace('{{DOCS}}', DOCS)
q = lambda s: html.escape(s, quote=True)
# 只有中英文的页面：其他语言显示英文
ZH_EN = """<script>
(function () {
  try {
    var u = new URLSearchParams(window.location.search).get('lang');
    var s = localStorage.getItem('nb3_lang');
    var ok = /^(zh|en|es|fr|de|pt|ru|id|vi|zh-TW|ja|ko)$/, v = ok.test(u) ? u : (ok.test(s) ? s : 'zh'), lang = v === 'zh' ? 'zh' : 'en';
    window.__lang = lang;
    document.documentElement.lang = lang;
  } catch (e) {
    window.__lang = 'zh';
  }
})();
</script>
"""
# 写了 i18n: <组名> 的页面有 12 种语言：中文、英文写在页面里，其他语言的译文由 _src/i18n/pages.py 生成在
# assets/i18n/site.<语言>.js 和 <组名>.<语言>.js，这里按需加载，assets/site.js 换上译文
I18N = """<script>
/* 语言：中文、英文写在页面里；其他语言（西、法、德、葡、俄、印尼、越南、繁中、日、韩）的译文在 assets/i18n/site.<语言>.js 和 %(group)s.<语言>.js，
   由 _src/i18n/pages.py 生成，这里按需加载，assets/site.js 换上译文。界面示意图：繁体中文显示繁体中文界面，其他语言显示英文界面 */
(function () {
  var LANGS = ['zh', 'en', 'es', 'fr', 'de', 'pt', 'ru', 'id', 'vi', 'zh-TW', 'ja', 'ko'];
  /* 日文、韩文、繁体中文用系统字体；俄语用 Inter（Archivo 没有西里尔字母），切到俄语时才加载 */
  var FONTS = { ru: 'inter' };
  var lang = 'zh';
  try {
    var u = new URLSearchParams(window.location.search).get('lang');
    var s = localStorage.getItem('nb3_lang');
    lang = LANGS.indexOf(u) >= 0 ? u : (LANGS.indexOf(s) >= 0 ? s : 'zh');
  } catch (e) {}
  window.__i18nPage = '%(group)s';
  window.__lang = lang;
  document.documentElement.lang = lang;
  window.__font = function (l) {
    if (!FONTS[l] || document.getElementById('font-' + l)) return;
    var k = document.createElement('link');
    k.id = 'font-' + l;
    k.rel = 'stylesheet';
    k.href = '%(root)sassets/fonts/' + FONTS[l] + '.css';
    document.head.appendChild(k);
  };
  window.__font(lang);
  if (lang !== 'zh' && lang !== 'en') document.write('<script src="%(root)sassets/i18n/site.' + lang + '.js"><\\/script><script src="%(root)sassets/i18n/%(group)s.' + lang + '.js"><\\/script>');
})();
</script>
"""
lang_script = I18N % {'group': m['i18n'], 'root': root} if m.get('i18n') else ZH_EN
# scripts: 页面另外要加载的脚本（如表单的 assets/public-form.js），空格分隔
extra = ''.join(f'<script src="{root}{x}"></script>\n' for x in m.get('scripts', '').split())
page = f'''<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title data-zh="{q(m['title_zh'])}" data-en="{q(m['title_en'])}">{html.escape(m['title_zh'])}</title>
<meta name="description" content="{q(m['desc_zh'])}" data-zh="{q(m['desc_zh'])}" data-en="{q(m['desc_en'])}">
{lang_script}<link rel="icon" type="image/png" sizes="32x32" href="https://static-docs.nocobase.com/nocobase-favicon-32x32.png">
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
{extra}</body>
</html>
'''
open(out, 'w', encoding='utf-8').write(page)
print('wrote', out, len(page))
