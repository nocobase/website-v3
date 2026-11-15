---
title: "AI 开发的应用可以交给人工继续维护吗？"
---

可以，也可以由人和 AI 交替开发。Core 应用的页面、接口、业务逻辑和数据库迁移都在自己的源码仓库中，开发者可以直接修改、测试和发布，不需要把项目转换成另一种形式。

接手时应交付源码和锁文件、运行与部署说明、业务规则、测试，以及配置和密钥的管理方式。关键决定应记录在项目文档中，不只保留在 AI 会话里。目录职责见[项目结构](../core/developing-apps/project-structure.md)。

人工维护仍需遵循应用的权限、接口和迁移约定，复用已有 Core 能力。后续再让 Agent 参与时，应让它读取最新源码与项目指引，在当前实现上继续修改。修改完成后按[测试与验收](../core/developing-apps/testing-and-acceptance.md)验证，再[发布新版本](../core/deployment/publish-app-release.md)。
