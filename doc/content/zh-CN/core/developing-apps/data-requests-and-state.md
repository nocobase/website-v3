---
title: 数据请求与状态管理
description: 使用应用已有的 API Client 和列表 Hooks，组织 URL、远程数据与表单状态，处理竞态、错误和保存后刷新。
---

页面需要同时处理接口数据、用户输入和导航状态。先明确每种状态的来源，再决定放在哪里，才能在搜索、翻页、编辑和返回时保持一致。

本篇依据默认模板 `1.0.0-beta.84` 的客户端实现。`useListData`、`useListLocation` 是生成到应用中的源码，可以按业务修改，并非 `@nocobase/app-client` 的导出。示例假设应用已经实现下文的任务接口；请求路径和响应结构应与自己的服务端一致。

## 使用 Agent

```text
请为任务列表补齐数据请求与状态处理，先检查现有接口及 client/hooks/。

搜索词和页码放在 URL 中，刷新与前进后退后可以恢复；改变搜索条件时回到第一页。
沿用 useListData 和 useListLocation，快速切换条件时旧请求不能覆盖新结果。
列表需要区分加载、空结果、失败与重试；没有权限时不能继续显示旧数据。
编辑失败保留草稿，保存成功后刷新当前查询，不丢失搜索条件。
检查路由弹窗关闭、最后一页删除、请求乱序和重复提交。
沿用 shadcn 组件、应用多语言和主题，并说明实际验证范围。
```

## 分清状态的归属

| 状态 | 建议位置 | 更新时机 |
| --- | --- | --- |
| 搜索、排序、页码、可分享的页签 | URL 查询参数 | 用户改变视图；浏览器前进后退 |
| 记录、总数、服务端返回的操作权限 | 请求 Hook 或查询缓存 | 查询条件变化、保存成功或主动刷新 |
| 尚未提交的字段、校验错误 | 表单或页面局部状态 | 用户输入、校验、保存与取消 |
| 展开、悬浮、临时选择 | 组件局部状态 | 当前交互 |
| 同一组件树中的共享值 | 共同父组件或 React Context | 相关组件协作时 |
| 跨页面的业务操作与可订阅状态 | 客户端业务服务 | 业务方法或服务事件 |

能从现有状态计算出来的值，通常不需要再保存一份。例如，当前页选中数量可以从选中 ID 与记录计算。自定义 Hook 用于复用逻辑；两个组件分别调用同一个 Hook，不会自动共享一份状态。React Context 与 Provider 的接入见 [UI 组件与交互](pages-and-interactions.md#使用-react-context-与-provider)，服务组织见[客户端业务服务](client-business-services.md)。

## 取得应用的 API Client

组件或 Hook 中用 `useApiClient()` 取得应用配置好的客户端。普通函数通过参数接收它，业务服务通过容器注入它；避免为每个页面另建客户端或拼接部署地址。

以下示例约定：

| 接口 | 输入 | 成功响应 |
| --- | --- | --- |
| `GET /tasks` | `q`、`page`、`pageSize` | `{ data: Task[], meta: { total: number } }` |
| `PATCH /tasks/:id` | JSON `{ title: string }` | `{ data: Task }` |

这些是示例业务接口，不会因为创建客户端文件而自动生成。服务端负责校验、认证、授权和数据范围，接入方式见[路由与 HTTP 接口](apis-and-services.md)。

在 `client/pages/tasks/api.ts` 中保存响应类型和修改操作：

```ts
import type { ApiClient } from '@nocobase/app-client';

export interface Task {
  id: string;
  title: string;
}

export interface TaskListResponse {
  data: Task[];
  meta: { total: number };
}

export async function renameTask(
  api: ApiClient,
  id: string,
  title: string,
  signal?: AbortSignal,
): Promise<Task> {
  const response = await api.request<{ data: Task }>({
    method: 'PATCH',
    path: `/tasks/${encodeURIComponent(id)}`,
    json: { title },
    signal,
  });
  return response.data;
}
```

`path` 相对于 API Client 的地址，通常不包含 `/api` 或应用挂载路径。`request<T>()` 返回整个响应体，泛型只描述预期类型，不会校验运行时数据。这里的 `response.data` 是业务接口的字段，不是额外的 HTTP 客户端包装。

服务端使用 Repository 数据接口时，改用 `api.repository(name)` 及其对应协议，不要混用上面的响应假设。详见 [API Client](../framework/http/api-client.md) 与 [Repository 数据接口](../framework/http/repository-routes.md)。

## 从 URL 读取列表条件

在 `client/pages/tasks/use-task-list.ts` 中组合模板已有的 Hooks：

```ts
import { useListData } from '#hooks/use-list-data';
import { useListLocation } from '#hooks/use-list-location';
import type { TaskListResponse } from './api.js';

export function useTaskList() {
  const { params, setParams, active } = useListLocation();
  const q = params.get('q') ?? '';
  const inputPage = Number(params.get('page') ?? '1');
  const page = Number.isSafeInteger(inputPage) && inputPage > 0 ? inputPage : 1;
  const pageSize = 20;
  const query = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
  const request = useListData<TaskListResponse>(`/tasks?${query}`, { active });

  function setSearch(value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set('q', value);
      else next.delete('q');
      next.set('page', '1');
      return next;
    }, { replace: true });
  }

  function setPage(value: number) {
    if (!Number.isSafeInteger(value) || value < 1) return;
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('page', String(value));
      return next;
    });
  }

  return { ...request, q, page, pageSize, active, setSearch, setPage };
}
```

页面把 `q`、`setSearch` 接入搜索控件，把 `page`、`setPage` 接入分页控件。需要防抖时，可以用局部状态保留输入中的文本，提交搜索词时再更新 URL；注意中文输入法的组合输入。这里搜索使用 `replace`，避免每次输入增加历史记录，翻页则保留前进后退记录。

`useListLocation()` 依赖模板提供的路由上下文。列表被子路由覆盖时，它保留列表自己的查询参数，并通过 `active` 暂停读取；返回列表后恢复读取。此时 `useListData` 的 `loading` 可能为 `true`，不代表正在发起请求。独立于模板路由树的页面应根据自己的 Router 组织读取，不能直接照搬 `active` 的判定。

需要排序、可变页大小和删除后自动校正页码时，可继续参考模板的 `client/hooks/use-table-url-state.ts`。只允许接口支持的排序字段，保留其他查询参数；参数校正使用 `replace`，避免产生往返跳转。

## 处理加载、竞态和错误

`useListData` 在路径变化或卸载时取消旧读取，使用请求代次阻止失效响应写回。`reload()` 会同步使旧结果失效，再触发读取。复用这个实现时，页面仍然需要处理展示状态：

| 状态 | 页面行为 |
| --- | --- |
| 首次加载，没有数据 | 展示加载状态 |
| 成功且 `data.data` 为空 | 展示空状态；不要把请求失败当成空列表 |
| 正在刷新，已有同一查询的数据 | 标记正在更新；需要最新结果的操作等待刷新完成 |
| 网络失败或服务端暂时不可用 | 展示可重试反馈，保留草稿，通过 `reload()` 重试读取 |
| 401、403、404 | 按身份、权限或记录状态反馈，不继续展示旧的受限数据 |
| 请求因切换条件或卸载而取消 | 不显示错误提示，不让取消结果覆盖新页面 |

默认情况下，改变请求路径不会继续显示上一个路径的数据。`keepPreviousData: true` 可在切换查询时保留上一份结果，但应明确标记它仍是旧结果，不用它计算新查询的总数或执行批量操作。它不是完整的共享查询缓存。

HTTP 错误使用 `ApiClientError` 的 `status`、`reason`、`domain` 判断；网络错误可能是普通异常。把已知错误映射为翻译文案和字段提示，`requestId` 可用于排查，不能把开发者用的 `error.message` 直接展示给用户。通用机制见 [API Client](../framework/http/api-client.md)。

自行编写请求 Effect 时，同时处理取消和结果归属，清理订阅并声明实际依赖。React 开发模式可能重复运行 Effect 的建立与清理步骤；见 [React useEffect](https://react.dev/reference/react/useEffect)。

## 保存后刷新与草稿保留

表单通过 `useApiClient()` 取得客户端，调用 `renameTask(api, id, title)`。提交前校验并标记提交中，同时使用同步的提交锁防止连续点击；结束后释放锁。

保存成功后，用服务端返回的记录更新当前详情，或调用列表的 `reload()` 重新读取当前查询。新建、删除或修改排序字段会影响总数与位置，通常应重新读取列表。`replaceData()` 只替换当前 Hook 的结果；它不会更新其他页面，也不会自动重新计算分页、权限和汇总。

保存失败时保留草稿，按接口契约关联字段错误。不要在每次列表刷新后重新初始化编辑表单；切换到另一条记录时，再根据记录 ID 明确重置。当前记录已不存在或已失去权限时，结束可编辑状态并说明原因。

列表与编辑子路由可以通过父级状态、Outlet context 或回调传递刷新动作。关闭弹窗或返回列表后恢复原搜索条件；删除最后一页最后一条记录时，用最新的匹配查询总数调整页码，而不是使用旧总数。

取消浏览器请求不代表服务端撤销修改，超时也不证明保存失败。自动重试写操作前需要明确幂等语义；存在并发修改时使用服务端版本检查或冲突处理。跨页面统一封装操作见[客户端业务服务](client-business-services.md)。

## 何时引入共享查询缓存

单页列表可以先使用模板 Hooks。多个页面需要共享同一查询、去重请求、后台刷新或乐观更新时，再使用项目已有的查询缓存方案，并统一 Provider 的挂载位置。

缓存键需要覆盖资源、查询参数及影响可见结果的身份或上下文。退出登录或切换身份时，清理旧请求和缓存。不要同时让组件、服务和缓存分别维护一份相互独立的记录列表。

## 验证结果

为自己的页面与 Hooks 添加测试，重点覆盖：

- 连续输入两个搜索词，刻意让第一个请求最后返回，仍展示第二个结果。
- 刷新、前进后退、进入子路由再返回，查询参数与列表保持一致。
- 读取失败、取消、401、403、404，以及成功的空结果分别呈现正确状态。
- 保存失败保留草稿，重复点击只发起一次提交，成功后刷新当前查询。
- 删除最后一页的最后一条记录时校正页码，保留搜索和排序。
- 卸载与身份切换后，旧请求和共享状态不会继续影响当前界面。

默认模板已有 `tests/client/list-recovery.test.tsx` 和 `tests/client/table-url-state.test.tsx` 可作为参考。使用自己项目中的实际路径运行相关测试，并执行 `pnpm typecheck`、`pnpm build`；验证方法见[测试与验收](testing-and-acceptance.md)。

本文的接口约定需要业务服务端实现；客户端测试替换网络边界只能验证请求与状态行为，真实授权和持久化仍需接口与集成测试。

源码基线：[useListData](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/hooks/use-list-data.ts)、[useListLocation](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/hooks/use-list-location.ts)。
