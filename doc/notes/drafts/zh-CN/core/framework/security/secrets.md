---
title: 密钥管理与敏感数据加密
---

`@nocobase/secrets` 提供带版本的密钥环和认证加密。应用通过 `@nocobase/app-server/secrets` 的 `secretsServiceToken` 复用宿主密钥，而不是每个插件单独生成主密钥。

## 配置与使用

用配置初始化流程生成稳定的 `secrets.keys`，或通过 `SECRETS_KEYS` 注入。配置列表第一项用于加密新值，旧版本用于解密已有值。密钥不得进入客户端配置、日志或 Git；数据库备份也需要配套保管密钥。

在服务端从容器解析 Secrets 服务后，传给业务函数：

```ts
import type { SecretsService } from '@nocobase/app-server/secrets';

export function protectIntegrationToken(
  secrets: SecretsService,
  integrationId: string,
  plaintext: string,
) {
  const options = {
    purpose: '@example/orders/integration-token',
    aad: [integrationId],
  };
  const sealed = secrets.seal(plaintext, options);
  // Persist sealed; open with the same purpose and record binding.
  return { sealed, read: () => secrets.open(sealed, options) };
}
```

`purpose` 隔离不同用途，`aad` 将密文绑定到业务记录；解密时二者必须与加密时一致。改变记录 ID、用途字符串或绑定字段，必须安排数据迁移。密文格式检查和 `inspect()` 读取版本都不等于验证密文真实性，成功的 `open()` 才完成认证与解密。

该机制用于需要恢复明文的 API Token 等数据。用户密码应交给认证插件的密码处理机制。

## 轮换

1. 备份数据与现有密钥，将新版本放在列表首位，暂时保留旧版本。
2. 部署能读取新旧版本的配置，检查 `pnpm nocobase secrets status`。
3. 先运行 `pnpm nocobase secrets rotate --dry-run`，确认范围后执行实际轮换。
4. 确认存量密文和仍需恢复的备份不再依赖旧密钥后，再规划移除旧版本。

CLI 仅能发现已通过 `registerStore()` 注册的数据存储。自定义表里的密文不会因为调用过 `seal()` 就自动参加轮换；插件需要实现 `SecretsStore` 的统计和可重复执行的重新加密逻辑。

## 独立使用

库的 `createKeyring()`、`seal()`、`open()` 和 `derive()` 也可独立使用。`generateSecretKey()` 用于首次初始化或轮换，不要在每次启动时重新生成持久数据的主密钥。会话等组件可以派生用途专属密钥，参见[会话](sessions.md)。

## 接口与实现

- [Keyring implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/secrets/src/keyring.ts)
- [Host service and rotation stores](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/secrets/service.ts)
