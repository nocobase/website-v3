---
title: "NocoBase 3 使用什么前后端技术栈，支持哪些数据库？"
---

Core 应用的前端基于 React，服务端运行在 Node.js 上，使用 Hono 处理 HTTP 路由。默认 UI 遵循 shadcn/ui 组件约定，可以复用应用组件和 NocoBase UI Library，并通过主题调整样式。见[客户端运行时](../core/framework/runtime/client.md)、[服务端运行时](../core/framework/runtime/server.md)和[主题与样式](../core/developing-apps/themes-and-styles.md)。

数据库可以从已支持的驱动中选择：SQLite、PostgreSQL、MySQL/MariaDB、SQL Server 和 Oracle；达梦、人大金仓及 OceanBase 驱动需要相应商业授权，并有兼容模式或实验性限制。具体版本、驱动和条件见[数据库支持与版本兼容](../core/reference/compatibility.md)。

默认模板使用 SQLite，但它不是所有应用的必选项。创建应用时可以安装其他驱动并配置连接，见[使用不同数据库创建应用](../core/reference/database-configuration.md)。已有数据时，修改连接或方言不会自动搬迁数据，需要另行安排[数据迁移](backup-and-migration.md)。
