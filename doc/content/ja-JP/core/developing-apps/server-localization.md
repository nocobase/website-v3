---
title: サーバーの多言語化
description: サーバーのロケールリソースを設定し、リクエストと受信者の言語を選び、プラグインの文言を上書きし、ローカライズしたエラーメッセージを返します。
---

サーバーが生成するメール、通知、エクスポートは `server/locales/` を使います。これらのリソースは `client/locales/` とは独立して読み込まれるため、ページで使えるキーでも、サーバーで改めて宣言する必要があります。

以下のレポート準備完了の通知では、HTTP のレスポンスにはリクエストの言語を、バックグラウンドのメッセージには受信者の言語を使います。[サンプルアプリ](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization) はコマンドで実行します。[サンプルのソースとセットアップ](#サンプルのソースとセットアップ) を参照してください。実際のレポートにアクセスしたりメールを送ったりせずに、文言をレンダリングします。

## ロケールリソースを追加して読み込む

### 文言と補間のパラメーターを定義する

`server/locales/en-US.ts` の既存のオブジェクトに、ほかのキーと型のエクスポートは残したまま `reports` を追加します。あとで紹介するプラグインの上書きは、ここでは省略しています。

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  reports: {
    ready: 'Report {{name}} is ready.',
    subject: 'Your report: {{name}}',
    notReady: 'Report {{name}} is not ready yet.',
  },
};
export type AppServerResource = LocaleResource<typeof enUS>;
export default enUS;
```

`server/locales/zh-CN.ts` に、対応するキーを追加します。

```ts
import type { AppServerResource } from './en-US.js';

const zhCN = {
  reports: {
    ready: '报表 {{name}} 已准备好。',
    subject: '你的报表：{{name}}',
    notReady: '报表 {{name}} 尚未准备好。',
  },
} satisfies AppServerResource;
export default zhCN;
```

`LocaleResource` はキーの構造を確認しつつ、翻訳された文字列が異なることを許します。`{{name}}` は補間のパラメーターです。言語間で名前をそろえ、レポート名からキーを組み立てるのではなく、値として渡します。型チェックでは、レンダリングされた補間の結果は検証されません。

[ロケールリソースを見る](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/locales)。`pnpm demo request zh-CN` を実行すると中国語のメッセージに `Q3` が挿入され、`pnpm demo request en-US "Sales summary"` を実行すると `Report Sales summary is ready.` が返ります。

### 言語を登録し、既定を設定する

Default テンプレートの `server/locales/index.ts` は、すでにロケールのローダーを宣言しています。

```ts
import type { LocaleLoaders } from "@nocobase/i18n";
const locales: LocaleLoaders = {
  "en-US": () => import("./en-US.js"),
  "zh-CN": () => import("./zh-CN.js"),
};
export default locales;
```

`server/runtime.ts` は、`locales` でこの入口を接続します。新しい言語ごとに、リソースファイルとそのローダーの両方を追加します。プラグインの翻訳は、アプリが提供する言語の一覧には追加されません。クライアントとサーバーのリソースの一覧は別々に管理します。

アプリの `config.yml` で既定の言語を設定します。たとえば：

```yaml
i18n:
  defaultLocale: en-US
```

`APP_DEFAULT_LOCALE` を使うこともできます。[アプリの設定](configuration-and-settings.md) を参照してください。この既定は、どの設定も一致しない場合のフォールバックで、ユーザーが保存した選択を置き換えるものではありません。

サンプルの [アプリの入口](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/app.ts) は、`i18n.defaultLocale` を英語にし、実際の `I18nProvider` とロケールリソースを登録しています。`pnpm demo request fr-FR` を実行すると、アプリがフランス語を宣言していないため、レスポンスは英語になります。サンプルのプラグインは日本語のリソースを提供していますが、`pnpm demo request ja-JP` も英語にフォールバックします。

## HTTP のレスポンスを翻訳する

### 現在のリクエストの言語を使う

Default テンプレートの `server/app.ts` は、`i18nHttpMiddleware` の前にセッションのミドルウェアをマウントしています。後者はリクエストの言語を解決し、そのリソースの読み込みを待ちます。ルートでは、`getRequestTranslator(c)` でアプリの翻訳関数を、`getRequestLocale(c)` で解決された言語を取得します。

これは [report-messages.ts](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts) のレポートのプレビューのエンドポイントを単独にしたものです。`server/routes/` に保存し、[HTTP ルートと API](apis-and-services.md) の説明に従って `server/routes/index.ts` で登録します。

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import {
  apiErrorHandler, apiErrorResponses, apiValidator,
  dataResponse, defineApiRoutes, describeRoute,
} from '@nocobase/app-server/router';
import {
  getRequestLocale, getRequestTranslator,
} from '@nocobase/i18n/server';

export default defineApiRoutes(() => {
  const router = new Hono();
  router.onError(apiErrorHandler);
  router.get(
    '/report-message-preview',
    describeRoute({
      operationId: 'previewReportMessage',
      summary: 'Preview report wording',
      security: [],
      responses: {
        200: dataResponse(z.object({
          locale: z.string(), message: z.string(),
        })),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', z.strictObject({
      name: z.string().trim().min(1).max(80),
    })),
    (c) => c.json({
      data: {
        locale: getRequestLocale(c),
        message: getRequestTranslator(c)(
          'reports.ready', { name: c.req.valid('query').name },
        ),
      },
    }),
  );
  return router;
});
```

既存のアプリで、`Accept-Language: zh-CN` を付けて `<APP_BASE_PATH>/api/report-message-preview?name=Q3` をリクエストします。セッションの言語の上書きがなければ、レスポンスは次のようになります。

```json
{
  "data": {
    "locale": "zh-CN",
    "message": "报表 Q3 已准备好。"
  }
}
```

サンプルの `pnpm demo request zh-CN` コマンドは、ポートを開かずに `Application.fetch` でこのリクエストを送ります。この公開のエンドポイントは文言をプレビューするだけです。`security: []` は API を記述するものです。実際のレポートにアクセスするよう改造する前に、認証とデータの認可を追加してください。

### セッションの言語、リクエストヘッダー、既定

保存されたセッションの言語が優先されます。ない場合、ミドルウェアは `Accept-Language` の設定を優先順位の順に調べてサポートされている言語を探し、一致するものがなければ既定を使います。セッションにすでに保存されている、サポートされていない値はフォールバックで解決され、リクエストヘッダーで上書きされることはありません。

`pnpm demo session zh-CN` を実行します。[デモのスクリプト](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/scripts/demo.ts) は、まずサンプルのエンドポイントで実際のセッションに英語を保存し、次にその Cookie と中国語のヘッダーを付けてプレビューをリクエストします。結果は `locale: "en-US"` と `Report Q3 is ready.` のままです。その Cookie を付けない新しいリクエストでは中国語が使われます。

サンプルの `/demo-locale` エンドポイントは優先順位を示すためだけのもので、設定は現在のプロセス内にしかありません。既存のアプリでは、言語を選ぶ入口をそのまま残してください。[クライアントの多言語化](localization.md) を参照してください。

## バックグラウンドのメッセージを受信者の言語でレンダリングする

### ランタイムを注入して翻訳関数を結び付ける

バックグラウンドの処理には、現在の HTTP リクエストがありません。呼び出し元から受信者の言語の設定を受け取り、`i18nToken` でランタイムを注入して、その言語でレンダリングします。[report-message.ts](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/services/report-message.ts) でサービスを定義します。

```ts
import metadata from "../../package.json" with { type: "json" };
import type { I18nRuntime } from "@nocobase/i18n";
import { createServiceToken } from "@nocobase/service-provider";

export class ReportMessageService {
  constructor(private readonly i18n: I18nRuntime) {}

  async render(recipientLocale: string, name: string) {
    const locale = this.i18n.resolveLocale(recipientLocale);
    await this.i18n.ensureLocaleLoaded(locale);
    const t = this.i18n.getFixedT(metadata.name, locale);
    return {
      locale,
      subject: t("reports.subject", { name }),
      message: t("reports.ready", { name }),
    };
  }
}
export const reportMessageToken =
  createServiceToken<ReportMessageService>("report-message");
```

`resolveLocale()` は設定をサポートされている言語に解決し、`ensureLocaleLoaded()` はそのリソースを読み込み、`getFixedT()` は翻訳関数を名前空間と言語に結び付けます。この順序を守ってください。読み込まれていない文言は、黙って既定やキーにフォールバックすることがあります。名前空間はアプリの `package.json` の名前です。

[ReportMessageProvider](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/providers/report-message.ts) がランタイムを注入します。

```ts
import type { Application } from "@nocobase/app-server/application";
import { i18nToken } from "@nocobase/app-server/i18n";
import { ServiceProvider } from "@nocobase/service-provider";
import {
  ReportMessageService,
  reportMessageToken,
} from "../services/report-message.js";

export default class ReportMessageProvider extends ServiceProvider<Application> {
  readonly name = "report-message";
  override register() {
    this.app.container.singleton(
      reportMessageToken,
      (container) => new ReportMessageService(container.resolve(i18nToken)),
    );
  }
}
```

既存のアプリの `server/providers/index.ts` に、ほかの Provider を残したままこの Provider を追加します。`server/services/` ディレクトリはコードを整理するだけで、サービスを自動で登録するわけではありません。サンプルの [アプリの入口](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/app.ts) では、すでに Provider が登録されています。

`pnpm demo background zh-CN` を実行します。このコマンドはコンテナからサービスを解決し、HTTP のコンテキストなしで次の出力を生成します。

```json
{
  "locale": "zh-CN",
  "subject": "你的报表：Q3",
  "message": "报表 Q3 已准备好。"
}
```

### 異なる言語を並行してレンダリングする

アプリの起動後、バックグラウンドジョブやコマンドは、並行する受信者にこのサービスを再利用できます。この呼び出し方は [デモのスクリプト](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/scripts/demo.ts) に沿っています。

```ts
import { reportMessageToken } from './server/services/report-message.js';

// app has completed app.start().
const service = app.container.resolve(reportMessageToken);
const messages = await Promise.all([
  service.render('en-US', 'Q3'),
  service.render('zh-CN', 'Q3'),
  service.render('fr-FR', 'Q3'),
]);
```

`pnpm demo concurrent` を実行します。3 つのメッセージは `Report Q3 is ready.`、`报表 Q3 已准备好。`、`Report Q3 is ready.` で、解決された言語はそれぞれ `en-US`、`zh-CN`、`en-US` です。

各呼び出しは、共有のランタイムで `changeLanguage()` を呼び出さずに、受信者の言語を明示的に結び付けます。そのため、タスクと HTTP リクエストがグローバルな現在の言語を奪い合うことはありません。開始したユーザーの言語を全員に適用するのではなく、業務データから各受信者の言語の設定を取得してください。

## プラグインのサーバーの文言を上書きする

アプリのロケールオブジェクトの `overrides` キーの下に、プラグインの完全なパッケージ名を使います。たとえば、英語のリソースに次を追加します。

```ts
// Inside the default export of server/locales/en-US.ts:
overrides: {
  '@example/report-delivery': {
    delivery: {
      ready: 'Your report {{name}} is available in the customer portal.',
    },
  },
},
```

中国語のリソースの同じ場所には、`ready: '报表 {{name}} 已可在客户门户中查看。'` を追加します。アプリの上書きは、プラグインのリソースのあとに適用されます。上書きしないキーはプラグインの文言のままで、プラグインのファイルや `node_modules/` を変更する必要はありません。

リクエストのハンドラーでは、プラグインの名前空間を明示的に指定します。Hono はファイルの場所から名前空間を推測しません。

```ts
const t = getRequestTranslator(c, '@example/report-delivery');
return c.json({ data: {
  locale: getRequestLocale(c),
  message: t('delivery.ready', { name: c.req.valid('query').name }),
  channel: t('delivery.channel'),
} });
```

`pnpm demo override zh-CN` を実行すると、メッセージは `报表 Q3 已可在客户门户中查看。` になり、上書きしていない `delivery.channel` はプラグインの `客户门户` のままです。

[サンプルのプラグインのリソース](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/report-delivery.ts)、[アプリの上書き](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/locales)、[リクエストのハンドラー](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts) が、これを一緒に実装しています。`@example/report-delivery` は組み込みのリソースプラグインです。自分のアプリでは、実際のプラグインのパッケージ名とキーに置き換えてください。プラグインでの宣言については [プラグインのサーバーの多言語化](../extension-development/server-localization.md) を参照してください。

## ユーザー向けのエラーメッセージを返す

API エラーの `reason`、`domain`、HTTP ステータスは固定にし、`message` には開発者向けの英語の説明を残します。サーバーがユーザー向けのテキストを提供する場合は、解決された言語と翻訳を `localizedMessage` に入れます。

この抜粋は [レポート未準備のハンドラー](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts) から取ったもので、プレビューと同じクエリーの検証と `apiErrorHandler` を使っています。

```ts
import { ApiError } from '@nocobase/app-server/router';
import {
  getRequestLocale, getRequestTranslator,
} from '@nocobase/i18n/server';

// Inside the validated /report-not-ready handler:
throw new ApiError({
  status: 'FAILED_PRECONDITION',
  reason: 'REPORT_NOT_READY',
  domain: 'reports',
  message: 'The requested report is not ready.',
  localizedMessage: {
    locale: getRequestLocale(c)!,
    message: getRequestTranslator(c)(
      'reports.notReady', { name: c.req.valid('query').name },
    ),
  },
});
```

`pnpm demo error zh-CN` を実行して、わざとレポート未準備の状態を起こします。HTTP 400、`reason: "REPORT_NOT_READY"`、`domain: "reports"` と、次の `localizedMessage` が返ります。

```json
{
  "locale": "zh-CN",
  "message": "报表 Q3 尚未准备好。"
}
```

英語のリクエストでは、ユーザー向けの言語だけが変わります。コードは翻訳を比較するのではなく、引き続き固定の識別子で分岐します。クライアントがエラーの識別子を自分で翻訳することもできます。[リクエストの検証とエラー処理](request-validation-and-errors.md) を参照してください。

## 翻訳とフォールバックを検証する

完全なテンプレートのアプリでは、`pnpm nocobase locales check` はクライアントとサーバーのファイルが宣言している言語を比較します。ローダー、翻訳キー、補間の結果は確認しません。`pnpm typecheck` は、リソースの型でキーの構造を確認します。サンプルにはテンプレートの CLI がインストールされていないため、そこでは `pnpm typecheck` と `pnpm test` を使います。

実行時のチェックには、実際のリソースとミドルウェアを使う必要があります。[サンプルのテスト](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/tests/localization.test.ts) は、英語と中国語の補間、ヘッダーの優先順位、セッションの分離、既定の言語へのフォールバック、プラグインの上書き、並行するリクエストとバックグラウンドのメッセージを網羅しています。ミドルウェアがない場合の明示的なエラー、無効な入力、言語をまたいで固定の業務エラーの識別子も確認します。

サポートされていない言語と、キーがないことは別のケースです。前者はアプリの既定に解決されます。後者は既定と英語のリソースを試し、どちらにもなければキーを返すことがあります。分離したテストでは、不完全なリソースを使って翻訳の欠落を再現しています。通常のアプリでは、すべての言語のキーを用意すべきです。

## サンプルのソースとセットアップ

[完全なソースと README](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization) には、バージョンの要件、使い方とソースの対応、コマンドの期待される出力が記載されています。サンプルは Node.js 24、pnpm 11.11.0、App Server `3.0.0-beta.5`、I18n `2.0.0-beta.1` を使い、Default テンプレート `1.0.0-beta.85` の依存関係のバージョンに合わせています。

```sh
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 44cc65d121ea8cebf26fee77c924119cc57f4aad
cd apps/server-localization
npm pkg set packageManager=pnpm@11.11.0
pnpm install --frozen-lockfile
pnpm demo request zh-CN
pnpm test
```

この最小限のサンプルは、NocoBase の Application と Provider を直接組み合わせたもので、完全な Default テンプレートではありません。コマンドは同じプロセス内でリクエストやサービスの呼び出しを送り、終わるとアプリを終了します。ブラウザー、データベース、メールサービスは不要です。既存のアプリにコードを取り込むときは、そのランタイム、設定、ミドルウェアを残し、ロケールリソース、ルート、Provider の登録だけをマージしてください。
