---
title: 主题与样式
description: 使用语义样式和主题变量，调整主题预设，并设置明暗模式和默认外观。
---

应用通过 `client/styles.css` 和 `client/theme/` 维护外观。业务组件使用 shadcn 基础组件和语义主题变量，使不同页面在浅色、深色模式下保持一致。主题名称的翻译见 [多语言](localization.md)。

本篇以入门示例使用的默认模板 `1.0.0-beta.81` 为参照。明暗模式和主题预设是两项独立的设置；阅读时还要区分它们各自的默认值和用户已保存的个人选择。

## 使用 Agent

```text
请检查项目功能的主题一致性。

使用现有 shadcn 组件和语义主题变量。
浅色和深色模式下，表格、弹窗、输入框、错误提示和键盘焦点都要清晰可辨。
统一调整共享样式，检查其他页面与窄屏布局。
沿用现有外观设置，保留用户已保存的偏好，单独验证默认值。
请实际检查页面，并说明哪些情况尚未验证。
```

## 不使用 Agent

### 使用主题语义变量

业务组件使用 `bg-background`、`text-foreground`、`text-muted-foreground`、`border-border` 等语义类，具体的颜色和尺寸由主题决定。不要在页面中写死一套浅色背景，再为每个组件单独补深色样式。

当前示例应用中，主题相关的文件如下：

| 文件 | 职责 |
| --- | --- |
| `client/theme/themes/compact.css` | 紧凑主题，即默认预设 |
| `client/theme/themes/default.css` | 宽松主题，ID 为 `default` |
| `client/theme/theme-presets.ts` | 可选的预设及其翻译 key |
| `client/styles.css` | 导入各预设，并把主题变量连接到 Tailwind |
| `client/theme/theme-provider.tsx` | 提供已有的主题状态；不要另建 Provider |

明暗模式和主题预设是两个相互独立的选择。一个预设应同时定义浅色和深色两套规则，而不是强制用户切换模式。布局密度、字体、圆角和阴影同样应该通过主题变量管理。

### 调整或增加主题

如果只是调整现有预设，修改对应的主题文件，并检查所有使用它的页面。如果需要增加一个独立的品牌预设：

1. 把一份完整的预设复制到 `client/theme/themes/brand.css`，保留全部颜色变量和非颜色变量。
2. 把浅色、深色和 `.theme-preview` 的选择器改为新的 `data-theme='brand'`，再分别在各条规则中调整颜色。只写一个局部的 `--primary` 覆盖，不算完整的预设。
3. 在 `client/styles.css` 中导入新文件，保留现有的预设及其导入顺序。
4. 在 `theme-presets.ts` 中追加 `{ id: 'brand', labelKey: 'appearance.themes.brand' }`，保留原有默认项的顺序，并为标签提供中英文翻译。
5. 在真实页面和预览中检查可读性、焦点和明暗模式，然后运行主题测试。

以上是新增预设的操作说明，当前示例并没有附带一个名为 `brand` 的现成主题。不要重新运行 `shadcn init`、引入另一套 `next-themes` Provider，也不要用全局的 `:root` 覆盖来绕开现有的预设机制。

### 设置默认外观

使用现有主题时，可以在 `config.yml` 中设置：

```yaml
client:
  app:
    defaultColorScheme: system
    defaultTheme: compact
```

`defaultColorScheme` 支持 `light`、`dark` 和 `system`；`defaultTheme` 必须是已注册的预设 ID。生效顺序是：浏览器中保存的有效选择优先，其次是配置的默认值，最后是内置的回退值。注意，这里的 `default` 是宽松预设的 ID，并不是“自动选择默认主题”的特殊指令。

修改配置后，让服务端加载新配置并刷新页面。代码中需要读取或修改外观时，使用已有的 `useTheme()` 和 `useThemePreset()`，不要自行读写存储 key 或 `<html>` 上的属性。

## 验证结果

修改主题后，运行本示例的主题测试和类型检查：

```bash
pnpm exec vitest run tests/client/theme-tokens.test.ts tests/client/theme-preferences.test.ts tests/client/client-theme.test.tsx
pnpm exec tsc -p tsconfig.json --noEmit
```

然后在真实页面中检查浅色模式、深色模式以及修改过的主题预设，覆盖窄屏、键盘焦点、弹窗和错误状态。默认值和已保存的偏好要分别验证。类型检查和 CSS 编译都不能代替对实际阅读效果的检查。
