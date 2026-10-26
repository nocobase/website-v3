#!/usr/bin/env python3
"""繁体中文的产品界面示意：从首页抽出界面文字（脚本里 L() 的中文、{ zh: … } 数据、NAMES_ZH 的人名，
模板 <template> 里成对的 <t-zh>…</t-zh><t-en>…</t-en> 的中文），
转成繁体中文（台湾用语），写进 ui.zh-TW.json；build.py 把它放进 assets/i18n/home.zh-TW.js 的 ui，
首页切到繁体中文时 L() 按它显示繁体中文界面。在 _src 下运行 python3 i18n/ui_tw.py ..（需要 macOS 的 swift）

- 先用系统自带的简繁转换（ICU 的 Hans-Hant，i18n/s2t.swift），再按台湾用语逐条替换（tw.py 的 TERMS）。
- ui.zh-TW.json 里已有的条目保留不动（可以手改），只补新出现的；页面上已经没有的删掉。
- 最后检查：转换结果里不应还有简体字。
"""
import json, re, sys
from pathlib import Path

from tw import convert, leftover

here = Path(__file__).resolve().parent
site = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else here.parent.parent
page = (site / 'index.html').read_text(encoding='utf8')
i = page.index('var L = function'); body = page[i:page.index('</script>', i)]


def lit(m):
    return m.group(1) if m.group(1) is not None else m.group(2)


STR = r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\""
keys = []
for m in re.finditer(r"\bL\(\s*(?:" + STR + r")\s*,", body):          # L('中文', 'English')
    keys.append(lit(m))
for m in re.finditer(r"\bzh:\s*(?:" + STR + r")", body):              # { zh: '…', en: '…' }，经 L(d.zh, d.en) 显示
    keys.append(lit(m))
for t in re.findall(r'<template id="[^"]+">(.*?)</template>', page, re.S):   # 模板里的界面示意（Studio、各 Solution）
    keys += re.findall(r'<t-zh>([\s\S]*?)</t-zh>\s*<t-en>', t)
nm = re.search(r"NAMES_ZH\s*=\s*\{([^}]*)\}", body)                    # 人名
keys += re.findall(r"'([^']+)'", nm.group(1)) if nm else []
keys = [k for k in dict.fromkeys(keys) if re.search(r'[一-鿿]', k) and k not in ('简体中文',)]

out_f = here / 'ui.zh-TW.json'
old = json.loads(out_f.read_text(encoding='utf8')) if out_f.exists() else {}
new_keys = [k for k in keys if k not in old]
conv = dict(zip(new_keys, convert(new_keys))) if new_keys else {}
ui = {k: old.get(k, conv.get(k)) for k in keys}
left = leftover(list(ui.values()))
out_f.write_text(json.dumps(ui, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
print(f'ui.zh-TW.json: {len(ui)} 条（新增 {len(new_keys)}，删掉 {len(set(old) - set(ui))}）')
if left:
    print('还有简体字：'); [print('  ' + v) for v in left]; sys.exit(1)
