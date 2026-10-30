# Studio 中文文档截图：待办交接

日期：2026-10-30。范围：`doc/content/zh-CN/studio/` 下的中文页面。英文页面暂不处理。

## 要做什么

1. **按 2 倍像素重截全部 Studio 截图，替换文档里的图片地址。**
   现有截图（文件名以 `-20261030-v2.png` 结尾）是 1 倍像素，文件只有 1440×900 像素，文档里点开放大后会发糊。
   - 浏览器窗口保持 1440×900，设备像素比设为 2，截出来的文件是 2880×1800 像素。
   - 效果和在 Retina Mac 上手工截一个 1440×900 浏览器窗口一样。
   - 文件大小应和手工截图相近，约 600–750 KB。
2. **首页截图换成默认账号，并拉到任务动态。**
   - 用默认管理员 `nocobase` 截，不用周航的账号（周航的任务太少）。
   - 「我的任务」右侧的任务详情要往下滚到「动态」，画面里要能看到调度 Agent 交出步骤、Agent 回复结果，体现调度 Agent 在分派和推进任务。
   - 图注用首页概览的口吻概括 Studio 在做什么，不要只罗列图上有什么。
3. **「我的任务」页和「核心概念」页的 `my-issues` 也改用默认账号截**，理由同上。
4. 截完后更新图片地址和图注，跑测试和构建，并看一下页面效果。

## 环境

本地 Studio 预览已经准备好，数据可写，不是演示模式。

- **代码**：Studio worktree `~/code/nocobase/studio/.claude/worktrees/docs-demo`，分支 `docs/demo-screenshots`，基于 `origin/dev` 的 `1d20b6a7`，改动都没有提交。
- **配置**：`config.yml` 已就绪（被 git 忽略）：SQLite、`i18n.defaultLocale: zh-CN`、`app.sampleData: true`、`studio.testing.enabled: true`（打开质量管理菜单）。
- **地址**：http://127.0.0.1:13000/main/
- **账号**：
  - 管理员 `nocobase` / `admin123`
  - 演示成员 `alex`（陈安，「供应商管理」的项目负责人）、`zhouhang`（周航，采购主管）、`chloe`（周可）等，密码都是 `demo1234`
- **示例数据**：安装时自动生成，包括：
  - 现有的中文演示数据（青禾零售的 5 个项目）。
  - Runner Agent 对话（由演示会话转换而来）。
  - 文档故事线：「供应商管理」项目，PUR-1 到 PUR-24，其中 PUR-23「供应商评分与分级」按《一个需求怎样完成》生成。
- **相关代码**（都在 `server/demo/` 下）：
  - `sample.ts`：非演示模式下按安装语言生成完整数据集。
  - `runner-conversations.ts`：生成 Runner Agent 对话。
  - `content/procurement-story.ts`：采购故事的项目、人、知识库、仓库、项目记忆。
  - `procurement-story.ts`：PUR-23 的每一步和发布记录。
  - 另外改了 `provider.ts`、`dataset.ts`、`task-history.ts`、`pull-requests.ts`、`sessions.ts`、`tag-versions.ts`、`memory.ts`、`content/index.ts`、`content/types.ts`，以及 `server/memory/provider.ts`。

### 按阶段重建

PUR-23 一次只能处于一个状态，所以截图要按阶段重建本地库，每次约 3 分钟：

```bash
cd ~/code/nocobase/studio/.claude/worktrees/docs-demo
scripts/docs-screenshots/stage.sh <阶段>   # session | dispatch | blocked | implement | review | done；keep 表示用现有数据库重启
```

看到输出 `studio ready` 再截图。几点说明：

- **自动重启**：开发服务器等健康检查最多 120 秒，生成示例数据会超过这个时间，脚本会在数据生成完后自动重启一次，属正常现象。
- **模拟「在线」**：脚本每 30 秒把演示运行环境标为在线，并延长「运行中」任务的租约，这样页面上显示在线和「工作中」。这只是截图用的模拟，不会真的执行任何任务。
- **停止方式**：Ctrl-C 结束脚本，会同时停掉服务器。

### 截图

```bash
cd ~/code/nocobase/studio/.claude/worktrees/docs-demo
node scripts/docs-screenshots/shots.mjs scripts/docs-screenshots/specs/<spec>.json <输出目录>
```

- 每个 spec 指定登录账号和要截的页面、操作步骤，脚本说明见 `shots.mjs` 开头。
- 项目 ID、会话 ID 每次重建都会变，spec 里用 `{project:供应商管理}`、`{conversation:zhouhang}` 占位，运行时从数据库查出实际值。
- 截完逐张看一遍：页面是否加载完整、有没有提示条、滚动位置对不对。

## 截图清单

| 阶段 | spec | 图片 | 账号 | 用在哪些页面 |
| --- | --- | --- | --- | --- |
| session | `session.json` | `req-session` | zhouhang | 一个需求怎样完成、我的会话 |
| dispatch | `dispatch.json` | `req-dispatch` | zhouhang | 一个需求怎样完成、Agent 团队怎样工作 |
| blocked | `blocked.json` | `req-blocked` | zhouhang | 一个需求怎样完成、回答提问 |
| implement | `implement.json` | `req-now`、`composer`、`runs` | zhouhang | 一个需求怎样完成、走完第一个需求、跟进进展 |
| implement | `implement-lead.json` | `agent-queue` | alex | Agent 团队怎样工作、Agent 工作负荷与模型用量 |
| review | `review.json` | `req-accept`、`req-preview`、`review-thread`、`new-task-chat`、`manual-form` | zhouhang | 一个需求怎样完成、验收、PR 预览、走完第一个需求、Agent 团队怎样工作、提出需求 |
| done | `done-admin.json` | `home`（新）、`my-issues` | nocobase | 首页；我的任务、核心概念 |
| done | `done-lead.json` | `releases`、`project-memory`、`sessions-list`、`qs-agents`、`qs-coordinator`、`qs-add-runtime`、`invite`、`connect-computer` | alex | 一个需求怎样完成、发布概览、我的会话、核心概念、启用 Agent、接入共享运行环境、邀请成员、连接自己的电脑 |
| done | `done-inbox.json` | `inbox` | chloe | 收件箱与提醒 |

用 `grep -rn "studio-zh-" doc/content/zh-CN/studio` 可以找到每张图的引用位置和现有图注。

## 首页截图

- 默认选中的是「等你处理」里的第一个任务。在右侧详情里往下滚到「动态」，让画面里同时有：
  - 调度 Agent 的「交接」评论：交给哪个 Agent、做什么；
  - 执行 Agent 的回复和结果；
  - 状态的变化。
- `done-admin.json` 里 `home` 的滚动距离是估计值，要按实际画面调。必要时换一个动态更完整的任务：在 `nocobase` 账号下，选一个经历过方案、开发、评审、交付的待验收任务。
- 图注写 Studio 在做什么，和首页概览的语气一致，不要逐项描述画面。可参考：

  > 调度 Agent 把需求拆成步骤，交给擅长的 Agent 设计、开发和评审，每一次交接和结果都留在任务里；需要人决定的事，排在「我的任务」最前面。

- 首页的图放在 `doc/content/zh-CN/studio/index.md` 概览三段文字之后、「学习」之前，替换现有的 `my-issues` 图。

## 上传和替换

1. 用 PicGo 桌面端上传（默认图床就是 `static-docs.nocobase.com`）：

   ```bash
   node ~/.claude/skills/picgo-upload/scripts/gui-upload.mjs <文件绝对路径>...
   ```

   PicGo 会保留原文件名上传，同名文件会覆盖已有文件。所以上传前先改成不重复的名字，例如 `studio-zh-<图片>-20261030-v3.png`，不要用 `my-issues.png` 这类通用名。
2. 上传后用 `curl -I` 确认每个地址返回 200。
3. 在 `doc/content/zh-CN/studio/` 里把 `-20261030-v2.png` 换成新地址；首页和「我的任务」「核心概念」的图按上文换成新截的。
4. 核对每张图的图注和新画面一致。

## 已知问题，需要决定

- **验收截图对不上**：《一个需求怎样完成》的「验收」一节写着「开发的 Agent 为每个验收场景附上了截图」，但 PUR-23 的交付报告里没有附图。可以删掉这句，或在 `server/demo/procurement-story.ts` 里给交付报告补上截图附件。
- **收件箱截图不能用管理员账号**：陈安和管理员的收件箱里有一条原演示数据的「部署到正式环境」审批，和文档「生产不在 Studio 托管」的说法冲突，所以收件箱用周可的账号截。
- **「我的电脑」显示离线**：截图里的电脑显示「最后在线 8 月 1 日」，图注已写成不说在线。My Agent 将废弃，这一页之后可能整体调整。

## 完成后的检查

在仓库根目录：

```bash
pnpm doc:test
pnpm doc:build
```

- 如果本机 `~/code/node_modules/cookie` 存在，build 会报 `parseCookie` 错误。这是本机环境问题，可以临时 `ln -s ../../node_modules/.pnpm/cookie@2.0.1/node_modules/cookie doc/node_modules/cookie`，build 完删除链接。
- 用 `pnpm doc:preview` 打开中文 Studio 页面，点开几张图确认放大后清晰。
- 不要提交 `doc/dist/` 和截图的本地文件。


## English pass — 2026-10-31

- Translated the Studio home page, four Introduction articles, and Install and configure pages. English sidebar titles match the current Chinese structure.
- Added English architecture and workflow figures. English examples use GitHub, S3, example.com addresses, and the default English UI; no Chinese locale setup or domestic service examples.
- Recaptured 27 full-viewport screenshots at 1440 × 900. The image names start with `studio-en-` and end with `-20261030.png`, hosted on `static-docs.nocobase.com` through PicGo. Runtime registration credentials are redacted.
- The English business example uses Supplier Management, Jordan, and PUR-23. Its fixture was prepared in an isolated copy; the original Chinese demo was preserved. The My issues list is at its minimum width.
- Login and empty-project screenshots come from a new English instance. Installation screenshots use the existing setup instance and its initialized project. No new GitHub repository, member invitation, or CI run was created for this translation pass.
- Working screenshot scripts and private local fixture state are under `/tmp/studio-en-docs`; they are not documentation source and must not be committed.
