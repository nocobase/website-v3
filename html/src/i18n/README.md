# 官网的其他语言

中文、英文直接写在页面源文件里（`<t-zh>` / `<t-en>`、首页脚本里的 `L()` / `M()`）。西班牙语、法语、德语、葡萄牙语（巴西）、俄语、印尼语、越南语、繁体中文、日语、韩语的译文在这个目录里，构建（`pnpm build`）时直接写进各语言的页面，页面不再在浏览器里加载译文。缺某条译文时页面显示英文，不会出错。

## 文件

所有文件都是 YAML，一个组一套，组是首页 `home`、导航页脚和表单提示 `site`，以及各子页面 `core`、`studio`、`solutions`、`crm`、`itam`、`pricing`、`partner`、`find-partner`、`contact`（组和页面的对应在 `scripts/lib/i18n.mjs` 的 `PAGE_GROUPS`）：

- `<组>.keys.yaml`：要翻译的条目，由 `pnpm i18n:extract` 从页面抽取，不要手改。`meta` 是页面标题和描述的中英文；`items` 按编号列出每条的英文原文 `en`、中文原文 `zh`、所在位置 `where`，页面上已经没有的标记 `unused: true`，同一段英文在页面上意思不同时有单独的键 `k`（正文里写 `<t-en data-k="…">`）。
- `<组>.<语言>.yaml`：一种语言的译文，人直接改这个文件。`notes` 是这种语言的写法和固定用语（如德语用 Sie、foundation 译作 Fundament），`title`、`description` 是页面标题和描述（`site` 组没有），`strings` 按编号写译文；繁体中文的文件另有 `ui`：产品界面示意图里的简体中文 → 繁体中文。

```yaml
notes: |-
  Deutsch（Sie）
  术语：foundation = Fundament；building blocks = Bausteine
title: NocoBase Core — Ihre Agenten kümmern sich um die Geschäftslogik
description: NocoBase Core ist das Open-Source-Anwendungsfundament …
strings:
  "000": Ihre Agenten kümmern sich um die Geschäftslogik. <span class="m">Das Fundament steht bereit.</span>
  "002": Schnellstart
```

译文用编号而不用英文原文做键：英文原文常常很长、带 HTML 标记，用编号的文件好读；而且英文改了就是一条新编号的新条目，旧译文不会被悄悄套在新原文上，缺的那条会在检查里列出来。编号和原文的对应查 `<组>.keys.yaml`。

YAML 的写法：含冒号加空格、`#`、引号或以特殊字符开头的译文要加引号，`pnpm i18n:extract` 写回文件时会自动加；编号一律写成带引号的三位数（`"000"`）。改完运行 `pnpm i18n:check`，格式错了会报错。

## 改了页面文案之后

1. 在 `html/` 下运行 `pnpm i18n:extract`：已有编号不变，英文原文变了或新出现的条目追加在末尾，页面上已删掉的标记 `unused: true`。它同时更新繁体中文的界面文字：新出现的以空值写进 `<组>.zh-TW.yaml` 的 `ui`，并列出「待填写」的条目，页面上已经没有的删掉。
2. 在各语言的 `<组>.<语言>.yaml` 的 `strings` 里补上新编号的译文；繁体中文在 `ui` 里把空值填成繁体中文（台湾用语，见 `ui-terms.md`）。
3. 运行 `pnpm i18n:check`：列出缺的译文，格式错误会让它失败（构建时也会检查）；`pnpm build` 后用 `pnpm preview` 看一遍。

`pnpm i18n:extract` 和 `pnpm i18n:check` 都只用 Node，Linux 上也能运行；繁体中文不再自动从简体转换，由人直接写。构建时繁体中文缺的界面文字显示简体中文并打印警告，不会失败。

## 哪些翻译，哪些不翻译

- **翻译**：营销文案、导航、页脚、表单，以及结构图上的说明（Core 图、Hero 下方的 Core 能力条、Hero 收尾卡片、Solution 左侧的应用说明）。
- **不翻译**：产品界面示意图（`.fit-in` 里的内容，首页 `<template>` 里的界面，首页脚本里的 `L()`）。简体中文显示中文界面，繁体中文显示繁体中文界面（`ui`），其他语言都显示英文界面，不展示不存在的界面语言。产品界面上的名称照 `ui-terms.md` 写：中文以外的语言照英文界面原样写（如 Studio 的 My issues、My sessions、Runtimes），繁体中文写繁体；NocoCRM、NocoITAM 两页只换字形（線索、審批）。人名转成繁体，金额用 NT$，数字不变。
- **只给中文的内容**：用 `.zh-only`（如定价页的信创数据库一行、联系页的微信和国内地址），中文以外的语言都不显示，里面不写 `<t-en>`。
- **表单**：联系、伙伴两页的表单，简体中文提交到 NocoBase 2 的中文表单，其他语言提交到英文表单。标签用 `<t-en>`；输入框占位、选项文字、提交成功提示写在 `data-ph-en`、`data-text-en`、`data-ok-en` 上，一并抽取；`src/assets/public-form.js` 的提示语写成 `T(中文, 英文)`，归在 `site` 组；联系页两道选择题的选项来自英文表单的字段，列在 `scripts/i18n.mjs` 的 `FORM_OPTIONS`，表单字段改了要跟着改。国家列表保持英文。表单在浏览器里要用的译文由构建内联进页面。
- 价格：其他语言写美元，按各语言习惯写数字（见 `pricing.<语言>.yaml` 的 `notes`）。

## 写作标准

和英文版《NocoBase Product Definition and Messaging》同一个标准：

- 按这门语言里同类产品的习惯来写，不逐字翻译，也不改原意。繁体中文从简体中文原文改写成台湾用语，不从英文转译。
- 一个概念在全页只用一种说法，见各文件 `notes` 里的用语。比如 foundation（底座）：法语 socle、德语 Fundament、越南语 nền móng（与表示"平台"的 nền tảng 区分）、日语 基盤。
- 按位置控制长度。Hero 大标题不换行显示，要短；Hero 下方 Core 能力条每格约 72px，西文约 11 个字母、中日韩约 5 个字；卡片标题控制在一行半以内。
- "AI + NocoBase" 是品牌组合，各语言都不翻译；正文里的 AI 用当地习惯（德语 KI、法语和西语 IA、俄语 ИИ）。
- 英文原文带 `<br>`、`<span class="...">` 的，译文保留同样的标记（中文、日文、韩文可按中文原文的写法去掉 `<br>`）；首页条目里的占位符（如 `{app}`）要保留。
- 法文 `? ! : ;` 前的不换行空格、数字和 `%` 之间的不换行空格由构建自动加，译文里写普通空格。

改完构建并用浏览器在 1440、1180、768、390 几个宽度看一遍：标题和能力条不能溢出。
