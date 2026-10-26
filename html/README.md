# 官网

`html/` 是 www.nocobase.com 的源码。`src/` 里只放源文件，`scripts/` 里是构建和维护用的脚本（Node.js），`pnpm build` 按语言生成整站静态页面到 `dist/`。`dist/` 和 `node_modules/` 不提交：只改源文件，构建产物交给 CI 生成和发布。

## 本地开发

需要 Node 24 和 pnpm 11（版本写在 `package.json` 的 `packageManager`，用 `corepack enable` 或自己安装）。在 `html/` 下：

```bash
pnpm install        # 安装依赖（yaml、marked）
pnpm build          # 生成 dist/，打印各语言的页面数；链接坏了、译文格式错了会失败
pnpm preview        # 本地预览 http://localhost:4322/，按 CDN 回源规则映射地址（PORT 可以换端口）
```

改完源文件重新运行 `pnpm build`，刷新预览页面看效果。预览服务器和线上一样：`/core` 和 `/core/` 都读 `core/index.html`，`/en/…` 当成根目录，找不到的地址返回根目录的 `404.html`、状态码 404。其他命令：`pnpm test`（构建脚本的测试）、`pnpm i18n:extract` 和 `pnpm i18n:check`（译文，见 `src/i18n/README.md`）、`pnpm figs`（重新生成界面示意图）、`pnpm cms:import`（导入 CMS 的博客文章）、`pnpm fonts`（重新下载字体）。

## 产物和地址

每页输出成 `<路径>/index.html`，地址不带扩展名、以 `/` 结尾，站内链接和资源都用根路径。这是 CDN 回源规则（`scripts/deploy-cdn/deploy-cdn.mjs` 的 `REWRITE_RULES`）依赖的格式，改了线上会整站 404。

- 语言目录：英文在根目录（`/`、`/core/`），其他语言在 `/<目录>/` 下，目录名和 NocoBase 3 插件的语言文件同名：`zh-CN zh-TW ja-JP ko-KR es-ES fr-FR de-DE pt-BR ru-RU id-ID vi-VN`。`<html lang>` 和 hreflang 英文用 `en`，其他用目录名，`x-default` 指向英文。不要生成 `/en/` 目录（CDN 把 `/en/…` 映射到根目录）。语言代码和目录的对应在 `scripts/lib/config.mjs`。
- 首页、Core、Studio、Solution 总览、NocoCRM、NocoITAM、定价、成为伙伴、寻找伙伴、联系我们有 12 种语言；NocoReach、博客（`/blog/`、`/blog/<slug>/`）、客户案例（`/customers/`、`/customers/<slug>/`）、更新日志（`/changelog/`）只有英文和 `/zh-CN/`，语言菜单里其他语言链接到英文版。
- 根目录另有 `404.html`（英文，发布时另外上传到 bucket 根目录，任意深度的地址都会返回它）、`sitemap.xml`（每个地址带这页所有语言的 hreflang）、`robots.txt`。站点域名读环境变量 `SITE_ORIGIN`，默认 `https://www.nocobase.com`，canonical、hreflang、sitemap 都用它。
- 不按浏览器语言自动跳转，语言切换是普通链接。每种语言是单独的页面，页面脚本里的 `window.__lang` 是构建时写好的语言代码（`zh`、`en`、`de`……）。

构建时检查：站内链接指向的页面和文件都存在、译文格式正确、每种语言的页面数一致、产物根目录没有会被 CDN 规则误处理的名字（`en`、`api`）。缺的译文显示英文，繁体中文缺的界面文字显示简体中文，只打印警告；博客正文（来自 CMS）里写坏的相对链接也只打印警告，在 CMS 里改。

## 改页面要改哪些文件

- **子页面正文**：`src/pages/<名称>.body.html`，中英双语（`<t-zh>…</t-zh><t-en>…</t-en>`、`.zh-only` / `.en-only`、表单上的 `data-ph-zh` / `data-ph-en`）。头部的元信息（`page`、`title_zh`、`title_en`、`desc_zh`、`desc_en`、`i18n`、`scripts`、`langs`、`noindex`）见 `scripts/lib/pages.mjs` 开头的说明。正文开头可以有一段 `<style>`（放进 head），`<!-- AFTER-MAIN -->` 之后是页面自己的脚本。正文里的 `{{SNIP:名称:宽度}}` 引用 `src/pages/snips/` 里的界面示意，`{{DOCS}}` 是文档站 `https://docs.nocobase.com/`。改了中英文文案，再按 `src/i18n/README.md` 更新其他语言。
- **站内链接**：一律写成源文件名，`core.html`、`index.html`、`contact.html#contact`、`blog/<slug>.html`，构建时换成各语言的地址（这页没有该语言时换成英文地址）；资源写 `assets/…`，构建时换成 `/assets/…`。文档站的链接写英文地址，中文页面构建时补上 `zh-CN/`。
- **首页**：`src/pages/home.html` 是完整的页面（自己的导航、页脚、样式和脚本），构建时换掉 head 里 `<!-- HEAD -->` 标记、语言菜单的 `<!-- LANG-MENU -->` / `<!-- LANG-MENU-M -->` 标记，按语言处理正文。脚本里界面文字用 `L(中文, 英文)`，要翻译的营销文案用 `M(中文, 英文)`。
- **导航和页脚**：子页面的在 `scripts/lib/shell.mjs`，首页的写在 `src/pages/home.html`，两处一起改。顶部「资源」里的更新日志还没有已发布的 v3 版本，暂时置灰（`.soon`），有内容后两处一起改回链接。
- **404 页**：`src/pages/404.body.html`（只有英文，`noindex`）。
- **博客、客户案例、更新日志**：数据在 `src/blog/`（`posts.json`、`cs-posts.json`、`releases.json`），页面结构在 `scripts/lib/blog.mjs`、`scripts/lib/changelog.mjs`。`src/blog/cms/articles/` 是 CMS（cms.aliyun.nocobase.com）的镜像，`pnpm cms:import` 把它合并进 `posts.json` 和 `releases.json`（显示规则见 `scripts/cms-import.mjs` 开头），导入时把指向 v2 文档的旧地址换成 `nocode.docs.nocobase.com`。阳光电源的客户案例目前只有标题和摘要（`scripts/lib/blog.mjs` 的 `SUNGROW`）。v2 及更早版本的更新日志在旧官网，更新日志页顶部有链接。
- **共用的样式和脚本**：`src/assets/site.css`、`src/assets/site.js`（手机菜单、图纸缩放等交互，不处理语言）、`src/assets/public-form.js`（联系、伙伴页的表单，提交到 NocoBase 2 的公开表单）。CSS 里按语言的写法用页面的 `<html lang>`，如 `html[lang="zh-CN"]`、`html[lang="ja-JP"]`。
- **界面示意图**：`scripts/figs/` 的脚本生成，改图改脚本，然后 `pnpm figs`，再 `pnpm build`。`src/pages/snips/` 里的片段和这些脚本写进 `home.html`、`site.css` 标记之间的内容是脚本的输出，不要直接改；CI 会重新运行 `pnpm figs`，和提交的内容不一致就失败。
  - `product-figs.mjs`：Core 首屏（`coreStack`，和首页 `coreFig()` 是同一张，数据两处一起改）、Core「为 Agent 提供统一的架构和规范」（`coreRepo`，对照 NocoBase 3 应用模板的 `AGENTS.md` 与 `.agents/skills/`）、Studio「各项进展一目了然」（`studioDash`，对照 nocobase-studio 仓库 dev 分支）；把 `src/pages/product-pages.css` 同步到 `site.css` 的 `/* PRODUCT-PAGES */` 标记之间。
  - `studio-figs.mjs`：按真实 Studio 截图的样式画的 Studio 界面图（Studio 页首屏 `studioHero` 等）；把 `src/pages/studio-ui.css` 同步到 `site.css` 和首页内联样式的 `/* STUDIO-UI */` 标记之间。
  - `home-studio.mjs`：首页 Studio 段四条核心特色各一张图，写进 `home.html` 的 `<!-- STUDIOTPL -->` 标记之间，同一批写到 `snips/stv*.html` 给 Studio 页用；样式在 `/* HOME-STUDIO */` 标记之间。
  - `home-sol.mjs`：首页 Solutions 段六款应用各一张图，写进 `home.html` 的 `<!-- SOLTPL -->` 标记之间，同一批写到 `snips/sol*.html` 给 Solution 页用。NocoCRM、NocoITAM、NocoReach 的图取自各自内页正文里最核心的图，内页的图改过后运行它即可同步。左侧每款应用的一句话和「了解 →」链接写在首页脚本的 `getAPPS()` 里，Solution 页左侧的说法和它一致。
  - NocoCRM、NocoITAM、NocoReach 三个内页的大部分界面图直接写在各自的 `.body.html` 里。
- **NocoReach 的产品界面截图**：`src/reach/`（`figs.html` 加载产品自己的样式表 `product.css`，`figs.js` 按产品页面的结构写，数据用宣传片里的 Acme 例子）。改图后运行 `node scripts/reach-shoot.mjs [图名…]`（需要 Chrome 和 cwebp），输出到 `src/assets/reach/`（不提交、不发布），上传到 static-docs.nocobase.com 根目录后页面用 CDN 地址引用；图的尺寸变了同步改 `<img>` 的 width、height。
- **图片、视频、字体**：图片、视频和 favicon 放在 static-docs.nocobase.com 根目录，页面写完整地址，新图先上传再引用。字体放在本地 `src/assets/fonts/`（`pnpm fonts` 从 Google Fonts 下载，改字体或字重改 `scripts/fonts.mjs` 的 `SETS`）；中日韩文用系统字体，俄语页面另外加载 Inter。图标库 Lucide 在 `src/assets/vendor/`。

## 内容约定

- Core、Studio、Solution 三个产品页按《NocoBase 产品定义与标准表述》（在 [nocobase/nocobase-v3-standard](https://github.com/nocobase/nocobase-v3-standard) 仓库）写：品牌表达做 H1，定义做导语，核心特色按标准文稿的顺序各一节（标题用特色原文，导语先说「问题与方案」里对应的问题，再说方案；问题句要一读就是困难。Studio「一支持续推进的 Agent 团队」一节只留方案），然后是开源与私有部署、开始使用。和 Vibe Coding 的对比只放在首页 FAQ。改文案先改标准文稿，再从它摘录。
- 定价页的开源与商业划分以《NocoBase 产品定义与标准表述》的「开源与私有部署」一节为准。
- 博客、客户案例列表和详情页的业务咨询入口指向联系页（`contact.html#contact`），按钮保留「预约实战验证」（英文 Book a Pilot）。

## 发布

`.github/workflows/site.yml`：改到 `html/`、这个 workflow 或 `scripts/deploy-cdn/` 的 PR 和推送到 `main` 会运行 `Site build`：`pnpm install --frozen-lockfile`、`pnpm test`、`pnpm figs`（不能改动任何已提交的文件）、`pnpm build`，检查 `index.html`、`zh-CN/index.html`、`404.html`、`sitemap.xml` 等存在，把 `dist/` 上传为 artifact。只有 `main` 上的运行才会接着跑 `Site publish`：上传到 OSS 的时间戳目录，按 `SITE_CDN_DOMAINS` 切换 CDN 回源规则、刷新缓存，保留最新 3 个版本（见根目录 `AGENTS.md` 的「CI 与发布」）。推送到 `main` 会直接改变线上的 www.nocobase.com。
