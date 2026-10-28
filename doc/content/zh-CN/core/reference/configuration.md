---
title: 配置项参考
description: 配置文件与环境变量的覆盖顺序、常用分区、浏览器公开配置、自定义规则与检查命令。
---

配置由应用及已接入模块共同定义。本页列出默认模板中的常用字段；已安装应用的完整配置元数据通过 `pnpm nocobase config variables --json` 查询。配置开发流程见[应用配置与系统设置](../developing-apps/configuration-and-settings.md)。

## 文件与覆盖顺序

默认模板按以下顺序合并，后者覆盖前者：

```text
server/config/ 中的代码默认值
    → config.yml
    → 已声明映射的环境变量
```

普通对象递归合并；数组和标量整体替换。环境变量需要显式声明映射，不会按名称任意转换成配置路径。YAML 中的 `${NAME}` 是普通字符串，不会自动插值。

| 位置 | 用途 |
| --- | --- |
| `server/config/` | 分区默认值、环境变量映射与校验规则 |
| `config.example.yml` | 可提交的配置示例，供初始化使用 |
| `config.yml` | 当前环境的本地配置，可包含敏感值，不提交到 Git |
| `APP_CONFIG_FILE` | 改用另一份配置文件；相对路径以应用根目录解析 |
| `dist/variables.json` | 构建生成的部署配置元数据清单，不是密钥值备份 |

在未初始化的应用中运行 `pnpm nocobase config init --dialect sqlite`。该命令根据示例生成本地配置和密钥；已有应用应保留原密钥，不通过重新初始化来完成升级。

## 常用配置项

| 字段 / 分区 | 含义 |
| --- | --- |
| `server.host` / `server.port` | 监听地址与端口；模板代码默认 `127.0.0.1` / `13000` |
| `server.startLog` | 是否打印启动地址；开发命令有自己的启动提示 |
| `app.publicOrigin` | 对外访问的协议与域名；影响绝对链接和回调地址 |
| `app.sampleData` | 首次初始化时是否加载示例数据 |
| `database.default` | 默认连接名，模板为 `main` |
| `database.connections.<name>` | 方言、连接参数与结构管理方式 |
| `api.bodyLimit` / `api.timeout` / `api.rateLimit` | HTTP 请求大小、超时与限流策略；按需配置 |
| `secrets.keys` | 版本化主密钥；用于敏感数据保护，不能在升级时随意丢弃 |
| `session` / `auth` | 会话与认证配置；由相应模块定义 |
| `users.initialAdmin` | 空用户库初始化时使用的用户名、邮箱与密码；不重置已有账号 |
| `i18n.defaultLocale` | 默认语言；可用语言还取决于已加载的语言资源 |
| `logging` | 日志级别、输出及文件轮换等 |
| `client.app.title` | 浏览器显示的应用标题 |
| `client.app.defaultColorScheme` | `light`、`dark` 或 `system`；用户已保存的选择优先 |
| `client.app.defaultTheme` | 应用主题预设 ID，须在主题源码中存在 |
| `jobs` / `queue` / `caching` / `drive` | 后台任务、队列、缓存和存储的适配配置 |
| `mail` / `notification` / `scheduler` / `knowledge` | 对应插件或集成模块的配置，随安装版本和注册情况变化 |

这是配置位置索引，不是可以原样复制的完整配置。缺省值、支持字段和插件分区以当前模板与包声明为准。

例如，已经初始化的本地开发应用可以在原配置中合并以下值：

```yaml
server:
  host: 127.0.0.1
  port: 13000

client:
  app:
    title: My App
    defaultColorScheme: system
```

保留原文件中的数据库和密钥配置。局域网访问时，按需将监听地址改为 `0.0.0.0`，并在浏览器使用机器的实际 IP；`0.0.0.0` 本身不是浏览器访问地址。开发服务可能还包含独立的前端端口，以 `pnpm dev` 打印的地址为准。

## 数据库配置

连接位于 `database.connections.<name>`，`database.default` 指定默认连接。SQLite 使用 `filename`，其他方言通常使用 `host`、`port`、`database`、`username` 和 `password`，特殊字段见[数据库支持与版本兼容](compatibility.md)。

`schemaManagement: managed` 表示框架可管理结构。`external` 用于外部数据库，限制框架的结构变更，不代表业务数据自动只读；仍需配置账号权限和授权策略。

SQLite 配置还兼容模板中的 `database` 文件名写法；同时存在时 `database` 优先于 `filename`。调整文件位置时统一使用一种写法，避免 `DB_FILENAME` 被文件中的旧 `database` 值覆盖。

默认 `DB_*` 环境变量只映射 `main`。额外连接需要自己声明映射；可使用 `@nocobase/app-server/database` 的 `connectionEnvironment(name, prefix)`，并保留原有默认连接映射。为连接修改方言或地址不会自动迁移原数据库内容。

## 环境变量

下表来自已核对应用的配置清单。认证、邮件、通知等映射依赖对应模块；精确类型、说明和敏感标记以当前应用命令输出为准。

| 环境变量 | 对应字段 |
| --- | --- |
| `APP_SERVER_HOST` / `APP_SERVER_PORT` / `APP_SERVER_START_LOG` | `server.host` / `server.port` / `server.startLog` |
| `APP_PUBLIC_ORIGIN` / `APP_SAMPLE_DATA` | `app.publicOrigin` / `app.sampleData` |
| `DB_DIALECT` / `DB_HOST` / `DB_PORT` | `database.connections.main.dialect` / `.host` / `.port` |
| `DB_DATABASE` / `DB_FILENAME` | `database.connections.main.database` / `.filename` |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_SSL` | `database.connections.main.username` / `.password` / `.ssl` |
| `API_BODY_LIMIT` / `API_TIMEOUT` | `api.bodyLimit` / `api.timeout` |
| `SECRETS_KEYS` | `secrets.keys` |
| `AUTH_SECRET` / `SESSION_SECRET` | `auth.secret` / `session.secret` |
| `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | `users.initialAdmin.username` / `.email` / `.password` |
| `APP_DEFAULT_LOCALE` | `i18n.defaultLocale` |
| `SNOWFLAKE_WORKER_ID` | `snowflake.workerId` |
| `APP_VITE_DEV_URL` | `spa.viteDevUrl` |
| `MAIL_JOBS` / `MAIL_SYNC_BATCH_SIZE` / `MAIL_AUTOMATIC_SYNC_INTERVAL_MS` | `mail.jobs` / `.syncBatchSize` / `.automaticSyncIntervalMs` |
| `MAIL_OAUTH_CALLBACK_URL` / `MAIL_OAUTH_RETURN_URL` | `mail.oauthCallbackUrl` / `.oauthReturnUrl` |
| `MAIL_PUSH_WEBHOOK_URL` / `MAIL_PUSH_WEBHOOK_SECRET` | `mail.pushWebhookUrl` / `.pushWebhookSecret` |
| `RESEND_API_KEY` / `SMTP_PASSWORD` | `notification.channels.system-email.apiKey` / `.auth.pass` |
| `SCHEDULER_JOBS` | `scheduler.jobs` |

另外三个变量由运行时读取：

| 变量 | 用途 |
| --- | --- |
| `APP_BASE_PATH` | 应用挂载的基础路径 |
| `APP_CONFIG_FILE` | 配置文件位置 |
| `NOCOBASE_STRICT_STARTUP` | 启动失败时严格退出，便于进程管理器识别 |

`SECRETS_KEYS` 使用 `版本:密钥` 条目，以逗号分隔，第一项为当前密钥。新增密钥时保留仍用于解密旧数据的条目，并按密钥轮换流程处理数据；密钥变化也可能使已有登录会话失效。各模块按自身规则选择显式密钥或主密钥派生值：例如会话优先使用显式 `session.secret`，未设置时才尝试从 Secrets 派生。配置变更前核对对应模块，见[会话](../framework/security/sessions.md)和[密钥管理](../framework/security/secrets.md)。

## 浏览器可见配置

`client` 分区会写入应用页面，浏览器可以读取。其他服务端分区只通过 `defineAppConfig()` 的 `public` 叶子路径明确公开。数据库密码、签名密钥、邮件凭证等不能放入 `client` 或公开路径。

增加一个公告配置分区，例如 `server/config/announcements.ts`：

```ts
import { defineAppConfig, envInteger } from '@nocobase/app-server/config';

export default defineAppConfig({
  defaults: { pageSize: 20 },
  env: {
    ANNOUNCEMENTS_PAGE_SIZE: envInteger('pageSize', {
      description: 'Default number of announcements per page.',
    }),
  },
  public: ['pageSize'],
  validate(value, context) {
    if (!Number.isInteger(value.pageSize) || value.pageSize < 1 || value.pageSize > 100) {
      context.error('pageSize', 'Expected an integer between 1 and 100.');
    }
  },
});
```

在 `server/config/index.ts` 的现有 `defaultAppConfigs({ ... })` 中导入并加入 `announcements`，同时更新该文件显式列出的返回类型。对应文件配置为 `announcements.pageSize`，环境变量为 `ANNOUNCEMENTS_PAGE_SIZE`。`public: ['pageSize']` 仅公开这个字段。

校验函数在启动、重新加载和 `config check` 时运行，应检查实际值，避免在其中发起网络请求或写入数据。重新加载配置也不保证已经创建的服务自动切换行为，需要服务自身处理更新。

## 修改与检查

```bash
pnpm nocobase config set server.port=13000
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect
```

从现有环境变量读取敏感值并写入本地配置：

```bash
pnpm nocobase config set --from-env database.connections.main.password=MAIN_DB_PASSWORD
```

先通过自己的环境管理方式设置 `MAIN_DB_PASSWORD`。该命令把其当前值写入配置文件，不保存一个动态变量引用。设置以后若仍有 `DB_PASSWORD`，后者会覆盖文件值。

`config check` 默认检查配置并尝试非 SQLite 连接；`--no-connect` 适合离线检查，`--strict` 将警告视为失败。不要在问题反馈中直接贴出整个配置文件；提供字段名、脱敏后的错误和包版本即可。命令行为见[命令行参考](cli.md)。

## 核对范围

定义机制按 [Core `015404ecd0db` 的配置源码](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/config)核对；配置清单与离线检查在默认模板 beta.83、`@nocobase/app-cli` 1.0.0-beta.29、`@nocobase/config` 0.1.0-beta.3 下执行。安装其他插件后可能出现更多分区和映射。
