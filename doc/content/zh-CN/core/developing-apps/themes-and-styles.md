---
title: 主题与样式
description: 使用语义样式编写组件，定制主题预设，通过 Hook 切换外观，并配置新用户的默认主题。
---

业务界面沿用应用已有的 shadcn 组件和语义主题变量。颜色、间距、字体和圆角在主题文件中调整，列表、表单、弹窗便能一起适配外观变化。NocoBase UI Library 的组件和业务区块也遵循这套组件约定。

商品目录示例基于默认模板 `1.0.0-beta.85`，包含商品列表、编辑弹窗和三种主题预设。商品编辑仅保存在内存中，刷新即复原；外观偏好使用模板的浏览器存储机制。可先[运行示例](#示例源码与运行)，再逐项操作。

## 明暗模式与主题预设

外观包含两项独立设置：

- **明暗模式**：`light`、`dark` 或 `system`，决定使用浅色还是深色规则。`system` 跟随操作系统。
- **主题预设**：决定配色、字体、密度、圆角和阴影。一个预设同时支持浅色和深色，切换预设不会改变明暗模式。

模板内置 `compact`（紧凑）和 `default`（宽松）。`default` 是预设 ID，不是“自动采用默认主题”的指令。示例另外注册了 `brand`（品牌）。

这些文件属于应用模板，可在自己的应用内维护：

| 文件 | 用途 |
| --- | --- |
| `client/theme/themes/*.css` | 各预设的变量和明暗规则 |
| `client/styles.css` | 导入预设，并将变量连接到 Tailwind 类名 |
| `client/theme/theme-presets.ts` | 注册预设 ID 和名称的翻译 key |
| `client/theme/theme-provider.tsx` | 管理主题状态、保存选择并同步标签页 |

已有 `AppThemeProvider` 在应用根部注册。业务组件使用它提供的状态，不需要新增 Provider，也不需要重新执行 `shadcn init`。

## 使用主题变量编写组件

### 颜色与交互状态

使用表示用途的类名，而不是固定颜色。例如，商品目录的面板使用 `bg-card text-card-foreground`，辅助文字使用 `text-muted-foreground`：

```tsx
// client/pages/products/index.tsx，组件内的面板结构
<section className='overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm'>
  <div className='flex flex-col gap-2 border-b border-border p-6'>
    <h2 className='font-heading text-lg font-semibold'>{t('products.inventory')}</h2>
    <p className='text-sm text-muted-foreground'>{t('products.editHint')}</p>
  </div>
  <DataTable columns={columns} data={products} pagination={false} getRowId={(product) => product.id} />
</section>
```

`DataTable` 是应用已有的表格组件，`columns` 和 `products` 来自该页面。完整导入、列定义和数据见[商品页源码](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/pages/products/index.tsx)。

常用颜色按用途成对选择：

| 用途 | 类名 |
| --- | --- |
| 页面 | `bg-background text-foreground` |
| 卡片、面板 | `bg-card text-card-foreground` |
| 浮层 | `bg-popover text-popover-foreground` |
| 主要操作 | `bg-primary text-primary-foreground` |
| 辅助说明 | `text-muted-foreground` |
| 分隔线、错误文字 | `border-border`、`text-destructive` |

按钮、输入框和弹窗优先复用已有组件，它们已处理悬停、焦点和禁用状态。表单校验失败时设置 `aria-invalid`，同时显示文字错误，不能只改变颜色。商品编辑表单的实现见[表单源码](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/pages/products/edit.tsx)。

在示例页选择 **Light → Compact**，可看到面板、表格和状态标签；再选择 **Dark**，相同组件便使用深色变量。

![紧凑预设下的商品列表与语义颜色](/assets/core/themes-and-styles/compact-light.png)

### 间距、圆角与字体

尺寸同样使用主题类。上面的 `p-6` 读取 `--spacing`，`rounded-lg` 读取 `--radius`，`shadow-sm` 读取 `--shadow-sm`。`font-heading` 用于标题，`font-sans` 用于正文，`font-mono` 用于代码或 SKU。

```tsx
// client/pages/products/index.tsx，SKU 列的内容
<code className='text-sm text-muted-foreground'>{row.original.sku}</code>
```

`text-sm` 同时使用字号与行高变量。只修改字号而保留不合适的固定高度，可能使输入框或按钮裁切文字；调整密度后应一起检查这些组件。

选择 **Spacious**，商品表格与面板间距会增大，颜色保持一致。选择 **Brand**，还可以看到衬线标题与更大的圆角，效果见[品牌预设](#添加品牌预设)。

![宽松预设下的商品列表](/assets/core/themes-and-styles/default-light.png)

## 定制主题预设

### 修改现有预设

直接修改对应 CSS 文件。示例把 `compact.css` 的 `--spacing` 从模板的 `0.225rem` 调整为 `0.21rem`：

```css
/* client/theme/themes/compact.css，已有规则中的变量 */
:root[data-theme='compact'],
.theme-preview[data-theme='compact'] {
  /* 保留其余变量 */
  --spacing: 0.21rem;
}
```

选择 **Compact** 后，商品面板、按钮与表格都会收紧，效果见[紧凑预设截图](#颜色与交互状态)。`.theme-preview` 让外观选择器中的缩略图采用同一组变量。

模板的紧凑与宽松预设共享配色、字体和阴影，只在密度上不同。若改变它们共同使用的主色或字体，应同步修改两个文件；需要保留一套不同外观时，增加独立预设。保持已有 ID 不变，浏览器偏好和配置都通过 ID 引用预设。

[查看紧凑预设源码](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/theme/themes/compact.css)

### 添加品牌预设

从完整预设复制一份 `client/theme/themes/brand.css`，将选择器中的 ID 改为 `brand`。保留全部颜色和非颜色变量，再修改所需值。下面只摘录品牌预设中调整的部分，完整文件见[品牌预设源码](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/theme/themes/brand.css)：

```css
/* client/theme/themes/brand.css，节选 */
:root[data-theme='brand'],
.theme-preview[data-theme='brand'] {
  /* 其余变量从完整预设保留 */
  --font-heading: var(--font-serif);
  --spacing: 0.25rem;
  --radius: 0.75rem;
  --primary: #0f766e;
  --primary-foreground: rgb(255 255 255);
  --accent: #f0fdfa;
  --accent-foreground: #115e59;
  --ring: var(--primary);
}

:root.dark[data-theme='brand'],
:root.dark .theme-preview[data-theme='brand'] {
  /* 保留完整的深色颜色变量 */
  --primary: #5eead4;
  --primary-foreground: #042f2e;
  --accent: #134e4a;
  --accent-foreground: #99f6e4;
  --ring: var(--primary);
}
```

变量值是完整 CSS 颜色，可以使用 HEX、RGB 或 OKLCH，无需再包一层 `hsl()`。背景与文字一起调整，浅色、深色和预览选择器都要覆盖。新预设不要带裸 `:root` 或 `:root.dark` 规则，以免覆盖其他预设的回退值。

接着完成三处接入：

1. 在 `client/styles.css` 的现有预设后导入新文件，保持 `default.css` 最先导入。

   ```css
   @import './theme/themes/default.css';
   @import './theme/themes/compact.css';
   @import './theme/themes/brand.css';
   ```

2. 在 `client/theme/theme-presets.ts` 追加注册项，保留 `compact` 在首位。

   ```ts
   export const themePresets = [
     { id: 'compact', labelKey: 'appearance.themes.compact' },
     { id: 'default', labelKey: 'appearance.themes.default' },
     { id: 'brand', labelKey: 'appearance.themes.brand' },
   ] as const;

   export type ThemePresetId = (typeof themePresets)[number]['id'];
   ```

3. 在应用语言文件中扩展名称，保留已有翻译。英文如下，中文文件以相同方式扩展 `systemZhCN.appearance`，添加 `brand: '品牌'`；详见[多语言](localization.md)。

   ```ts
   // client/locales/en-US.ts，enUS 对象中的字段
   appearance: {
     ...systemEnUS.appearance,
     themes: { ...systemEnUS.appearance.themes, brand: 'Brand' },
   },
   ```

[样式入口](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/styles.css)、[预设注册](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/theme/theme-presets.ts)和[翻译源码](https://github.com/nocobase/docs-examples-v3/tree/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/locales)包含完整实现。

外观面板会自动列出新预设，不需要修改面板组件。在商品页选择 **Brand**，再分别选择 **Light** 和 **Dark**，按钮主色、标题字体和圆角一起变化。

![品牌预设的浅色模式](/assets/core/themes-and-styles/brand-light.png)

![品牌预设的深色模式](/assets/core/themes-and-styles/brand-dark.png)

## 读取与切换外观

### 切换明暗模式

从 `next-themes` 导入 `useTheme()`。`theme` 是用户选择的 `light`、`dark` 或 `system`，`resolvedTheme` 是当前实际应用的浅色或深色模式，`setTheme()` 用于切换。

```tsx
// client/pages/products/appearance-controls.tsx，ColorModeControls 节选
import { useTheme } from 'next-themes';
import { Button } from '#components/ui/button';

// 在组件内，t 来自 useTranslation()
const { theme, resolvedTheme, setTheme } = useTheme();

// 渲染模式选择按钮
{(['light', 'dark', 'system'] as const).map((mode) => (
  <Button
    key={mode}
    variant={theme === mode ? 'default' : 'outline'}
    aria-pressed={theme === mode}
    onClick={() => setTheme(mode)}
  >
    {t(`appearance.${mode}`)}
  </Button>
))}
```

选择 **System** 后，页面上的 **Applied mode** 显示 `resolvedTheme`。改变操作系统的明暗设置，实际模式跟随变化，**System** 按钮仍保持选中。不要用 `theme === 'dark'` 判断系统模式下的实际颜色。

![系统模式下显示实际应用的浅色外观](/assets/core/themes-and-styles/system-light.png)

[查看模式切换组件源码](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/pages/products/appearance-controls.tsx)

### 切换主题预设

`useThemePreset()` 是应用模板提供的 Hook，返回当前 `preset` 和切换函数 `setPreset()`。示例从注册表生成按钮，ID 的类型随注册项自动更新：

```tsx
// client/pages/products/appearance-controls.tsx，PresetControls 节选
import { useThemePreset } from '../../theme/theme-context.js';
import { themePresets } from '../../theme/theme-presets.js';

// 在组件内，Button 和 t 与上一例相同
const { preset, setPreset } = useThemePreset();

{themePresets.map(({ id, labelKey }) => (
  <Button
    key={id}
    variant={preset === id ? 'default' : 'outline'}
    aria-pressed={preset === id}
    onClick={() => setPreset(id)}
  >
    {t(labelKey)}
  </Button>
))}
```

两个 Hook 都在已有 `AppThemeProvider` 内使用。不要在业务组件中自行读写存储 key、修改 `<html>` 属性，或再用组件状态保存一份外观选择。

在商品页切换预设后，打开右上角 **Appearance**，可以看到对应预设及缩略图已选中。通过该面板切换时，页面按钮也会同步；刷新页面或打开同一应用的另一标签页，选择仍然保留。

![外观面板显示品牌预设和深色缩略图](/assets/core/themes-and-styles/appearance-preview.png)

[查看预设切换组件源码](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/pages/products/appearance-controls.tsx)

## 设置默认外观

### 配置默认模式与预设

在应用根目录执行以下命令，让未保存偏好的浏览器默认使用品牌深色外观：

```bash
pnpm nocobase config set client.app.defaultColorScheme=dark client.app.defaultTheme=brand --json
```

它在 `config.yml` 中设置：

```yaml
client:
  app:
    defaultColorScheme: dark
    defaultTheme: brand
```

`defaultColorScheme` 支持 `light`、`dark`、`system`；`defaultTheme` 必须是已注册的预设 ID。开发模式会在配置变更后重启服务端；其他运行方式需要重启服务端，再刷新页面。不要改 `AppThemeProvider` 的 `defaultTheme` 属性来替代配置，否则启动阶段与 React 挂载后可能使用不同默认值。

用新的无痕窗口打开商品页，应看到 **Dark** 和 **Brand** 选中。这是默认值生效，不代表用户已经保存过选择。

![未保存偏好的浏览器使用配置中的品牌深色默认值](/assets/core/themes-and-styles/configured-defaults.png)

恢复示例初始配置：

```bash
pnpm nocobase config set client.app.defaultColorScheme=system client.app.defaultTheme=compact --json
```

[查看配置样例](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/config.example.yml)

### 默认值与已保存偏好的优先级

两项设置分别取第一个有效来源：浏览器已保存的选择、`config.yml` 默认值、内置回退值。明暗模式的内置回退是 `system`，预设的回退是注册表第一项，示例中为 `compact`。无效模式或未注册的预设 ID 会被忽略。

验证时，在一个窗口主动选择 **Light → Spacious**，再将配置默认值改为 **Dark → Brand**：原窗口刷新后仍为浅色宽松，新无痕窗口使用品牌深色。仅保存过明暗模式时，预设仍可采用配置默认值，反之亦然。

偏好按浏览器来源和应用部署路径隔离，不随登录账号在设备间同步。存储不可用时，切换仍可在当前页面生效，但不能保证刷新后保留。

[查看偏好解析源码](https://github.com/nocobase/docs-examples-v3/blob/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles/client/theme/theme-preferences.ts)

## 检查主题效果

每次修改预设后，在浅色、深色和窄屏下检查实际页面，特别是正文、辅助说明、主要按钮、键盘焦点和弹窗。颜色成对检查对比度；CSS 编译通过不能证明文字可读。

商品页中点击 **Arc desk lamp**，清空商品名称，将价格填为 `-1`，点击 **Save**。弹窗应保留输入并显示两处错误，焦点回到商品名称。修正后保存，列表更新；刷新后恢复示例数据。按 Escape 取消时，焦点回到打开弹窗的商品链接。

![浅色品牌预设中的表单错误与焦点](/assets/core/themes-and-styles/brand-error-light.png)

![深色品牌预设中的表单错误与焦点](/assets/core/themes-and-styles/brand-error-dark.png)

窄屏下外观控制区上下排列，宽表格在自身区域内横向滚动，不应撑宽整个页面。

在示例 App 根目录运行主题与页面测试、类型检查：

```bash
pnpm exec vitest run tests/client/theme-tokens.test.ts tests/client/theme-preferences.test.ts tests/client/client-theme.test.tsx tests/client/app-locale-coverage.test.ts tests/client/products.test.tsx
pnpm exec tsc -p tsconfig.json --noEmit
```

这些测试覆盖变量完整性、偏好回退、切换和表单交互。浏览器验证命令见示例 README；截图和自动化断言仍需配合实际阅读效果检查。

## 示例源码与运行

[完整示例与 README](https://github.com/nocobase/docs-examples-v3/tree/b0f1701944a1243b5939c88c4486966db9c09e61/apps/themes-and-styles)使用 Node.js 24 或更高版本、pnpm 11，依赖锁定在提交中的 `pnpm-lock.yaml`。在独立目录获取源码：

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout b0f1701944a1243b5939c88c4486966db9c09e61
cd apps/themes-and-styles
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite --json
pnpm nocobase config check --json
pnpm dev
```

在启动输出的应用地址后追加 `products`，例如应用地址以 `/main/` 结束时，打开 `/main/products`。演示页无需登录。SQLite 用于启动这个独立示例；主题功能不依赖某种数据库，也不需要外部服务。已有应用沿用自身配置，无需重新初始化。

README 提供用法与源码的对应关系、浏览器检查命令，以及实际验证范围。商品目录使用固定英文演示数据，不连接商品 API。
