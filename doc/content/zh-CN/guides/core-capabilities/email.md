---
title: "邮件接入与业务收发"
metaDescription: 在 CRM 中接入个人邮箱，按联系人邮箱地址匹配客户往来邮件，直接发送正式报价单附件并验证同步与发送结果。
---

在 CRM 应用中接入销售个人邮箱，按客户联系人邮箱地址查找往来邮件，并直接发送已生成的正式报价文件。

在完整示例中体验时，准备管理员、销售 Alex 和 Taylor、主管 Morgan 四个独立账号（角色配置见[角色权限与数据范围控制](roles-and-permissions.md#配置用户与角色)），以及一个允许 IMAP/SMTP 接入的授权测试邮箱。

**学习模块**

- [邮件](../../core/using-plugins/notifications/mail.md)

## 明确客户沟通与报价发送的场景

[Core 邮件](../../core/using-plugins/notifications/mail.md)提供邮箱连接、同步、阅读、草稿、附件和发送记录；本专题把这些能力接到客户详情。个人邮箱与系统通知的邮件渠道分别配置，互不影响。

客户邮件按一位联系人的完整邮箱地址精确匹配 From、To、Cc，只显示当前用户已同步的邮件。共享客户不会共享私人邮箱，销售主管也不会因此获得销售的邮件。不同客户使用同一联系人地址时，可能匹配相同邮件；这不是邮件归档或独占关联。

## 接入邮箱并关联客户往来邮件

### 交给 Agent 开发

将第一节的业务规则连同下面的提示词交给开发 Agent：

```prompt
给 CRM 增加个人邮箱工作台和客户邮件标签，按所选联系人的完整邮箱地址查找当前用户的往来邮件。沿用本专题的客户与邮箱权限规则，没有邮箱地址时提示补充联系人。

让我在工作台附上已生成的报价 DOCX，确认后手动发送，并查看同步和发送记录；管理员可以查看账号运行状态。重复点击不能重复发送，未知结果不能自动重发。保留已有业务数据，不连接真实邮箱或自动发信。
```

### 理解实现

完整示例中的[账号页](https://github.com/nocobase/doc-demo-crm/blob/main/client/pages/mail/accounts.tsx)直接导出 Core 的 `MailAccountsPage`；[工作台](https://github.com/nocobase/doc-demo-crm/blob/main/client/pages/mail/workspace.tsx)复用 `MailWorkspacePage`，只补账号和日志入口。连接、同步、编辑及发送由 Core 提供。

[CRM 邮件接口](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/crm-mail.ts)先检查客户访问权限，再读取该客户的联系人，最后调用 Mail。下面是其中的查询片段；`actorId` 限定当前用户邮箱，`participant` 按联系人完整地址过滤：

```ts
await new CrmService(connection, policies).get(customerId);
// contact comes from the same customer's permission-scoped contacts.
const result = await app.container.resolve(mailServiceToken).listMessages(
  { actorId: c.get('auth')!.user.id },
  { participant: contact.email.trim().toLowerCase(), offset: (page - 1) * 20,
    limit: 20, withTotal: true },
);
```

### 配置并体验邮箱

准备一个允许 IMAP/SMTP 接入的授权测试邮箱，向服务商获取服务器地址、端口、TLS 方式及应用密码。在项目根目录的私有 `config.yml` 中合并以下 `mail` 配置，不要覆盖数据库等已有配置；使用 `APP_CONFIG_FILE` 时修改它指向的文件。

```yaml
mail:
  oauthReturnUrl: /mail/accounts
  providers:
    company-mail:
      type: imap-smtp
      imap:
        host: imap.example.com
        port: 993
        secure: true
      smtp:
        host: smtp.example.com
        port: 465
        secure: true
```

替换两个主机名，端口和 `secure` 按服务商要求填写：上例使用直接 TLS；STARTTLS 不能照抄这些值。不要把邮箱密码写入此段，连接账号时再输入。`company-mail` 是稳定的提供方名称，连接账号后不要随意改名。若 SMTP 不保存已发送副本，或需要配置 Gmail、Microsoft 365 回调路径，请参考[邮件插件配置](../../core/using-plugins/notifications/mail.md)与示例的 [`config.example.yml`](https://github.com/nocobase/doc-demo-crm/blob/main/config.example.yml)。

在项目根目录运行 `pnpm nocobase config check`，通过后重启 `pnpm dev`，使用终端打印的 `Local:` 地址。打开 **邮件 → 邮箱账号 → 连接账户**，应能选择 `company-mail`；看不到时检查私有配置路径及是否已重启。配置检查通过只证明配置可加载，账号连接成功才证明两端认证通过。

Alex 打开 **邮件 → 邮箱账号 → 连接账户**，选择 `company-mail`，填写邮箱地址、登录用户名及密码或应用密码，并选择初次同步起点。等待同步完成后，在 **联系人** 给客户联系人填写邮箱，再打开 **客户邮件** 并选择该联系人。没有邮箱地址时先补充联系人；空列表也可能表示邮件尚未同步，而非客户没有来信。

![客户详情按联系人地址显示当前用户的邮件](/assets/guides/crm-customer-mail.png)

图中使用仅供测试的本地邮箱夹具，普通启动不会提供此邮箱。按上述步骤接入自己的测试邮箱后，以实际同步结果为准。

## 发送报价文件并查看发送结果

1. 打开一份已确认的报价，下载生成的 DOCX。尚未生成报价单时，先按[用模板生成单据文件](template-print.md)生成文件。
2. 打开 **邮件 → 写邮件**，选择自己的发件账号，填入测试收件人和正文，通过 **添加附件** 上传刚下载的文件。
3. 核对收件人、报价版本及附件后点击 **发送**，在 **邮件记录 → 发送记录** 查看结果。接收方实际收到邮件后，再检查附件内容。

![原生邮件编辑器附上正式报价文件](/assets/guides/crm-quotation-mail.png)

**等待中**表示待发送，**提交中**表示正在提交，**服务商已受理**仅表示服务商接受，不能据此认定客户收到或阅读。**失败**时应先检查原因；**结果未知**时可能已经发送，核查服务商结果后再决定，不能自动重发。收件人部分被拒绝时，不要向所有人重新发送。

## 验证邮件同步、业务关联与访问范围

以下项目通过界面操作检查：

| 操作 | 预期结果 |
| --- | --- |
| 同步联系人来信，再打开客户邮件 | 精确地址匹配；同域其他人、相似域名不混入 |
| 切换联系人或客户 | 清除前一个筛选结果，不显示全部邮箱邮件 |
| Taylor 获得客户只读共享 | 只能匹配 Taylor 自己的邮件，不能读取 Alex 邮箱 |
| 移交客户，Alex 刷新原客户入口 | 页面和接口拒绝访问；Alex 自己的邮箱仍保留原邮件 |
| 查看同步及发送记录 | 区分同步失败、待发送、已接受和未知结果 |

管理员打开 **系统设置 → 消息 → 邮箱**，在 **账号** 查看连接状态，在 **同步日志** 和 **发送日志** 查看同步与发送结果。销售与销售主管默认没有此管理权限。

重复请求、同一请求标识配不同正文和附件字节一致性由自动化测试检查，不需要在页面构造。在项目根目录运行 `pnpm test`，预期全部通过；测试使用隔离数据库和本地邮箱夹具，不需要真实邮箱凭据。

邮件同步、匹配、越权、去重和报价附件内容一致性由 Agent 自动检查，并报告实际结果。外部 OAuth、IMAP/SMTP 连通性和真实收件需在自己的授权测试邮箱验证；本地验收不代表这些连接已经成功。

## 小结与下一步

**完成的标志**：已用自己的授权测试邮箱完成同步，客户邮件只匹配当前用户邮箱中的联系人地址；测试收件人已实际收到报价邮件，附件内容正确；已检查客户交接后的访问限制，并能从记录中区分服务商接受、失败和未知结果。

回到[专题实战](index.md)查看其余能力专题，或按需查阅[用模板生成单据文件](template-print.md)了解正式报价单的生成与快照规则。
