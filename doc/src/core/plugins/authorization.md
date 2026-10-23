---
title: 权限
status: 待补充正文
description: 权限模型和管理界面的基础：页面、操作和数据范围的授权（权限集，界面上叫角色），服务端和浏览器端的权限检查，以及“为什么能看到”的检查工具。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-authorization` |
| 版本 | 1.0.0-beta.31 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端 |
| 依赖的插件 | [认证](authentication.md) |
| 自带页面 | 无；「角色与权限」页面在模板里，由应用启用 |
| UI 组件 | UI 组件库的 `permission-editor`、`role-list`、`default-access-editor` |
| 数据表 | 有，迁移随插件提供，表名以 `authorization` 开头 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-authorization` |
| 所属能力 | [权限控制](../capabilities/permissions.md) |

## 计划包含

- 它怎样工作
- 权限集、资源、操作和数据范围怎样组成一条授权
- 应用怎样声明可以授权的页面、操作和业务对象
- 「系统设置 › 权限管理」能做什么
- 检查权限结果：为什么某人能看到某条记录
- 和默认数据范围、共享规则、限制规则的关系
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
