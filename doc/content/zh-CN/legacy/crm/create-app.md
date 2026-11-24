---
title: "创建应用"
metaDescription: 准备开发环境和 Skill，让 Agent 创建并启动 CRM 应用，登录后认识项目规范与应用底座，保存第一个版本。
lesson: 1
---

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="../../guides/core-capabilities/index.md#示例项目说明">示例项目的 tag 使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">开始</th><td>空目录</td></tr>
<tr><th scope="row">完成</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-1"><code>lesson-1</code></a></td></tr>
<tr><th scope="row">本课说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-1/docs/lesson-1.md">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../../core/using-plugins/application-support/foundation.md">应用底座</a> · <a href="../../core/using-plugins/authentication/sign-in.md">登录认证</a></td></tr>
</tbody>
</table>
</div>
</div>

## 准备开发环境与 Agent

我们先准备 Node.js 24 或更高版本、pnpm 11 和 Git。Windows 用户在 WSL 中操作，后面的命令都在 Bash 等类 Unix 终端中运行。

### 安装开发工具

Windows 用户先按[微软的 WSL 安装说明](https://learn.microsoft.com/zh-cn/windows/wsl/install)安装 WSL。在以管理员身份打开的 PowerShell 中运行 `wsl --install`，按提示重启后打开 Ubuntu，后续工具安装和应用开发都在 WSL 中进行。

按 [nvm 安装说明](https://github.com/nvm-sh/nvm#installing-and-updating)安装 nvm，再安装 Node.js 和 pnpm：

```bash
nvm install 24
npm install -g pnpm@11
```

已有 fnm 时，也可以用 `fnm install 24` 安装 Node.js，再运行上面的 pnpm 安装命令。

macOS 用户运行 `git --version`，按提示安装命令行开发工具；Linux 和 WSL 用户用系统包管理器安装 Git，例如 Ubuntu 上运行 `sudo apt install git`。

### 检查环境并准备 Agent

打开一个新终端，检查工具版本：

```bash
node --version
pnpm --version
git --version
```

确认 Node.js 为 24 或更高版本、pnpm 为 11，Git 能正常运行。

准备一个能读取项目文件、运行终端命令的编码 Agent，例如 Codex 或 Claude Code，完成它自身的安装和登录。接下来在应用目录中向它提出需求；应用运行后，再到浏览器里检查结果。

## 安装创建应用的 Skill

我们在终端运行以下命令，按提示选择正在使用的编码工具：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

安装后重新打开 Agent 会话，让它加载新 Skill。这个 Skill 负责创建应用；应用创建好后，由项目自带的开发 Skill 接手。

## 创建、启动并登录应用

新建一个空目录 `my-crm`，在这个目录中打开 Agent：

```bash
mkdir my-crm
cd my-crm
```

教程示例使用 SQLite，不需要另外安装数据库服务。自己的应用可沿用已有数据库要求，连接配置见[使用不同数据库创建应用](../../core/reference/database-configuration.md)。

```prompt
我想搭建一个管理客户和跟进记录的 CRM。先帮我创建一个能在本机打开和登录的 NocoBase 3 应用，具体业务功能稍后再做。
启动后告诉我访问地址和首次登录的账号。
```

Agent 会检查环境、创建项目、安装依赖、生成本机配置并启动应用。想自己执行命令，可以按[手动创建应用](../../getting-started/develop-your-first-app.md#自己执行命令)操作。

打开 Agent 给出的地址，保留末尾的应用路径，例如 `/main/`。自己启动时，使用终端输出的完整 `Local:` 地址，不要猜端口。用首次登录账号进入应用；示例的本地学习账号是 `nocobase`，密码是 `admin123`，对外提供访问前应修改密码。

登录后应看到 **首页**，侧边栏有 **系统设置**。这时还没有 **客户**，客户功能在第三课开发。默认模板 `1.0.0-beta.92` 是本教程示例的创建版本，后续版本的界面可能略有不同。

开发服务器需要保持运行。停止后，在应用目录执行 `pnpm dev` 可以重新启动。如果更换了访问主机或端口，让 Agent 同步检查 `app.publicOrigin`：它应是浏览器地址的协议、主机和端口，不含 `/main/`。

## 认识项目规则、技能和应用底座

在编辑器中看看项目文件，再打开 **系统设置 → 应用使用情况**：

| 位置               | 用途                                                           | 谁维护                     |
| ------------------ | -------------------------------------------------------------- | -------------------------- |
| `AGENTS.md`        | Agent 开发前读取的规则和索引，例如代码放哪里、该用哪些已有能力 | 人和 Agent                 |
| `.agents/rules/`   | 这个应用自己的业务和开发约定                                   | 人和 Agent，随代码提交     |
| `.agents/skills/`  | 与已安装依赖版本配套的开发指引                                 | 安装依赖时同步，不手动修改 |
| **应用使用情况** | 查看应用已接入的 Core 能力                                     | 由应用实际注册的能力决定   |

下一课，我们先确定 CRM 需求与原型，再使用数据、页面和认证等能力开发客户跟进功能。底座里列有某项能力，不代表客户管理等业务页面已经做好。

## 保存第一个版本

在应用目录的 Agent 会话中发送：

```prompt
保存当前能启动和登录的版本，方便以后查看这一阶段的成果。
```

提交前看看改动列表。`config.yml` 含有本机配置和密钥，数据库、`storage/`、`node_modules/` 和自动同步的 `.agents/skills/` 都不应提交；示例项目的 `.gitignore` 已排除它们。业务代码、锁文件和项目约定要随版本保存。

**完成的标志**：管理员可以登录并打开首页和应用使用情况；`git log -1` 能看到第一个提交。


接下来，我们一起[确定 CRM 需求](define-requirements.md)。
