---
title: Document text extraction
---

`@nocobase/document-extractor` extracts local text in Node Workers from PDF, DOC, DOCX, XLS, XLSX, XLSM, PPTX, TXT, MD, JSON and CSV. It performs no OCR and owns no storage, permissions, model selection or remote upload.

## Extract text

```ts
import { workerExtractor } from '@nocobase/document-extractor';

const extract = workerExtractor();
export async function extractDocument(bytes: Uint8Array, signal: AbortSignal) {
  return extract(
    { bytes, ext: 'docx' },
    { signal, maxOutputChars: 100_000, omitEmbeddedImages: true },
  );
}
```

Read authorized file bytes on the server first. This example targets DOCX; real endpoints validate formats and input limits before selecting an extension. Browser code can import format information from `/formats`, not the server Worker implementation.

`maxOutputChars` bounds output. Exceeding it fails rather than silently truncating. `omitEmbeddedImages: true` skips DOCX image conversion so embedded data cannot consume the text budget. It does not recognize text inside images.

## Readability

Built-in successful results include `hasText`, separating actual text from generated page or slide headings. Nonempty Markdown does not prove that document contents were extracted. Scans and image-only DOCX files need a separate OCR flow.

The shared custom-extractor contract permits omission of `hasText`. Callers need an explicit readability policy in that case instead of treating it as true.

## Resources and failures

Defaults allow two running Workers, 32 waiting requests, 100 MiB per input and a five-minute deadline including queue time. Business endpoints generally benefit from tighter upload and output limits.

Cancellation and timeouts wait for Worker termination. Caller-owned bytes are not transferred. Workers isolate CPU work, not all memory allocation or hostile document behavior; they are not security sandboxes.

Background jobs avoid holding HTTP requests during extraction. Record format, error category and task state without logging files or full text. Knowledge plugins can build indexing, search and version management on top.

## Interfaces and implementation

- [Extractor usage and limits](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/document-extractor/README.md)
