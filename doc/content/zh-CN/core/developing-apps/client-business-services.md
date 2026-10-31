---
title: 客户端服务
metaDescription: 注册和调用 NocoBase 客户端服务，注入 API Client，订阅共享状态，并管理请求取消和资源清理。
---

客户端服务用于在多个组件或页面之间复用操作、协调状态变化，或管理应用级资源。服务可以封装业务操作，也可以提供缓存、通知等通用能力；ServiceProvider 负责把它注册到应用容器。

商品目录示例把名称修改封装为一个服务：编辑区调用服务保存，列表订阅变更后重新请求数据，两个计数组件订阅同一份状态。示例基于默认模板 `1.0.0-beta.85`，界面沿用模板的 shadcn 组件。[获取源码并运行](#示例源码与运行)。

## 什么时候需要客户端服务

一处使用的计算或格式转换可以写成普通函数；表单草稿、加载状态等页面交互放在组件或自定义 Hook 中。一组组件需要共享上下文时，可以使用 React Context。多个页面需要复用操作、协调变更，或共同使用一项有生命周期的资源时，再考虑客户端服务。

客户端服务不替代服务端业务规则。权限、数据范围、事务和最终校验仍由服务端执行。API 请求的基础用法见[数据请求与状态管理](data-requests-and-state.md)。

## 编写和注册服务

### 封装业务操作与变更通知

在 `client/services/products.ts` 中通过构造函数接收 API Client。`rename()` 接收商品 ID、名称及本次请求选项，等待接口成功后增加计数并通知订阅者：

```ts
import type { ApiClient } from '@nocobase/app-client';

export interface Product {
  id: string;
  name: string;
  sku: string;
}
export type DemoMode = 'normal' | 'slow' | 'fail';
export interface RenameOptions {
  signal?: AbortSignal;
  mode?: DemoMode;
}

export class ProductsService {
  private revision = 0;
  private disposed = false;
  private readonly listeners = new Set<() => void>();
  constructor(private readonly api: ApiClient) {}
  getSnapshot = (): number => this.revision;
  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) throw new Error('ProductsService has been disposed.');
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  async rename(
    id: string,
    name: string,
    options: RenameOptions = {},
  ): Promise<Product> {
    if (this.disposed) throw new Error('ProductsService has been disposed.');
    const response = await this.api.request<{ data: Product }>({
      method: 'PATCH',
      path: `clientServiceProducts/${encodeURIComponent(id)}`,
      json: { name },
      signal: options.signal,
      // This header controls this example's HTTP response, not a framework feature.
      headers: { 'x-demo-mode': options.mode ?? 'normal' },
    });
    if (!this.disposed) {
      this.revision += 1;
      for (const listener of this.listeners) listener();
    }
    return response.data;
  }
  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }
}
```

`getSnapshot()` 返回当前计数，`subscribe()` 返回取消订阅的函数，`dispose()` 清理监听并停止后续通知。它们是示例自行定义的方法，不是继承某个 NocoBase 服务基类获得的能力。

`revision` 统计这个服务收到的成功修改响应，不是商品记录版本，也不是列表缓存。请求失败或因取消而拒绝时，异常交给页面处理，计数不变。订阅回调只做轻量的状态失效通知；异步刷新需要自行处理失败。

请求路径相对于应用的 API base URL，不写部署路径或 `/api` 前缀。这里的 `x-demo-mode` 是示例接口的演示开关，用来触发慢响应和失败，不是 API Client 的内置配置。对应接口已在示例服务端实现，添加客户端服务本身不会创建接口。

[查看服务源码](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/services/products.ts) · [查看演示接口](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/server/routes/demo-products.ts)

### 定义共享 Token

在 `client/services/tokens.ts` 中定义并导出服务标识：

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { ProductsService } from './products.js';
export const productsServiceToken =
  createServiceToken<ProductsService>('app.products');
```

注册方和使用方必须导入同一个 Token。重复调用 `createServiceToken('app.products')` 会创建不同的标识，即使名称相同也不能解析到原服务。

[查看 Token 源码](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/services/tokens.ts)

### 注册 ServiceProvider 并注入依赖

在 `client/providers/products.ts` 中注册服务工厂，从容器解析应用已有的 API Client：

```ts
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import { ProductsService } from '../services/products.js';
import { productsServiceToken } from '../services/tokens.js';
export class ProductsServiceProvider extends ServiceProvider<ClientApplication> {
  readonly name = 'app.products';
  override register(): void {
    this.app.container.singleton(
      productsServiceToken,
      (services) => new ProductsService(services.resolve(apiClientToken)),
    );
  }
  override async shutdown(): Promise<void> {
    this.app.container.resolveIfCreated(productsServiceToken)?.dispose();
  }
}
```

`singleton()` 在首次解析时创建实例，同一容器之后返回同一实例。注册阶段只声明依赖，不发起请求或访问页面 DOM。`shutdown()` 的清理行为见[取消订阅与释放资源](#取消订阅与释放资源)。

在 `client/service-provider.ts` 原有数组中追加 Provider：

```ts
import { ProductsServiceProvider } from './providers/products.js';

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultClientServiceProvider,
  ProductsServiceProvider,
];

export default serviceProviders;
```

这是聚合文件的局部修改，保留原有类型导入、`DefaultClientServiceProvider` 和其他 Provider。默认 Provider 还负责 Toast 和页面标题；模板的 `client/runtime.ts` 已加载此聚合入口，无需重复接入。`services/` 和 `providers/` 只是代码组织目录，不会自动注册其中的文件。

[查看 Provider](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/providers/products.ts) · [查看应用注册入口](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/service-provider.ts)

## 在页面中调用服务

### 提交修改与处理失败

在组件或自定义 Hook 顶层调用 `useService(productsServiceToken)`，然后在提交处理函数中调用服务方法。不要在事件回调中调用 Hook，也不要在每次渲染时重新创建服务。

编辑组件自己保存草稿、提交状态和反馈。下面摘出 `ProductEditor` 中的状态与提交逻辑；`product` 来自选中的商品，`mode` 来自 **Response mode**，组件挂载和卸载时的处理见下一节：

```tsx
// Inside ProductEditor. Imports, validation and form markup are in the full source.
const products = useService(productsServiceToken);
const [name, setName] = useState(product.name);
const [pending, setPending] = useState(false);
const [feedback, setFeedback] = useState('');
const activeRef = useRef<AbortController | null>(null);
const mountedRef = useRef(false);

async function submit(event: FormEvent) {
  event.preventDefault();
  // Name validation is omitted here.
  if (activeRef.current) return;
  setFeedback('');
  setPending(true);
  const controller = new AbortController();
  activeRef.current = controller;
  try {
    const saved = await products.rename(product.id, name.trim(), {
      signal: controller.signal,
      mode,
    });
    if (mountedRef.current) {
      setName(saved.name);
      setFeedback('saved');
    }
  } catch {
    if (mountedRef.current)
      setFeedback(controller.signal.aborted ? 'cancelled' : 'failed');
  } finally {
    activeRef.current = null;
    if (mountedRef.current) setPending(false);
  }
}
```

完整表单会校验名称、禁用提交中的输入和保存按钮，并通过 `activeRef` 阻止重复提交。失败时不清空 `name`，页面根据反馈标识显示翻译后的文案；实际业务中还需按接口错误区分字段校验、无权限等情况。

打开示例的 `/service-products`，点击商品行的 **Edit**，修改名称后点击 **Save changes**。列表应显示新名称，两个 **Successful changes** 计数同时增加。

![保存后商品列表和两个变更计数同步更新](/assets/core/client-services/saved.png)

将 **Response mode** 改为 **Fail** 再保存，页面显示失败提示并保留草稿，列表和计数不变。

![请求失败后保留编辑草稿和原有计数](/assets/core/client-services/failed.png)

[查看完整编辑组件](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/pages/service-products/editor.tsx)

### 取消页面发起的请求

页面创建的请求由页面管理。把 `AbortSignal` 传给服务，服务再传给 API Client；组件卸载时取消请求，并避免更新已卸载组件的状态：

```tsx
// Inside ProductEditor, using the refs declared above.
useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
    activeRef.current?.abort();
  };
}, []);

// The cancel button in the form:
<Button
  variant="outline"
  type="button"
  onClick={() => activeRef.current?.abort()}
>
  {t('serviceProducts.cancel')}
</Button>
```

选择 **Slow (3 seconds)** 后保存，可以看到禁用的输入、**Saving…** 和 **Cancel request**。点击取消，客户端停止等待，计数不增加。

![等待慢响应时可以取消请求](/assets/core/client-services/pending.png)

取消请求不保证服务端撤销修改。此示例特意先更新内存记录，再延迟返回响应：取消后点击 **Refresh list**，仍可看到服务端已保存的新名称。真实业务需要撤销时，应另外设计服务端操作。

![取消后刷新列表，仍能看到服务端已经保存的名称](/assets/core/client-services/cancelled.png)

[查看请求取消与卸载清理](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/pages/service-products/editor.tsx)

## 让多个视图响应服务变化

### 使用 useSyncExternalStore 订阅状态

`useService()` 只取得实例，不会监听实例字段。需要让组件随服务状态变化重新渲染时，用 `useSyncExternalStore` 连接订阅和快照：

```ts
import { useService } from '@nocobase/app-client';
import { useSyncExternalStore } from 'react';
import { productsServiceToken } from '../services/tokens.js';
export function useProductRevision(): number {
  const products = useService(productsServiceToken);
  return useSyncExternalStore(products.subscribe, products.getSnapshot);
}
```

页面中的两个 `ChangeCounter` 都使用这个 Hook。以下省略组件导入，完整实现见源码：

```tsx
function ChangeCounter({ title }: { title: string }) {
  const { t } = useTranslation();
  const count = useProductRevision();
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <p role="status">{t('serviceProducts.count', { count })}</p>
      </CardContent>
    </Card>
  );
}
```

保存商品后，服务通知两个订阅者，React 重新读取快照，两个计数随之更新，效果见[保存后的界面](#提交修改与处理失败)。组件卸载时，React 会调用 `subscribe()` 返回的清理函数。

快照在状态未变时必须稳定。这里返回数字；返回对象时应复用未变化的快照，不能每次读取都创建新对象。本例用于浏览器渲染，服务端渲染还需提供合适的 `getServerSnapshot`，详见 [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)。

[查看订阅 Hook](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/hooks/use-product-revision.ts) · [查看计数组件](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/pages/service-products/index.tsx)

### 订阅通知并刷新列表

列表需要的是重新读取服务端数据，可以直接订阅刷新动作，无需把整个列表放进服务。示例复用模板的 `useListData`，由它处理首次加载、请求取消和过期响应：

```ts
import { useService } from '@nocobase/app-client';
import { useEffect } from 'react';
import { useListData } from './use-list-data.js';
import { productsServiceToken } from '../services/tokens.js';
import type { Product } from '../services/products.js';
export function useProducts() {
  const products = useService(productsServiceToken);
  const request = useListData<{ data: Product[] }>('clientServiceProducts');
  const { reload } = request;
  useEffect(() => products.subscribe(reload), [products, reload]);
  return {
    rows: request.data?.data ?? [],
    loading: request.loading,
    failed: Boolean(request.error),
    reload,
  };
}
```

列表挂载时会读取数据，不依赖过去发生的通知；卸载时取消服务订阅。保存后的刷新只走这一条订阅路径，提交处理函数不再重复调用 `reload()`。界面效果与[保存后的界面](#提交修改与处理失败)一致。

这套通知只覆盖当前服务发出的成功修改。其他浏览器或用户的修改不会自动推送到这里，仍需手动刷新或接入实时通知。

[查看列表订阅](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/hooks/use-products.ts) · [查看模板列表 Hook](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/hooks/use-list-data.ts)

## 管理服务生命周期

### 单例的作用范围

容器单例属于当前浏览器应用实例。两个组件使用同一 Token 会取得同一个服务；刷新页面、打开另一个标签页或创建另一应用容器，都会有独立实例。

刷新示例页面后，两个计数归零，而商品名称仍来自服务端内存。重启服务端才会恢复初始商品。客户端服务的生命周期与服务端数据的保存时间是两回事。

React Provider 为组件树提供上下文，入口是 `client/react-providers.ts`；ServiceProvider 注册容器服务，入口是 `client/service-provider.ts`。调用服务不需要额外包一层 React Provider。如果以后增加与账号有关的缓存，还需在身份变化时清理缓存和在途请求。

### 取消订阅与释放资源

页面卸载时取消局部订阅和页面请求；服务负责清理自己拥有的资源。示例 Provider 在关闭时使用：

```ts
this.app.container.resolveIfCreated(productsServiceToken)?.dispose();
```

`resolveIfCreated()` 只返回已创建的实例，避免应用关闭时反而创建从未使用过的服务。本例的 `dispose()` 清空监听集合，并阻止未完成请求在关闭后继续发布通知；它不会关闭应用共享的 API Client。

点击 **Hide second view** 卸载第二个计数组件，再保存商品，第一个计数仍应更新。点击 **Show second view** 后，新挂载的组件会读取最新快照，不必等待下一次保存。

![卸载第二个视图后，第一个计数继续更新](/assets/core/client-services/unmounted.png)

若服务自己创建连接、定时器或后台请求，也应由服务负责关闭或取消。完整容器契约和生命周期顺序见[服务容器与 Token](../framework/services/container.md)及 [ServiceProvider 与服务生命周期](../extension-development/service-provider.md)。

[查看释放实现](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/providers/products.ts) · [查看单例、取消订阅与关闭测试](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/tests/client/products-service.test.ts)

## 使用 Agent 开发客户端服务

在已有商品页面和接口的应用中，可以向开发 Agent 提出需求：

```text
把多个页面使用的商品名称修改操作提取为一个客户端服务。
保存成功后，让当前打开的商品列表和变更计数同步更新；失败时保留输入，允许重试。
等待响应时可以取消请求，离开页面后清理订阅和请求。
```

将具体页面和接口名称替换为自己的应用内容。注册入口、API Client 注入和 React 订阅方式按前面的实现说明处理；验收时检查页面行为，而不只检查是否新增了服务类。

## 示例源码与运行

### 安装与启动

[完整示例与 README](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/README.MD)需要 Node.js 24 或更高版本、pnpm 11，依赖版本由 `pnpm-lock.yaml` 锁定。在独立目录运行：

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 36708ad5b081835c6ab206cdc5ec1a40618971f3
cd apps/client-business-services
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite --json
pnpm nocobase config check --json
pnpm dev
```

在启动输出的应用地址后追加 `service-products`；例如应用地址以 `/main/` 结束时，打开 `/main/service-products`。演示页无需登录。SQLite 用于启动此独立示例的模板功能，客户端服务本身不依赖特定数据库；已有应用沿用自身配置。

示例使用真实 API Client 和 HTTP 接口，但商品仅保存在服务端内存中。公共演示接口只允许修改三个固定商品的名称，不接触真实业务数据，不演示身份权限或数据库持久化。将这个模式接入业务应用时，服务端应使用已有的鉴权、授权和数据访问机制。

### 验证共享、失败与清理行为

在示例 App 根目录运行：

```bash
pnpm exec vitest run tests/client/products-service.test.ts tests/client/service-products.test.tsx tests/server/demo-products.test.ts
```

这些测试分别验证服务的单例与通知、编辑界面的提交状态和草稿保留，以及演示接口的数据边界。用浏览器按前文操作确认成功、失败、取消和组件卸载后的表现；浏览器自动化命令见示例 README。

还可打开第二个标签页：计数从零开始，其他标签页的成功修改不会自动触发这里的刷新；点击 **Refresh list** 才重新读取商品。更完整的业务数据与权限验收见[测试与验收](testing-and-acceptance.md)。
