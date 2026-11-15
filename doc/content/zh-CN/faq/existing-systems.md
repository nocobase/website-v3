---
title: "如何与已有的 Java、Spring Boot 等业务系统集成？"
---

可以保留已有系统，由 Core 应用通过 API 调用其服务，补充业务页面或新功能。例如，质量和设备服务继续由 Spring Boot 维护，NocoBase 应用负责展示数据、提交业务操作和组合交互。服务端接入位置见[服务端服务](../core/developing-apps/server-business-services.md)。

已有服务负责的写入应优先经过原服务的 API，保留其校验、事务和业务流程。跨系统调用需要明确账号映射、操作权限、失败重试和重复提交的处理；NocoBase 的本地数据库事务不能自动覆盖远程服务调用。

需要直接访问现有数据库时，可以配置 `schemaManagement: 'external'` 连接，由原系统继续维护表结构。`external` 不等于只读：实际读写范围仍取决于数据库账号和应用权限。见[接入已有数据库](../core/developing-apps/existing-databases.md)。

如果已有统一身份平台，可以通过[身份认证](../core/using-plugins/authentication/sign-in.md)的扩展机制接入，按实际协议实现登录与账号映射。登录身份互通不代表业务权限自动同步，仍需定义两边的授权边界。
