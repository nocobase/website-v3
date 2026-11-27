---
title: "外部 API 与系统集成"
metaDescription: 签发带范围的 API 密钥接入外部线索来源，并打通 CRM 赢单商机与已确认报价的 ERP / 财务出站同步、幂等与失败重试。
---

在 CRM 应用中为外部系统提供受控的 API 接入能力：一边通过带权限范围的 API 密钥与幂等接口接收官网或营销系统的外部线索，一边将赢单商机和已确认报价可靠同步到 ERP / 财务系统，并在失败时安全重试。

在完整示例中体验时，准备管理员、销售 Alex、主管 Morgan 账号（角色配置见[角色权限与数据范围控制](roles-and-permissions.md#配置用户与角色)）。本地验证出站同步无需外部 ERP 账号，示例内置了支持幂等与故障模拟的本地模拟接收器；对接真实 ERP 或财务系统时替换为对应的 HTTP(S) 接口即可。

**学习模块**

- [API 密钥](../../core/using-plugins/authentication/api-keys.md)
- [HTTP 路由与接口](../../core/developing-apps/apis-and-services.md)
- [请求校验与错误响应](../../core/developing-apps/request-validation-and-errors.md)
- [后台任务与定时执行](../../core/developing-apps/background-tasks.md)

## 明确外部接入接口与同步规则

外部系统不会像浏览器用户那样交互登录，也不能因为是“内部脚本”就拿到整库超级权限。本专题明确两条双向边界：

- **API 密钥权限范围**：带范围密钥（Scoped API Key）的有效权限始终是**所属用户当前角色权限与密钥范围的交集**，不会授予用户原本没有的能力。本专题声明两组业务范围与两组预设：

| 权限组 | 只读（`read`） | 读写（`write`） |
| --- | --- | --- |
| `crm.leads`（CRM 线索与客户） | 读取本人有权访问的客户列表 | 创建与更新客户、新增与更新联系人 |
| `crm.integrations`（ERP 与财务同步） | 查看出站投递日志与同步目标 | 触发已确认报价/赢单同步、手动重试失败投递 |

- **入站外部线索规则**：`POST /api/crmIntegrations/leads` 复用[数据批量导入与后台处理](data-import.md)的客户识别与冲突策略（`skip` / `update` / `reject`），要求请求头携带 `Idempotency-Key`。同一请求因网络超时重试时返回原始结果与 `Idempotency-Replayed: true`，绝不产生重复客户；浏览器专用接口继续拒绝带范围密钥，避免密钥越界访问常规后台路由。
- **出站 ERP / 财务同步规则**：仅**已确认报价**或**已赢单（`won`）商机**允许同步。每条待同步业务记录使用确定性幂等键（`erp-sync:quote:<quoteId>` 或 `erp-sync:opportunity:<opportunityId>`）写入投递台账 `crmSyncDeliveries`，再由后台任务投递到目标地址；目标返回失败（如 HTTP 503）时保留错误日志与相同幂等键，供后续手动重试，确保外部系统不重复下单。
- **密钥管理隔离**：创建、轮换与撤销 API 密钥必须通过已登录的浏览器会话操作；任何 API 密钥都不能管理或签发其他密钥。

## 签发带范围的 API 密钥并接入外部线索

### 交给 Agent 开发

将上一节的权限组、线索接口与出站同步规则连同下面的提示词交给开发 Agent：

```prompt
给 CRM 增加外部系统集成能力：
1. 销售可以在个人设置中用“线索接入”模板创建有期限的 API 密钥。主管还能用“ERP 与财务同步”模板创建同步密钥。密钥只能在持有人的权限范围内使用。
2. 提供带范围密钥可调用的外部线索接入接口和客户查询接口，复用客户名称识别、skip/update/reject 冲突策略与 Idempotency-Key 幂等保护，新建线索默认归属密钥所属用户。
3. 在系统设置增加“外部系统集成”页面，配置 ERP / 财务同步目标（默认提供本地模拟接收器并支持模拟 HTTP 503 故障），记录已确认报价与赢单商机的出站投递日志、外部单号和重试次数，支持失败后按同一幂等键手动重试；在已确认报价详情也提供同步入口。
```

### 配置业务权限并签发个人密钥

NocoBase 的 `@nocobase/app-plugin-api-keys` 插件已提供密钥认证与 `/api/apiKeys` 自助端点，应用负责在两处接入业务范围：

1. **声明权限组与映射（`server/providers/crm-integrations.ts`）**：在 Provider 的 `boot()` 中通过 `apiKeyScopesToken` 注册 `crm.leads` 与 `crm.integrations` 权限组及 `lead-intake`、`erp-sync` 预设，并把 `business` 权限引用映射到 CRM 的复合资源。
2. **在路由显式放行带范围密钥（`server/routes/crm-integrations.ts`）**：应用常规接口默认使用 `auth.required({ scopedKeys: false })`，只有明确执行授权校验的外部集成接口显式开启 `scopedKeys: true`：

```ts
for (const path of ['/leads', '/customers', '/deliveries', '/deliveries/*', '/sync/*']) {
  router.use(path, auth.required({ scopedKeys: true }), authz.middleware());
}
```

Alex 登录后打开右上角的账号菜单，进入 **Personal settings → Integrations → API keys**，点击 **New key**。系统设置中的同名页面供管理员管理系统密钥和审查成员密钥。

1. 在 **Name** 填写 **Website lead capture**，保留 **Custom**。在 **What it can do** 中选择 **Lead intake** 模板，核对选中的客户与联系人操作及 90 天有效期。
2. 点击 **Create key**，复制并妥善保存仅显示一次的密钥，然后点击 **I have saved it**。下一步用它提交外部线索。
3. 需要同步订单时，由具备同步权限的管理员或销售主管在自己的个人设置中选择 **ERP & finance sync** 模板签发另一把密钥。

![Alex 在个人设置中为 Website lead capture 选择 Lead intake 模板及 90 天有效期](/assets/guides/crm-api-keys.png)

### 使用 API 密钥提交外部线索

在终端使用刚复制的 `x-api-key` 和一次性 `Idempotency-Key` 调用外部线索接口（将 `APP_URL` 替换为启动日志中的实际地址，例如 `http://127.0.0.1:13105/main`）：

```bash
IDEM_KEY="$(node -e 'console.log(`${Date.now()}.${crypto.randomUUID()}`)')"

curl -i -X POST "$APP_URL/api/crmIntegrations/leads" \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $LEAD_API_KEY" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{
    "externalId": "WEB-2026-108",
    "source": "website",
    "name": "Beacon BioLabs",
    "industry": "Biotech",
    "status": "prospect",
    "website": "https://beacon-biolabs.example.com",
    "notes": "Requested enterprise rollout demo",
    "conflictMode": "skip",
    "contact": {
      "name": "Dana Wu",
      "role": "Head of Operations",
      "email": "dana.wu@beacon-biolabs.example.com",
      "phone": "+1-555-0190"
    }
  }'
```

首次调用返回 `201 Created` 与 `Idempotency-Replayed: false`，响应体包含 `action: "created"` 以及新建的客户和联系人记录。回到浏览器打开 **Customers**，可以看到 **Beacon BioLabs** 已入库，备注自动标注来源 `[website #WEB-2026-108]`，且客户负责人为该密钥所属用户。

若需在交互式文档中查看全部接口定义，可使用登录会话或有效密钥访问 `$APP_URL/api/swagger/docs`。

## 打通赢单与已确认报价的外部同步

### 理解同步出站、幂等与重试

直接把同步逻辑写成“保存报价时顺便 `fetch()` 外部 ERP”会带来两个隐患：一是 ERP 抖动会阻塞或拖垮 CRM 请求，二是超时重试容易在财务系统生成两张订单。

示例中的 `server/providers/crm-integrations.ts` 将同步拆成两步：

1. **写入确定性出站台账**：触发同步时校验业务前置条件（报价必须为 `confirmed`、商机必须为 `won`），将客户、商机、报价明细与总额打包成 `payloadSnapshot`，以 `erp-sync:quote:<quoteId>` 或 `erp-sync:opportunity:<opportunityId>` 作为唯一键写入 `crmSyncDeliveries`，再把 `deliveryId` 投递给 `JobExecutor`（scope `crm.integrations`）。
2. **后台异步投递与幂等重试**：后台任务向配置的目标地址发送 POST 请求，并在请求头附带 `Idempotency-Key` 与 `X-CRM-Event`。成功时记录 HTTP 状态码与外部系统返回的订单号（如 `ERP-SO-39BB3529`）；失败时记录状态 `failed`、尝试次数和错误摘要，重试始终沿用同一条投递记录与同一幂等键。

### 触发同步并查看投递记录

1. 打开 **System settings → Data and files → External integrations**，确认 **ERP & Finance sync target** 默认指向本地模拟接收器 `mock://erp-finance/orders` 且 **Sync enabled** 已开启。对接真实外部服务时，可在此替换为实际 HTTP(S) Webhook 地址并配置 `X-Integration-Secret`。
2. 在 **Beacon BioLabs** 下创建一条阶段为 `won` 的商机（如 **Beacon enterprise rollout**），或打开一份已确认报价（参考[审批流程与待办](approval-workflows.md)）。
3. 在已确认报价详情页点击 **Sync to ERP**，或使用具备 `crm.integrations: write` 范围的密钥触发赢单同步：

```bash
curl -i -X POST "$APP_URL/api/crmIntegrations/sync/opportunities/<opportunityId>" \
  -H "x-api-key: $ERP_API_KEY"
```

4. 回到 **System settings → Data and files → External integrations**，在 **Outbound sync deliveries** 列表中可以看到该记录状态变为 **Succeeded**，`Attempts` 为 `1 (200)`，并显示外部系统返回的 `ERP-SO-...` 单号。

![系统设置中的外部集成配置与出站同步投递日志，展示成功单号与失败重试入口](/assets/guides/crm-external-integrations.png)

## 验证幂等重放、失败重试与密钥撤销

按顺序验证外部集成中最容易出问题的四类边界：

| 验证场景 | 操作 | 预期结果 |
| --- | --- | --- |
| 线索幂等重放 | 用同一个 `$IDEM_KEY` 和相同请求体再次 `POST /api/crmIntegrations/leads` | 返回 `200 OK` 与 `Idempotency-Replayed: true`，返回原客户 ID，不新建重复记录 |
| 线索冲突拒绝 | 换新 `Idempotency-Key`，将 `conflictMode` 设为 `reject` 再次提交 **Beacon BioLabs** | 返回 `409`（`CRM_CUSTOMER_CONFLICT`），已有记录保持不变 |
| 失败模拟与安全重试 | 在 **External integrations** 开启 **Simulate HTTP 503 failure**，同步一条新赢单；看到 **Failed (`1 (503)`)** 后关闭模拟故障，点击 **Retry sync** | 状态转为 **Succeeded**，`Attempts` 变为 `2 (200)`，沿用原幂等键并返回唯一 `ERP-SO-...` 单号；再次重复触发同步直接返回原成功结果 |
| 密钥越权、轮换与撤销 | 用只读密钥调用 `POST /api/crmIntegrations/leads`、调用 `/api/apiKeys` 或 `/api/crm/customers`；在界面点击 **Rotate** 或 **Revoke** 后用旧密钥重试 | 越权与未放行接口均返回 `403`；轮换或撤销后旧密钥立即返回 `401` |

上述场景连同权限交集、销售禁止同步 ERP 等检查，也可通过 `tests/server/crm-integrations.test.ts` 在隔离数据库中自动运行验证。本地模拟接收器仅用于验证 CRM 侧的出站队列、幂等键和重试闭环；接入生产 ERP 或财务系统时，需在真实目标环境单独验证 HTTPS 连通性、签名校验与对方的幂等处理。

**完成的标志**：已签发带范围 API 密钥并通过 `x-api-key` 幂等写入外部线索；赢单或已确认报价可异步同步并记录外部单号；模拟 HTTP 503 失败后可按同一幂等键手动重试恢复；只读越权、轮换旧密钥和撤销后的调用均被正确拒绝。

## 小结与下一步

至此，CRM 补齐了面向外部系统的标准化入站与出站能力：带范围 API 密钥守住权限边界，共享客户接入规则保证与批量导入行为一致，出站台账与后台任务保证了外部同步的可观测与可重试。

回到[专题实战](index.md)查看其余核心能力专题，或对照[数据批量导入与后台处理](data-import.md)回顾文件导入与 API 接入共享的校验和冲突策略。
