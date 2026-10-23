---
title: 应用底座
status: 待补充正文
description: 「应用底座」页面：显示应用用到了哪些 Core 能力、由哪些包提供、关联哪些业务模块。只有拥有全部权限的管理员能看。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-foundation` |
| 版本 | 0.1.0-beta.1 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端、命令行 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md) |
| 自带页面 | 「系统设置 › 应用底座」（默认 `/foundation`） |
| UI 组件 | 无 |
| 数据表 | 无 |
| 命令 | 构建时运行 `pnpm nocobase foundation modules build` |
| 技能 | `nocobase-app-plugin-foundation` |
| 所属能力 | [基础运维](../capabilities/operations.md) |

## 计划包含

- 它怎样工作
- 13 类能力和三种状态的判断依据
- 业务模块与底座能力的对照表
- 谁能看
- 大型应用和部署后的应用
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
