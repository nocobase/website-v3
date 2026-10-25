---
title: 数据库浏览
status: 待补充正文
description: 只读浏览应用的数据库连接、数据表和字段的接口，供应用做自己的数据库浏览页面。不写入任何数据。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-database-explorer` |
| 版本 | 1.0.0-beta.16 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md) |
| 自带页面 | 无 |
| UI 组件 | 无 |
| 数据表 | 无 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-database-explorer` |
| 所属能力 | [数据建模](../capabilities/data.md) |

## 计划包含

- 它怎样工作
- 只读接口能看到什么
- 访问需要 `page:database-explorer/access` 授权，系统管理员默认拥有
- 让 Agent 做一个数据库浏览页面
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
