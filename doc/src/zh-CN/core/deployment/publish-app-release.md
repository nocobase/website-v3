---
title: 发布应用新版本
description: 用可选截止日期演练一次带数据库迁移的业务发布，保留已有任务、权限和配置。
---

本篇使用历史示例 `03-filtering-pagination` → `04-task-due-date`，在独立环境中演练带迁移的业务发布。当前入门示例应用已经包含截止日期，不要向它重复添加这个字段；请单独准备旧标签的示例，再执行下面的演练。

接下来给任务增加截止日期。发布到原来的应用，保留数据库、运行配置、密钥和文件存储，在已有任务上执行新迁移并验证结果。

这是一次业务功能发布。如需更新框架及相关依赖，请阅读[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)，再按[部署指南](choose-a-deployment-method.md)发布。

## 演练：给任务增加截止日期

新版完整源码见 [04-task-due-date](https://github.com/nocobase/app-tutorials/tree/04-task-due-date)，[与上一章的比较](https://github.com/nocobase/app-tutorials/compare/03-filtering-pagination...04-task-due-date) 展示新增迁移、页面和测试。本篇以仓库标签为基线。

在独立的旧版部署里创建两条带负责人的任务，完成其中一条，再准备一个只读成员。在开发项目中参考上述源码差异加入截止日期，保留已有修改，然后运行：

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm exec vitest run --config vitest.tutorial.config.ts
pnpm exec vitest run tests/client/tutorial-tasks-date-picker.test.tsx
```

源码修改在开发项目进行，不在服务器安装目录中进行。本篇只以明确列出的历史仓库标签为基线，不使用当前入门示例的源码版本。

示例只新增一个可为空的 `dueDate` 字段，用新迁移保存，已有迁移保持原样。新建弹窗可以选择或清除截止日期，接口校验 `YYYY-MM-DD`，列表显示日期。旧任务的日期为空，标题、负责人和完成状态不变；完成／恢复仍只修改完成状态。

![新建任务时选择可选的截止日期。](/assets/core/tutorials/tasks-update/choose-date.png)

启动开发应用后，可以用示例中的 `tests/playwright/tutorial-tasks-due-date.test.ts` 验证真实页面操作。按该标签下测试文件的要求配置 `APP_URL` 和测试账号；测试会写入任务，应只运行在开发或独立演练环境。

## 按原来的部署方式发布

功能验证通过后，保留旧版构建及对应源码，构建新包或新镜像，再使用原部署方式：

- [app-installer：部署新版本](../tutorials/deploy-with-app-installer.md#部署新版本)：检查更新计划，备份并执行新增迁移，切换 release。
- [Studio：部署新版本](../tutorials/deploy-to-studio.md#部署新版本)：向原应用上传新版本，再部署到原运行环境。
- [Docker：部署新版本](../tutorials/deploy-with-docker.md#部署新版本)：使用新镜像标签，保留配置与存储挂载，重建容器。

发布后不只检查进程健康，还要检查旧任务的负责人和完成状态是否保留，新日期能否创建并在刷新后保留，以及原只读成员是否仍然不能写入。

![新版本中，旧任务保留负责人和完成状态，截止日期为未设置；新任务显示截止日期。](/assets/core/tutorials/tasks-update/updated-list.png)

本例已实际通过 app-installer 在已有 SQLite 数据库上执行更新，并验证任务、角色和配置保留，以及重启后的读写行为。Studio 和 Docker 的首次部署另有实操记录；这次没有在它们上面执行带新迁移的更新。

本轮仓库重建使用模板 `.78`，重新验证开发流程、测试和构建，并重拍任务界面；此前三种部署及 app-installer 更新的实操使用 `.77`。新截图不代表三种部署都在 `.78` 上重新演练。
