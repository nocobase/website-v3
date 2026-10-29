---
title: 服务端多语言
description: 声明插件的服务端语言资源，在请求和后台任务中使用正确的命名空间与语言。
---

插件在 `server/locales/` 维护服务端文案，通过 `server/plugin.ts` 的 `locales` 接入应用。客户端页面使用独立的 [Client 语言资源](localization.md)，注册 Client 插件不会替代 Server 资源注册。

## 使用 Agent

```prompt
请为插件的接口提示和后台消息增加服务端多语言。
保留稳定的错误码，显式使用插件包名作为命名空间。
请求按当前请求语言翻译，后台消息按接收人语言翻译。
补齐已支持的语言，并在目标应用中验证两种请求语言和不同接收人的消息。
```

## 声明服务端资源

创建插件时可以选择 `server.locales`。已有插件保留原有实现，增加资源、加载器和 Server 声明即可。以下路径相对于插件根目录：

```text
server/
├── locales/
│   ├── en-US.ts
│   ├── zh-CN.ts
│   ├── …
│   └── index.ts
└── plugin.ts
```

英文定义资源键结构，其他语言使用完整的资源类型；加载器按语言动态导入。具体写法和翻译完整性约定复用[用英文定义键结构](localization.md#用英文定义键结构)，将文件放在 `server/locales/`，维护服务端自己的资源类型，不从客户端导入资源。

在生成的 `server/plugin.ts` 中保留 `packageName`、`baseDir` 和其他贡献，将 `server/locales/index.ts` 导出的加载器集合赋给 `locales`。只增加翻译文件不会注册资源，应用还需要接入插件的 Server 入口，见[插件声明与公开入口](plugin-declarations.md#服务端)。

<span id="服务端文案属于另一份资源"></span>

## 在请求中使用翻译

以下示例假设 Server 入口与语言资源已注册。接口接入方法见[路由与 HTTP 接口](server-apis.md)，后台消息的执行入口见[后台任务与执行器](background-jobs.md)。

例如在服务端资源里添加 `messages.ready`，各语种补齐后，在由 App 挂载的请求处理器中使用：

```ts
import { getRequestTranslator } from '@nocobase/i18n/server';

// Inside a handler mounted by the App, with the plugin's Server locales registered:
const t = getRequestTranslator(context, '@nocobase/app-plugin-notice-i18n');
return context.json({ data: { message: t('messages.ready') } });
```

请求语言由 App 的会话偏好、`Accept-Language` 和默认语言规则确定。Hono 不会根据源文件位置推断插件命名空间，所以服务端需要明确指定包名。

错误保留稳定的 `ApiError.reason`，供程序判断；给用户显示的译文可以通过 `localizedMessage` 提供。不要用翻译后的句子作为业务错误码。

后台任务、邮件和通知没有当前请求，必须选择接收人的语言，先调用 `i18n.ensureLocaleLoaded(locale)`，再调用 `i18n.getFixedT(namespace, locale)`。不要把触发任务的用户语言套给所有接收人。

## 验证接入结果

使用注册了真实 Server 插件的测试应用，通过请求验证翻译：相同接口在支持的不同语言下返回对应文案，错误码与数据结构保持一致。应用接入与请求语言示例见[服务端多语言](../developing-apps/server-localization.md)。

后台任务分别使用不同接收人的语言，并验证语言资源加载后再生成文案。多个请求或任务之间不能通过一个可变的“当前语言”字段串用状态。

运行插件的类型检查、相关服务端测试和应用构建。资源类型检查只证明键结构完整；还需要在目标应用中检查 Server 注册、实际请求、错误提示和后台消息。应用如何设置语言及覆盖模块文案，见[应用服务端多语言](../developing-apps/server-localization.md)。
