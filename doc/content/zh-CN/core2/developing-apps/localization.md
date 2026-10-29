---
title: 多语言
description: 组织应用文案和语言资源，按语言格式化展示数据，添加语言并设置默认语言。
---

应用通过 `client/locales/` 组织文案，沿用已有的翻译和语言切换机制，让菜单、表单、空状态和错误反馈使用同一种语言。外观的调整见 [主题与样式](themes-and-styles.md)。

本篇以入门示例使用的默认模板 `1.0.0-beta.81` 为参照，`projects` 只是新增业务文案的一个例子。阅读时请注意区分两件事：应用的默认语言，和用户已经保存的个人语言选择。

## 使用 Agent

```text
请补全项目功能的中英文文案。

菜单、按钮、字段提示、空状态、成功与失败反馈都要有完整文案，不显示翻译 key。
数字和日期按当前语言显示，不改变记录本身的值或业务时区规则。
沿用应用现有语言切换机制，保留用户已保存的偏好，并在新浏览器上下文中验证默认语言。
请实际检查两种语言，并说明哪些情况尚未验证。
```

## 不使用 Agent

### 把文案放在应用语言文件中

| 位置 | 职责 |
| --- | --- |
| `client/locales/en-US.ts` | 应用的英文文案，并导出 `AppResource` 类型 |
| `client/locales/zh-CN.ts` | 对应的中文文案，使用同一个资源结构 |
| `client/locales/system/` | 模板自带的文案，随模板升级维护 |
| `client/locales/index.ts` | 浏览器端可用的语言及其加载入口 |
| `server/locales/` | 服务端生成的消息及其语言加载入口 |

新增的业务文案放进应用语言文件，按功能分组，例如 `projects`。不要为了加入业务内容而直接修改 `system/`；扩展 `navigation`、`actions` 等共享分组时，先展开原有分组，以免覆盖模板已有的字段。

例如，在两个语言文件中添加 `projects` 分组和下面的计数文案。如果分组已经存在，只追加字段，不要替换其他内容：

```ts
// client/locales/en-US.ts — inside projects
count_one: '{{count}} project',
count_other: '{{count}} projects',
```

```ts
// client/locales/zh-CN.ts — inside projects
count_one: '{{count}} 个项目',
count_other: '{{count}} 个项目',
```

组件中使用应用提供的翻译 Hook：

```tsx
import { useTranslation } from '@nocobase/i18n/client';

export function ProjectCount({ count }: { count: number }) {
  const { t } = useTranslation();
  return <span>{t('projects.count', { count })}</span>;
}
```

“已创建某项目”这类完整句子，请用插值表达，不要把几个独立的词拼接起来。“保存”“取消”等通用文案可以复用现有 key；而带有业务对象的成功和错误提示，应留在各自的功能分组中，以免改动影响其他页面的含义。

语言文件的类型能检查资源结构，但像 `t('projects.titel')` 这样的拼写错误，TypeScript 不一定能发现。因此还需要文案覆盖测试和浏览器检查。

### 格式化数据与处理服务端文案

通过 `useLocale()` 取得当前语言，再用 `Intl.NumberFormat`、`Intl.DateTimeFormat` 格式化展示的值。日期的语言格式和业务时区是两回事：不要把“切换到中文”实现成修改数据库中的时间，也不要把只有日期的值误当成跨时区的时间戳。

API 错误按状态码和稳定的 `reason` 映射为页面文案，字段错误关联到对应的输入。不要直接把服务端返回的任意 `message` 作为最终给用户看的文案。服务端自己生成的通知、邮件等文本放在 `server/locales/`；后台发送的内容按接收人的语言生成，而不是沿用触发操作的管理员的语言。

如果要调整某个插件的文案，在应用语言资源中使用该插件命名空间下的 `overrides`，不要直接编辑已安装的插件。使用前，先按该插件公开的语言约定核实 key，避免依赖内部未公开的文案结构。

### 添加语言与设置默认语言

增加一种语言时，添加对应的资源文件，并在相应的 `locales/index.ts` 中注册动态加载入口。只给某个插件增加翻译，并不会把这种语言加入应用的语言选择器。

前端和服务端的语言列表是分别维护的。如果服务端也需要支持该语言，请同步增加服务端资源，然后运行：

```bash
pnpm nocobase locales check
```

这个命令检查两边的语言列表是否一致，但不检查每个文案 key 是否都已翻译。只在客户端存在的语言可以切换，但服务端会回退到其他语言，检查命令也会报告这种不一致。

默认语言在 `config.yml` 中设置：

```yaml
i18n:
  defaultLocale: zh-CN
```

浏览器中已保存的语言选择优先于默认值。验证默认语言时，请使用一个没有保存过选择的新浏览器上下文；不要为了让默认值生效而清除所有用户的偏好。请保留应用已有的 `useSyncServerLocale()` 同步机制，使服务端会话的语言与浏览器中受支持的选择保持一致。

## 验证结果

运行本示例的文案覆盖测试和类型检查：

```bash
pnpm exec vitest run tests/client/app-locale-coverage.test.ts
pnpm exec tsc -p tsconfig.json --noEmit
```

然后在浏览器中检查两种语言下的菜单、空状态、字段错误、复数计数和日期格式。在新的浏览器上下文中验证默认语言，并确认已有的个人选择仍然生效。类型检查不能代替对实际文案的检查。
