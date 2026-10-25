---
title: 应用配置与系统设置
description: 声明、校验和读取应用配置，区分运行参数与业务设置，并交付真正可用的管理页面。
---

应用配置描述一个实例怎样运行，业务设置描述管理员怎样调整业务规则。两者可以影响同一个功能，但存储位置、修改者和生效方式不同。不要把每一个配置项都做成设置表单，也不要把管理员日常维护的业务值固定在部署文件里。

本篇基于示例应用的配置入口与内置设置页面，介绍接入方式。服务器部署参数的操作流程见[选择部署方式](../deployment/choose-a-deployment-method.md)。

## 先确定谁管理这个值

| 值的类型 | 示例 | 适合放在哪里 |
| --- | --- | --- |
| 运行参数 | 监听端口、数据库连接、公开访问地址 | `config.yml` 或已声明的环境变量 |
| 代码默认行为 | 列表默认每页条数 | 配置工厂的默认值，必要时允许部署覆盖 |
| 业务设置 | 报表时区、工作日历、业务编号规则 | 应用或插件管理的数据，通过授权接口修改 |
| 个人偏好 | 语言、明暗模式、主题 | 使用现有个人偏好机制 |
| 业务主数据 | 项目、客户、产品 | 对应业务模块，通常不放进系统设置 |

谁能修改、修改后何时生效、是否影响旧记录，都应在实现前确定。例如更改报表时区可以只影响以后的展示，也可能影响统计边界，不能让页面和后台任务自行解释。

## 使用 Agent

```text
请梳理这个应用的配置和管理入口，让部署人员与业务管理员各自能管理需要的内容。

先列出现有功能实际使用的配置，说明由谁修改、保存在哪里、修改后何时生效。
数据库连接和服务端密钥继续由部署环境管理，不出现在普通页面或浏览器配置里。
用户和角色管理沿用已有入口，不重复创建，也不自动扩大权限。

如果业务管理员需要调整规则，请使用真实的读取和保存接口，让后续业务操作实际使用保存的值。
只读管理员可以查看，具有修改权限的管理员才能保存；非法值不能写入，失败时保留输入。
不要添加尚未使用能力的空设置页。
完成后说明每项设置的生效范围，以及刷新、重新登录或重启验证的结果。
```

## 不使用 Agent

### 找到配置入口

服务端默认值在 `server/config/`，由 `server/config/index.ts` 的 `defaultAppConfigs()` 汇总；客户端自身的默认值在 `client/config/`。应用启动时加载配置文件和已声明的环境变量，再由运行时交给服务使用。

对于声明了环境映射的服务端配置，覆盖顺序为代码默认值、`config.yml`、环境变量。只设置一个名字看似合理的环境变量不会自动生效：它必须有相应映射。`config.yml` 中的 `${NAME}` 不会自动展开。

### 声明并校验配置

下面演示一个部署人员可覆盖的项目列表默认条数，新增 `server/config/project-defaults.ts`：

```ts
import {
  defineAppConfig,
  envInteger,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

export interface ProjectDefaults {
  pageSize: number;
}

const projectDefaults: AppConfigFactory<ProjectDefaults> = defineAppConfig({
  defaults: { pageSize: 20 },
  env: {
    PROJECT_PAGE_SIZE: envInteger('pageSize', {
      description: 'The default project page size, from 1 to 100.',
    }),
  },
  public: ['pageSize'],
  validate(value, ctx) {
    const size = value.pageSize;
    if (
      typeof size !== 'number' ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    ) {
      ctx.error('pageSize', 'Must be an integer from 1 to 100.');
    }
  },
});

export default projectDefaults;
```

将它导入 `server/config/index.ts`，把 `projectDefaults` 加入已有的 `defaultAppConfigs({ ... })`；如果该文件显式声明返回类型，也添加 `projectDefaults: ReturnType<typeof projectDefaults>`。保留已有配置项，不用本文片段替换整个文件。

在 `config.example.yml` 说明部署可配置的值，实际实例在 `config.yml` 中覆盖：

```yaml
projectDefaults:
  pageSize: 20
```

校验针对合并后的最终值，在启动、配置重载和配置检查时运行。校验函数报告无效值，不应写数据库、发送请求或修改外部状态。`public: ['pageSize']` 只公开这个叶子字段，其他服务端值不能因为页面需要配置就一并暴露。

### 读取并接入业务代码

服务端可以从配置服务读取：

```ts
const defaults = app.config.get<ProjectDefaults>('projectDefaults');
```

这里的 `ProjectDefaults` 从上面的配置文件导入。把 `defaults.pageSize` 用在分页输入缺省值的处理处，显式请求仍要检查 `1–100` 的范围。**声明配置本身不会自动改变列表。** 已有项目接口和前端当前有各自的默认值，采用此示例时需要一起调整其消费位置。

浏览器只读取公开配置，通过配置服务的 `config.public.get('projectDefaults.pageSize')` 访问，并在客户端声明类型：

```ts
declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    projectDefaults: { pageSize?: number };
  }
}

export {};
```

将类型声明放在客户端 TypeScript 项目包含的 `.d.ts` 文件中。插件拥有的配置优先使用其工厂和 hooks，避免绕过插件自身的校验。`client` 下的运行配置会发送到浏览器，不能存放密钥。

### 检查配置和生效方式

```bash
pnpm nocobase config env
pnpm nocobase config variables
pnpm nocobase config check
```

前两个命令帮助确认环境变量映射与说明，最后一个检查当前实例配置。不要把包含环境详情的输出或本地配置作为公开文档样例提交。

运行时能接收配置重载，不代表已经创建的所有服务都会重新初始化。服务若只在启动时读取一次配置，需要重启才能取得新值；支持动态更新的服务应按其合同订阅变化。修改客户端默认配置后还需刷新页面，验证未保存个人偏好的新会话，而不是仅观察已有浏览器状态。

### 接入已有系统设置

当前默认模板包含可复用的用户和权限管理页面。应用开始使用业务能力后，在 `client/routes.ts` 中把 `./pages/settings/routes.js` 导出的 `systemSettingsRoutes` 加入现有路由贡献数组一次；任务示例已经完成注册，无需重复添加。

菜单分组只是组织方式，不提供额外授权。保留已有页面的权限声明、真实接口和角色分配机制；增加业务功能时检查其管理入口是否齐全，而不是仅因某插件出现在依赖中就增加空页面。

### 增加应用自己的业务设置

如果需要“管理员可以调整报表时区”，应作为一项真实业务功能实现，不能直接给 `config.yml` 加一个网页保存按钮：

1. 确定持久化位置和初始值。优先使用能力所属插件的公开设置服务；应用自有设置则用迁移建立存储模型。
2. 在服务端声明设置资源及 `read`、`update` 等操作，提供认证、授权、输入校验完整的读写接口。
3. 管理页面放进已有设置导航组，页面检查对应设置资源的读取权限，保存入口检查修改权限。
4. 只读用户能查看当前值，修改失败保留草稿，成功后显示实际保存值；服务端每次保存仍独立授权。
5. 报表、后台任务等消费者实际读取这项设置，明确缓存、重载和对历史记录的影响。

设置页检查的资源类型通常为 `settings`，与普通业务页面的 `page/access` 不同。它的资源 ID 和操作必须在服务端注册，不能只写前端声明。具体授权声明方式以已安装权限插件的 Skill 为准。

以上是应用自有业务设置的实现流程，不表示模板已提供“报表时区”的数据表或接口。数据库连接、存储凭据、备份恢复等运维功能继续使用既有部署工具；页面可以展示授权后的状态和操作入口，但不能提供实际上不会生效的保存控件。

## 验证结果

配置变更要验证默认值、文件覆盖、环境覆盖和非法值拒绝；公开配置只包含允许发给浏览器的字段。业务设置要验证持久化、重启后保留、只读与修改权限，以及实际业务消费者确实采用新值。

继续阅读[页面、路由与导航](pages-routes-and-navigation.md)、[多语言与主题](localization-and-themes.md)和[测试与验收](testing-and-acceptance.md)。
