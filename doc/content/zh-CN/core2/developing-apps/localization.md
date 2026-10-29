---
title: 多语言
description: 组织应用文案和语言资源，格式化展示数据，添加语言并设置默认语言。
---

应用通过 `client/locales/` 组织文案，沿用已有的翻译和语言切换机制，让菜单、表单、空状态和错误反馈保持一致。外观调整见[主题与样式](themes-and-styles.md)。

本篇以入门示例所用的默认模板 `1.0.0-beta.81` 为参照，`projects` 仅作为新增业务文案的例子。需要区分默认语言与用户已经保存的个人选择。

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

| 位置                      | 职责                                  |
| ------------------------- | ------------------------------------- |
| `client/locales/en-US.ts` | 应用英文文案，导出 `AppResource` 类型 |
| `client/locales/zh-CN.ts` | 对应中文文案，使用同一个资源结构      |
| `client/locales/system/`  | 模板自带文案，升级模板时维护          |
| `client/locales/index.ts` | 浏览器可用语言及其加载入口            |
| `server/locales/`         | 服务端生成的消息及语言加载入口        |

新增业务文案放进应用语言文件，例如 `projects` 分组。不要直接修改 `system/` 来加入业务内容；扩展 `navigation`、`actions` 等共享分组时，先展开原分组，防止覆盖模板已有字段。

例如，在两个语言文件中添加 `projects` 分组及下面的计数文案；如果分组已经存在，只追加字段，不替换其他内容：

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

组件使用应用提供的翻译 hook：

```tsx
import { useTranslation } from '@nocobase/i18n/client';

export function ProjectCount({ count }: { count: number }) {
  const { t } = useTranslation();
  return <span>{t('projects.count', { count })}</span>;
}
```

使用插值表达“已创建某项目”等完整句子，不拼接几个独立单词。共享的“保存”“取消”可以复用现有 key；含业务对象的成功和错误文案留在功能分组中，避免改变其他页面的含义。

语言文件的类型可以检查结构，但 `t('projects.titel')` 这样的拼写错误不一定被 TypeScript 发现。还需要文案覆盖测试和浏览器检查。

### 格式化数据与处理服务端文案

通过 `useLocale()` 取得当前语言，再用 `Intl.NumberFormat`、`Intl.DateTimeFormat` 格式化展示值。日期语言格式与业务时区是两件事：不要把“切换中文”实现为修改数据库时间，也不要把只有日期的值误当成跨时区时间戳。

API 错误按状态与稳定的 `reason` 映射成页面文案，字段错误关联对应输入。不要直接把任意服务端 `message` 作为最终用户文案显示。服务端自己生成的通知、邮件和其他文本放在 `server/locales/`，后台发送内容按接收人的语言生成，不能沿用触发操作的管理员语言。

若要调整插件文案，使用应用语言资源中该插件命名空间的 `overrides`，不要编辑已安装插件。使用前按该插件的语言合同核实 key，避免依赖内部未公开的文案结构。

### 添加语言与设置默认值

增加一种语言时，添加资源文件，并在对应 `locales/index.ts` 中注册动态加载入口。只给某个插件增加翻译不会把新语言放进应用的语言选择器。

前端和服务端的语言列表分别维护。需要服务端也使用该语言时，同步增加服务端资源；然后运行：

```bash
pnpm nocobase locales check
```

它检查两边语言列表是否一致，不检查每个文案 key 是否已翻译。客户端独有语言可以切换，但服务端会回退，检查命令也会报告这种不一致。

默认语言在 `config.yml` 中设置：

```yaml
i18n:
  defaultLocale: zh-CN
```

已有浏览器保存的语言选择优先于默认值。验证默认语言时使用没有保存选择的新浏览器上下文；不要清除所有用户的偏好来强制生效。保留应用已有的 `useSyncServerLocale()` 同步机制，使服务端会话语言与支持的浏览器选择保持一致。

## 验证结果

运行本示例的文案覆盖与类型检查：

```bash
pnpm exec vitest run tests/client/app-locale-coverage.test.ts
pnpm exec tsc -p tsconfig.json --noEmit
```

浏览器中检查两种语言的菜单、空状态、字段错误、复数计数和日期格式。在新浏览器上下文中验证默认语言，并确认已有个人选择仍然生效。类型检查不能替代实际文案检查。
