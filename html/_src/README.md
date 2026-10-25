# 官网页面源文件

页面 HTML 由这里的脚本生成，改完后重新生成即可（在 `_src` 目录下运行）。

- `pages/*.body.html`：各页正文（中英双语，`<t-zh>` / `<t-en>`）。生成：`python3 pages/wrap.py pages/core.body.html ../core.html`
- `pages/gen_sol.py`：用 HTML 画 NocoCRM、NocoITAM 的界面示意，输出到 `pages/snips/`；正文里用 `{{SNIP:名称:宽度}}` 引用。改完先运行它，再运行 wrap.py。
- `sol/figs/`：从首页提取的 Studio、Core 图纸（中英两份），正文里用 `{{FIG:名称:宽度}}` 引用。
- `blog/fetch.py`：从 nocobase.com 抓取博客（中英文）到 `posts.json`；`blog/gen_blog.py ..` 生成列表页 `blog.html` 和文章页 `blog/*.html`。
- `blog/cs-posts.json`：客户案例（官网博客「客户故事」分类，中英文）。`blog/gen_blog.py` 同时生成 `customers.html` 与 `customers/*.html`；博客列表不再包含客户故事。阳光电源目前只有标题和摘要（写在 gen_blog.py 的 SUNGROW 里），拿到全文后补进去即可。
- `pages/gen_wow.py`：解决方案页的场景大图（依赖 gen_sol.py）。
- `pages/gen_more.py`：第二批界面示意（NocoReach 数据源与数据健康、NocoCRM 客户时间线 / 邮箱 / WhatsApp、Studio 会话联动与发布、伙伴页）。它会顺带运行 gen_wow.py 和 gen_sol.py，所以改任何图之后运行它一次即可，再运行 wrap.py。
- 伙伴页：`pages/partner.body.html`（成为伙伴）、`pages/find-partner.body.html`（寻找伙伴）；导航与页脚链接在 `assets/site.js`，首页的静态导航在 `homepage.html` 里单独改。
- 首页的其他 10 种语言：译文在 `i18n/home.<语言>.txt`，运行 `python3 i18n/build.py ..` 生成 `assets/i18n/`，做法和写作标准见 `i18n/README.md`。首页改了中英文文案，要同步更新 `i18n/keys.json` 和各语言译文。其他页面只有中英文，选了别的语言时显示英文。
- `pages/inject_home.py`：首页不走 wrap.py。首页 Studio 段的图（大图 studioHero，小图 homeMyAgent、homeFleet、homeSkills）放在 `<!-- SNIP:名称 -->` 标记之间，改完 gen_more.py 后运行它填进 `homepage.html`。首页 Hero 的「我的 Agent」演示写在 homepage.html 的脚本里（heroFig / start / approve），样式在页面内联样式和 `assets/site.css` 末尾各有一份。
- 子目录里的页面：正文头部写 `root: ../`，wrap.py 会把样式和脚本路径往上找一级，`assets/site.js` 按 `<body data-root>` 给导航和页脚链接补前缀。gen_blog.py 写 `blog/`、`customers/` 下的页面时会自动加上，并把正文里的站内相对链接改成 `../`。
- `pages/gen_home_sol.py`：首页 Solutions 段六款应用各一张专属图，写进 `homepage.html` 的 `<!-- SOLTPL -->` 标记之间（`<template id="tpl-crm|itam|reach|support|project|hr">`）。NocoCRM、NocoITAM、NocoReach 直接取自三个内页**成品 HTML**（`solution-*.html`）里最核心的图，内页的图改过后，在 `_src` 目录下运行 `python3 pages/gen_home_sol.py ..` 即可同步；NocoSupport、NocoProject、NocoHR 还没有内页，图在脚本里直接写。首页按 880 宽排（和 Studio 段的图同一字号），放不下的内容在脚本里删减（时间线、表格行、卡片数），内页不受影响。左侧选中应用时展开的那句话和「了解 →」链接写在首页脚本的 `getAPPS()` 里。
- `reach/`：NocoReach 页的产品界面图（洞察、机会、任务审核、回复草稿、提修改意见、做法、按 Agent 看任务、成果、AI 搜索、交给 Agent 接入、数据健康）。不再用官网样式仿画：`figs.html` 加载产品自己的样式表 `product.css`（NocoReach main 编译出的 CSS），`figs.js` 按产品页面的结构写，数据用 NocoReach 宣传片里的 Acme 例子，中英各一份。改图后在 `html/` 下运行 `node _src/reach/shoot.mjs [图名…]`（需要 Chrome 和 cwebp），输出无损的 `assets/reach/<图名>-<zh|en>.webp`，页面里用 `<div class="sheet app-shot">` 引用；图的尺寸变了要同步改 `<img>` 的 width、height。产品界面改版后，从 NocoReach 的开发服务器取新的 CSS 替换 `product.css` 再重拍。首页和 Solution 页的 NocoReach 图用的是同一张洞察图（`gen_home_sol.py`）。
- 注意：Core、Studio、Solution 三个产品页（`core.html`、`studio.html`、`solutions.html`）已按《NocoBase 产品定义与标准表述》重写，`pages/core|studio|solutions.body.html` 就是最新的，改完直接运行 wrap.py。其他内页的成品 HTML 仍比 `pages/*.body.html` 新（文案在成品页上直接改过），在把正文同步回源文件之前，不要用 wrap.py 重新生成它们。
- 三个产品页的结构：品牌表达做 H1，定义做导语，核心特色按标准文稿的顺序各一节（标题用特色原文，导语先说「问题与方案」里对应的问题，再说方案；问题句要一读就是困难。Studio「一支持续推进的 Agent 团队」一节只留方案：那句问题以「同时处理多个项目和任务」开头，读者会先当成 Studio 的能力），然后是开源与私有部署、开始使用。和 Vibe Coding 的对比只放在首页 FAQ，产品页不放：只列其中几行会让读者以为那就是全部区别。改文案先改标准文稿，再从它摘录。
- `pages/gen_home_studio.py`：首页 Studio 段四条核心特色各一张图（运行环境、我的任务、等你验收、技能 / 知识库 / 项目记忆），写进 `homepage.html` 的 `<!-- STUDIOTPL -->` 标记之间（`<template id="stv-team|progress|decide|memory">`），样式写在 `/* HOME-STUDIO */` 标记之间。同一批图还写到 `pages/snips/stvTeam|stvProgress|stvDecide|stvMemory.html` 给 Studio 页用，样式同步到 `assets/site.css` 的 STUDIO-UI 之后。左侧四条特色的文字直接写在 `homepage.html` 里，取自标准文稿。改图后在 `_src` 下运行 `python3 pages/gen_home_studio.py ..`，再用 wrap.py 重新生成 Studio 页。
- `pages/gen_home_sol.py` 同时把六张应用图写到 `pages/snips/solCrm|solItam|solReach|solSupport|solProject|solHr.html`，Solution 页的应用列表用它们；改图后运行它，再用 wrap.py 重新生成 Solution 页。Solution 页左侧每款应用的一句话和首页 `getAPPS()` 保持一致。
- `pages/gen_product_figs.py`：产品页自己的三张图——Core 首屏（`coreStack`，和首页 `coreFig()` 是同一张，数据两处一起改）、Core「为 Agent 提供统一的架构和规范」（`coreRepo`，目录、技能名和规则对照 NocoBase 3 应用模板的 `AGENTS.md` 与 `.agents/skills/`）、Studio「各项进展一目了然」（`studioDash`，仪表盘和用量页的字段对照 nocobase-studio 仓库 dev 分支）。它还把 `pages/product-pages.css`（三个产品页共用的组件样式）同步到 `assets/site.css` 末尾的 `/* PRODUCT-PAGES */` 标记之间。改图或样式后运行 `python3 pages/gen_product_figs.py ..`，再运行 wrap.py。
- `pages/gen_studio_figs.py`：按真实 Studio 截图的样式画的四张 Studio 界面图——我的任务（Studio 页首屏）、运行环境、业务专家主导的任务、受治理的流水线，输出到 `pages/snips/studioHero|homeFleet|homeExpert|homeGovern.html`，Studio 页首屏用 `{{SNIP:studioHero:1120}}` 引用。样式在 `pages/studio-ui.css`，脚本会把它同步到 `assets/site.css` 末尾和首页内联样式末尾（`/* STUDIO-UI */` 标记之间）。改图或改样式后，在 `_src` 下运行 `python3 pages/gen_studio_figs.py ..`，再用 wrap.py 重新生成 Studio 页。不要再用 `inject_home.py` 处理这几张图。
