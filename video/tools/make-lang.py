#!/usr/bin/env python3
"""其他语言版本：从英文版 src/film-en.js 生成 src/film-<语言>.js（de、es、fr、pt、ru、id、vi、ja、ko；繁体中文用繁体中文界面，由 tools/make-zh-TW.py 从中文版生成）。

和官网首页的译文规则一致（../html/_src/i18n/README.md）：
- 产品界面示意不翻译。官网首页上，中文、繁体中文显示本文字的界面，其他语言都显示英文界面，所以这些版本里的终端、会话卡片、
  NocoBase 应用（供应商列表、工作流画布、能力卡片里的小界面）、Studio 控制台都沿用英文版，人名、币种也跟英文界面一致。
- 翻译片子对观众说的话：标题、页头、图注、结构图上的字（Core 底座、能力名称、发布线）、问题卡片、解决标签、
  Agent 状态标签、落版。官网已有的句子直接用官网的译文；用语按各语言文件开头的用语表。

做法：下面的 SLOTS 是英文版里每一处要换的文字，⟦键⟧ 是文案。tools/lang/<语言>.json 给出每个键的译文；
tools/lang/en.json 是英文原文，用它生成必须和 src/film-en.js 一字不差（脚本先自检这一步）。每处替换都要恰好命中
写明的次数。«…» 标出蓝色（NB）的那一段。时间表不动：事件表和中英文版逐条相同，音轨直接沿用。

用法（在 video 目录下，先运行 python3 tools/make-en.py）：python3 tools/make-lang.py [语言 …]（不写就生成全部）
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGS = ['de', 'es', 'fr', 'pt', 'ru', 'id', 'vi', 'ja', 'ko']
NAMES = {'de': 'German', 'es': 'Spanish', 'fr': 'French', 'pt': 'Portuguese (Brazil)', 'ru': 'Russian', 'id': 'Indonesian',
         'vi': 'Vietnamese', 'zh-TW': 'Traditional Chinese', 'ja': 'Japanese', 'ko': 'Korean'}

# 能力看板：名称、图标、颜色（颜色和图标让每一处在文件里唯一）
CAPS = [('capData', 'database', '#1677ff'), ('capPerm', 'shield', '#059669'), ('capFlow', 'git-branch', '#1677ff'),
        ('capAppr', 'list-checks', '#d97706'), ('capUsers', 'users', '#4f46e5'), ('capAuth', 'key-round', '#4f46e5'),
        ('capSrc', 'cable', '#0d9488'), ('capFiles', 'folder-open', '#d97706'), ('capNotif', 'bell', '#ef4444'),
        ('capMail', 'mail', '#0891b2'), ('capJobs', 'alarm-clock', '#ea580c'), ('capStages', 'workflow', '#7c3aed'),
        ('capPrint', 'printer', '#e11d48'), ('capKanban', 'kanban', '#0d9488'), ('capAsync', 'timer', '#475569'),
        ('capApi', 'braces', '#475569'), ('capAI', 'sparkles', '#7c3aed'), ('capKb', 'book-open', '#7c3aed'),
        ('capModels', 'shuffle', '#7c3aed'), ('capRec', 'history', '#475569'), ('capUI', 'layout-grid', '#1677ff'),
        ('capLang', 'languages', '#4f46e5'), ('capTheme', 'palette', '#db2777'), ('capDeploy', 'server', '#475569')]

# (模板, 命中次数[, 本语言的模板])。⟦k⟧ 是 JS 字符串里的文案；⟦k:js⟧ 是带 «蓝色» 的整段 JS 表达式；⟦wfRate⟧ 是打字间隔。
# 第三项用在英文版里没有、其他语言要加上的参数（Agent 状态标签的两个状态词，英文版用引擎默认的 Working / Done）
SLOTS = [
    ("const ASKQ = '⟦ask⟧';", 1),
    ("K.modeHTML('01', '⟦mode⟧')", 1),
    ('<span class="h1 split">⟦h1⟧</span><span class="h2 split">⟦h2⟧</span>', 1),
    ("{ t: '⟦p1t⟧', d: '⟦p1d⟧', by: 'NocoBase Core', fix: '⟦p1f⟧' }", 1),
    ("{ t: '⟦p2t⟧', d: '⟦p2d⟧', by: 'NocoBase Core', fix: '⟦p2f⟧' }", 1),
    ("{ t: '⟦p3t⟧', d: '⟦p3d⟧', by: 'NocoBase Studio', fix: '⟦p3f⟧' }", 1),
    ("{ t: '⟦p4t⟧', d: '⟦p4d⟧', by: 'NocoBase Studio', fix: '⟦p4f⟧' }", 1),
    ("const WARN = ['⟦w1⟧', '⟦w2⟧', '⟦w3⟧'];", 1),
    ('<div class="pend"><small>⟦pend⟧</small>', 1),
    ('<small>Maya Brooks · ⟦joined⟧</small><span>⟦p4q⟧</span>', 1),
    ('<div id="bPos">⟦pos⟧</div>', 1),
    ("${ic('bot')}⟦role0⟧</span>", 1),
    ('<span class="en">NocoBase</span></span>⟦role1⟧</span>', 1),
    ("${ic('user-round')}⟦role2⟧</span>", 1),
    ("S.stack.html({ chips: ['⟦cPerm⟧', '⟦cFlow⟧', '⟦cNotif⟧'], focusChip: '⟦cPerm⟧', more: '⟦more⟧', baseSub: '⟦baseSub⟧', codeLabel: '⟦codeLabel⟧', codeBy: '⟦codeBy⟧',", 1),
    ("K.chapHTML('chC', 'Core', ⟦core:js⟧)", 1),
    ("K.ftlH('ftP', 'NocoBase Core · ⟦bb⟧', '⟦permT⟧', '⟦permD⟧', 'ftl ctr')", 1),
    ('<span class="hu"><b>⟦huB⟧</b>⟦huT⟧</span><span class="ag"><b>⟦agB⟧</b>⟦agT⟧</span>', 1),
    ('<span class="k">⟦wfBy⟧</span><span class="r"></span><span class="f">server/workflows/<b>⟦wfLines⟧</b></span>', 1),
    ("K.ftl('ftW', 'NocoBase Core · ⟦bb⟧', '⟦flowT⟧', '⟦flowD⟧')", 1),
    ("<span class=\"ic\">${ic('git-branch')}</span>⟦wfFoot⟧</div>", 1),
    ("K.typeOn($('#wfStrip .r'), '⟦wfRule⟧', at + 0.95, ⟦wfRate⟧);", 1),
    ('<i class="pl">+</i><span>⟦cbUnit⟧</span></div>', 1),
    ("K.tcard('tWall', ⟦wall:js⟧, 336)}<div id=\"tWsub\">⟦wallSub⟧</div>", 1),
    *[(f"['⟦{k}⟧', '{icon}', '{color}'", 1) for k, icon, color in CAPS],
    ("K.ftlH('aT', 'NocoBase Core', '⟦archT⟧', '⟦archD⟧', 'hubT')", 1),
    ("['⟦pj1⟧', '⟦pj2⟧', '⟦pj3⟧'].map((x) => `<span>${x}</span>`)", 1),
    ("pill('', 'run', '⟦consistent⟧ · 3 / 3')", 1),
    ("f + ' · ⟦toStd⟧'", 1),
    ("'Expiry alerts · ⟦toStd⟧', 'done'", 1),
    ("K.chapHTML('chS', 'Studio', ⟦studio:js⟧)", 1),
    ("K.ftlH('cT0', 'NocoBase Studio', '⟦s0t⟧', '⟦s0d⟧', 'hubT')", 1),
    ("K.ftlH('cT1', 'NocoBase Studio', '⟦s1t⟧', '⟦s1d⟧', 'hubT')", 1),
    ("K.ftlH('cT2', 'NocoBase Studio', '⟦s2t⟧', '⟦s2d⟧', 'hubT')", 1),
    ("K.ftlH('cT3', 'NocoBase Studio', '⟦s3t⟧', '⟦s3d⟧', 'hubT')", 1),
    ("K.agentAs('agtS', '⟦coord⟧', '⟦assign⟧',", 2),
    ("K.agentAs('agtS', 'Codex · GPT-5.5', '⟦scoring⟧',", 1),
    ("K.agentAs('agtS', 'Claude · Sonnet 5.5', '⟦tests⟧',", 1),
    ("K.agentAs('agtS', 'Claude · Opus 5.5', '⟦review⟧',", 2),
    ("K.agentAs('agtS', '⟦coord⟧', '⟦evidence⟧',", 2),
    ("K.agentAs('agtS', 'Claude Code', '⟦readMem⟧',", 2),
    ("clk('<b>23:40</b> · ⟦offline⟧',", 1),
    ("K.tcard('tY', ⟦year:js⟧, 176)", 1),
    ('<div id="yCnt">⟦wpre⟧<b id="yW">1</b>⟦wpost⟧ · ⟦ver⟧ <b id="yV">v1.0</b></div>', 1),
    ('<i></i>⟦wpre⟧${w}⟦wpost⟧</span>', 1),
    ('<small>⟦wpre⟧${d}⟦wpost⟧</small>', 1),
    ("const YEAR = [[2, '⟦y1⟧'], [3, '⟦y2⟧'], [6, '⟦y3⟧'], [8, '⟦y4⟧'], [14, '⟦y5⟧'], [26, '⟦y6⟧'], [39, '⟦y7⟧'], [48, '⟦y8⟧']];", 1),
    ('<div id="eZh" class="split">⟦end⟧</div><div id="endTags">⟦tag1⟧ · ⟦tag2⟧ · ⟦tag3⟧</div>', 1),
    ("K.agentChip('agtA', { cls: 'tr' })", 1, "K.agentChip('agtA', { cls: 'tr', labels: ['⟦chipRun⟧', '⟦chipDone⟧'] })"),
    ("K.agentChip('agtS', { cls: 'tr' })", 1, "K.agentChip('agtS', { cls: 'tr', labels: ['⟦chipRun⟧', '⟦chipDone⟧'] })"),
]
HEADER = ("brand film, v3.1 (118 s, 16:9, English) — GENERATED by tools/make-en.py from src/film.js; edit the script, not this file.",
          "brand film, v3.1 (118 s, 16:9, {name}) — GENERATED by tools/make-lang.py from src/film-en.js and tools/lang/{lang}.json; edit those, not this file.")
TYPED = 36 * 0.03   # the finance rule types in English's time (36 characters × 0.03 s)


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def js_expr(s):
    """'a «b» c' → 'a ' + NB('b') + ' c'（空的部分不写）"""
    parts = re.split(r'«(.*?)»', s)
    out = []
    for i, p in enumerate(parts):
        if not p:
            continue
        out.append(f"NB('{esc(p)}')" if i % 2 else f"'{esc(p)}'")
    return ' + '.join(out)


def fill(tpl, v):
    def sub(m):
        k = m.group(1)
        if k == 'wfRate':
            return str(round(TYPED / len(v['wfRule']), 4)) if v['wfRule'] != EN['wfRule'] else '0.03'
        if k.endswith(':js'):
            return js_expr(v[k[:-3]])
        return esc(v[k])
    return re.sub(r'⟦([^⟧]+)⟧', sub, tpl)


EN = json.loads((ROOT / 'tools/lang/en.json').read_text(encoding='utf-8'))
SRC = (ROOT / 'src/film-en.js').read_text(encoding='utf-8')


def build(lang, v):
    s, errors = SRC, []
    keys = set(re.findall(r'⟦([^⟧:]+)', ''.join(t[-1] if len(t) == 3 else t[0] for t in SLOTS))) - {'wfRate'}
    missing = sorted(keys - set(v))
    if missing:
        return None, [f'missing keys: {", ".join(missing)}']
    for slot in SLOTS:
        tpl, n = slot[0], slot[1]
        old, new = fill(tpl, EN), fill(slot[2] if len(slot) == 3 and lang != 'en' else tpl, v)
        k = s.count(old)
        if k != n:
            errors.append(f'{k}× (expected {n}): {old[:80]}')
            continue
        s = s.replace(old, new)
    if lang != 'en':
        if s.count(HEADER[0]) != 1:
            errors.append('header comment not found')
        s = s.replace(HEADER[0], HEADER[1].format(name=NAMES[lang], lang=lang))
    return s, errors


# 自检：英文原文按同一张表生成，必须和 film-en.js 一字不差
out, errs = build('en', EN)
if errs or out != SRC:
    print('make-lang: the English table does not reproduce src/film-en.js')
    for e in errs:
        print('  ' + e)
    sys.exit(1)

failed = False
for lang in (sys.argv[1:] or LANGS):
    v = json.loads((ROOT / f'tools/lang/{lang}.json').read_text(encoding='utf-8'))
    s, errs = build(lang, v)
    if errs:
        failed = True
        print(f'make-lang {lang}: {len(errs)} problem(s)')
        for e in errs:
            print('  ' + e)
        continue
    (ROOT / f'src/film-{lang}.js').write_text(s, encoding='utf-8')
    print(f'src/film-{lang}.js written')
sys.exit(1 if failed else 0)
