---
title: 发布
status: 待补充正文
description: 应用、版本、环境和部署，部署方式由可替换的驱动实现。Studio 的发布与部署建在它上面。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-releases` |
| 版本 | 0.1.0-beta.10 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | 不在默认模板中 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md) |
| 自带页面 | 应用与部署、环境设置页面（默认 `/releases`） |
| UI 组件 | 无 |
| 数据表 | 有，迁移随插件提供，表名以 `rel` 开头 |
| 命令 | 无 |
| 技能 | 无 |
| 所属能力 | [基础运维](../capabilities/operations.md) |

## 计划包含

- 它怎样工作
- 它在 Studio 里的作用
- 版本包的存储
- CI 和限定范围的 API Key
- 环境变量和密钥
- 预览部署
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
