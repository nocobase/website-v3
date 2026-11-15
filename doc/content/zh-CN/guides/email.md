---
title: "邮箱接入与客户邮件"
lesson: 11
description: "使用 Core 邮件能力同步客户往来、发送报价附件并检查结果。"
---

在第 10 课 CRM 中接入个人邮箱，用联系人地址查找往来邮件，并发送第 9 课生成的正式报价文件。

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#使用示例项目的-tag">示例项目的 tag 使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">开始</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-10"><code>lesson-10</code></a></td></tr>
<tr><th scope="row">完成</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-11"><code>lesson-11</code></a></td></tr>
<tr><th scope="row">本课说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-11/docs/lesson-11.md">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../core/using-plugins/notifications/mail.md">邮件</a></td></tr>
</tbody>
</table>
</div>
</div>

## 明确客户沟通与报价发送的场景

[Core 邮件](../core/using-plugins/notifications/mail.md)提供邮箱连接、同步、阅读、草稿、附件和发送记录；本课把这些能力接到客户详情。它与第 10 课的系统通知邮件渠道分别配置。

客户邮件按一位联系人的完整邮箱地址精确匹配 From、To、Cc，只显示当前用户已同步的邮件。共享客户不会共享私人邮箱，销售主管也不会因此获得销售的邮件。不同客户使用同一联系人地址时，可能匹配相同邮件；这不是邮件归档或独占关联。

## 接入邮箱并关联客户往来邮件

### 交给 Agent 开发

将第一节的业务规则连同下面的提示词交给开发 Agent：

```prompt
给 CRM 增加个人邮箱工作台和客户邮件标签，按所选联系人的完整邮箱地址查找当前用户的往来邮件。沿用本课的客户与邮箱权限规则，没有邮箱地址时提示补充联系人。

让我在工作台附上第 9 课生成的报价 DOCX，确认后手动发送，并查看同步和发送记录；管理员可以查看账号运行状态。重复点击不能重复发送，未知结果不能自动重发。保留已有业务数据，不连接真实邮箱或自动发信。
```

### 理解实现

[账号页](https://github.com/nocobase/doc-demo-crm/blob/lesson-11/client/pages/mail/accounts.tsx)直接导出 Core 的 `MailAccountsPage`；[工作台](https://github.com/nocobase/doc-demo-crm/blob/lesson-11/client/pages/mail/workspace.tsx)复用 `MailWorkspacePage`，只补账号和日志入口。连接、同步、编辑及发送由 Core 提供。

新增的 [CRM 邮件接口](https://github.com/nocobase/doc-demo-crm/blob/lesson-11/server/routes/crm-mail.ts)先检查客户访问权限，再读取该客户的联系人，最后调用 Mail。下面是其中的查询片段；`actorId` 限定当前用户邮箱，`participant` 按联系人完整地址过滤：

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

准备一个允许 IMAP/SMTP 接入的授权测试邮箱，向服务商获取服务器地址、端口、TLS 方式及应用密码。在示例项目根目录的私有 `config.yml` 中合并以下 `mail` 配置，不要覆盖数据库等已有配置；使用 `APP_CONFIG_FILE` 时修改它指向的文件。

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

替换两个主机名，端口和 `secure` 按服务商要求填写：上例使用直接 TLS；STARTTLS 不能照抄这些值。不要把邮箱密码写入此段，连接账号时再输入。`company-mail` 是稳定的提供方名称，连接账号后不要随意改名。若 SMTP 不保存已发送副本，再按[提供方配置说明](https://github.com/nocobase/doc-demo-crm/blob/lesson-11/docs/lesson-11.md#provider-options)设置客户端归档；该说明也提供 Gmail 和 Microsoft 365 的配置形状及回调路径。

在项目根目录运行 `pnpm nocobase config check`，通过后重启 `pnpm dev`，使用终端打印的 `Local:` 地址。打开 **邮件 → 邮箱账号 → 连接账户**，应能选择 `company-mail`；看不到时检查私有配置路径及是否已重启。配置检查通过只证明配置可加载，账号连接成功才证明两端认证通过。

Alex 打开 **邮件 → 邮箱账号 → 连接账户**，选择 `company-mail`，填写邮箱地址、登录用户名及密码或应用密码，并选择初次同步起点。等待同步完成后，在 **联系人** 给客户联系人填写邮箱，再打开 **客户邮件** 并选择该联系人。没有邮箱地址时先补充联系人；空列表也可能表示邮件尚未同步，而非客户没有来信。

![客户详情按联系人地址显示当前用户的邮件](/assets/guides/crm-customer-mail.png)

图中使用仅供测试的本地邮箱夹具，普通启动不会提供此邮箱。按上述步骤接入自己的测试邮箱后，以实际同步结果为准。

## 发送报价文件并查看发送结果

1. 打开第 9 课已确认的报价，下载生成的 DOCX。尚未准备报价时，先完成[报价文件生成](attachments-and-documents.md)。
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

管理员在 **系统设置 → 邮件管理** 查看账号、同步和发送状态；销售与销售主管默认没有此管理权限。

重复请求、同一请求标识配不同正文和附件字节一致性由自动化测试检查，不需要在页面构造。按[运行说明中的测试命令](https://github.com/nocobase/doc-demo-crm/blob/lesson-11/docs/lesson-11.md#verification)在项目根目录执行，预期全部通过；测试使用隔离数据库和本地邮箱，不需要真实邮箱凭据。

邮件同步、匹配、越权、去重和报价附件内容一致性由 Agent 自动检查，并报告实际结果。外部 OAuth、IMAP/SMTP 连通性和真实收件需在自己的授权测试邮箱验证；本地验收不代表这些连接已经成功。

**完成的标志**：已用自己的授权测试邮箱完成同步，客户邮件只匹配当前用户邮箱中的联系人地址；测试收件人已实际收到报价邮件，附件内容正确；已检查客户交接后的访问限制，并能从记录中区分服务商接受、失败和未知结果。
