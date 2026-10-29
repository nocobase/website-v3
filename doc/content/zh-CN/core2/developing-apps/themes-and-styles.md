---
title: 主题与样式
description: 使用语义样式与主题变量，调整主题预设，并设置明暗模式和默认外观。
---

应用通过 `client/styles.css` 与 `client/theme/` 维护外观。业务组件使用 shadcn 基础组件和语义主题变量，让不同页面在浅色、深色模式下保持一致。主题名称的翻译见[多语言](localization.md)。

本篇以入门示例所用的默认模板 `1.0.0-beta.81` 为参照。明暗模式与主题预设是两项设置，各自的默认值与用户已经保存的个人选择需要区分。

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

主题变更后，运行本示例的主题测试与类型检查：

```bash
pnpm exec vitest run tests/client/theme-tokens.test.ts tests/client/theme-preferences.test.ts tests/client/client-theme.test.tsx
pnpm exec tsc -p tsconfig.json --noEmit
```

在真实页面中检查浅色、深色模式和修改过的主题预设，覆盖窄屏、键盘焦点、弹窗和错误状态。默认值与已保存偏好分别验证；类型检查和 CSS 编译不能替代实际阅读效果。
