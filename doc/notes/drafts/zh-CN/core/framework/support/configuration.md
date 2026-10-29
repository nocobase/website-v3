---
title: 配置加载、解析与校验
---

`@nocobase/config` 将配置来源、解析和读取分开。应用宿主在它上面组织配置分区、环境变量映射、校验和公开给浏览器的字段。业务模块应声明配置契约，再由部署环境提供值。

## 来源与优先级

默认应用按“代码默认值 → `config.yml` → 已声明的环境变量映射”合并。普通对象递归合并，数组和标量由后来的来源替换。YAML 的 `${NAME}` 不会自动插值，环境变量也不会任意转换为配置路径。

库级 `Config` 通过 Provider 获取值或字节，再由 Parser 解析字节；例如 object Provider 提供代码默认值，file Provider 与 YAML Parser 提供文件值。独立使用时由调用方安排加载顺序和重载行为。

## 定义应用分区

```ts
// server/config/orders.ts
import { defineAppConfig, envInteger } from '@nocobase/app-server/config';

export default defineAppConfig({
  defaults: { pageSize: 20 },
  env: { ORDERS_PAGE_SIZE: envInteger('pageSize') },
  public: ['pageSize'],
  validate(value, context) {
    if (!Number.isInteger(value.pageSize) || value.pageSize < 1 || value.pageSize > 100) {
      context.error('pageSize', 'Expected an integer between 1 and 100.');
    }
  },
});
```

在 `server/config/index.ts` 的 `defaultAppConfigs()` 中加入 `orders`，并同步该聚合文件的显式返回类型。之后 YAML 字段是 `orders.pageSize`，环境变量为 `ORDERS_PAGE_SIZE`。修改 `config.example.yml`，让新环境能发现可配置项。

插件配置通过插件声明交给宿主聚合；消费者可以覆盖部署值。配置声明、校验和默认值应跟随模块版本发布，不要在多个服务中重复解析同一个环境变量。

## 校验与公开配置

校验应检查实际类型、取值范围和字段组合，以 `context.error(path, message)` 报告具体位置，不依赖外部网络或产生写入。标记敏感环境变量时使用声明中的 `secret` 元数据。

`client` 分区可见于浏览器，其他分区只公开 `public` 指定的叶子路径。示例中的 `public: ['pageSize']` 不会公开整个 orders 分区。认证密钥和数据库密码不能放在公开配置中。

## 读取与变更

服务端使用 `app.config.get()` 等读取接口；客户端消费宿主公开的配置。配置重新加载不意味着已创建的数据库连接或服务实例会自动重建。需要热更新的服务必须自己定义更新边界，否则通过受控重启应用变更。

用 `pnpm nocobase config variables --json` 查看当前应用的字段声明，用 `pnpm nocobase config check --no-connect` 做离线检查。完整字段和命令见[配置项参考](../../reference/configuration.md)。

## 接口与实现

- [Configuration sources](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/config/README.md)
- [Application configuration declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/config/define-app-config.ts)
