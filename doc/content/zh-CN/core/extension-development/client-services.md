---
title: 客户端服务
description: 通过插件提供客户端服务，用 Token 注册共享实例，并将变更订阅接入 React。
---

当多个页面需要协作刷新公告列表时，可以由插件提供一个变更通知服务。它负责发布“已保存”的通知，页面负责请求数据和显示反馈。本例只维护当前浏览器应用实例中的版本号，不实现保存接口、请求缓存或跨浏览器同步。

应用层如何组织请求和共享业务操作，见[客户端业务服务](../developing-apps/client-business-services.md)；服务容器原理见[业务服务与依赖注入](../framework/services/container.md)。本篇重点是插件注册、公开契约和 React 订阅。

## 前提与文件

在已有 `@nocobase/app-plugin-announcements` 中增加 Client 服务，不要求先完成 Context 或数据库章节。文件路径相对于插件根目录。新建插件时可选 `client.service-providers`；已有插件合并下面的实现和声明。保留 `@nocobase/service-provider`、React 和客户端运行时的兼容 peer 依赖。

## 使用 Agent

```prompt
请为公告插件增加客户端变更通知服务，供多个页面共用。
公告保存成功后通知订阅者刷新，失败时不发送成功事件；保留现有页面行为。
通过插件公开入口提供服务契约和同一个 Token，沿用宿主容器。
验证实例复用、事件订阅与取消订阅，以及应用关闭后的资源释放。
```

## 定义服务与 Token

新增 `client/services/changes.ts`。`services/` 是组织实现的目录，不会自动注册服务。契约、Token 和实现放在同一文件便于本例阅读，较大的插件可以拆开维护。

```ts
import { createServiceToken, type ServiceToken } from '@nocobase/service-provider';

export interface AnnouncementChanges {
  getSnapshot(): number;
  subscribe(listener: () => void): () => void;
  notifySaved(): void;
}
export const announcementChangesToken: ServiceToken<AnnouncementChanges> =
  createServiceToken<AnnouncementChanges>('@nocobase/app-plugin-announcements/changes');

export class DefaultAnnouncementChanges implements AnnouncementChanges {
  private revision: number = 0;
  private readonly listeners: Set<() => void> = new Set();

  public readonly getSnapshot = (): number => this.revision;
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  public notifySaved(): void {
    this.revision += 1;
    for (const listener of this.listeners) listener();
  }
  public dispose(): void {
    this.listeners.clear();
  }
}
```

`getSnapshot()` 在没有通知时返回相同的数字，适合 React 判断变化。`subscribe()` 返回注销函数；`dispose()` 仅由拥有实现的 Provider 调用，不加入使用方的公开契约。

## 通过 Provider 注册与清理

新增或合并 `client/providers/announcements.ts`：

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  DefaultAnnouncementChanges,
  announcementChangesToken,
} from '../services/changes.js';

export class AnnouncementChangesProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/changes';
  private changes: DefaultAnnouncementChanges | undefined;
  public override register(): void {
    this.app.container.singleton(announcementChangesToken, () => {
      this.changes = new DefaultAnnouncementChanges();
      return this.changes;
    });
  }
  public override async shutdown(): Promise<void> {
    this.changes?.dispose();
    this.changes = undefined;
  }
}
```

Provider 的私有引用只记录自己实际创建的实例。关闭时不会为清理而首次解析服务，也不释放应用共享的 API Client 或其他插件的资源。

将 `AnnouncementChangesProvider` 加入 `client/providers/index.ts` 的构造函数数组，并确认 `client/plugin.ts` 已把该数组赋给 `serviceProviders`。保留其他 Provider，不能在数组里实例化类，也不要为同一 Token 再注册第二个实现。注册与生命周期的共用规则见 [ServiceProvider](service-provider.md)。

## 在 React 中订阅

新增 `client/hooks/use-announcement-revision.ts`：

```ts
import { useSyncExternalStore } from 'react';
import { useService } from '@nocobase/app-client';
import { announcementChangesToken } from '../services/changes.js';

export function useAnnouncementRevision(): number {
  const changes = useService(announcementChangesToken);
  return useSyncExternalStore(changes.subscribe, changes.getSnapshot, changes.getSnapshot);
}
```

`useService()` 只解析实例；`useSyncExternalStore()` 才会订阅变化，并在消费者卸载时取消订阅。页面取得 revision 后，可让已有的数据读取逻辑在 revision 改变时重新加载，保留请求取消和旧响应处理，见[数据请求与状态管理](../developing-apps/data-requests-and-state.md)。

保存入口从同一容器解析 `announcementChangesToken`，在真实保存请求成功后调用 `notifySaved()`。不要在 `finally` 中调用，也不要把通知当作数据库保存成功的证明。本篇没有实现写接口；接入时沿用应用已校验权限的业务接口。不同浏览器或进程中的更新需要额外的服务端通知机制。

## 对外公开并接入应用

在 `client/index.ts` 保留插件默认导出，增加：

```ts
export { announcementChangesToken } from './services/changes.js';
export type { AnnouncementChanges } from './services/changes.js';
export { useAnnouncementRevision } from './hooks/use-announcement-revision.js';
```

调用方从插件公开入口导入原始 Token 或 Hook，并在 App 的 `client/plugins.ts` 注册插件工厂。不要用相同字符串重新创建 Token；只导入 Hook 不会注册服务。包路径与产物映射见[插件声明与公开入口](plugin-declarations.md#公开导出)。

## 验证行为

把行为测试放到 `tests/client/service-provider.test.tsx`，更新已有的脚手架断言，保留其他仍有效的测试：

```tsx
import { act, screen } from '@testing-library/react';
import { renderWithApp } from '@nocobase/app-testing/client';
import type { ReactElement } from 'react';
import { expect, it, vi } from 'vitest';
import plugin from '../../client/index.js';
import { announcementChangesToken } from '../../client/services/changes.js';
import { useAnnouncementRevision } from '../../client/hooks/use-announcement-revision.js';

function Revision({ id }: { id: string }): ReactElement {
  return <output data-testid={id}>{useAnnouncementRevision()}</output>;
}
it('shares revisions and releases listeners', async () => {
  const view = await renderWithApp(<><Revision id="a" /><Revision id="b" /></>, {
    plugins: [plugin()],
  });
  const changes = view.app.container.resolve(announcementChangesToken);
  act(() => changes.notifySaved());
  expect(screen.getByTestId('a').textContent).toBe('1');
  expect(screen.getByTestId('b').textContent).toBe('1');
  const listener = vi.fn();
  const stop = changes.subscribe(listener);
  stop();
  act(() => changes.notifySaved());
  expect(listener).not.toHaveBeenCalled();
  changes.subscribe(listener);
  view.unmount();
  await view.app.shutdown();
  changes.notifySaved();
  expect(listener).not.toHaveBeenCalled();
});
```

还需在实际保存入口验证成功、失败和取消路径：只有成功写入才改变 revision。两个消费者收到同一通知，卸载后不再更新，应用关闭后释放所有自有监听器。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Context 管理的显示偏好和这里的服务状态各自有明确归属；不必再把同一个 revision 复制到另一份 Context 中。
