---
title: 邮件
status: 待补充正文
description: 关联个人邮箱，同步、阅读、回复和发送邮件，使用签名和模板，往来邮件与业务记录关联。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-mail` |
| 版本 | 1.0.0-beta.16 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md) |
| 自带页面 | 无；邮件页面由应用基于它的接口和组件实现 |
| UI 组件 | 插件自带的邮件组件（`client/components`） |
| 数据表 | 有，迁移随插件提供，表名以 `mail` 开头 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-mail` |
| 所属能力 | [邮件互通](../capabilities/mail.md) |

## 计划包含

- 它怎样工作
- 管理员准备邮件服务商配置
- 用户关联自己的邮箱（OAuth 或 IMAP）
- 同步、阅读、回复、发送
- 在业务页面里看往来邮件
- 业务 Agent 使用邮件
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
