---
title: 测试与验证
description: 区分插件测试、App 集成和交付检查，验证真正会影响用户的行为。
---

插件的检查通过、在 App 中注册成功、用户实际能够使用，是三个不同的结果。验证应沿着本次改动的边界进行：先检查插件本身，再检查接入 App 之后的行为；涉及发布时，再检查包的内容。

## 使用 Agent

```text
请为当前插件补齐与实际功能对应的测试，覆盖正常流程、输入错误和权限边界。
使用生产实现和真实插件声明，区分组件测试、接口测试和 App 验证。
运行插件检查与 App 构建，并说明哪些用户操作已验证、哪些尚未验证。
```

## 测试放在哪里

创建工具会按能力生成测试和 Vitest 配置。请保留 Node 与 jsdom 两种环境的划分，不要为了让某一条测试通过，就把所有测试都改成浏览器环境。

| 目录 | 环境与工具 | 验证的内容 |
| --- | --- | --- |
| `tests/server/` | Node，`@nocobase/app-testing/server` | 接口、服务和服务端的集成 |
| `tests/database/` | Node，同一个 Server 测试入口 | 迁移、元数据、在真实数据库上的读写 |
| `tests/client/` | jsdom，`@nocobase/app-testing/client` | 组件、翻译、交互和请求契约 |
| `tests/cli/` | Node，`@nocobase/app-testing/cli` | 参数、输出、错误和命令行为 |
| App 的浏览器测试 | App 已有的浏览器测试配置 | 登录、导航、刷新和与真实 API 的交互 |

`@nocobase/app-testing` 放在 `devDependencies` 中。请检查生成的测试依赖以及当前版本的公开入口；它没有 `/database` 或 `/playwright` 导出。

## 复用生产实现

[路由与 HTTP 接口](server-apis.md) 的测试从真实的 `apiRoutes` 调用 `createRouter()`，验证 200 响应、非法输入的 400 以及 API 文档；[数据库资源与迁移](database-and-migrations.md) 通过真实的 Migrator 应用、回滚并重新应用迁移；[命令行扩展](extend-command-line.md) 使用 `bindAppCommand()` 和 `runAppCommand()` 验证统一的输出。

这些示例用的都是插件自己的实现。不要在测试中另写一套路由、服务或数据模型，再让那套代码的测试通过。

只用到容器的 Provider，可以接受一个完整的窄接口 `{ container: ServiceContainer }`。这样，测试可以提供一个真实的容器，而不必把一个不完整的对象强制断言为整个 App。需要认证、数据库或生命周期时，应使用 App 的测试 fixture 并注册真实的插件。

## Client 测试的边界

`renderWithApp()` 会注册真实的 Client 插件，并提供服务、API 客户端、路由和语言环境，不要另外再包一层 `MemoryRouter`。需要验证路由树时，仍然要把实际路由声明所对应的组件渲染出来，见 [页面、路由与菜单](pages-and-menus.md#5-验证导航行为)。

网络请求可以通过 `answerApi()` 在边界上替换响应，但必须匹配请求方法和 API 的相对路径。不要不管请求什么都返回成功，这会掩盖路径拼错或请求发多了等问题。

下面是对已有页面进行请求测试的结构，请把 `Page` 和插件入口替换为实际被测的模块：

```tsx
const calls: { method: string; path: string }[] = [];
await renderWithApp(<Page />, {
  plugins: [plugin()],
  locale: 'zh-CN',
  fetch: answerApi((call) => {
    calls.push({ method: call.method, path: call.path });
    if (call.method === 'GET' && call.path === 'announcements') {
      return { data: [], meta: { total: 0 } };
    }
    return new Response(null, { status: 404 });
  }),
});
expect(await screen.findByText('暂无公告。')).toBeInTheDocument();
expect(calls).toEqual([{ method: 'GET', path: 'announcements' }]);
```

`answerApi()` 会把处理函数中抛出的异常转换成 HTTP 500，所以对请求的断言应放在处理函数之外，以免断言失败被页面的错误处理吞掉。异步显示的内容用 `findBy...` 或 `waitFor()` 等待；交互操作不要写在可能重复执行的 `waitFor()` 中。需要测试加载状态时，控制响应完成的时机，而不是依赖固定时长的 sleep。

## 验证权限和资源清理

受保护的接口，要分别测试匿名、已登录但无权限、有权限三种情况。多租户或按记录授权的功能，还要测试跨用户、跨记录的边界。Client 中隐藏了按钮，并不等于 Server 已经保护了写操作。

测试自己创建的数据库、临时目录、订阅和应用实例，都要由 fixture 负责清理；直接创建的资源，使用 `finally` 清理。不要让测试默认连接日常开发用的数据库，也不要为了“测试稳定”而关闭错误检查。

## 运行范围

以 `notice-api` 为例，以下命令在 App 根目录执行：

```bash
pnpm --filter @nocobase/app-plugin-notice-api exec vitest run tests/server/routes.test.ts
pnpm --filter @nocobase/app-plugin-notice-api check
pnpm build
```

先运行相关的测试定位问题，再运行插件的 `check` 和受影响的 App 检查。如果修改了迁移，请按顺序运行需要的数据库测试，避免多个集成测试套件争用资源；不必为了一处纯文案的改动重复运行整个仓库的测试。

如果创建插件时使用了 `--no-install`，请先运行 `pnpm install`。不要把 `--passWithNoTests` 下的成功当成已有测试覆盖，请检查输出中实际运行了哪些文件和用例。

## 交付前确认什么

| 改动 | 还要确认 |
| --- | --- |
| Client 页面 | 登录后可以打开，直接链接、刷新和前进后退都正常 |
| Server 接口 | 在 App 下的真实前缀、认证和授权、错误格式、API 文档 |
| 数据迁移 | 空库安装、旧数据升级、编译产物的校验和 |
| CLI | App 注册之后的命令，以及部署产物中的命令 |
| 公共导出或发布 | 能从公开入口使用；tarball 中包含 dist、资源和 Skills |

报告时写明具体的命令和结果，并说明未覆盖的边界，例如“组件和路由的单元测试通过，App 构建通过；尚未执行真实登录后的浏览器流程”。`plugin inspect` 只检查静态的注册信息，不能代替对这些行为的测试。
