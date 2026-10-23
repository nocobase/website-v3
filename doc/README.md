# NocoBase Studio 文档

```
Doc/
├── 方案/          文档方案（5 篇）：现有文档的问题、结构与原则、命名方案、写作规范与术语、进度与待确认事项
├── src/           文档正文（Markdown）：认识 Studio、快速开始、日常使用
│   ├── figures/   局部配图（HTML 片段），正文里用 ::figure 名称 | 说明 引用
│   └── images/    真实截图（少数需要时才用）
├── assets/        样式、脚本、Logo
├── site/          生成的文档站（发布用，不要手改）
└── build.mjs      构建脚本
```

## 构建

```bash
node Doc/build.mjs
```

需要 `marked@4.3.0`，脚本会依次在 `Doc/node_modules` 和上一级目录的 `node_modules` 里查找。生成后打开 `Doc/site/index.html` 浏览文档站，打开 `Doc/方案/01-现有文档的问题.html` 浏览方案。

## 编写

- 写法约定见 `方案/03-写作规范与术语.md`。
- 新增页面：在 `src/` 下新建 Markdown，并在 `build.mjs` 的 `SITE_NAV` 里登记。
- 待写的章节在 `SITE_NAV` 里用 `pending` 标出，只在目录中占位，不生成页面。
