---
title: 审计日志
description: 配置业务操作的审计记录，在系统设置中查看、筛选和导出日志。
minimumEdition: enterprise
---

## 提供的能力

审计日志帮助你追溯“谁在什么时候做了什么，涉及哪些记录，结果如何”。启用企业版审计日志插件并完成采集配置后，日志保存在应用数据库中，有权限的用户可以在系统设置中查看和导出。

它适合跟踪商品修改、订单处理、用户管理等重要操作，既能记录成功操作，也能记录已配置操作的失败或拒绝访问结果。

## 让 Agent 配置审计日志

先确认应用具备企业版审计日志的使用授权。插件接入、存储配置和业务操作的采集可以交给当前应用的开发 Agent。插件的一般接入方式见[管理插件](../../developing-apps/manage-plugins.md)。

### 为尚未接入审计的应用补齐审计记录

应用还没有配置审计时，可以让 Agent 检查现有功能，统一补齐需要跟踪的操作：

```prompt
请使用 @nocobase/audit 为这个应用接入审计日志。先梳理现有的创建、修改、删除和关键业务操作，按照审计文档和项目开发规范，用 describeAudit 补齐需要的审计声明。框架已经记录的操作不要重复采集，也不要记录普通查询。

请在 config.yml 的 audit.transports 中配置 driver 为 database 的保存目标，让管理员能够在系统设置中查看和导出日志。每条记录应包含操作人、时间、操作对象及成功、失败或被拒绝的结果。

操作名称需要支持应用现有的所有语言，列表、详情和新导出的文件都应使用对应语言。不要记录密码、API 密钥等敏感信息，也不要改变现有业务权限。
```

### 为指定业务补齐审计记录

已经接入审计，但新增了业务功能或发现某类操作没有记录时，可以限定补齐范围。比如：

```prompt
请基于应用现有的 @nocobase/audit 审计能力，为商品的创建、修改和删除补齐审计记录。按照审计文档和项目开发规范，在相应业务路由中配置 describeAudit，记录谁在什么时候操作了哪条商品，以及成功、失败或被拒绝的结果。

检查 config.yml 的 audit.transports 是否已配置 driver 为 database 的保存目标：已有则复用，缺少则补上，让这些记录能够在系统设置中查看和导出。保留其他业务的审计配置，避免重复记录。

请补齐这些操作名称在应用支持的所有语言中的翻译，让列表、详情和新导出的文件保持一致。不要记录密码、API 密钥等敏感信息，也不要改变商品管理现有的权限。
```

将“商品管理”替换为需要跟踪的业务。配置后，用测试记录执行一次操作，再到审计日志中核对操作人、对象、结果和语言。

## 手动配置审计日志

需要数据库存储和管理页面时，先安装并注册 `@nocobase/app-plugin-audit` 的客户端和服务端入口，执行应用的数据库迁移，再配置需要采集的路由与存储。已有业务接口的认证、权限和输入校验保持不变。

### 使用 `describeAudit` 记录业务操作

在服务端的业务路由文件（比如 `server/routes/products.ts`）中加入 `describeAudit`。下面以修改商品为例；片段中的 `router` 和 `productUpdateHandlers` 代表应用已有的路由实例和完整处理链，后者包含认证、权限、接口说明、输入校验及业务处理。

```ts
import { describeAudit } from '@nocobase/audit';

const auditProductUpdate = describeAudit({
  action: 'products.update',
  resource: 'products',
  operationName: {
    ns: 'my-app',
    key: 'audit.products.update',
    defaultValue: 'Update a product',
  },
  target: (context) => ({
    collection: 'products',
    key: context.req.param('id'),
  }),
  captureBody: false,
});

router.patch('/products/:id', auditProductUpdate, ...productUpdateHandlers);
```

| 配置 | 用途 |
| --- | --- |
| `action` | 操作的固定标识，用于区分和筛选操作 |
| `resource` | 操作所属资源的标识 |
| `operationName` | 页面和导出中的操作名称，支持翻译引用与默认名称 |
| `target` | 指明操作涉及的数据表和记录主键，只返回标识，不返回整条业务数据 |
| `captureBody` | 是否采集请求和响应正文；此处明确关闭 |

这里从地址中的 `id` 获取商品主键，因此不需要读取正文。创建记录时，如果主键要在操作成功后才能取得，可用 `resolveTargets` 补充目标。需要排除某个接口时，使用 `describeAudit(false)`。更完整的路由写法见[HTTP 路由与 API](../../developing-apps/apis-and-services.md)。

### 配置操作名称的多语言

将示例中的 `my-app` 替换为应用 `package.json` 的 `name`；插件自己的操作使用该插件的包名。`key` 对应语言资源中的同一条文案，`defaultValue` 用于缺少翻译时回退。

把以下字段合入现有语言资源，不要覆盖其他文案。客户端和服务端都需要提供：前者用于列表和详情，后者用于导出。

`client/locales/en-US.ts` 和 `server/locales/en-US.ts`：

```json
{
  "audit": {
    "products": {
      "update": "Update a product"
    }
  }
}
```

`client/locales/zh-CN.ts` 和 `server/locales/zh-CN.ts`：

```json
{
  "audit": {
    "products": {
      "update": "修改商品"
    }
  }
}
```

应用支持其他语言时，同样补齐对应文案，并确认语言资源已加载。操作名称会随查看或发起导出时的语言显示，不会自动翻译业务数据。语言资源的接入见[多语言](i18n.md)。

### 在 `config.yml` 中配置多个保存目标

`audit.transports` 可以配置多个保存目标，同一条审计记录会分别发送到各个目标。比如，在应用根目录的 `config.yml` 中同时启用数据库和文件存储：

```yaml
audit:
  enabled: true
  autoDetect: false
  captureBody: false
  transports:
    history:
      driver: database
    localFile:
      driver: file
      options:
        path: audit/events.jsonl
        maxFileSizeMB: 50
        retentionDays: 180
```

其中，`history` 和 `localFile` 是自定义名称，`driver` 决定保存方式。这个配置既将日志写入数据库，供管理页面查询和导出，也追加到指定文件中。

| 配置 | 含义 |
| --- | --- |
| `enabled` | 审计总开关，设为 `false` 时停止采集和写入 |
| `autoDetect` | 是否额外自动采集已声明 API 文档的写操作，默认 `false`；显式审计声明和框架生成的数据写入接口不依赖此开关 |
| `captureBody` | 正文采集开关；这里全局关闭，路由不能单独重新开启 |
| `transports` | 按名称配置保存目标，每个目标指定自己的驱动和选项 |
| `driver: database` | 使用审计插件提供的数据库存储，写入应用默认数据库；每个应用配置一个数据库保存目标，避免重复写入 |

修改后重启应用。以上配置保留操作信息，不保存请求和响应正文。需要采集正文时，参见[敏感信息脱敏](#敏感信息脱敏)。

配置存储并重启后，修改一条测试商品。管理页面应显示“修改商品”、`products` 数据表和对应主键，文件中也应追加一条记录；切换页面语言后，操作名称应使用对应翻译。

### 文件输出的配置与注意事项

设置 `driver: file` 后，可通过以下选项控制文件输出：

| 配置项 | 说明 |
| --- | --- |
| `options.path` | 必填，指定目录和文件名前缀，如 `audit/events.jsonl` |
| `options.maxFileSizeMB` | 文件大小达到该值时轮转，默认 `50` MB |
| `options.retentionDays` | 归档文件的保留天数，默认 `180` 天 |

相对路径以应用存储目录为起点，也支持绝对路径。日志按 UTC 日期和文件大小自动分段，以 JSON Lines 格式保存，每行一条记录。

保留期按文件最后修改时间计算，过期归档会在后台清理，与数据库日志的保留设置相互独立。多实例应使用不同的输出目录或前缀；旧版未分段文件需要单独归档或清理。

> [!TIP]
> 仅输出到文件时，可以保留上例的 `localFile`、去掉 `history`。文件输出由 `@nocobase/audit` 提供，默认应用模板已接入，无需安装 `@nocobase/app-plugin-audit`；数据库存储和管理页面才需要该插件。

## 敏感信息脱敏

采集 JSON 请求和响应正文时，密码、令牌等敏感字段会在写入日志前替换为 `******`，业务字段也可以配置脱敏规则。下图中，身份号码、手机号等已被遮盖，普通字段仍然可见。

![审计日志详情中，敏感字段显示为星号，普通字段保留原值](/assets/core/audit-logs/redacted-detail.png)

### 路由级配置：`describeAudit`

在业务路由已有的 `describeAudit` 声明中补充以下配置，保留原有操作名称和目标配置。正文默认不采集，仅在确实需要的路由上开启；如果沿用了前面配置中的全局 `captureBody: false`，需先移除这一行。全局或路由任一处显式为 `false`，都不会采集正文。

```ts
describeAudit({
  action: 'products.update',
  captureBody: true,
  redact: {
    fields: ['routeSecret'],
    paths: ['payload.members.mobile', 'data.payload.members.mobile'],
  },
});
```

`fields` 在任意层级精确匹配字段名；`paths` 从正文根节点匹配指定路径，也可匹配数组中的字段。示例隐藏所有 `routeSecret` 字段，以及请求和响应中 `members` 数组的手机号。

### 应用级配置：`config.yml`

多个接口共用的规则可合入 `config.yml` 的 `audit.redact`，保留原有的 `audit.transports` 等配置：

```yaml
audit:
  redact:
    fields: [identityNumber, appSecret]
    paths:
      - payload.profile.mobile
      - data.payload.profile.mobile
```

应用级规则与路由级规则叠加生效，不会替换内置的敏感字段规则。请求和响应结构不同时，应分别列出对应路径。修改后重启应用；新规则只影响之后生成的审计记录，不改写业务数据或历史日志。

## 查看和导出日志

### 查看日志列表

打开 **系统设置 → 审计日志**，在 **日志** 页签查看记录。列表按时间从新到旧排列，显示操作人、动作、操作对象和结果等信息。

先选择时间范围，再通过 **更多筛选** 按动作、结果或主体类型缩小范围。已知记录 ID、用户 ID、IP 或请求 ID 时，可以使用搜索框定位。

![审计日志列表中的筛选条件、操作对象和执行结果](/assets/core/audit-logs/list.png)

### 查看操作详情

点击一条记录打开详情，可查看操作人的身份、涉及的记录、执行结果及请求 ID。遇到问题时，可以把请求 ID 提供给维护人员，帮助定位同一次请求。

![审计日志详情中的操作人、涉及的记录和执行结果](/assets/core/audit-logs/detail.png)

请求和响应内容只有在配置允许且实际采集到时才会显示。提示未保存内容，表示这条日志没有保存相应正文，不代表整个操作未被记录。

### 导出日志

1. 在列表中设置需要的筛选条件
2. 点击 **导出**，再点击 **开始导出**
3. 等待后台生成文件，在 **站内信** 中打开导出完成通知并下载

导出的是符合筛选条件的记录，不限于当前页。文件格式为 Excel（`.xlsx`），包含时间、操作人、动作、操作对象和结果等信息，不包含请求和响应正文。文件中的翻译使用发起导出时的语言。

下载链接有效期为 24 小时，仅发起导出的用户在仍有导出权限时可以下载；过期后重新导出即可。
