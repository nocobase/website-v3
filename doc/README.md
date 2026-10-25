# NocoBase 3 文档

```
doc/
├── 方案/          文档方案：Studio 文档（01–05、11 重构方案）、Core 与统一文档站（06–10）
├── src/           文档正文（Markdown）：开始（index.md、start/）、Core（core/）、Studio（studio/）
│   ├── figures/   局部配图（HTML 片段），正文里用 ::figure 名称 | 说明 引用
│   └── images/    真实截图（少数需要时才用）
├── assets/        样式、脚本、Logo
├── site/          生成的文档站（发布用，不要手改）
└── build.mjs      构建脚本
```

## 构建

```bash
node doc/build.mjs
```

需要 `marked@4.3.0`，脚本会依次在 `doc/node_modules` 和上一级目录的 `node_modules` 里查找。生成后打开 `doc/site/index.html` 浏览文档站，打开 `doc/方案/01-现有文档的问题.html` 浏览方案。

## 编写

- Studio 文档的结构和措辞见 `方案/11-Studio文档重构方案.md`，写法约定见 `方案/04-写作规范与术语.md`。所有措辞以《NocoBase 产品定义与标准表述》为准。
- 新增页面：在 `src/` 下新建 Markdown，并在 `build.mjs` 的 `SECTIONS` 里登记。
- 待写或待改写的页面在 front matter 里写 `status`（待编写、待改写），菜单里颜色较浅，不进入上一页 / 下一页。
