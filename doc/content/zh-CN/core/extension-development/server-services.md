---
title: 业务服务与 ServiceProvider
description: 在插件中组织服务实现、Token 和 Provider，通过公开契约供接口、命令和其他插件使用。
---

本篇为公告插件提供文本预览服务，让 HTTP、CLI 或其他插件复用同一实现。`services/` 放业务实现，`tokens.ts` 定义公开契约，`providers/` 把实现注册到应用容器。这里不访问数据库，也不需要客户端。

通用的依赖注入与生命周期见 [ServiceProvider](service-provider.md)，事务和请求状态的处理见[服务端服务](../developing-apps/server-business-services.md)。本篇重点是插件的注册与公开使用边界。

## 前提与相关文件

在已有 `@nocobase/app-plugin-announcements` 中增加以下文件。路径相对于插件根目录；已有同名内容时合并，保留原有服务和接口。新建插件时可选 `server.service-providers`。`@nocobase/service-provider` 使用兼容的 peer 依赖，让应用与插件共享同一运行时身份。

## 使用 Agent

```text
把公告文本预览整理为插件的服务端服务，返回去空白后的文本与 Unicode 码点数量。
通过原始 Token 和 ServiceProvider 注册一个惰性单例，并公开契约供接口和命令复用。
保留现有 Server 贡献，不把当前请求、用户或事务保存在单例字段中。
验证缺少注册时失败、注册后共享同一实例，以及公开入口的类型声明构建。
```

## 定义服务契约

在 `server/tokens.ts` 中增加契约与 Token：

```ts
import { createServiceToken, type ServiceToken } from '@nocobase/service-provider';

export interface AnnouncementPreview {
  readonly text: string;
  readonly length: number;
}
export interface AnnouncementPreviewService {
  preview(text: string): AnnouncementPreview;
}
export const announcementPreviewToken: ServiceToken<AnnouncementPreviewService> =
  createServiceToken<AnnouncementPreviewService>('@nocobase/app-plugin-announcements/preview');
```

接口输入的类型、长度和权限由相应入口校验；可复用的业务约束仍由服务维护。本例的长度按 Unicode 码点计算，不等同于 JavaScript 字符串长度或用户感知的字形数量。

## 编写实现

新增 `server/services/preview.ts`：

```ts
import type { AnnouncementPreview, AnnouncementPreviewService } from '../tokens.js';

export class DefaultAnnouncementPreviewService implements AnnouncementPreviewService {
  public preview(text: string): AnnouncementPreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

实现不依赖 HTTP Context，因此 CLI 和任务也能使用。以后需要数据库或外部服务时，由 Provider 解析应用已有的服务并通过构造参数注入；请求用户、授权策略、事务连接等单次调用状态通过方法参数传递。不要创建第二套全局容器或绕过应用已有的数据访问策略。

## 注册到插件

新增 `server/providers/preview.ts`：

```ts
import { ServiceProvider, type ServiceContainer } from '@nocobase/service-provider';
import { announcementPreviewToken } from '../tokens.js';
import { DefaultAnnouncementPreviewService } from '../services/preview.js';

export interface AnnouncementPreviewApplication {
  readonly container: ServiceContainer;
}
export class AnnouncementPreviewProvider extends ServiceProvider<AnnouncementPreviewApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/preview';
  public override register(): void {
    this.app.container.singleton(announcementPreviewToken, () => new DefaultAnnouncementPreviewService());
  }
}
```

将 `AnnouncementPreviewProvider` 加入 `server/providers/index.ts` 的构造函数数组，再确认 `server/plugin.ts` 的 `serviceProviders` 引用了它。目录里有实现文件并不代表它已注册；保留其他 Provider，也不要在数组中写 `new AnnouncementPreviewProvider(...)`。

本例只有纯计算，不需要额外启动或关闭资源。需要异步初始化时使用对应生命周期；需要关闭订阅或连接时，只释放自己创建的资源，并处理启动失败的情况。具体阶段与依赖顺序见[应用启动与生命周期](../framework/runtime/lifecycle.md)。

## 公开并使用服务

在 `server/index.ts` 中保留默认插件导出，增加公开 Token 和接口类型：

```ts
export { announcementPreviewToken } from './tokens.js';
export type { AnnouncementPreview, AnnouncementPreviewService } from './tokens.js';
```

应用在 `server/plugins.ts` 接入插件后，接口或其他插件可从 `@nocobase/app-plugin-announcements/server` 导入原始 Token，并通过当前应用容器调用。不要用相同字符串重新创建 Token，也不要跨包导入 `server/services/preview.ts`。

在已完成输入校验的路由处理逻辑中，调用 `app.container.resolve(announcementPreviewToken).preview(text)`，再按 HTTP 响应合同返回结果。路由如何声明与保护见[路由与 HTTP 接口](server-apis.md)。

CLI 在 `this.withApp(async ({ app }) => ...)` 中解析同一个 Token，并将结果作为命令返回值。应用必须已注册插件的 Server 入口；只注册 CLI 入口不会注册这个服务。纯预览不需要为了调用而额外执行 `app.start()`；依赖启动阶段资源的服务则必须按其契约启动应用。CLI 参数和错误处理见[命令行扩展](extend-command-line.md)。

调用方通过公开入口取得接口类型，具体实现和 Provider 可以继续作为插件内部细节。包依赖、运行时注册和调用顺序的区别见[插件声明与公开入口](plugin-declarations.md)。

## 验证公开契约与集成

将下面的测试放到 `tests/server/service-provider.test.ts`，合并或替换已有相关断言：

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import { announcementPreviewToken } from '../../server/index.js';
import { AnnouncementPreviewProvider } from '../../server/providers/preview.js';

it('registers one lazy service behind the public Token', () => {
  const container = new ServiceContainer();
  expect(() => container.resolve(announcementPreviewToken)).toThrow();
  new AnnouncementPreviewProvider({ container }).register();
  expect(container.resolveIfCreated(announcementPreviewToken)).toBeUndefined();
  const service = container.resolve(announcementPreviewToken);
  expect(service.preview('  欢迎 👋  ')).toEqual({ text: '欢迎 👋', length: 4 });
  expect(container.resolve(announcementPreviewToken)).toBe(service);
});
```

这个测试证明公开 Token、惰性创建和实例共享；还要检查真实 Server 声明包含 Provider，并在目标 App 中调用实际 HTTP 或 CLI 入口。涉及数据库、权限或事务的服务使用真实应用测试，不能用一个容器测试代表全部集成。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

服务端服务与客户端服务运行在不同容器中。浏览器需要通过接口调用这项服务，不可直接导入 Server 实现。
