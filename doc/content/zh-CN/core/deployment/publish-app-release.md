---
title: 发布应用新版本
description: 修改代码后重新构建，按原来的部署方式更新已有应用。
---

发布应用新版本，就是把验证通过的代码重新构建，再通过 Docker 或 PM2（app-installer）更新已有的生产应用。沿用生产环境的数据库、运行配置和文件存储，应用地址通常也不需要改变。

## 使用 Agent

告诉 Agent 原应用部署在哪里、使用哪种部署方式，例如：

```text
请把当前应用的新版本部署到原来的服务器，继续使用 Docker。
部署目录是 /srv/nocobase/tasks。保留已有数据和配置，更新前做好备份，更新后检查应用是否正常。
```

使用 PM2（app-installer）时，提供服务器和已有安装目录，由 app-installer 更新应用。

## 不使用 Agent

先完成代码修改和测试，确认要发布的提交或版本，再按照原部署方式重新构建、发布。两种方式主要有以下差别：

| 部署方式 | 更新时怎么做 |
| --- | --- |
| [Docker](../tutorials/deploy-with-docker.md#部署新版本) | 构建新标签的镜像，修改 Compose 中的镜像版本并重新创建容器，保留原配置和存储挂载。 |
| [PM2（app-installer）](../tutorials/deploy-with-app-installer.md#部署新版本) | 构建新的部署包，使用 app-installer 的 `upgrade` 更新原安装目录；从开发机远程发布时继续使用 `deploy --ssh`。 |

具体命令见各部署指南的“部署新版本”章节。

如果修改涉及数据库结构，将新增迁移随代码一起发布，保留已经执行过的迁移。更新前备份数据库和文件，并留存旧部署包或镜像；切回旧代码不一定能恢复数据库。

更新后检查应用能否访问、已有数据和权限是否保留、新功能是否正常。需要升级框架依赖时，先按[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)完成升级和验证，再按同样的流程部署。
