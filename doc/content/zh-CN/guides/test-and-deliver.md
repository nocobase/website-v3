---
title: "验收与交付应用"
metaDescription: 对照需求验收客户跟进功能，查看 Agent 的检查结果，按团队流程评审和发布，并在实际环境验证业务流程。
lesson: 4
---

在[客户跟进功能](customers-and-follow-ups.md)完成后，我们继续验收同一个 CRM 应用。准备好之前确认的需求文档和原型，作为判断功能是否符合预期的依据。

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#使用示例项目的-tag">示例项目的 tag 使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">开始</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-3"><code>lesson-3</code></a></td></tr>
<tr><th scope="row">完成</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-4"><code>lesson-4</code></a></td></tr>
<tr><th scope="row">本课说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-4/docs/lesson-4.md">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../core/developing-apps/testing-and-acceptance.md">应用测试</a></td></tr>
</tbody>
</table>
</div>
</div>

## 验收功能

开发过程中，Agent 应根据改动补充并运行相关测试，检查页面操作、数据保存和访问权限，修复发现的问题。这些属于开发工作，不需要我们逐条安排测试命令。验收时，先查看它实际完成了哪些检查、结果如何，还有哪些未验证；有测试要求不代表检查已经通过。

我们可以直接打开应用，对照需求文档和原型逐项体验，也可以先让 Agent 按文档中的验收标准检查：

```prompt
请按之前需求文档中的验收标准检查客户跟进功能，并对照原型看看实际操作是否符合预期。
给我一份验收报告，附上本地测试环境的访问链接和关键操作截图，说明哪些通过了、有哪些问题、哪些还没验证，方便我亲自体验。
```

报告应能对应到具体需求，说明实际操作和结果。截图帮助我们查看页面状态，访问链接用于亲自体验；没有运行或无法验证的部分，应明确标出，不能只凭截图判断功能已经完成。验收使用独立的测试环境和演示数据，避免影响正式业务记录。

打开 Agent 提供的地址，按[第三课的体验步骤](customers-and-follow-ups.md#体验录入查询与修改)走完客户跟进流程，并对照需求确认：

| 体验内容 | 确认什么 |
| --- | --- |
| 新建客户、添加联系人和跟进记录，再刷新页面 | 内容仍在，联系人和跟进属于正确的客户 |
| 修改客户资料，再搜索并重新打开 | 能找到客户，修改已保存，已有资料没有意外改变 |
| 客户名称或跟进内容留空，输入格式不正确的邮箱 | 页面提示问题，修正后可以保存 |
| 使用不同权限的测试账号访问 | 每个账号只能查看和操作允许的内容 |

权限不足、保存失败或重复提交等不方便手动复现的情况，可以查看 Agent 的检查结果；缺少证据时，让它补充验证。最终由我们确认功能和操作方式是否满足业务需求。

发现问题时，我们把操作步骤、实际结果和预期结果告诉 Agent，必要时附上截图。修复后重新体验相关操作，并查看更新后的验收结果。

验收通过后，按团队流程进入评审。PR（Pull Request）用于让团队审查并合并本次改动；已有 PR 的，补充验收结果即可，不必重复提交或新建。还没有 PR 时，可以说：

```prompt
把这次完成的客户跟进功能交给团队评审，说明完成了什么，并附上验收结果。
```

## 发布应用

评审通过后，按团队的 CI/CD 流程发布确认的版本。应用支持 Docker、PM2 等部署方式，详见[选择部署方式](../core/deployment/choose-a-deployment-method.md)。

生产环境使用独立配置、数据库和文件存储。开发环境中的业务记录不会自动复制到生产环境。

发布后，登录实际环境，确认客户、联系人和跟进记录能正常查看、保存，刷新后仍在。更新已有应用时，同时检查原有客户资料。

![客户详情展示客户资料、联系人和跟进记录。](/assets/guides/customer-detail.png)

## 备份与更新

正式使用前，与负责发布的同事确认数据库和上传文件已有备份安排，并保留对应的程序版本、运行配置和密钥。团队应在独立环境验证备份能否恢复；我们可以通过登录并查看客户、联系人和跟进记录，确认恢复后的业务数据可用。

后续新增功能或修复问题时，沿用“Agent 开发与检查 → 业务验收 → 团队评审 → 发布 → 实际环境验证”的流程。更新应保留已有配置和业务数据，具体操作见[发布应用新版本](../core/deployment/publish-app-release.md)。

回退程序不一定能恢复数据；恢复备份也会丢失备份之后的新增或修改。需要恢复时，由团队确认程序与数据的匹配版本，以及这部分业务记录如何处理。

**完成的标志**：已对照需求和原型验收客户跟进功能，发现的问题已修复并复查，团队评审已通过；发布后能查看和保存客户、联系人与跟进记录，刷新后数据仍在；备份安排已确认，并已在独立环境验证恢复后的业务数据可用。

## 小结

完成以上步骤后，CRM 的第一轮搭建就完成了，我们也走完了从确定需求、Agent 开发到验收、评审和发布的完整闭环。后续课程将继续完善同一个应用，深入使用数据关联、页面组件、权限、审批、通知和 AI 等模块能力。下一课从[商机与报价数据建模](opportunities-and-quotes.md)开始。
