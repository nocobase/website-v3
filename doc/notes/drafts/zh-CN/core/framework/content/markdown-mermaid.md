---
title: Markdown 与 Mermaid
---

`@nocobase/markdown-mermaid` 为 `react-markdown` 中标记为 `mermaid` 的代码块渲染图表。应用和插件可以共用这个小型渲染模块，而不必相互导入完整的文档页面。

## 接到 Markdown 渲染器

```tsx
import { MermaidDiagram, mermaidSource } from '@nocobase/markdown-mermaid';
import Markdown, { type Components } from 'react-markdown';

const components: Components = {
  pre: ({ node, ...props }) => {
    const fallback = <pre {...props} />;
    const source = mermaidSource(node);
    return source === undefined
      ? fallback
      : <MermaidDiagram source={source} fallback={fallback} />;
  },
};

export function DocumentBody({ content }: { content: string }) {
  return <Markdown components={components}>{content}</Markdown>;
}
```

`mermaidSource(node)` 只识别 Mermaid 代码块，其他代码块保持原有渲染。示例把原代码块传给 `fallback`，加载中或解析失败时仍可阅读源码。

## 加载和主题

Mermaid 在第一次实际渲染图表时加载；没有图表的页面不会因此加载 Mermaid。组件观察文档根元素的 `dark` class，配合 shadcn 的主题方式在明暗主题之间重绘。

流式内容频繁变化时，默认等待源码稳定 150 ms 后再绘制，可通过 `delayMs` 调整。不要在每个输出 token 到来时自行强制重建渲染器。

## 展示与安全

渲染使用 Mermaid 的 strict 安全级别，编码标签中的 HTML 并关闭图表点击处理器。这只覆盖图表渲染，不意味着 Markdown 其他自定义渲染器也已经安全；不要额外放开未经清理的 HTML。

外层 `data-mermaid` 为 `pending`、`diagram` 或 `failed`，可用于样式与测试。失败时保留源码并通过 fallback 的标题展示错误，不应让整个文档页面崩溃。

组件和页面仍可自由组织，基础 UI 使用 shadcn。需要把组合后的文档区块作为可编辑源码资产分发时，参见[发布 UI 源码资产](../../extension-development/frontend-components.md#按需分发-ui-源码资产)。

## 接口与实现

- [Markdown Mermaid integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/markdown-mermaid/README.md)
