---
title: 用户
status: 待补充正文
description: 用户管理的接口和页面组件：账号列表、启用与停用、重置密码、邀请链接、个人偏好，以及在应用里给人分配角色。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-users` |
| 版本 | 2.0.0-beta.9 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md)、[通知](notification.md) |
| 自带页面 | 邀请链接页（`/invite/:token`）；「用户管理」页面在模板里，由应用启用 |
| UI 组件 | 无单独组件；模板的「用户管理」页面使用它的接口 |
| 数据表 | 有，迁移随插件提供 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-users` |
| 所属能力 | [用户与组织](../capabilities/users.md) |

## 计划包含

- 它怎样工作
- 「系统设置 › 用户管理」能做什么
- 邀请链接和初始管理员（`users.initialAdmin`）
- 删除用户的处理
- 个人偏好（语言、外观）
- 和权限插件一起分配角色
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
