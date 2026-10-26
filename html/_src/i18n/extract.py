#!/usr/bin/env python3
"""从首页抽取要翻译的条目，更新 keys.json。在 _src 下运行 python3 i18n/extract.py ..（需要 playwright 和 Chrome）

已有条目的编号保持不变：新出现的英文追加到末尾，页面上已经没有的标记 "unused": true（译文文件里对应编号可以留着）。
英文原文改了，就算一条新条目，需要给各语言补上新编号的译文。
"""
import asyncio, json, re, sys
from pathlib import Path
from playwright.async_api import async_playwright

here = Path(__file__).resolve().parent
site = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else here.parent.parent
page = site / 'index.html'

async def static_strings():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome')
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        await pg.goto(page.as_uri() + '?lang=en', wait_until='load')
        await pg.wait_for_timeout(500)
        # 页面上写死的 <t-en>，不含脚本画出来的图
        items = await pg.evaluate('''() => [...document.querySelectorAll('t-en')].filter(n => !n.closest('.fit-in, #heroFoot, #apptabs, .vframe')).map(n => {
            const z = n.previousElementSibling && n.previousElementSibling.tagName === 'T-ZH' ? n.previousElementSibling.innerHTML : '';
            const sec = n.closest('section, header, footer, nav');
            return { en: n.innerHTML, zh: z, where: sec ? (sec.id || sec.className.split(' ')[0] || sec.tagName.toLowerCase()) : '' };
        })''')
        await b.close()
    return items

def script_strings(s):
    js = re.findall(r'<script>([\s\S]*?)</script>', s)[-1]
    unq = lambda x: x.replace("\\'", "'")
    out = []
    # M(zh, en)：营销文案和结构图
    for m in re.finditer(r"\bM\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)", js):
        out.append({'en': unq(m.group(2)), 'zh': unq(m.group(1)), 'where': 'figure'})
    # Hero 收尾卡片的三行
    for m in re.finditer(r"row\('r-\w+', '[\w-]+', '([^']*)', '([^']*)', '([^']*)', '([^']*)'\)", js):
        out.append({'en': m.group(2), 'zh': m.group(1), 'where': 'hero-finale'})
        out.append({'en': m.group(4), 'zh': m.group(3), 'where': 'hero-finale'})
    # Core 能力（中英两组数组）
    caps = re.search(r"trCaps\(\[([\s\S]*?)\]\) : \[([\s\S]*?)\];", js)
    en_rows = re.findall(r"\['[\w-]+', '([^']*)', '([^']*)'\]", caps.group(1))
    zh_rows = re.findall(r"\['[\w-]+', '([^']*)', '([^']*)'\]", caps.group(2))
    for (e1, e2), (z1, z2) in zip(en_rows, zh_rows):
        out += [{'en': e1, 'zh': z1, 'where': 'core-caps'}, {'en': e2, 'zh': z2, 'where': 'core-caps'}]
    # Core 图上的业务模块
    for z1, e1, z2, e2 in re.findall(r"\['([^']*)', '([^']*)', '([^']*)', '([^']*)', \[", js):
        out += [{'en': e1, 'zh': z1, 'where': 'core-mods'}, {'en': e2, 'zh': z2, 'where': 'core-mods'}]
    return out

found = asyncio.run(static_strings()) + script_strings(page.read_text(encoding='utf8'))
current = {}
for it in found:
    current.setdefault(it['en'], it)

kp = here / 'keys.json'
keys = json.loads(kp.read_text(encoding='utf8')) if kp.exists() else []
known = {k['en'] for k in keys}
for k in keys:
    if k['en'] in current:
        k.pop('unused', None)
        k['zh'] = current[k['en']]['zh']
    else:
        k['unused'] = True
added = [it for en, it in current.items() if en not in known]
keys += added
kp.write_text(json.dumps(keys, ensure_ascii=False, indent=1), encoding='utf8')
print(f'{len(keys)} 条，新增 {len(added)}，不再使用 {sum(1 for k in keys if k.get("unused"))}')
for it in added:
    print(f'  新增 {keys.index(it):03d}：{it["en"]}')
