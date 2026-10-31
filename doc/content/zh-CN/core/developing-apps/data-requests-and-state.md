---
title: 数据请求与状态管理
description: 使用应用 API Client、模板列表 Hooks 和 useSubmission，同步查询条件，处理请求竞态、提交恢复与保存后刷新。
---

客户目录示例展示搜索、翻页、查看详情和编辑时的数据流转：查询条件跟随 URL，读取结果来自服务端，未提交的字段留在表单中。示例使用真实数据库、应用权限和提交回执；慢请求、写入拒绝和响应丢失通过演示开关触发。[源码与运行方式](#示例源码与运行)在文末。

本文对应默认模板 `1.0.0-beta.85`。`useApiClient`、`useSubmission` 来自 `@nocobase/app-client`；`useListData`、`useListLocation`、`useTableUrlState` 是生成到应用 `client/hooks/` 中的源码，可以按业务修改。界面沿用 shadcn 组件及模板的 `DataTable`、路由弹窗和抽屉，组件接入见 [UI 组件与交互](pages-and-interactions.md)。

## 使用应用的 API Client

### 获取客户端与调用业务接口

组件或 Hook 中调用 `useApiClient()`，普通函数通过参数接收客户端。它已经使用应用的 API 地址和会话配置，页面无需另建客户端或拼接部署前缀。

下面是客户详情读取的最小调用；示例详情页通过后文的 `useListData` 管理这次请求的生命周期。

```ts
import { useApiClient } from '@nocobase/app-client';
import type { Customer } from './api.js';

const api = useApiClient(); // 在组件或 Hook 内调用
const response = await api.request<{ data: Customer }>({
  path: `customerRecord/${encodeURIComponent(id)}`,
  signal,
});
const customer = response.data;
```

`path` 相对于应用 API 根地址，不包含 `/api` 或 `/main`。`request<T>()` 返回整个响应体；这里的 `data` 是业务接口定义的字段。泛型描述预期类型，不会校验运行时响应。`id` 和 `signal` 分别来自路由参数与当前请求的 `AbortController`。

在 **Customer directory** 点击 **Alpine Goods**，抽屉通过 `GET customerRecord/:id` 读取数据库中的记录。这个接口由示例服务端实现，不会因客户端调用自动生成。

![客户详情抽屉显示接口返回的姓名、联系人、邮箱与状态](/assets/core/developing-apps/data-requests-and-state/detail.png)

查看源码：[详情页](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/detail.tsx)、[业务接口](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/server/routes/customers.ts)。通用请求选项见 [API Client](../framework/http/api-client.md)。

### 调用 Repository 数据接口

服务端注册 Repository 数据接口后，客户端用 `api.repository<Customer>('customers')` 调用其协议。示例的编辑操作位于 `client/pages/customers/api.ts`：

```ts
const result = await api.repository<Customer>('customers').updateOne({
  filter: { id },
  values,
  idempotencyKey: key,
  signal,
});
return result.record;
```

这里返回的是 Repository 客户端整理后的结果，记录在 `result.record` 中，不能照搬 `request()` 的 `response.data`。`values` 是待保存字段；`key` 与 `signal` 由后文的 `useSubmission` 提供。标准写接口要求操作键，并依赖模板已注册的提交回执服务。

在详情抽屉点击 **Edit customer**，修改联系人后保存；实际请求为 `POST customers/updateOne`。新建、删除分别使用 `createOne`、`deleteOne`，都传入同一次逻辑提交的操作键。认证、业务操作权限、字段范围和输入校验仍由服务端执行。

![客户编辑弹窗](/assets/core/developing-apps/data-requests-and-state/edit.png)

查看源码：[读取与写入封装](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/api.ts)。服务端注册方式见 [Repository 数据接口](../framework/http/repository-routes.md)。

## 读取列表与同步查询条件

### 使用 useListData 读取与刷新数据

`useListData` 接收请求路径，把读取结果、错误和刷新动作交给页面。以下是 `useCustomerList` 中的核心调用，`query` 包含当前搜索、状态、分页和排序参数：

```ts
import { useListData } from '#hooks/use-list-data';
import type { CustomerList } from './api.js';

const request = useListData<CustomerList>(`customerList?${query}`, { active });
// request.data: { data: Customer[], meta: { total: number } } | undefined
// request.loading / request.error / request.reload()
```

打开列表会读取 `GET customerList`；点击 **Refresh** 重新读取当前查询。数据确实来自数据库，刷新页面后已保存的记录仍然存在。`reload()` 只影响当前 Hook 实例，不会自动刷新其他页面或成为共享查询缓存。

![客户目录列表与分页](/assets/core/developing-apps/data-requests-and-state/list.png)

查看源码：[列表 Hook](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/use-customer-list.ts)、[useListData](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/hooks/use-list-data.ts)。

### 搜索、分页与排序写入 URL

`useListLocation()` 取得列表自己的查询参数；`readTableUrlState()` 解析页码、每页条数和排序；`useTableUrlState()` 把表格操作写回 URL。示例只允许服务端支持的四个排序字段，每页可选 5、10 或 20 条。

搜索输入先保存在局部状态，点击 **Search** 或按回车才提交。更新搜索或状态筛选时，复制原参数并删除 `page`，回到第一页，保留排序和每页条数：

```ts
setParams((old) => {
  const next = new URLSearchParams(old);
  if (value) next.set('q', value);
  else next.delete('q');
  next.delete('page');
  return next;
}, { replace: true });
```

尝试搜索 `Al`、选择 **Active**，再调整每页条数和排序。类似下面的地址可在刷新后恢复同一查询；路径要加在自己应用的挂载路径之后。

```text
/customers?q=Al&status=active&pageSize=5&sort=name&order=desc
```

![按搜索词、状态和排序读取客户](/assets/core/developing-apps/data-requests-and-state/query.png)

查看源码：[URL 与列表参数](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/use-customer-list.ts)、[表格 URL 状态](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/hooks/use-table-url-state.ts)。

### 子路由覆盖与返回后恢复

列表进入详情或编辑子路由后，`useListLocation()` 保留列表自己的参数，并返回 `active: false`。把它传给 `useListData` 可暂停后台列表读取；关闭子路由后再恢复。此时 `loading: true` 不一定意味着正在发请求，刷新提示要同时判断 `active`。

示例通过带查询字符串的相对链接进入详情，再从详情进入编辑：

```tsx
<RecordLink to={`${customer.id}${search}`}>{customer.name}</RecordLink>
// 详情页内
<Link to={`edit${search}`}>...</Link>
```

从筛选后的列表打开 **Alpine Goods**，编辑并保存，再关闭详情抽屉，搜索、状态、页大小和排序应保持不变。抽屉效果见[获取客户端与调用业务接口](#获取客户端与调用业务接口)；编辑层效果见[调用 Repository 数据接口](#调用-repository-数据接口)。

这些 Hooks 依赖模板路由上下文。独立于模板路由树的页面，需要按自己的 Router 组织参数与激活状态。查看源码：[列表页与 Outlet](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/index.tsx)、[useListLocation](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/hooks/use-list-location.ts)。

## 处理请求状态与错误

### 加载、空结果与刷新状态

页面根据读取状态给 `DataTable` 传入 `listState`，避免把“尚未读到数据”误判为空列表：

| 情况 | 示例行为 |
| --- | --- |
| 首次读取，尚无结果 | 显示加载状态 |
| 成功但没有匹配记录 | 显示 No results，可清除筛选 |
| 刷新同一查询，已有结果 | 保留当前行，标记正在刷新 |
| 改变查询条件 | 默认等待新查询，不展示上一查询的行 |

展开 **Request demonstrations**，选择 **Slow response (1.6 seconds)** 可观察加载；结果出现后点击 **Refresh**，可以看到保留数据的刷新状态。

![慢请求中的列表加载状态](/assets/core/developing-apps/data-requests-and-state/loading.png)

![刷新同一查询时保留行并显示更新提示](/assets/core/developing-apps/data-requests-and-state/refreshing.png)

搜索 `NoSuchCustomer`，接口成功但返回零条记录：

![搜索成功但没有匹配结果](/assets/core/developing-apps/data-requests-and-state/empty.png)

查看源码：[列表状态映射](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/index.tsx)。演示开关需要启动时设置 `CUSTOMER_DEMO_FAULTS=1`，启用方式见文末。

### 取消旧请求与防止结果乱序

`useListData` 在路径变化或卸载时中止旧读取，并检查请求是否仍属于当前代次；`reload()` 会先同步使旧请求失效，再触发下一次读取。取消请求和拒绝旧结果需要一起处理，单靠后返回的结果覆盖状态会产生竞态。

选择 **Out-of-order responses**，搜索 `A`，随后立即搜索 `Al`。示例让前一次读取延迟 1.8 秒、后一次延迟 0.15 秒，列表应始终停留在 `Al` 的结果。界面结果见[搜索、分页与排序写入 URL](#搜索分页与排序写入-url)；截图本身不能证明请求顺序，页面测试会控制两次响应的完成顺序并断言旧结果不出现。

查看源码：[请求生命周期](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/hooks/use-list-data.ts)、[乱序测试](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/tests/client/customers.test.tsx)。中止浏览器请求不代表服务端撤销了已经执行的写操作。

### 请求失败、重试与权限变化

选择 **Read failure**，服务端返回演示用的 503；点击 **Retry** 会切回正常读取。对于同一查询的刷新失败，Hook 保留已有结果并附带错误；401、403、404 则清除旧结果，页面分别解释会话结束、无权访问或记录不可用。

![读取失败与重试入口](/assets/core/developing-apps/data-requests-and-state/read-error.png)

使用 `ApiClientError.status`、`reason`、`domain` 映射应用的翻译文案，网络异常另行处理。不要把服务端面向开发者的 `error.message` 直接展示给读者；需要排查时可记录 `requestId`。

权限示例使用原生 **Users** 和 **Permission management**。给一个普通用户分配 **Customer viewer**，用该用户打开列表；管理员保留页面访问权限，撤销客户的查看操作，再由用户点击 **Refresh**。旧记录应消失，直接请求接口也返回 403。编辑员使用 **Customer editor**；角色不会自动分配给所有用户。

![撤销业务查看权限后清除旧客户数据](/assets/core/developing-apps/data-requests-and-state/permission.png)

查看源码：[错误映射](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/api.ts)、[服务端授权](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/server/routes/customers.ts)、[权限浏览器测试](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/tests/playwright/customers.test.ts)。页面访问与数据操作是独立授权；界面隐藏按钮不能替代接口检查。

## 提交修改与更新页面

### 使用 useSubmission 管理提交与重复提交

一个表单使用一个 `useSubmission`，所有提交入口进入同一个 `run()`。控制器先取得同步锁，再保存输入快照并生成操作键；连续点击和回车不会启动并行提交。界面根据 `submitting` 显示忙碌状态，并禁止继续修改当前提交的字段。

下面省略表单、错误显示和演示开关，只保留编辑页的提交核心：

```ts
import { useSubmission } from '@nocobase/app-client';

const submission = useSubmission({
  scope: `${session?.user.id}:customers:${id ?? 'new'}`,
});
const saved = await submission.run(
  { id, ...values },
  async (key, signal, input) => {
    const { id: recordId, ...fields } = input;
    return saveCustomer(api, fields, recordId, key, signal);
  },
);
```

`scope` 区分身份、操作和表单实例，用于恢复未确认的提交；不要让互不相关的表单共用它。本例同一浏览器标签中只打开一个对应的路由编辑表单。服务端的标准 Repository 写入与回执在同一事务中提交，同一操作键和相同输入的重试可返回原结果。

在新增或编辑弹窗展开 **Submission demonstrations**，选择 **Slow submission (1.6 seconds)**，保存期间连续触发提交。页面应停留在提交中，数据库只发生一次对应写入。

![慢提交时锁定字段与保存操作](/assets/core/developing-apps/data-requests-and-state/submitting.png)

查看源码：[编辑与提交控制](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/edit.tsx)、[模板提交服务](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/server/providers/submission.ts)。自定义有副作用的业务接口需要显式接入回执事务，不能只加请求头就认为具备相同保障。

### 失败保留草稿与结果未知时的重试

在新增弹窗填写客户资料，选择 **Reject before saving** 并保存。接口在写入前明确拒绝，字段保持原值；切回 **Normal submission** 后可以修改并重新提交。

![写入被拒绝后保留表单草稿](/assets/core/developing-apps/data-requests-and-state/draft.png)

选择 **Lose response after saving** 时，示例先完成真实写入和回执，再返回 503，模拟客户端拿不到可靠结果。此时 `submitting` 已结束，但 `pending` 仍为真：保持原字段，点击 **Retry original submission**，使用原操作键和输入恢复结果，不能换一个新键再新增一次。

![结果未知时保留原提交并提供恢复入口](/assets/core/developing-apps/data-requests-and-state/uncertain.png)

`pending` 不等同于“正在请求”。网络失败、超时和结果不明的服务端错误都可能留下待确认操作；不要仅凭失败提示断言未写入。重新加载页面后，控制器可从当前标签的会话存储恢复操作键和输入摘要，**不会自动恢复表单草稿**。示例要求重新填写原值，输入不一致时拒绝开启新操作。

查看源码：[表单与恢复提示](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/edit.tsx)、[真实写入后丢失响应的测试](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/tests/server/customers.test.ts)。未提交改动的关闭确认沿用 [UI 组件与交互](pages-and-interactions.md)，不把关闭请求当成写入回滚。

### 保存后更新详情与刷新列表

编辑页成功取得保存结果后，通过父路由的 Outlet context 通知刷新，再关闭当前编辑层。详情页传递的刷新动作同时更新自身和后台列表：

```tsx
<Outlet context={{
  reload: () => {
    request.reload(); // 当前详情
    parent.reload();  // 客户列表
  },
}} />
```

在详情抽屉编辑联系人并保存，编辑弹窗关闭，抽屉显示最新内容；关闭抽屉后，列表重新读取保留下来的查询。新增、删除或修改排序字段可能改变记录位置与总数，重新读取比只修改当前行更完整。

![保存后详情抽屉重新读取客户资料](/assets/core/developing-apps/data-requests-and-state/saved-detail.png)

保存与刷新要分别处理：写入已经成功而后续读取失败时，显示读取失败和刷新入口，不要提示重新提交写操作。查看源码：[父级刷新动作](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/detail.tsx)、[保存完成后的处理](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/edit.tsx)。

### 删除后校正页码并保留查询条件

删除成功后先刷新当前查询，再将这次成功读取的总数交给 `useTableUrlState`。不要用刷新中的旧总数校正页码，否则可能回到错误的页面。

```ts
const table = useTableUrlState({
  ...tableOptions,
  active,
  revision: request.revision,
  rowCount: !request.loading && !request.error
    ? request.data?.meta.total
    : undefined,
});
```

创建六条带相同名称前缀的客户，搜索这个前缀，每页显示五条，再删除第二页唯一的记录。列表应回到第一页，保留搜索、状态筛选和排序。自动化用例会准备并清理自己的六条记录。

![删除当前页记录前的确认](/assets/core/developing-apps/data-requests-and-state/delete.png)

![删除后校正到有效页码并保留筛选结果](/assets/core/developing-apps/data-requests-and-state/corrected-page.png)

查看源码：[删除操作](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/delete.tsx)、[总数与页码校正](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/use-customer-list.ts)。

## 验证交互与数据结果

### 验证请求、提交与返回流程

先走一遍搜索、翻页、打开详情、编辑、保存和返回，再用演示开关检查失败分支：

- 快速提交 `A`、`Al` 两次搜索，最终只显示 `Al` 的结果。
- 读取失败可重试；普通刷新失败保留当前查询的数据，403 后不再显示旧记录。
- 写入拒绝后草稿不变；响应丢失后重试原提交，数据库只有一条新记录。
- 保存返回后查询条件不变；删除末页唯一记录后页码有效。
- 查看员看不到写操作，直接调用写接口也被拒绝；撤销查看权限后读取返回 403。

界面截图用于对照状态；重复写入、权限和持久化要检查接口响应与数据库结果。关闭和离开保护、窄屏操作也包含在示例浏览器测试中。

### 运行测试与构建

在示例应用目录运行：

```bash
pnpm exec vitest run tests/client/customers.test.tsx tests/client/list-recovery.test.tsx tests/client/table-url-state.test.tsx tests/server/customers.test.ts tests/server/authorization-assignment-safety.test.ts tests/database/customers.test.ts
pnpm typecheck
pnpm build
```

页面测试保留真实应用 Hooks，仅替换网络边界；服务端测试使用隔离数据库，验证真实路由、授权、写入和回执；迁移测试验证创建与回滚。浏览器测试连接启动中的示例，按 [README](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/README.md) 设置 `APP_URL`、`E2E_USERNAME`、`E2E_PASSWORD` 后运行：

```bash
pnpm exec playwright test tests/playwright/customers.test.ts
```

## 示例源码与运行

### 完整示例 App 源码

[Customer Directory 完整源码](https://github.com/nocobase/docs-examples-v3/tree/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory)包含列表、详情与编辑路由、真实 API、数据库迁移、演示数据和测试。[README](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/README.md)列出了每种用法的入口、实现文件与预期结果。

示例只维护姓名、联系人、邮箱和状态。延迟、明确拒绝与响应丢失是受开关控制的演示条件；读取、写入、权限判断和提交回执使用真实机制。

### 运行环境与启动方式

需要 Node.js 24 或更高版本；应用的 `packageManager` 指定 pnpm `11.7.0`，锁文件固定依赖。以下命令用 SQLite 快速启动；它是本示例的运行选择，不是 API Client 或这些 Hooks 的使用前提。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 0db1a6aade41a18757f5a709aacd2df695fcf7f8
cd apps/customer-directory
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
APP_SAMPLE_DATA=true CUSTOMER_DEMO_FAULTS=1 pnpm dev
```

首次配置生成 `config.yml`；按其中的 `users.initialAdmin` 配置登录。打开启动输出的应用地址，在其挂载路径后进入 `/customers`，或点击菜单 **Customer directory**。`APP_SAMPLE_DATA=true` 安装虚构的英文客户数据；写入会持久化，不会在每次启动时重置。普通用户可在 **Users** 中分配 **Customer viewer** 或 **Customer editor** 角色。

需要局域网访问时，按 README 配置 `APP_SERVER_HOST` 和 `APP_PUBLIC_ORIGIN`。演示故障开关只控制附加演示行为；停用它后普通查询和写入仍可使用。
