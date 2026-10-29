---
title: Markdown and Mermaid
---

`@nocobase/markdown-mermaid` renders fenced `mermaid` blocks in `react-markdown`. Apps and plugins can share this small renderer without importing each other's entire document pages.

## Connect a renderer

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

`mermaidSource(node)` recognizes only Mermaid blocks and preserves other code rendering. Passing the original block as `fallback` keeps source readable while loading or after a parsing failure.

## Loading and themes

Mermaid loads when a diagram first renders. Pages without diagrams do not load it through this component. The component observes the document root's `dark` class and redraws with the corresponding theme, matching shadcn theme conventions.

Streaming source is drawn after it remains stable for 150 ms by default; customize `delayMs` if necessary. Avoid rebuilding the renderer manually for each incoming token.

## Presentation and safety

Mermaid runs at strict security level, encoding label HTML and disabling diagram click handlers. This covers diagrams, not every other custom Markdown renderer; do not enable unsanitized HTML elsewhere.

The wrapper exposes `data-mermaid` as `pending`, `diagram` or `failed` for styling and tests. Failure retains the source and puts the error in the fallback title instead of breaking the document page.

Organize components and pages freely while using shadcn primitives. To distribute a composed document block as editable source, see [Publish UI source assets](../../extension-development/frontend-components.md#optionally-distribute-ui-source-assets).

## Interfaces and implementation

- [Markdown Mermaid integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/markdown-mermaid/README.md)
