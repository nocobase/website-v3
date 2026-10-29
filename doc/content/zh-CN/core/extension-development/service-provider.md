---
title: ServiceProvider 与服务生命周期
description: 一起理解前后端的服务契约、Token、容器注册与生命周期。
---

ServiceProvider 把插件提供的服务接入 App 的容器，并管理服务需要的启动与清理工作。前端和后端使用相同的基本机制，但运行在不同环境，容器和实例互不共享。

业务行为写在 Service，注册和资源生命周期写在 Provider。只有一个调用方的纯函数通常不需要容器；当多个入口共享能力、需要替换实现或管理资源时，再使用 ServiceProvider。

按运行端接入插件时，可以直接阅读[客户端服务](client-services.md)和[业务服务与 ServiceProvider](server-services.md)；任务资源的启动和关闭见[后台任务与执行器](background-jobs.md)。本篇继续解释两端共用的容器与生命周期概念，React 组件上下文另见[React Context 与 Provider](react-context-and-providers.md)。

## 使用 Agent

```prompt
请为公告功能整理 ServiceProvider：服务端提供可复用的文本预览服务，
客户端提供页面间共享的布局偏好服务。分别注册到各自的容器，
明确 Token 和公开入口，验证延迟创建及实例复用。
```

## 准备插件

下面的示例插件名为 `notice-services`，命令在 App 根目录执行，文件路径相对于 `packages/app-plugin-notice-services/`。

```bash
pnpm create @nocobase/plugin@beta notice-services --with server.service-providers --with client.service-providers
```

脚手架已生成两端的 Provider、聚合文件和插件声明。保留这些连接，修改各自实现即可。

## 服务端：契约、Token、实现与注册

替换 `server/tokens.ts`：

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreview {
  readonly text: string;
  readonly length: number;
}
export interface NoticeServicesService {
  preview(text: string): NoticePreview;
}
export const noticeServicesServiceToken: ServiceToken<NoticeServicesService> =
  createServiceToken<NoticeServicesService>(
    '@nocobase/app-plugin-notice-services/service',
  );
```

替换 `server/services/notice-services.ts`：

```ts
import type { NoticePreview, NoticeServicesService } from '../tokens.js';

export class DefaultNoticeServicesService implements NoticeServicesService {
  public preview(text: string): NoticePreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

`server/providers/notice-services.ts` 使用生成的注册方式：

```ts
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';

import { DefaultNoticeServicesService } from '../services/notice-services.js';
import { noticeServicesServiceToken } from '../tokens.js';

export interface NoticeServicesProviderApplication {
  readonly container: ServiceContainer;
}

export class NoticeServicesProvider extends ServiceProvider<NoticeServicesProviderApplication> {
  public readonly name: string = '@nocobase/app-plugin-notice-services';

  public override register(): void {
    this.app.container.singleton(
      noticeServicesServiceToken,
      () => new DefaultNoticeServicesService(),
    );
  }
}
```

`singleton` 在第一次解析时创建实例，同一个 App 容器内后续解析得到同一个实例。`instance(token, value)` 则注册已经创建好的值。工厂是同步的，异步准备放到生命周期方法里。

`server/providers/index.ts` 导出 Provider 的构造函数数组，`server/plugin.ts` 将它作为 `serviceProviders` 贡献给 App。不要在数组里写 `new NoticeServicesProvider(...)`，也不要在模块导入时启动连接或定时器。

路由或其他 Provider 可通过 `app.container.resolve(noticeServicesServiceToken)` 使用服务。如果其他插件也需要它，在 `server/index.ts` 保留默认导出并增加：

```ts
export { noticeServicesServiceToken } from './tokens.js';
export type { NoticeServicesService, NoticePreview } from './tokens.js';
```

调用方从 `@nocobase/app-plugin-notice-services/server` 导入原始 Token，不能用相同字符串重新创建一个。共享运行时 `@nocobase/service-provider` 必须作为 peer，避免安装两份产生不同的身份。

## 客户端：独立的服务和容器

新增 `client/services/preferences.ts`：

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreferences {
  isCompact(): boolean;
  setCompact(value: boolean): void;
}
export const noticePreferencesToken: ServiceToken<NoticePreferences> =
  createServiceToken<NoticePreferences>(
    '@nocobase/app-plugin-notice-services/preferences',
  );

export class DefaultNoticePreferences implements NoticePreferences {
  private compact = false;
  public isCompact(): boolean {
    return this.compact;
  }
  public setCompact(value: boolean): void {
    this.compact = value;
  }
}
```

替换 `client/providers/notice-services.ts`：

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  DefaultNoticePreferences,
  noticePreferencesToken,
} from '../services/preferences.js';

export class NoticeServicesServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-notice-services';
  public override register(): void {
    this.app.container.singleton(
      noticePreferencesToken,
      () => new DefaultNoticePreferences(),
    );
  }
}
```

保留 `client/providers/index.ts` 和 `client/plugin.ts` 中的注册。在已有 React 组件里，使用 `useService(noticePreferencesToken)`；它来自 `@nocobase/app-client`。普通函数可以接收服务作为参数，不要依赖全局容器变量。

这个偏好只在当前浏览器 App 实例内共享，刷新后恢复默认值。调用 `setCompact()` 不会自动触发 React 更新：界面状态仍需通过 state、订阅机制或 React Provider 驱动。ServiceProvider 管理服务，React Provider 管理组件树上下文，两者不是同一个概念。需要服务端持久化时，通过 API 保存，而不是认为前后端容器共享了状态。

## 生命周期应该做什么

| 阶段 | 合适的工作 |
| --- | --- |
| `register()` | 同步注册实例或延迟工厂，不做网络和数据库操作 |
| `boot()` | 检查依赖、完成异步准备 |
| `start()` | 启动自己拥有的订阅、连接、消费者或定时器 |
| `ready()` | 所有 Provider 启动后完成内部就绪切换 |
| `shutdown()` | 停止并等待自己创建的资源释放 |

每一阶段会先完成所有 Provider，再进入下一阶段；清理按相反顺序执行。Server 的路由工厂在 `boot()` 后、`start()` 前运行，所以可以解析服务，但不能假设后台任务已经启动。`ready()` 也不表示外部 HTTP 端口已经监听。

清理需要容忍启动失败和未创建的实例。使用 `resolveIfCreated()` 检查已有实例，避免关闭时才创建它。只释放自己拥有的资源，不要销毁从 App 取得的共享数据库或日志服务。本例没有外部资源，因此不添加空生命周期方法。

## 验证服务注册

替换生成的 `tests/server/service-provider.test.ts`：

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { NoticeServicesProvider } from '../../server/providers/notice-services.js';
import { noticeServicesServiceToken } from '../../server/tokens.js';

describe('notice service', () => {
  it('registers a lazy singleton and normalizes text', () => {
    const container = new ServiceContainer();
    new NoticeServicesProvider({ container }).register();
    expect(container.resolveIfCreated(noticeServicesServiceToken)).toBeUndefined();
    const service = container.resolve(noticeServicesServiceToken);
    expect(service.preview('  欢迎 👋  ')).toEqual({
      text: '欢迎 👋',
      length: 4,
    });
    expect(container.resolve(noticeServicesServiceToken)).toBe(service);
  });
});
```

```bash
pnpm --filter @nocobase/app-plugin-notice-services format
pnpm --filter @nocobase/app-plugin-notice-services check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-services --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-services --no-install
```

注册后，在 App 中实际调用服务端入口和使用客户端服务的页面，并运行 App 的 `pnpm build`。单元测试证明容器行为，无法代替两端接入验证。客户端服务测试可使用 `renderWithApp()` 注册真实 Client 插件，方法见[测试与验证](testing-and-verification.md)。
