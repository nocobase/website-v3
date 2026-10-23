---
title: 基础库
status: 待补充正文
description: 应用直接使用、不需要注册的包。数据库和记录生命周期各有一页，其余列在这里。
---

> [!PENDING] 正文待编写
> 下表来自 NocoBase 仓库 `v3-develop` 分支（2026-10-23）的 `packages/libs/`。正文计划为每个库补充：解决什么、应用里怎样用到、部署时要配置什么。

## 应用会直接用到的

| 库 | 做什么 | 默认模板 | 部署时要注意 |
| --- | --- | --- | --- |
| [数据库](db.md) `@nocobase/db` | 数据表、查询、迁移、数据库方言 | 已包含 | 选择数据库 |
| [记录生命周期](lifecycle.md) `@nocobase/lifecycle` | 流程：状态、流转、对外事项 | 已包含 | — |
| `@nocobase/jobs` | 定时和重复执行的后台任务，内存或 Redis（BullMQ） | 已包含 | 多实例必须用 Redis，Redis 要持久化 |
| `@nocobase/queue` | 应用队列：生产者、消费者，Redis 或单进程内存 | 已包含 | 同上 |
| `@nocobase/realtime` | 页面实时更新：浏览器订阅、服务端按权限推送 | 已包含 | 多进程时改用 Redis |
| `@nocobase/drive` | 文件存储：本地、S3 兼容、阿里云 OSS | 已包含 | 存储凭据、备份 |
| `@nocobase/secrets` | 加密保存的凭据和密钥，支持轮换 | 随运行时 | `secrets` 配置，丢失后已保存的凭据无法解密 |
| `@nocobase/caching` | 缓存 | 已包含 | — |
| `@nocobase/logging` | 日志 | 已包含 | 日志级别和输出 |
| `@nocobase/i18n` | 多语言运行时 | 已包含 | — |
| `@nocobase/authorization` | 权限的计算核心，权限插件建在它上面 | 已包含 | — |
| `@nocobase/mailer` | SMTP 和 Resend 发信，认证和通知渠道插件用它发邮件 | 随认证、通知渠道插件 | 邮件服务商凭据 |
| `@nocobase/config` | 配置的读取和合并 | 已包含 | — |
| `@nocobase/service-provider` | 服务容器 | 已包含 | — |
| `@nocobase/repository-input`、`@nocobase/snowflake`、`@nocobase/session` | 查询输入、ID 生成、会话 | 已包含 | — |

## 主要给插件和工具用的

`@nocobase/api-client`（访问 NocoBase 接口的客户端）、`@nocobase/agent-protocol`、`@nocobase/acp-bridge`（Agent 运行和会话的协议）、`@nocobase/cli-envelope`、`@nocobase/markdown-mermaid`、`@nocobase/db-testing`、`@nocobase/db-testkit`。
