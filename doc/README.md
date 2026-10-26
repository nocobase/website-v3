# NocoBase 3 文档

```
doc/
├── 方案/          文档方案：Studio 文档（01–05、11 重构方案）、Core 与统一文档站（06–10）
├── src/           英文正文（Markdown），站点根路径；Core 已迁入完整中英文文章
│   └── zh-CN/     简体中文正文，/zh-CN/ 下；中文是基准，目录结构和英文完全相同
├── figures/       局部配图（HTML 片段），正文里用 ::figure 名称 | 说明 引用
├── assets/        样式、脚本、Logo
├── scripts/       构建用到的检查脚本
├── build.mjs      构建脚本，生成到 dist/（不提交）
└── serve.mjs      本地预览
```

## 构建与预览

```bash
cd doc && npm ci
node build.mjs     # 生成 doc/dist/ 和 方案/*.html
node serve.mjs     # 在 http://localhost:4321/ 预览
```

`dist/` 的结构和线上一致：每页是 `<路径>/index.html`，地址不带扩展名、以 `/` 结尾（如 `/core/quickstart/`），站内链接和资源都用根路径，所以要通过 `serve.mjs` 预览，不能直接打开文件。根目录还有 `404.html`、`sitemap.xml`、`robots.txt`、`llms.txt` 和每页的 `.md` 副本。canonical、hreflang 和 sitemap 用的站点域名读环境变量 `DOCS_SITE_ORIGIN`，默认 `https://docs.nocobase.com`；输出目录读 `DOCS_OUT_DIR`。

本仓库的 GitHub Actions（`.github/workflows/docs.yml`）会在每个改到 `doc/` 的 PR 和推送上构建文档站，构建失败会在 PR 和提交上显示为失败的检查 `Docs build`。合入 `main` 后，`Docs publish` 在 Environment `production` 里把 `dist/` 上传到 OSS 的时间戳目录，再切换 `docs.nocobase.com` 的 CDN 回源规则、刷新缓存，只保留最新的两个版本（脚本在仓库根目录的 `scripts/deploy-cdn/`）。发布用到的阿里云密钥、bucket、区域和 CDN 域名都是这个 Environment 的 secrets，详见根目录 `AGENTS.md` 的「CI 与发布」。

`docs.nocobase.com` 上 v2 文档的旧地址（`/guide/`、`/api/`、`/cn/` 等一级路径和语言前缀）会 301 到 `nocode.docs.nocobase.com` 的同一地址，所以文档站的顶层目录不能和它们同名。名单在 `scripts/v2-redirect-prefixes.txt`，和 CDN 上的 EdgeScript 规则 `v2_paths_to_nocode_301` 保持一致；`build.mjs` 生成完会用 `scripts/check-v2-redirect-prefixes.mjs` 检查，同名就构建失败，CI 也就不会发布。确实要用名单里的名字时，从名单和 EdgeScript 里同时去掉它。

## 编写

- Studio 文档的结构和措辞见 `方案/11-Studio文档重构方案.md`，写法约定见 `方案/04-写作规范与术语.md`。所有措辞以《NocoBase 产品定义与标准表述》为准。
- 新增页面：在 `src/zh-CN/` 下新建 Markdown，在 `src/` 的同一路径下放英文页（还没翻译就只写 front matter 和 `status: placeholder`），再在 `build.mjs` 的 `SECTIONS` 里登记。菜单和源文件不一致时构建会失败。
- front matter 写了 `status` 的是占位页（中文页写待编写、待改写）：菜单里颜色较浅，不参与上一页 / 下一页。英文占位页正文留空时，会自动提示读者看中文版。
- 站内链接写成相对的 `.md` 路径（例如 `[我的任务](../use/my-tasks.md#视图)`），构建时换成最终地址；指向不存在的页面会让构建失败。

## Core 内容

Core 全部采用 `nocobase/app-docs` 的现有内容和菜单，迁入基线为 `5d8bdbe93bf63c6066013b121b189b3f8fdcad33`。迁入中英文各 22 篇，新增插件总览各 1 篇，现各 23 篇，分别位于 `src/zh-CN/core/` 和 `src/core/`。后续在这里维护，不从旧站重复生成或覆盖。原 Core 草稿和占位页面已替换；开始与 Studio 保留，仅修正指向 Core 的链接和首页的示例说明。

菜单分为开始使用、开发应用、扩展开发、能力、部署与运维、参考。扩展开发包含什么时候写插件、创建插件、插件的结构、发布插件、给插件写技能、向 UI 组件库贡献，6 项均为不可点击的待编写条目。三种部署指南按 Docker、app-installer、Studio 排列。能力菜单提供数据库、认证与用户、权限、文件、流程、通知、AI 等具体入口，并补充外部集成；插件总览归入参考，已列出源码核对的完整插件清单。能力总览、数据库、认证与用户、权限控制、文件管理已退回待编写；全部能力、其他参考和部分运维条目尚未编写，以 `SECTIONS` 中的 `{ planned: [英文标题, 中文标题] }` 显示为不可点击的待编写项，不生成空文章，不参与上一页、下一页和 sitemap。

保留原文章的目录和文件名并加 `core/` 前缀；MDX 转成 Markdown，内部链接改为相对 `.md`。中文以 `/zh-CN/core/` 开头，英文以 `/core/` 开头。截图保存在 `assets/core/`，正文通过 `/assets/core/...` 引用；示例下载包保存在 `assets/core/downloads/`。只迁入文章引用的资源，不复制旧站框架、运行数据或本地测试账号。

中文是写作基准，示例代码、应用界面和截图使用英文。保留使用 Agent 与不使用 Agent 两条路径、关键代码、原有折叠内容、固定版本源码链接和验证范围。详细写作规则见 [Core 文档结构与写作原则](方案/08-Core文档结构与写作原则.md)。
