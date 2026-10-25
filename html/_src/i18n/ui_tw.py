#!/usr/bin/env python3
"""繁体中文的产品界面示意：从首页抽出界面文字（脚本里 L() 的中文、{ zh: … } 数据、NAMES_ZH 的人名，
模板 <template> 里成对的 <t-zh>…</t-zh><t-en>…</t-en> 的中文），
转成繁体中文（台湾用语），写进 ui.zh-TW.json；build.py 把它放进 assets/i18n/home.zh-TW.js 的 ui，
首页切到繁体中文时 L() 按它显示繁体中文界面。在 _src 下运行 python3 i18n/ui_tw.py ..（需要 macOS 的 swift）

- 先用系统自带的简繁转换（ICU 的 Hans-Hant，i18n/s2t.swift），再按台湾用语逐条替换（TERMS）。
- ui.zh-TW.json 里已有的条目保留不动（可以手改），只补新出现的；页面上已经没有的删掉。
- 最后检查：转换结果里不应还有简体字。
"""
import json, re, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent
site = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else here.parent.parent
page = (site / 'homepage.html').read_text(encoding='utf8')
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

TERMS = [
    ('¥', 'NT$'),
    ('會話上下文', '對話脈絡'), ('當前會話', '目前對話'), ('會話', '對話'), ('對話里', '對話裡'), ('環境里', '環境裡'),
    ('儀錶盤', '儀表板'), ('項目', '專案'), ('質檢', '品檢'), ('質量', '品質'), ('功能與用例', '功能與測試案例'), ('發佈', '發布'),
    ('運行環境', '執行環境'), ('運行設備', '執行裝置'), ('運行', '執行'),
    ('合同額', '合約金額'), ('合同', '合約'),
    ('審批工作流', '簽核流程'), ('審批', '簽核'),
    ('導出', '匯出'), ('模板', '範本'), ('字段', '欄位'), ('數據', '資料'), ('搜索', '搜尋'), ('實時', '即時'), ('發送', '傳送'),
    ('個文件', '個檔案'), ('創建', '建立'),
    ('代碼評審', '程式碼審查'), ('寫代碼', '寫程式'), ('代碼', '程式碼'), ('評審', '審查'),
    ('發布到生產', '發布到正式環境'), ('已進入生產', '已進入正式環境'), ('生產 ✓', '正式 ✓'),
    ('回復', '回覆'), ('底座', '基礎平台'), ('構建', '打造'), ('瞭解', '了解'), ('演示視頻', '示範影片'), ('台賬', '台帳'),
    ('記錄', '紀錄'), ('驗收場景', '驗收情境'), ('個場景', '個情境'),
    ('在線客服', '線上客服'), ('在線', '線上'), ('當前', '目前'), ('編碼工具', '開發工具'), ('導入', '匯入'), ('新建任務', '新增任務'),
    ('執行計劃', '執行計畫'), ('啓', '啟'), ('覈實', '核實'), ('已覈實', '已核實'), ('定制', '客製'), ('全局', '全域'), ('反饋', '回饋'),
    ('倉庫', '儲存庫'), ('打開文檔', '開啟文件'), ('文檔', '文件'), ('賬號', '帳號'), ('登錄', '登入'), ('時區設置', '時區設定'),
    ('設置', '設定'), ('個人信息', '個人資料'), ('信息', '資訊'), ('內存', '記憶體'), ('示例', '範例'), ('渠道', '通路'),
    ('返點', '回饋'), ('首周', '首週'), ('2 周', '2 週'), ('第 3 周', '第 3 週'), ('咨詢', '諮詢'), ('重復', '重複'),
    ('一並', '一併'), ('席位里', '席位裡'), ('拿不准', '拿不準'), ('拖拽', '拖曳'), ('高級後端', '資深後端'),
    ('身份', '身分'), ('企業郵箱', '公司信箱'), ('調休', '補休'), ('東南亞出海', '東南亞拓展'), ('關注', '追蹤'),
    ('常規諮詢直接閉環', '一般諮詢直接結案'), ('客戶分級口徑', '客戶分級標準'), ('在崗', '值班中'), ('線索', '潛客'),
    ('本季度', '本季'), ('顯示器', '螢幕'), ('現場支持', '現場支援'), ('研發崗位', '研發職位'), ('在本地跑多容器聯調', '在本機跑多容器整合測試'),
    ('高配開發機', '高規開發機'),
]


def s2t(lines):
    r = subprocess.run(['swift', str(here / 's2t.swift')], input='\n'.join(lines) + '\n', capture_output=True, text=True, check=True)
    return r.stdout.rstrip('\n').split('\n')


out_f = here / 'ui.zh-TW.json'
old = json.loads(out_f.read_text(encoding='utf8')) if out_f.exists() else {}
new_keys = [k for k in keys if k not in old]
conv = {}
if new_keys:
    for k, v in zip(new_keys, s2t(new_keys)):
        for a, b in TERMS:
            v = v.replace(a, b)
        conv[k] = v
ui = {k: old.get(k, conv.get(k)) for k in keys}
left = [v for v, c in zip(ui.values(), s2t(list(ui.values()))) if c.replace('一目瞭然', '一目了然').replace('瞭解', '了解') != v]
out_f.write_text(json.dumps(ui, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
print(f'ui.zh-TW.json: {len(ui)} 条（新增 {len(new_keys)}，删掉 {len(set(old) - set(ui))}）')
if left:
    print('还有简体字：'); [print('  ' + v) for v in left]; sys.exit(1)
