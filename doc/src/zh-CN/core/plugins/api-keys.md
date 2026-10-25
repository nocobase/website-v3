---
title: API keys
status: 待补充正文
description: 用 API Key 访问应用的接口，供脚本、外部系统和命令行使用；可以创建只限部分范围的 Key。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-api-keys` |
| 版本 | 1.0.0-beta.18 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md) |
| 自带页面 | 无 |
| UI 组件 | 无；需要时由 Agent 做“集成密钥”页面 |
| 数据表 | 有，迁移随插件提供 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-api-keys` |
| 所属能力 | [外部集成](../capabilities/integrations.md) |

## 计划包含

- 它怎样工作
- 创建、保存、撤销 Key；只显示一次
- 用 Key 读取接口文档（`/api/swagger`）
- 限定范围的 Key
- Key 的权限和创建它的人一致
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
