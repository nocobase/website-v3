---
title: 默认数据范围
status: 待补充正文
description: 给已经有操作权限的人一个共同的数据范围，例如“完成的订单所有人可以查阅”，并提供对应的管理界面。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-authz-default-access` |
| 版本 | 1.0.0-beta.15 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md) |
| 自带页面 | 无；「默认数据范围」页面在模板里 |
| UI 组件 | UI 组件库的 `default-access-editor` |
| 数据表 | 有，迁移随插件提供 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-authz-default-access` |
| 所属能力 | [权限控制](../capabilities/permissions.md) |

## 计划包含

- 它怎样工作
- 什么时候用默认数据范围，什么时候用权限集
- 「系统设置 › 权限管理 › 默认数据范围」
- 它不额外授予操作
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
