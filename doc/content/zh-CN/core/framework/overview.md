---
title: 框架概览
---

本章介绍应用和插件共同使用的框架机制，以及 `@nocobase/*` 核心包的职责、使用方式和运行边界。需要实现页面、接口或插件时，可以从[开发应用](../developing-apps/overview.md)和[开发插件](../extension-development/when-to-write-a-plugin.md)开始，遇到具体机制再回到这里查阅。

## 运行时与共用机制

应用负责组装客户端、服务端和 CLI 运行时；插件通过公开入口提供扩展。两者使用相同的服务契约，但注册位置不同。

| 想了解的问题 | 阅读入口 |
| --- | --- |
| 应用如何启动，插件如何参与运行 | [客户端运行时](runtime/client.md)、[服务端运行时](runtime/server.md)、[CLI 运行时](runtime/cli.md)、[插件加载](runtime/plugins.md)、[启动与生命周期](runtime/lifecycle.md) |
| 业务服务如何注册、共享与释放 | [服务容器](services/container.md)、[服务契约与 Token](services/tokens.md)、[ServiceProvider](../extension-development/service-provider.md)、[前后端服务接入](services/integration.md) |
| React 上下文如何接入页面树 | [React Provider](runtime/react-providers.md) |
| 如何声明和调用 HTTP 接口 | [路由与请求上下文](http/routes.md)、[中间件](http/middleware.md)、[请求校验与响应](http/validation.md)、[Repository 数据接口](http/repository-routes.md)、[API Client](http/api-client.md) |

服务容器与依赖注入在前后端都适用。浏览器和服务端各有自己的容器、实例和生命周期；共享 Token 定义不会让两端共享内存对象，跨端调用仍通过 API。

## 核心包

菜单按功能组织，每篇说明对应包的机制与宿主接入方式。以下是本章重点：

| 包 | 职责 | 阅读入口 |
| --- | --- | --- |
| `@nocobase/service-provider` | 服务容器、Token、依赖注入与 Provider 生命周期 | [服务容器](services/container.md) |
| `@nocobase/db` | 连接、数据模型、查询、事务与结构演进 | [数据库](database/overview.md) |
| `@nocobase/caching` | 命名空间缓存、计数器与布隆过滤器 | [缓存](support/caching.md) |
| `@nocobase/drive` | 文件读写与存储驱动 | [文件存储与驱动](file-storage.md) |
| `@nocobase/jobs` | 后台任务执行与周期调度 | [后台任务](background/jobs.md)、[周期调度](background/scheduling.md) |
| `@nocobase/queue` | 消息生产、消费与投递控制 | [消息队列](background/queues.md) |
| `@nocobase/realtime` | 实时主题、发布与订阅 | [实时通信](realtime/topics.md) |
| `@nocobase/logging` | 结构化日志、输出与轮换 | [日志](support/logging.md) |
| `@nocobase/snowflake` | 基于时间、Worker 和序列的 ID 生成 | [ID 生成](support/ids.md) |

数据库内容较多，保留独立专题，按连接与方言、建模、读写、关联、事务、迁移和初始数据逐步查阅。应用目录中怎么建表、初始化数据，见[建表与数据初始化](../developing-apps/data-models-and-migrations.md)；插件如何声明数据资源，见[数据库资源与迁移](../extension-development/database-and-migrations.md)。

## 在应用与插件中使用

底层包定义能力，应用运行时负责把配置和实例接入宿主。大多数服务端服务通过公开 Token 从 `app.container` 取得；数据库的 Token 来自 `@nocobase/db`，缓存、文件、任务等的宿主 Token 来自相应的 `@nocobase/app-server/*` 入口。

应用和插件都应复用宿主实例。业务服务可以通过构造函数接收依赖，Provider 负责解析和组装。插件管理自己注册的执行器、订阅和主题；数据库连接、队列服务等共享实例由宿主关闭。各篇示例会分别说明资源归属，完整接入位置见[前后端服务接入](services/integration.md)。

独立脚本或测试可以自行创建包实例，同时负责配置、启动和释放。标明“独立使用”的示例展示这种生命周期，不应直接复制到每个请求中。

## 与插件功能的关系

文件存储包提供磁盘和文件读写，文件插件在其上提供文件记录与上传能力；私有内容的访问鉴权由应用接入。Jobs 提供任务执行与调度，定时任务插件进一步提供执行记录和启停接口，管理页面由应用组合。实时通信传递变更消息，通知插件可以提供持久通知和个人收件箱。

需要把现成功能接入业务时，查阅[使用插件](../using-plugins/overview.md)；需要编写底层逻辑或理解运行行为时，查阅本章。公开入口与参数索引见 [API 参考](../reference/api.md)。
