# AGENTS.md

## 文档站（`doc/`）

`doc/` 是 NocoBase 3 文档站的源码，CI 每次推送都会运行 `node doc/build.mjs` 构建它，以后也从这里发布到 `docs.nocobase.com`。改文档时，正文和构建脚本必须一起改，不能两边对不上：

- 页面的增、删、移动、改名，都要同时改 `doc/build.mjs` 里的 `SECTIONS`（左侧菜单），以及所有链接到这个页面的正文。菜单里有、源文件里没有，或者源文件里有、菜单里没有，构建都会失败。
- 两种语言的目录结构必须完全相同：英文在 `doc/src/`，简体中文在 `doc/src/zh-CN/`。在一种语言里增删或移动页面，另一种语言的同一路径也要跟着改；英文还没翻译的页面只写 front matter（`title`，需要时加 `nav`）和 `status: placeholder`。
- 站内链接写成相对的 `.md` 路径（如 `[我的任务](../progress/my-tasks.md#视图)`），由构建换成最终地址。指向不存在的页面会让构建失败，移动页面后要把所有指向它的链接都改掉。
- 新增菜单分组时，`SECTIONS` 里的标题写成 `[英文, 中文]`，两种语言都要有。
- 配图片段在 `doc/figures/`，正文用 `::figure 名称 | 说明` 引用，改名或删除配图要同步改引用它的正文。
- 产物的约定不要随手改：每页输出成 `<路径>/index.html`，地址不带扩展名，站内链接和资源用根路径，根目录有 `404.html`、`sitemap.xml`、`robots.txt`、`llms.txt`。这是 CDN 回源规则依赖的格式，改了线上会整站 404。
- 改完必须在本地跑一遍 `cd doc && npm ci && node build.mjs`，确认成功；改了页面外壳或样式的，再用 `node doc/serve.mjs` 打开看一眼。`doc/dist/` 是构建产物，不要提交。
- 改了文档结构，同步更新 `doc/README.md` 和 `doc/方案/` 里描述结构的地方。

## 官网（`html/`）

`html/` 下很多页面是从 `html/_src/` 的数据和脚本生成的（博客、客户案例等，见 `html/_src/README.md`）。改这些页面时改源，再用对应的脚本重新生成，不要直接改生成出来的 HTML。
