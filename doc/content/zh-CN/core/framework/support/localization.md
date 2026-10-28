---
title: 多语言机制
---

`@nocobase/i18n` 提供命名空间、资源加载、语言解析和前后端翻译绑定。语言选择器、切换接口和用户偏好由多语言插件提供；没有该插件仍可使用翻译机制。

## 资源与注册

每个包使用自己的包名作为命名空间。应用与插件分别组织 `client/locales/` 和 `server/locales/`，资源文件导出翻译对象，聚合入口按语言提供 loader：

```ts
// client/locales/index.ts or server/locales/index.ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

应用通过运行时注册这些资源，插件在 `defineClientPlugin()`、`defineServerPlugin()` 中声明 `locales`。以上仅展示两种语言的加载方式，实际资源应覆盖模块约定支持的全部语言。可从英文资源用 `LocaleResource` 推导其他语言的完整键结构。

应用自己的 loader 列表决定可用语言；安装一个包含日文翻译的插件不会自动给应用增加日文选项。`i18n.defaultLocale` 只指定默认语言，不是全部语言列表。

## 翻译和回退

组件用 `@nocobase/i18n/client` 的 `useTranslation()`。默认命名空间随渲染树的 scope，插件导出的组件如果由应用直接渲染，应显式指定插件命名空间，或用 `withNamespace()` 包装。

键按“当前命名空间 → 应用命名空间 → 基础命名空间”回退；语言按“当前语言 → 应用默认语言 → en-US”回退。缺失翻译可能显示回退文本或键本身，不能据此认为资源完整。

应用可覆盖插件文案：

```ts
// client/locales/zh-CN.ts
export default {
  save: '保存',
  overrides: {
    '@nocobase/app-plugin-scheduler': {
      nav: { schedules: '计划任务' },
    },
  },
};
```

覆盖在所有命名空间注册后应用，无需修改插件源码。

## 服务端和后台任务

`i18nHttpMiddleware` 应在会话中间件之后运行，语言依次取自会话偏好、`Accept-Language` 和默认语言，并匹配应用可用语言。路由用 `getRequestTranslator()` 取得已加载的翻译器。

后台任务没有请求语言：先 `ensureLocaleLoaded(locale)`，再 `getFixedT(namespace, locale)`。邮件和通知使用接收人的语言。API 的错误分支使用稳定错误码，多语言消息只负责展示。

应用可运行 `pnpm nocobase locales check`；组件测试使用 `@nocobase/i18n/testing` 的真实资源和严格翻译检查，避免 mock 掩盖错误键或命名空间。插件的资源组织见[插件多语言](../../extension-development/localization.md)。

## 接口与实现

- [Localization contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/i18n/README.md)
