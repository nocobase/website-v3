# AGENTS.md

## 文档站（`doc/`）

`doc/` 是 NocoBase 3 文档站的源码，CI 在每个改到它的 PR 和推送上运行 `node doc/build.mjs` 构建它，合入 `main` 后从这里发布到 `docs.nocobase.com`（见下面的「CI 与发布」）。改文档时，正文和构建脚本必须一起改，不能两边对不上：

- 页面的增、删、移动、改名，都要同时改 `doc/build.mjs` 里的 `SECTIONS`（左侧菜单），以及所有链接到这个页面的正文。菜单里有、源文件里没有，或者源文件里有、菜单里没有，构建都会失败。
- 两种语言的目录结构必须完全相同：英文在 `doc/src/`，简体中文在 `doc/src/zh-CN/`。在一种语言里增删或移动页面，另一种语言的同一路径也要跟着改；英文还没翻译的页面只写 front matter（`title`，需要时加 `nav`）和 `status: placeholder`。
- 站内链接写成相对的 `.md` 路径（如 `[我的任务](../progress/my-tasks.md#视图)`），由构建换成最终地址。指向不存在的页面会让构建失败，移动页面后要把所有指向它的链接都改掉。
- 新增菜单分组时，`SECTIONS` 里的标题写成 `[英文, 中文]`，两种语言都要有。
- 配图片段在 `doc/figures/`，正文用 `::figure 名称 | 说明` 引用，改名或删除配图要同步改引用它的正文。
- 产物的约定不要随手改：每页输出成 `<路径>/index.html`，地址不带扩展名、以 `/` 结尾，站内链接和资源用根路径，根目录有 `404.html`、`sitemap.xml`、`robots.txt`、`llms.txt`。这是 CDN 回源规则依赖的格式，改了线上会整站 404。
- 顶层目录不能和 v2 文档的旧地址同名（名单在 `doc/scripts/v2-redirect-prefixes.txt`，如 `guide`、`api`、`cn`），`docs.nocobase.com` 会把这些路径 301 到 `nocode.docs.nocobase.com`，构建时同名会失败。不要为了让构建通过去改名单，名单要和 CDN 上的 EdgeScript 规则一起改，先问用户。
- 改完必须在本地跑一遍 `cd doc && npm ci && node build.mjs`，确认成功；改了页面外壳或样式的，再用 `node doc/serve.mjs` 打开看一眼。`doc/dist/` 是构建产物，不要提交。
- 改了文档结构，同步更新 `doc/README.md`。

## 官网（`html/`）

`html/` 是官网的源码，详细说明见 `html/README.md`（翻译见 `html/src/i18n/README.md`）。

- 只改源文件，不要提交构建产物。源文件都在 `html/src/`（页面正文 `pages/*.body.html`、首页 `pages/home.html`、译文 `i18n/*.yaml`、博客数据 `blog/`、样式和脚本 `assets/`），构建和维护脚本在 `html/scripts/`（Node.js）。`html/dist/` 是构建产物，`html/node_modules/` 是依赖，都不提交；仓库里不再有生成出来的 HTML。
- 构建和预览：在 `html/` 下 `pnpm install`、`pnpm build`（生成 `html/dist/`，按语言每页一个 `<路径>/index.html`）、`pnpm preview`（按 CDN 回源规则映射地址的本地预览）。改完源文件必须跑一遍 `pnpm build` 确认成功，改了页面外壳、样式或文案的用 `pnpm preview` 打开看一眼。
- 语言：英文在根目录，其他 11 种语言在 `zh-CN zh-TW ja-JP ko-KR es-ES fr-FR de-DE pt-BR ru-RU id-ID vi-VN` 目录下；NocoReach、博客、客户案例、更新日志只有英文和 `zh-CN`。不要生成 `/en/` 目录，产物的目录约定是 CDN 回源规则依赖的格式，改了线上会整站 404。
- 改了页面的中英文文案，运行 `pnpm i18n:extract`，在 `html/src/i18n/<组>.<语言>.yaml` 里补译文，`pnpm i18n:check` 检查。站内链接写成 `core.html`、`blog/<slug>.html` 这样的源文件名，构建时换成各语言的地址，指向不存在的页面构建会失败。
- 界面示意图由 `html/scripts/figs/` 的脚本生成（`pnpm figs`），改图改脚本，不要直接改 `html/src/pages/snips/` 或 `home.html`、`site.css` 里脚本写入的部分；CI 会重新生成并比对。
- 改了构建的约定（语言、地址、页面清单）或命令，同步更新 `html/README.md`、`html/src/i18n/README.md` 和这一节。

## CI 与发布

本仓库是公开仓库，构建和发布都由本仓库自己的 GitHub Actions 完成，不再经外部仓库转发：

- `.github/workflows/docs.yml`：文档站。改到 `doc/`、这个 workflow 或 `scripts/deploy-cdn/` 的 PR 和推送到 `main` 会触发，也可以手动运行。`Docs build` 运行 `npm ci --prefix doc --ignore-scripts` 和 `node doc/build.mjs`，检查 `index.html`、`zh-CN/index.html`、`404.html`、`sitemap.xml` 都生成了，把 `doc/dist/` 上传为 artifact；只有 `main` 上的运行才会接着跑 `Docs publish`。
- `.github/workflows/site.yml`：官网。触发条件相同，路径换成 `html/`、这个 workflow 和 `scripts/deploy-cdn/`。`Site build` 用 pnpm（版本取 `html/package.json` 的 `packageManager`）和 Node 24 在 `html/` 下运行 `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm figs`（重新生成的界面示意图必须和提交的一致）、`pnpm build`，检查 `index.html`、`zh-CN/index.html`、`404.html`、`sitemap.xml`、`robots.txt` 都生成了，把 `html/dist/` 上传为 artifact。只有 `main` 上的运行才会接着跑 `Site publish`；`www.nocobase.com` 已经由它发布，推送到 `main` 会直接改变线上网站。
- 发布：每次部署都上传到 OSS 里一个新的时间戳目录（上海时间），再由 `scripts/deploy-cdn/deploy-cdn.mjs` 把 CDN 回源改写规则指过去，等规则生效后刷新缓存，最后清理旧版本；`404.html` 另外上传到 bucket 根目录（官网的 404 页由 `html/src/pages/404.body.html` 生成，会在任意深度的地址上返回，资源和链接一律用根路径）。同一时间只有一个发布在跑，运行中的发布不会被取消；如果 `main` 已经前进，且之后的提交也改了这个 workflow 负责的目录，旧提交就跳过发布，由新提交发布。
- 版本保留与回滚：文档保留最新 2 个时间戳目录（脚本默认 `--keep 1`），官网保留最新 3 个（`site.yml` 传 `--keep 2`）。官网的 `SITE_CDN_DOMAINS` 为空时用 `--cleanup-only`：不切换 CDN、不刷新缓存，但照样清理旧版本。清理前会确认刚上传的目录在 bucket 里，不在就报错、什么都不删。回滚时在阿里云 CDN 控制台把该域名的每条回源改写规则（`back_to_origin_url_rewrite`）里的时间戳改回保留着的旧目录，再刷新缓存；workflow 只发布 `main` 的最新提交，不能用它重新发布旧提交。
- 配置：发布 job 运行在 Environment `production` 里，用到的值全部是这个 Environment 的 secrets：`ALI_ACCESS_KEY_ID`、`ALI_ACCESS_KEY_SECRET`、`ALI_OSS_REGION`（如 `cn-beijing`）、`DOCS_OSS_BUCKET`、`DOCS_CDN_DOMAINS`（必须配置，缺了发布失败）、`SITE_OSS_BUCKET`、`SITE_CDN_DOMAINS`（可以不配）。域名之间用空白或逗号分隔。
- 安全：只用 `pull_request` 触发，不要改成 `pull_request_target`；顶层权限只有 `contents: read`。build job 会运行 PR 里的代码，不能引用任何 secret；secret 只写在 publish job 发布步骤的 `env` 里，publish job 只下载 artifact，除 `scripts/deploy-cdn/` 外不运行仓库里的代码。
- 改发布流程时，`docs.yml` 和 `site.yml` 的发布部分要一起改；改了 `deploy-cdn.mjs` 读取的环境变量或依赖，同步改两个 workflow 的 `Publish` 步骤和 `scripts/deploy-cdn/package.json`、`package-lock.json`；增删 secret 或改触发条件，同步改这一节和 `doc/README.md` 里的说明。改文档站产物的目录约定时，先看 `deploy-cdn.mjs` 里 `REWRITE_RULES` 上面的说明。改了版本清理或参数解析（`scripts/deploy-cdn/versions.mjs`），跑 `node --test scripts/deploy-cdn/versions.test.mjs`，两个 build job 也会跑它。
