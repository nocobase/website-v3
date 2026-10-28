---
title: 会话
---

`@nocobase/session` 管理跨请求的会话数据、Cookie 和过期时间。应用通过 `@nocobase/app-server/session` 的 `sessionManagerToken` 接入它。登录、用户身份和认证策略由认证插件负责，普通会话字段不能作为用户身份的证明。

## 请求中的会话

会话中间件从 Cookie 建立请求级会话，挂到 Hono 上下文的 `session` 变量，并在请求结束时保存变更和更新 Cookie。中间件必须在使用会话的路由之前注册；重复创建另一套会话管理器会形成独立状态。

从请求上下文取出会话后，可以交给下面的业务函数：

```ts
import type { NocoBaseSession } from '@nocobase/session';

export async function rememberListView(session: NocoBaseSession) {
  await session.set('ordersView', 'compact');
  const data = await session.get();
  return data?.ordersView;
}

export async function clearListView(session: NocoBaseSession) {
  await session.forget('ordersView');
}
```

`get()` 异步读取全部数据；`set()` 更新单个键，`update()` 更新数据或根据旧值计算新值，`forget()` 删除键。`regenerate()` 更换会话 ID，`destroy()` 销毁会话。认证插件可能管理自己的认证 Cookie，销毁普通会话不代表已经完成插件的退出登录流程。

## 存储和过期

| 配置 | 含义 |
| --- | --- |
| `session.default`、`session.stores` | 选择存储；支持 memory、fs、redis、null |
| `session.cookie` | Cookie 名称、路径、Secure、HttpOnly、SameSite 等 |
| `session.lifetime.absolute` | 绝对有效期 |
| `session.lifetime.inactivity` | 可选的闲置过期时间 |
| `session.lifetime.rolling` | 是否随活动刷新有效期 |

内存存储适合单进程开发；多实例需要所有实例能够访问的存储。Cookie 的 `secure` 应与外部 HTTPS 接入方式一致。文件存储属于运行数据，部署和备份时要保留其目录。

显式设置的 `session.secret` 用于加密并验证会话 Cookie；未设置时，宿主可从已配置的 Secrets 密钥派生会话密钥。生产环境应配置稳定密钥，避免重启导致会话失效，参见[密钥管理](secrets.md)。

## 接入位置

应用在服务端配置与运行时中声明会话配置和 Provider；插件使用宿主提供的服务。自行嵌入此库时，`createSessionManager()` 创建管理器，`createSessionMiddleware()` 接到 Hono，请在结束时释放管理器。不要在浏览器中保存服务端会话密钥。

## 接口与实现

- [Session contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/session/src/types.ts)
- [Hono integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/session/src/hono.ts)
- [Application session provider](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/session/provider.ts)
