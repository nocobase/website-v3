---
title: 多语言与主题
description: 组织应用文案和语言资源，设置默认语言与外观，并通过主题变量保持界面一致。
---

多语言和主题属于整个应用的体验。新增业务页面应使用已有翻译、语言切换和主题机制，让菜单、表单、错误反馈以及明暗模式保持一致，而不是给每个页面分别实现一套。

本篇以当前入门示例所用的默认模板 `1.0.0-beta.81` 为参照，`projects` 仅作为新增业务文案的例子。语言、明暗模式和主题的默认值与用户已经保存的个人选择需要区分。

## 使用 Agent

```text
请检查项目功能的中英文和主题一致性。

菜单、按钮、字段提示、空状态、成功与失败反馈都要有完整文案，不显示翻译 key。
切换语言后，数字和日期按当前语言显示，但不要改变记录本身的值或业务时区规则。
浅色和深色模式下，表格、弹窗、输入框、错误提示和键盘焦点都要清晰可辨。

沿用应用现有语言和外观设置，保留用户已经选择的偏好。
如果需要调整主题，请统一调整共享样式，不只给项目页面换颜色。
请实际检查两种语言和两种明暗模式，并说明哪些情况尚未验证。
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

### 使用主题语义变量

业务组件使用 `bg-background`、`text-foreground`、`text-muted-foreground`、`border-border` 等语义类，颜色和尺寸由主题决定。页面中不要写死一套浅色背景，再另外为每个组件补深色样式。

当前示例应用的主题位置是：

| 文件                              | 职责                              |
| --------------------------------- | --------------------------------- |
| `client/theme/themes/compact.css` | 紧凑主题，默认预设                |
| `client/theme/themes/default.css` | 宽松主题，ID 为 `default`         |
| `client/theme/theme-presets.ts`   | 可选预设及其翻译 key              |
| `client/styles.css`               | 导入预设并把变量连接到 Tailwind   |
| `client/theme/theme-provider.tsx` | 提供已有主题状态，不另建 Provider |

明暗模式与主题预设是两个独立选择。一个预设应同时定义浅色与深色规则，不应强制用户切换模式。布局密度、字体、圆角和阴影同样应通过主题变量管理。

### 调整或增加主题

只调整现有预设时，修改对应主题文件，检查所有使用它的页面。需要增加独立品牌预设时：

1. 复制一份完整预设到 `client/theme/themes/brand.css`，保留完整的颜色与非颜色变量。
2. 把浅色、深色和 `.theme-preview` 的选择器改为新的 `data-theme='brand'`，在各自规则中调整颜色；不要只写一个局部 `--primary` 覆盖就当作完整预设。
3. 在 `client/styles.css` 导入新文件，保留现有预设及其导入顺序。
4. 在 `theme-presets.ts` 追加 `{ id: 'brand', labelKey: 'appearance.themes.brand' }`，保留原有默认项的顺序，并为标签提供中英文翻译。
5. 在真实页面和预览中检查可读性、焦点与明暗模式，运行主题测试。

这是新增预设的操作说明；当前示例没有附带一个名为 `brand` 的成品主题。不要重新运行 `shadcn init`、引入另一套 `next-themes` Provider，或用全局 `:root` 覆盖绕开现有预设机制。

### 设置默认外观

使用现有主题时可以在 `config.yml` 中设置：

```yaml
client:
  app:
    defaultColorScheme: system
    defaultTheme: compact
```

`defaultColorScheme` 支持 `light`、`dark`、`system`；`defaultTheme` 必须是已注册的预设 ID。浏览器保存的有效选择优先，再取配置默认值，最后使用内置回退值。这里的 `default` 是宽松预设的 ID，不是“自动选择默认主题”的特殊指令。

修改后让服务端加载新配置并刷新页面。代码中需要读取或修改外观时使用已有 `useTheme()` 与 `useThemePreset()`，不要自行读写存储 key 或 `<html>` 属性。

## 验证结果

只改文案时运行相关文案与类型检查；主题变更再运行主题测试：

```bash
pnpm exec vitest run tests/client/app-locale-coverage.test.ts
pnpm exec tsc -p tsconfig.json --noEmit
pnpm exec vitest run tests/client/theme-tokens.test.ts tests/client/theme-preferences.test.ts tests/client/client-theme.test.tsx
```

浏览器中检查两种语言、浅色和深色、窄屏、键盘焦点，以及列表空状态和字段错误。默认值与已保存偏好分别验证；类型检查和 CSS 编译不能替代实际阅读效果。
