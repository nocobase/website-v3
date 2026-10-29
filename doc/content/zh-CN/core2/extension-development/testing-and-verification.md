---
title: 测试与验证
description: 区分插件测试、App 集成与交付检查，验证真正会影响用户的行为。
---

插件检查通过、App 注册成功和用户实际能用，是三个不同的结果。验证应该沿着本次变化的边界进行：先检查插件本身，再检查接入 App 后的行为，涉及发布时再检查包的内容。

## 使用 Agent

```text
请为当前插件补齐与实际功能对应的测试，覆盖正常流程、输入错误和权限边界。
使用生产实现和真实插件声明，区分组件测试、接口测试和 App 验证。
运行插件检查与 App 构建，并说明哪些用户操作已验证、哪些尚未验证。
```

## 测试放在哪里

创建工具按能力生成测试和 Vitest 配置。保留 Node 与 jsdom 的环境划分，不要为了让某一条测试通过而把所有测试改成浏览器环境。

| 目录 | 环境与工具 | 验证内容 |
| --- | --- | --- |
| `tests/server/` | Node，`@nocobase/app-testing/server` | 接口、服务和服务端集成 |
| `tests/database/` | Node，同一 Server 测试入口 | 迁移、元数据、真实数据库读写 |
| `tests/client/` | jsdom，`@nocobase/app-testing/client` | 组件、翻译、交互和请求契约 |
| `tests/cli/` | Node，`@nocobase/app-testing/cli` | 参数、输出、错误及命令行为 |
| App 的浏览器测试 | App 已有的浏览器测试配置 | 登录、导航、刷新和真实 API 交互 |

`@nocobase/app-testing` 放在 `devDependencies`。检查生成的测试依赖和当前版本的公开入口；它没有 `/database` 或 `/playwright` 导出。

## 复用生产实现

[路由与 HTTP 接口](server-apis.md) 的测试从真实 `apiRoutes` 调用 `createRouter()`，验证 200 响应、非法输入的 400 以及 API 文档；[数据库资源与迁移](database-and-migrations.md) 通过真实 Migrator 应用、回滚、重新应用迁移；[命令行扩展](extend-command-line.md) 使用 `bindAppCommand()` 和 `runAppCommand()` 验证统一输出。

这些示例都使用插件自己的实现。不要在测试里重写一套路由、服务或数据模型，再把那套代码测绿。

一个只使用容器的 Provider 可以接受完整的窄接口 `{ container: ServiceContainer }`。这样测试可以提供真实容器，无需把不完整对象强制断言为整个 App。需要认证、数据库或生命周期时，应使用 App 测试 fixture 并注册真实插件。

## Client 测试的边界

`renderWithApp()` 注册真实 Client 插件，提供服务、API 客户端、路由和语言环境。不要另外包一层 `MemoryRouter`。需要验证路由树时，仍要把实际路由声明对应的组件渲染出来，见[页面、路由与菜单](pages-and-menus.md#5-验证导航行为)。

网络请求可通过 `answerApi()` 在边界处替换响应，但必须匹配方法和 API 相对路径。不要无论请求什么都返回成功，这会隐藏拼错路径和多发请求的问题。

下面是对已有页面进行请求测试的结构；把 `Page` 和插件入口替换为实际被测模块：

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

`answerApi()` 会把处理器抛出的异常转换成 HTTP 500，所以对请求的断言放在处理器外，避免断言失败被页面的错误处理吞掉。异步显示用 `findBy...` 或 `waitFor()` 等待；交互不要写在可能重复执行的 `waitFor()` 内。需要测试加载状态时控制响应何时完成，不依赖固定 sleep。

## 验证权限和资源清理

受保护的接口分别测试匿名、已登录但无权、有权三种情况。多租户或按记录授权的功能还要测试跨用户、跨记录边界。Client 隐藏按钮不等于 Server 已保护写操作。

测试自己创建的数据库、临时目录、订阅和应用实例要由 fixture 清理，直接创建的资源使用 `finally`。不要让测试默认连接日常开发数据库，也不要为了“测试稳定”关闭错误检查。

## 运行范围

以 `notice-api` 为例，命令在 App 根目录执行：

```bash
pnpm --filter @nocobase/app-plugin-notice-api exec vitest run tests/server/routes.test.ts
pnpm --filter @nocobase/app-plugin-notice-api check
pnpm build
```

先运行相关测试定位问题，再运行插件 `check` 和受影响的 App 检查。若修改了迁移，顺序运行需要的数据库测试，避免多个集成套件争用资源；不必为一个纯文案改动重复全仓库测试。

如果使用 `--no-install` 创建插件，先 `pnpm install`。不要把 `--passWithNoTests` 的成功当成已有测试覆盖；检查输出中实际运行的文件与用例。

## 交付前确认什么

| 变化 | 还要确认 |
| --- | --- |
| Client 页面 | 登录后可打开，直接链接、刷新和前进后退正常 |
| Server 接口 | App 下真实前缀、认证和授权、错误格式、API 文档 |
| 数据迁移 | 空库安装、旧数据升级、编译产物校验和 |
| CLI | App 注册后的命令及部署产物中的命令 |
| 公共导出或发布 | 从公开入口消费；tarball 包含 dist、资源和 Skills |

报告具体命令和结果，并说明未覆盖的边界。例如“组件和路由单测通过，App 构建通过；尚未执行真实登录后的浏览器流程”。`plugin inspect` 只检查静态注册信息，不是这些行为的替代测试。
