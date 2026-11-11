---
title: 多门户示例 - ServiceHub
metaDescription: 运行 ServiceHub 设备服务示例，体验同账号门户切换、独立布局、角色权限与跨门户工单协作。
---

ServiceHub 以咖啡门店的设备服务为场景。客户提交报修，调度员分配工程师，工程师处理后由客户确认；同一张工单在不同门户中呈现各自需要的信息和操作。

<a class="doc-repo-card" href="https://github.com/nocobase/app-example-multi-portal">
  <span class="doc-repo-card-content">
    <strong>ServiceHub 示例仓库</strong>
    <span class="doc-repo-card-name">nocobase/app-example-multi-portal</span>
    <span class="doc-repo-card-description">完整源码、初始化数据与运行说明</span>
  </span>
  <span class="doc-repo-card-action">在 GitHub 查看 <span aria-hidden="true">↗</span></span>
</a>

![系统管理员工作台](/assets/core/servicehub/admin-workbench.png)

## 示例场景与门户分工

四个门户共享一个应用的账号与业务数据，可以分别安装和卸载。

| 门户 | 页面与布局 | 主要用途 |
| --- | --- | --- |
| Customer portal | 顶部导航：概览、设备、服务工单 | 客户报修、查询进度、确认服务 |
| Dispatch console | 侧边栏：工单队列、现场团队、服务总览 | 跨客户派单、查看团队工作量 |
| Engineer workspace | 任务卡片、固定底部导航 | 处理派给自己的任务、查看已完成记录 |
| Service insights | 分析侧边栏、状态与门店汇总 | 查看实时服务统计，演示门户扩展 |

示例界面默认使用英文，也支持中文；两种语言使用相同的虚构英文数据。初始化提供 3 家门店、6 台设备、12 张工单和 7 个业务账号。

## 安装与初始化

需要 Node.js 24 或更高版本、pnpm 11.7.0，以及 NocoBase 商业包源的读取权限。示例源码公开，但运行所依赖的商业多门户插件仍需要相应下载权限。

克隆示例，在项目根目录登录包源并安装依赖：

```bash
git clone https://github.com/nocobase/app-example-multi-portal.git
cd app-example-multi-portal
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
pnpm install
```

包源登录的密码使用读取令牌，保存在用户级配置中，不要写入仓库。包源准备和权限检查见[创建多门户应用](create-app.md#准备环境与商业包访问权限)。这个仓库已经是完整应用，无需再运行 `create-app`。

下面使用示例默认的 SQLite 配置，无需单独启动数据库服务。在首次启动前初始化配置并开启样例数据：

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set app.sampleData=true
pnpm nocobase config set client.app.title=ServiceHub i18n.defaultLocale=en-US client.app.defaultTheme=compact
pnpm nocobase config check
pnpm dev
```

初始化命令生成本机 `config.yml` 和应用密钥。打开终端打印的应用入口，保留 `/main/` 路径；首次启动会运行迁移和样例初始化。需要其他数据库时，先安装相应驱动并调整配置，参考[数据库配置](../../reference/database-configuration.md)。

初始管理员默认为 `nocobase` / `admin123`，也可用 `admin@nocobase.com` 登录。首次启动前可通过 `config.yml` 的 `users.initialAdmin` 修改初始凭据；已有账号不会随这段配置自动重置。

管理员进入 **System settings → Portal management**，安装 Customer portal、Dispatch console 和 Engineer workspace，暂时保留 Service insights 未安装。回到首页后应看到三个已安装门户。

这些账号使用公开演示密码，只用于隔离的演示环境。完整安装说明和常见问题见仓库的[中文 README](https://github.com/nocobase/app-example-multi-portal/blob/main/README.zh-CN.md)。

## 演示账号与权限

以下业务账号的密码统一为 **`ServiceHub2026!`**，支持用户名或邮箱登录。

| 用户名 | 姓名 | 邮箱 | 数据与操作范围 |
| --- | --- | --- | --- |
| `manager` | Morgan Brooks | `manager@servicehub.example` | 调度全部工单；在工程师门户处理自己的任务；查看已安装的服务分析 |
| `dispatcher` | Jordan Lee | `dispatcher@servicehub.example` | 查看跨客户工单并分配工程师 |
| `engineer1` | Taylor Chen | `engineer-1@servicehub.example` | 处理派给自己的任务 |
| `engineer2` | Sam Patel | `engineer-2@servicehub.example` | 处理派给自己的任务 |
| `customer1` | Alex Morgan | `customer-1@servicehub.example` | Harbor Coffee · London 的设备与工单 |
| `customer2` | Sofia Rivera | `customer-2@servicehub.example` | Juniper Coffee · Amsterdam 的设备与工单 |
| `customer3` | Jamie Park | `customer-3@servicehub.example` | Daylight Coffee · Singapore 的设备与工单 |

经理不是系统管理员，没有客户门户权限，也不能安装门户或恢复演示数据。展示不同人员协作时，使用不同浏览器配置文件分别登录；同一浏览器的普通标签页共享会话。

## 切换门户与独立布局

先用 `manager` 登录，进入 **Dispatch console**。侧边栏提供 **Ticket queue**、**Field team** 和 **Service overview**。团队页展示工程师的真实任务分配，点击任务可打开详情。

![调度门户的侧边栏与团队工作量](/assets/core/servicehub/dispatch-team.png)

点击 **Switch portal → Engineer workspace**。无需退出登录，页面变为任务卡片和底部导航，只显示派给 Morgan Brooks 的任务。初始有两张待处理任务；**Completed work** 初始为空，客户确认完成后才会出现记录。

![经理在调度与工程师门户之间切换](/assets/core/servicehub/portal-switching.png)

<img src="/assets/core/servicehub/engineer-mobile.png" alt="工程师手机端的门户切换、任务卡片和底部导航" width="390" />

用 `customer1` 登录，可以看到另一种顶部导航布局。**Overview** 展示欢迎区和概览，**My devices** 为每台设备提供报修入口，**Service tickets** 用于查询进度和确认服务。

![客户门户的顶部导航与设备概览](/assets/core/servicehub/customer-portal.png)

ServiceHub 自行实现了面向业务用户的工作台与门户切换器，只列出已安装且当前账号有权限访问的门户。它不是模板默认管理员目录的直接复用；服务端仍独立检查安装状态、业务权限及数据范围。默认模板的边界见[门户访问与权限](access.md)。

## 完成一次服务协作

准备两个浏览器配置文件，分别登录 `customer1` 和 `manager`：

1. **客户报修**：在客户门户打开 **My devices**，为 Linea espresso machine 发起报修，标题填入“Espresso machine not heating”。提交后记录工单编号，状态应为 **Unassigned**。
2. **经理派单**：进入 **Dispatch console → Ticket queue**，查找该编号，打开详情或更多菜单的 **Assign engineer**，分配给 **Morgan Brooks**。工单变为 **Assigned**。
3. **切换并接单**：点击 **Switch portal → Engineer workspace**，找到同一张工单，打开 **View task**，点击 **Accept and start**。状态变为 **In progress**。
4. **提交处理结果**：填写 **Resolution**，例如“Replaced the thermostat and verified normal operation.”，点击 **Submit resolution**。工单变为 **Awaiting review**。
5. **客户确认**：回到客户的 **Service tickets**，刷新页面并筛选 **Awaiting review**，查看处理结果，确认并评价。工单变为 **Completed**；刷新经理的工程师门户后，可在 **Completed work** 中找到它。

若要演示独立调度员与工程师的协作，改用 `dispatcher` 将工单分配给 Taylor Chen，再用 `engineer1` 处理。客户与调度门户使用响应式表格，行操作收在纯文字的更多菜单中。

## 管理门户与恢复演示数据

系统管理员的首页提供业务门户入口，以及 **Portal management** 和 **Restore demo data**。业务用户不会获得这两个管理入口。

在门户管理中安装 **Service insights**，再刷新经理页面，切换菜单中会出现该门户。进入后可查看按工单状态和门店汇总的数据。卸载后入口隐藏，业务数据仍保留；安装与卸载的规则见[管理门户](manage.md)。

![门户管理：三个已安装门户与可选服务分析门户](/assets/core/servicehub/portal-management.png)

下一轮演示前，管理员可在首页点击 **Restore demo data** 并确认。它会删除本轮新增工单、重建示例设备和 12 张工单，同时保留账号、角色与门户安装状态。只有开启 `app.sampleData` 时才允许恢复。

如果首次启动时未开启样例数据，可在开发环境停止服务后执行以下命令，再重新启动。`db sample` 补跑此前跳过的样例初始化，不能代替日常演示重置，也不能在生产环境执行。

```bash
pnpm nocobase config set app.sampleData=true
pnpm nocobase db sample
pnpm dev
```

## 查看示例源码

[示例仓库](https://github.com/nocobase/app-example-multi-portal)提供完整应用。以下链接固定到本文对应的版本，便于对照布局、授权与演示数据：

| 入口 | 内容 |
| --- | --- |
| [四个门户包](https://github.com/nocobase/app-example-multi-portal/tree/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/packages) | 各门户的独立 `client/layout.tsx` |
| [门户布局与切换](https://github.com/nocobase/app-example-multi-portal/blob/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/client/pages/servicehub/portal-layout.tsx) | 按可访问门户生成切换菜单，组合导航与账号控件 |
| [业务 API](https://github.com/nocobase/app-example-multi-portal/blob/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/server/routes/servicehub.ts) | 门户访问列表、工单操作与数据范围检查 |
| [种子数据](https://github.com/nocobase/app-example-multi-portal/tree/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/database/main/seeds) | 业务账号、角色、设备与工单初始化 |

在此基础上增加自己的门户，可继续阅读[开发业务门户](develop.md)。
