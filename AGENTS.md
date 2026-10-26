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
- 改了文档结构，同步更新 `doc/README.md` 和 `doc/方案/` 里描述结构的地方。

## 官网（`html/`）

`html/` 下很多页面是从 `html/_src/` 的数据和脚本生成的（博客、客户案例等，见 `html/_src/README.md`）。改这些页面时改源，再用对应的脚本重新生成，不要直接改生成出来的 HTML。

## CI 与发布

本仓库是公开仓库，构建和发布都由本仓库自己的 GitHub Actions 完成，不再经外部仓库转发：

- `.github/workflows/docs.yml`：文档站。改到 `doc/`、这个 workflow 或 `scripts/deploy-cdn/` 的 PR 和推送到 `main` 会触发，也可以手动运行。`Docs build` 运行 `npm ci --prefix doc --ignore-scripts` 和 `node doc/build.mjs`，检查 `index.html`、`zh-CN/index.html`、`404.html`、`sitemap.xml` 都生成了，把 `doc/dist/` 上传为 artifact；只有 `main` 上的运行才会接着跑 `Docs publish`。
- `.github/workflows/site.yml`：官网。触发条件相同，路径换成 `html/`、这个 workflow 和 `scripts/deploy-cdn/`。`Site build` 目前是过渡版本：把 `html/` 复制到 `dist/`（排除顶层 `_src/` 和 `.DS_Store`），再把 `homepage.html` 复制成 `index.html`；以后换成按语言生成静态页的构建脚本。只有 `main` 上的运行才会接着跑 `Site publish`。
- 发布：每次部署都上传到 OSS 里一个新的时间戳目录（上海时间），再由 `scripts/deploy-cdn/deploy-cdn.mjs` 把 CDN 回源改写规则指过去，等规则生效后刷新缓存，最后清理旧版本；`404.html` 另外上传到 bucket 根目录（官网有 404 页之后才上传）。同一时间只有一个发布在跑，运行中的发布不会被取消；如果 `main` 已经前进，且之后的提交也改了这个 workflow 负责的目录，旧提交就跳过发布，由新提交发布。
- 版本保留与回滚：文档保留最新 2 个时间戳目录（脚本默认 `--keep 1`），官网保留最新 3 个（`site.yml` 传 `--keep 2`）。官网的 `SITE_CDN_DOMAINS` 为空时用 `--cleanup-only`：不切换 CDN、不刷新缓存，但照样清理旧版本。清理前会确认刚上传的目录在 bucket 里，不在就报错、什么都不删。回滚时在阿里云 CDN 控制台把该域名的每条回源改写规则（`back_to_origin_url_rewrite`）里的时间戳改回保留着的旧目录，再刷新缓存；workflow 只发布 `main` 的最新提交，不能用它重新发布旧提交。
- 配置：发布 job 运行在 Environment `production` 里，用到的值全部是这个 Environment 的 secrets：`ALI_ACCESS_KEY_ID`、`ALI_ACCESS_KEY_SECRET`、`ALI_OSS_REGION`（如 `cn-beijing`）、`DOCS_OSS_BUCKET`、`DOCS_CDN_DOMAINS`（必须配置，缺了发布失败）、`SITE_OSS_BUCKET`、`SITE_CDN_DOMAINS`（可以不配）。域名之间用空白或逗号分隔。
- 安全：只用 `pull_request` 触发，不要改成 `pull_request_target`；顶层权限只有 `contents: read`。build job 会运行 PR 里的代码，不能引用任何 secret；secret 只写在 publish job 发布步骤的 `env` 里，publish job 只下载 artifact，除 `scripts/deploy-cdn/` 外不运行仓库里的代码。
- 改发布流程时，`docs.yml` 和 `site.yml` 的发布部分要一起改；改了 `deploy-cdn.mjs` 读取的环境变量或依赖，同步改两个 workflow 的 `Publish` 步骤和 `scripts/deploy-cdn/package.json`、`package-lock.json`；增删 secret 或改触发条件，同步改这一节和 `doc/README.md` 里的说明。改文档站产物的目录约定时，先看 `deploy-cdn.mjs` 里 `REWRITE_RULES` 上面的说明。改了版本清理或参数解析（`scripts/deploy-cdn/versions.mjs`），跑 `node --test scripts/deploy-cdn/versions.test.mjs`，两个 build job 也会跑它。
