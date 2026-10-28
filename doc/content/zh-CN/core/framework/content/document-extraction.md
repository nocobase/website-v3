---
title: 文档文本提取
---

`@nocobase/document-extractor` 在本地 Node Worker 中提取文档文本，支持 PDF、DOC、DOCX、XLS、XLSX、XLSM、PPTX、TXT、MD、JSON 和 CSV。它不提供 OCR，也不负责文件权限、存储、模型选择或远程上传。

## 提取文档

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

在服务端获取已授权文件的字节后调用。示例固定处理 DOCX；实际接口需要校验格式、限制输入体积，再选择受支持的扩展名。浏览器可通过 `/formats` 入口取得格式信息，不应导入服务端 Worker 实现。

`maxOutputChars` 限制输出长度，超过预算会失败而非静默截断。`omitEmbeddedImages: true` 避免 DOCX 图片转码和内嵌数据占用文本预算；它不会从图片识别文字。

## 判断结果可读性

内置成功结果包含 `hasText`，用于区分实际正文和自动生成的页码、幻灯片标题。非空 Markdown 不一定表示文档正文已经被提取。纯扫描件或图片型 DOCX 需要单独的 OCR 流程。

自定义提取器的共享契约允许省略 `hasText`，调用方需要制定对应的可读性判断，不能统一当作 true。

## 资源与失败

默认限制包括两个运行中的 Worker、32 个等待请求、单输入 100 MiB，以及包含排队时间的五分钟截止时间。业务场景通常应配置更小的上传限制和输出预算。

取消和超时会等待 Worker 终止；调用方持有的字节不会被转移所有权。Worker 隔离 CPU 工作，但不隔离全部内存消耗，也不是处理恶意文档的安全沙箱。

将提取放入后台任务可以避免长时间占用 HTTP 请求。失败时保存格式、错误类别和任务状态，避免把原文件或全文放入日志。知识库插件可以在其上组合索引、搜索和版本管理。

## 接口与实现

- [Extractor usage and limits](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/document-extractor/README.md)
