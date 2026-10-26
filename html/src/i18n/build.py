#!/usr/bin/env python3
"""首页其他语言的译文：home.<语言>.txt → assets/i18n/home.<语言>.js。在 _src 目录下运行 python3 i18n/build.py ..

keys.json 是要翻译的条目（英文原文、中文原文、位置），由 i18n/extract.py 从首页抽取。译文文件每行一条：
  title: 页面标题
  description: 页面描述
  000: 第 0 条的译文
英文原文带 <br>、<span class="..."> 的，译文保留同样的标记（中文、日文、韩文可按中文原文的写法去掉 <br>）。
"""
import json, re, sys
from pathlib import Path

here = Path(__file__).resolve().parent
site = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else here.parent.parent
keys = json.loads((here / 'keys.json').read_text(encoding='utf8'))
tags = lambda s: sorted(re.findall(r'<(?!br>)[^>]+>', s))
ok = True

for f in sorted(here.glob('home.*.txt')):
    lang = f.name[len('home.'):-len('.txt')]
    meta, tr = {}, {}
    for n, line in enumerate(f.read_text(encoding='utf8').splitlines(), 1):
        if not line.strip() or line.startswith('#'):
            continue
        k, sep, v = line.partition(': ')
        if not sep:
            print(f'{f.name}:{n} 缺少「: 」'); ok = False; continue
        if k in ('title', 'description'):
            meta[k] = v
        elif re.fullmatch(r'\d{3}', k):
            # 法文的 ? ! : ; 前用不换行空格；数字和 % 之间不断行
            if lang == 'fr':
                v = re.sub(r' ([?!:;»])', '\u00a0\\1', v).replace('« ', '«\u00a0')
            v = re.sub(r'(\d) %', '\\1\u00a0%', v)
            if k in tr:
                print(f'{f.name}:{n} 重复的编号 {k}'); ok = False
            tr[k] = v
        else:
            print(f'{f.name}:{n} 不认识的编号 {k}'); ok = False
    problems = []
    for i, item in enumerate(keys):
        k = f'{i:03d}'
        if item.get('unused'):
            continue
        if k not in tr:
            problems.append(f'缺 {k}：{item["en"]}'); continue
        v, en = tr[k], item['en']
        if tags(v) != tags(en) and not (lang in ('zh-TW', 'ja', 'ko') and tags(v) == tags(item['zh'])):
            problems.append(f'{k} 标记和原文不一致：{v}')
        for ph in re.findall(r'\{\w+\}', en):
            if ph not in v:
                problems.append(f'{k} 少了占位符 {ph}')
        if re.search(r'&(?!amp;|lt;|gt;|quot;|#\d+;)', v) and '&amp;' in en:
            problems.append(f'{k} 的 & 要写成 &amp;')
    extra = sorted(set(tr) - {f'{i:03d}' for i in range(len(keys))})
    problems += [f'多出的编号 {k}' for k in extra]
    if set(meta) != {'title', 'description'}:
        problems.append('缺 title 或 description')
    if problems:
        ok = False
        print(f'{f.name}：'); [print('  ' + p) for p in problems]
    strings = {item['en']: tr[f'{i:03d}'] for i, item in enumerate(keys) if f'{i:03d}' in tr and not item.get('unused')}
    out = site / 'assets' / 'i18n' / f'home.{lang}.js'
    out.parent.mkdir(parents=True, exist_ok=True)
    data = {'meta': meta, 'strings': strings}
    ui_f = here / f'ui.{lang}.json'   # 繁体中文的产品界面示意（ui_tw.py 生成）：首页 L() 和模板按它显示本文字的界面
    if ui_f.exists():
        data['ui'] = json.loads(ui_f.read_text(encoding='utf8'))
    out.write_text('/* 由 _src/i18n/build.py 从 home.%s.txt%s 生成，不要直接修改 */\n(window.NB_I18N = window.NB_I18N || {})[%s] = %s;\n'
                   % (lang, f' 和 ui.{lang}.json' if ui_f.exists() else '', json.dumps(lang), json.dumps(data, ensure_ascii=False, indent=0)), encoding='utf8')
    print(f'{lang}: {len(strings)}/{len(keys)} 条')

sys.exit(0 if ok else 1)
