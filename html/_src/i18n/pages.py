#!/usr/bin/env python3
"""子页面的其他语言（目前是 NocoCRM、NocoITAM 两页）。在 _src 目录下运行：

  python3 i18n/pages.py extract ..   抽取要翻译的条目，更新 <组>.keys.json
  python3 i18n/pages.py build ..     检查译文，生成 assets/i18n/<组>.<语言>.js

条目分三组：
- site：顶部导航和页脚，写在 assets/site.js 的 T(zh, en) 里，所有接入的页面共用；
- crm、itam：各页正文里的 <t-en>，以及页面标题和描述（title、description）。
界面示意图（.fit-in 里的内容）不抽取：产品界面只有中文和英文，其他语言都显示英文界面，和首页一致。

译文文件 <组>.<语言>.txt 的写法和首页的 home.<语言>.txt 相同：开头是这种语言的固定用语，每行「编号: 译文」，
页面组另有 title、description 两行。site 组里和首页英文原文相同的条目，没写译文时沿用 home.<语言>.txt 的译文。
生成的 js 并入 window.NB_I18N[语言].strings（以英文原文为键），页面标题和描述放在 window.NB_I18N[语言].pages[组]。
缺的译文显示英文，不会出错。
"""
import html.parser, json, re, sys
from pathlib import Path

here = Path(__file__).resolve().parent
site = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else here.parent.parent
PAGES = {'crm': 'solution-crm.html', 'itam': 'solution-itam.html'}
LANGS = ['es', 'fr', 'de', 'pt', 'ru', 'id', 'vi', 'zh-TW', 'ja', 'ko']


def fit_regions(src):
    """界面示意图（class 含 fit-in 的元素）在源码里的起止位置。"""
    lines = [0]
    for line in src.splitlines(keepends=True):
        lines.append(lines[-1] + len(line))
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
    regions, stack = [], []

    class P(html.parser.HTMLParser):
        def handle_starttag(self, tag, attrs):
            if tag in VOID:
                return
            cls = dict(attrs).get('class') or ''
            ln, col = self.getpos()
            stack.append((tag, 'fit-in' in cls.split(), lines[ln - 1] + col))

        def handle_endtag(self, tag):
            ln, col = self.getpos()
            while stack:
                t, fit, start = stack.pop()
                if fit:
                    regions.append((start, lines[ln - 1] + col))
                if t == tag:
                    break

    P(convert_charrefs=False).feed(src)
    return regions


def page_items(name):
    src = (site / PAGES[name]).read_text(encoding='utf8')
    body = src.index('<main')
    regions = fit_regions(src)
    items = []
    for m in re.finditer(r'(?:<t-zh>((?:(?!</t-zh>).)*)</t-zh>)?<t-en>((?:(?!</t-en>).)*)</t-en>', src, re.S):
        if m.start() < body or any(a <= m.start() < b for a, b in regions):
            continue
        # 图片（视频封面、截图）按中英文各一张，其他语言用英文那张，不是文字
        if m.group(2).lstrip().startswith('<img'):
            continue
        sec = src.rfind('<section', 0, m.start())
        cls = re.match(r'<section class="([^"]*)"(?: id="([^"]*)")?', src[sec:]) if sec >= 0 else None
        where = (cls.group(2) or cls.group(1).split(' ')[-1]) if cls else 'main'
        items.append({'en': m.group(2), 'zh': m.group(1) or '', 'where': where})
    meta = {
        'title': re.search(r'<title data-zh="([^"]*)" data-en="([^"]*)"', src).groups(),
        'description': re.search(r'<meta name="description"[^>]*data-zh="([^"]*)" data-en="([^"]*)"', src).groups(),
    }
    return items, meta


def site_items():
    js = (site / 'assets' / 'site.js').read_text(encoding='utf8')
    unq = lambda x: x.replace("\\'", "'")
    return [{'en': unq(e), 'zh': unq(z), 'where': 'site'}
            for z, e in re.findall(r"\bT\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)", js)
            if e != 'English' and z != 'Switch to English']


def extract():
    groups = {'site': (site_items(), None)}
    for name in PAGES:
        groups[name] = page_items(name)
    for group, (found, meta) in groups.items():
        current = {}
        for it in found:
            current.setdefault(it['en'], it)
        kp = here / f'{group}.keys.json'
        old = json.loads(kp.read_text(encoding='utf8')) if kp.exists() else {'items': []}
        keys = old['items']
        known = {k['en'] for k in keys}
        for k in keys:
            if k['en'] in current:
                k.pop('unused', None)
                k['zh'] = current[k['en']]['zh']
            else:
                k['unused'] = True
        added = [it for en, it in current.items() if en not in known]
        keys += added
        out = {'items': keys}
        if meta:
            out['meta'] = {k: {'zh': v[0], 'en': v[1]} for k, v in meta.items()}
        kp.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf8')
        print(f'{group}: {len(keys)} 条，新增 {len(added)}，不再使用 {sum(1 for k in keys if k.get("unused"))}')


def read_tr(f, lang):
    meta, tr, problems = {}, {}, []
    if not f.exists():
        return meta, tr, problems
    for n, line in enumerate(f.read_text(encoding='utf8').splitlines(), 1):
        if not line.strip() or line.startswith('#'):
            continue
        k, sep, v = line.partition(': ')
        if not sep:
            problems.append(f'{f.name}:{n} 缺少「: 」')
            continue
        # 法文的 ? ! : ; 前用不换行空格；数字和 % 之间不断行（和首页 build.py 相同）
        if lang == 'fr':
            v = re.sub(r' ([?!:;»])', '\u00a0\\1', v).replace('« ', '«\u00a0')
        v = re.sub(r'(\d) %', '\\1\u00a0%', v)
        if k in ('title', 'description'):
            meta[k] = v
        elif re.fullmatch(r'\d{3}', k):
            if k in tr:
                problems.append(f'{f.name}:{n} 重复的编号 {k}')
            tr[k] = v
        else:
            problems.append(f'{f.name}:{n} 不认识的编号 {k}')
    return meta, tr, problems


def build():
    tags = lambda s: sorted(re.findall(r'<(?!br>)[^>]+>', s))
    home_keys = json.loads((here / 'keys.json').read_text(encoding='utf8'))
    ok = True
    for group in ['site', *PAGES]:
        data = json.loads((here / f'{group}.keys.json').read_text(encoding='utf8'))
        keys = data['items']
        for lang in LANGS:
            f = here / f'{group}.{lang}.txt'
            meta, tr, problems = read_tr(f, lang)
            if group == 'site':
                # 和首页相同的英文，沿用首页的译文
                _, home, _ = read_tr(here / f'home.{lang}.txt', lang)
                home_by_en = {item['en']: home[f'{i:03d}'] for i, item in enumerate(home_keys) if f'{i:03d}' in home}
                for i, item in enumerate(keys):
                    k = f'{i:03d}'
                    if k not in tr and item['en'] in home_by_en:
                        tr[k] = home_by_en[item['en']]
            for i, item in enumerate(keys):
                k = f'{i:03d}'
                if item.get('unused'):
                    continue
                if k not in tr:
                    problems.append(f'缺 {k}：{item["en"]}')
                    continue
                v, en = tr[k], item['en']
                if tags(v) != tags(en) and not (lang in ('zh-TW', 'ja', 'ko') and tags(v) == tags(item['zh'])):
                    problems.append(f'{k} 标记和原文不一致：{v}')
                if re.search(r'&(?!amp;|lt;|gt;|quot;|#\d+;)', v) and '&amp;' in en:
                    problems.append(f'{k} 的 & 要写成 &amp;')
            problems += [f'多出的编号 {k}' for k in sorted(set(tr) - {f'{i:03d}' for i in range(len(keys))})]
            if group != 'site' and set(meta) != {'title', 'description'}:
                problems.append('缺 title 或 description')
            if problems:
                ok = False
                print(f'{group}.{lang}：')
                for p in problems:
                    print('  ' + p)
            strings = {item['en']: tr[f'{i:03d}'] for i, item in enumerate(keys) if f'{i:03d}' in tr and not item.get('unused')}
            page = f', p.pages[{json.dumps(group)}] = {json.dumps(meta, ensure_ascii=False)}' if group != 'site' else ''
            out = site / 'assets' / 'i18n' / f'{group}.{lang}.js'
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text('/* 由 _src/i18n/pages.py 从 %s.%s.txt 生成，不要直接修改 */\n'
                           '(function (p) { p.strings = Object.assign(p.strings || {}, %s); p.pages = p.pages || {}%s; })'
                           '((window.NB_I18N = window.NB_I18N || {})[%s] = (window.NB_I18N || {})[%s] || {});\n'
                           % (group, lang, json.dumps(strings, ensure_ascii=False, indent=0), page, json.dumps(lang), json.dumps(lang)),
                           encoding='utf8')
            print(f'{group}.{lang}: {len(strings)}/{sum(1 for k in keys if not k.get("unused"))} 条')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    {'extract': extract, 'build': build}[sys.argv[1]]()
