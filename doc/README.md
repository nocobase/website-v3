# NocoBase 3 文档

```
doc/
├── 方案/          文档方案：Studio 文档（01–05）、Core 与统一文档站（06–10）
├── src/           英文正文（Markdown），站点根路径；目前多为占位页
│   └── zh-CN/     简体中文正文，/zh-CN/ 下；中文是基准，目录结构和英文完全相同
├── figures/       局部配图（HTML 片段），正文里用 ::figure 名称 | 说明 引用
├── assets/        样式、脚本、Logo
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

推送到本仓库后，CI 会构建文档站，构建失败会在 PR 和提交上显示为失败的检查。

## 编写

- 写法约定见 `方案/04-写作规范与术语.md`。
- 新增页面：在 `src/zh-CN/` 下新建 Markdown，在 `src/` 的同一路径下放英文页（还没翻译就只写 front matter 和 `status: placeholder`），再在 `build.mjs` 的 `SECTIONS` 里登记。菜单和源文件不一致时构建会失败。
- front matter 写了 `status` 的是占位页：菜单里颜色较浅，不参与上一页 / 下一页。英文占位页正文留空时，会自动提示读者看中文版。
- 站内链接写成相对的 `.md` 路径（例如 `[我的任务](../progress/my-tasks.md#视图)`），构建时换成最终地址；指向不存在的页面会让构建失败。
