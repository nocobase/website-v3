---
title: "模板打印"
description: "使用插件 Skills 在应用中实现 DOCX 模板和 PDF 输出。"
---

`@nocobase/app-plugin-template-print` 提供模板打印的 Agent Skills 与参考实现，帮助应用从 Office 模板和业务数据生成文档，并按需要处理图片、二维码及 PDF 转换。

## 安装后得到什么

当前包只分发开发指引，没有 Client、Server、CLI 运行时入口，不提供模板表、打印路由、渲染引擎或现成打印页面。安装后，应用仍需实现自己的打印功能。

将兼容版本作为应用的直接开发依赖安装，然后在应用根目录同步：

```bash
pnpm nocobase skills sync
```

确认应用可读取 `nocobase-app-plugin-template-print` Skill。无需把该包加入 Client 或 Server 插件注册数组，也不要为了安装 Skill 虚构运行时入口。

## 示例：为订单生成打印文档

可以将下面的需求交给应用 Agent：

```text
请使用模板打印 Skill，为当前应用的订单详情增加“下载订单”功能。

使用我提供的 DOCX 模板，填充订单信息、明细与合计。
读取数据时复用当前用户的订单与字段权限。
先实现 DOCX 下载；如果需要 PDF，说明转换依赖并接入应用部署环境。
覆盖无明细、长文本、图片缺失和无权限访问，验证生成文件可正常打开。
```

实现应由应用或业务插件持有：模板资产、数据查询、渲染依赖、下载接口和按钮。可以先使用固定模板完成一条业务流程，再决定是否需要模板上传、版本管理和预览。

## 内容组织与使用

先确定模板中的字段与重复明细区域，再准备经过授权的数据。图片、二维码、字体和分页需要在目标文档中实际检查。PDF 只是可选输出，转换工具、运行环境和部署依赖必须另外落实，不能因安装本包就认为服务器已有转换能力。

插件源码中的 `app-plugin-template-print-example` 是独立示例，拥有自己的发票数据、授权、固定 DOCX 和下载界面；它不是本 Skill 包内置的通用渲染服务。

## 验证结果

检查生成文档能打开、字段值和合计正确、重复区域与分页合理，并验证当前用户不能打印无权查看的记录或字段。需要 PDF 时，还要在部署环境验证转换、字体和错误处理。

相关文档：[使用 Agent 开发](../../developing-apps/develop-with-an-agent.md)、[文件](../data-and-files/file-management.md)、[权限管理](../authorization/permissions.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-template-print)。
