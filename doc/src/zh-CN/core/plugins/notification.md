---
title: 通知
status: 待补充正文
description: 通知的发送、存储、投递和日志。业务在需要时发送一条通知，由各个渠道投递，结果可以查。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-notification` |
| 版本 | 2.0.0-beta.0 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md) |
| 自带页面 | 无 |
| UI 组件 | `logs-ui`：投递记录页面 |
| 数据表 | 有，迁移随插件提供，表名以 `notification` 开头 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-notification` |
| 所属能力 | [消息通知](../capabilities/notifications.md) |

## 计划包含

- 它怎样工作
- 渠道的配置（`notification.channels`）
- 发送一条通知需要什么：渠道、收件人、内容、幂等键
- 投递记录和失败重试
- “已投递”指服务商已接收
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
