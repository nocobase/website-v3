---
title: "エージェント"
description: "アプリに AI チャット、業務のスキル、マシン上のコーディングエージェントを追加します。セットアップの手順、主要なコード、検証のガイダンスを示します。"
---

`@nocobase/app-plugin-agents` は、AI チャット、モデルの設定、業務のスキル、マシン上のエージェントを提供します。業務のページの横にチャットを追加したり、エージェントにチームの文章のルールに従わせたり、マシン上のコーディングアシスタントを接続してタスクを実行させたりできます。

## 機能

| 機能 | プラグインが提供するもの | アプリがすべきこと |
| --- | --- | --- |
| モデルサービス | サービスの設定、モデルの一覧、接続のテスト | Models ページを追加し、サービスとキーを設定する |
| AI チャット | ストリーミングの返信、生成の停止、会話の履歴 | チャットのコンポーネントで画面を組み立てる |
| 業務のスキル | 指示、補助ファイル、インポート、バージョン | ルールをスキルに保ち、会話やタスクで選ぶ |
| 業務のツール | ツールの登録と実行 | 業務のツールや CLI のコマンドを組み込み、権限を確認する |
| マシン上のエージェント | マシンの接続、ツールとモデルの選択、実行の状態 | Runtimes と Machine agents のページと、タスクの入口を追加する |
| 使用量の管理 | 使用量と価格のページ | Usage をナビゲーションに追加する |

プラグインはページとコンポーネントを提供します。メニューとチャットをどこに表示するか、どの業務データにアクセスできるかはアプリが選びます。登録したあとも、これらの画面をアプリに追加する必要があります。

### エージェントを接続する 2 つの方法

| | モデル API | マシン上のエージェント |
| --- | --- | --- |
| 典型的なタスク | チャット、文章の下書き、ツールを使った業務操作 | コードの読み書き、ビルドとテストの実行 |
| 前提条件 | モデルサービスのエンドポイント、キー、モデル | インストールして認証済みのコーディングツールと、Runner の接続 |
| 実行 | NocoBase がモデルを呼び出し、選んだツールを実行する | 接続したマシンでコーディングツールが実行する |
| アクセスできるリソース | 選んだスキル、仮想ファイル、組み込んだ業務のツール | マシンとコーディングツールの方針で許可されたプロジェクト、ファイル、コマンド |

両方の方法を一緒に使えます。以下の最初の 2 つのシナリオはモデル API を使い、3 つ目はマシンを接続します。モデル API の会話では、ホストのソースコードに直接アクセスしたり、プロジェクトのテストを実行したりはできません。

## シナリオと例

[アプリを作成する](../../getting-started/create-app.md) から始めるか、最後にリンクした [完全なサンプル](https://github.com/nocobase/docs-examples-v3/tree/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide) を実行します。アプリの既存のデータベースの設定はそのままにし、モデルサービスの例には DeepSeek を使います。サンプルの画面は英語です。コマンドは `apps/agents-guide` で実行します。

**開発用のプロンプト** は、プロジェクトで作業するコーディングエージェントに送ります。**会話のプロンプト** は、アプリのチャットの画面で使います。以下のプロンプトは読者向けに簡略化しており、スクリーンショットは元の検証済みの会話のものです。最後の検証の範囲を参照してください。

### シナリオ 1：アプリに AI との会話を追加する

開発用のエージェントに、次の依頼を渡します。

```prompt
ページの右側に、ヘッダーのボタンから開く AI チャットのパネルを追加してください。モデルを選び、メッセージを送り、返信を止め、あとで会話を続けられるようにしてください。各自が自分のチャットだけを見られるようにしてください。
```

ページを組み込んだら、**Models → Add service** でサービスを追加します。この例では次を使います。

| フィールド | 値の例 |
| --- | --- |
| Provider type | `DeepSeek` |
| Name | `DeepSeek` |
| Base URL | `https://api.deepseek.com/v1` |
| API key | 自分のキー。認証情報のフィールドにだけ入力する |
| Model ID | `deepseek-flash`。元の検証時にサービスが返したもの |
| Model kind | `chat` |
| Enabled | オン |

**Fetch models** をクリックし、自分のアカウントで利用できる `chat` のモデルを選びます。`embedding` と `rerank` のモデルは会話には使えません。**Test connection** を実行し、成功したら保存します。サービスを開き直したとき、キーのフィールドを空にしておくと、保存済みのキーが保たれます。サービスの設定については [DeepSeek のドキュメント](https://api-docs.deepseek.com/en/) を参照してください。

![接続のテストに成功した DeepSeek の設定](/assets/core/agents/model-configuration.png)

![保存して有効にしたモデルサービス](/assets/core/agents/models.png)

ヘッダーの **Agent chat** をクリックし、モデルを選んでメッセージを試します。

```prompt
この機能の紹介を一文で書いてください：アプリの中で AI とチャットし、戻ってきたときに会話を続けられる。
```

![業務のページの横のチャットと、モデルの返信](/assets/core/agents/chat.png)

**完了の目安**：返信が届き、**Conversations** から会話を開き直しても履歴を読めること。

モデル API の会話には、**Machine agents** の項目は必要ありません。注文を照会したり承認を処理したりするには、関連する業務のツールと認可を組み込みます。

### シナリオ 2：業務のスキルを使ってリリースノートを生成する

チームの文章のルールを業務のスキルとして保存し、専用の会話で再利用します。開発の依頼は、たとえば次のとおりです。

```prompt
「Draft release notes」ボタンを追加してください。私が提供する変更点とテスト結果を、チームの形式で下書きにしてください。足りない詳細をでっち上げたり、直接公開したりしないでください。
```

この例の `release-notes` スキルは、スタイルガイドを読んでから、Summary、Changes、Verification のセクションを作ります。テスト結果が提供されなければ、`Verification not provided` と書きます。文章を下書きするだけで、プロジェクトのファイルを変更したり公開したりはしません。

1. [サンプルのスキルをダウンロード](/assets/core/downloads/release-notes-skill.zip) し、**Skills → Import** でインポートして、その slug が `release-notes` であることを確認します。
2. ページで、`SKILL.md` と補助ファイルの `references/style.md` を確認します。
3. ヘッダーのファイルのアイコン **Draft release notes** をクリックし、このスキルを使う会話を開きます。

![Skills のリリースノートのルールと補助ファイル](/assets/core/agents/skill.png)

この入口は、有効なサービスから最初の `chat` のモデルを選びます。送信の前に切り替えることもできます。クリックするたびに新しい会話が作られます。既存の下書きを続けるには **Conversations** を使います。通常の **Agent chat** の入口では、このスキルは自動では選ばれません。

新しい会話で次を試します。

```prompt
チームのルールで英語のリリースノートを書いてください。モデルの設定とチャットのパネルを追加し、Skills のメニューの項目がない問題を修正し、関連する 17 件のテストに合格しました。
```

これらの変更点とテストの件数は文章の材料です。プロジェクトの実際の結果に置き換えてください。文章をまとめることは、エージェントがテストを実行したことを意味しません。

![スキルを読んだあとに生成されたリリースノート](/assets/core/agents/skill-chat.png)

**完了の目安**：下書きがチームの形式に従い、提供した事実だけを含み、実際のツールの記録でスキルと補助ファイルが読まれたことを確認できること。

入口が開かない場合は、モデルが利用できるか、スキルの slug、サーバーの Provider の登録を確認してください。エラーのフィードバックと再試行のロジックは `client/components/release-notes-button.tsx` にあります。

### シナリオ 3：マシン上のコーディングアシスタントを呼び出す

PC やサーバー上のコーディングツールを接続すると、アプリからタスクを送り、進捗と結果を確認できます。開発用のプロンプト：

```prompt
私のマシン上のコーディングアシスタントを接続して、アプリから利用できるアシスタントを選び、タスクを送り、その進捗と結果を確認できるようにしてください。
```

**配布物を準備する。** このサンプルは、アプリの CLI と Runner の依存関係と設定をすでに宣言しています。サンプルのディレクトリで実行します。

```bash
pnpm nocobase cli build --universal
pnpm nocobase cli build --runner --universal
```

コマンドには npm へのアクセスが必要で、対象のマシンには Node.js 24 が必要です。配布物は `storage/runners/dist` に書き出されます。初回のセットアップ後にアプリを再起動します。これらのコマンドは、本番のアプリをビルドしません。

<details>
<summary>自分のアプリで CLI と Runner を準備する</summary>

Default テンプレートには、アプリ固有の CLI も、ダウンロードできる Runner もありません。まず次を行います。

- 互換性のある `@nocobase/app-cli-client` と `@nocobase/agent-runner` のバージョンをインストールします。
- `package.json` で `nocobase.cli.bin` を宣言します。この例では `agents-guide` を使います。
- `server/config/agents.ts` で `cli.name: 'agents-guide'` と `cli.package: { kind: 'served' }` を定義し、`server/config/index.ts` で登録します。CLI の名前は、パッケージ化した製品と一致している必要があります。

Runner の配布物がないと、接続のページからのインストールで 404 が返ります。アプリの CLI がないと、マシンがオンラインでもタスクが `cliUnavailable` で失敗することがあります。設定のセクションを登録する前に `agents.cli.name` を設定すると、`UNKNOWN_KEY` が返ります。

</details>

**マシンを接続する。**

1. 対象のマシンにコーディングツールをインストールしてサインインします。ツールが単独で動くことを確認します。
2. **Runtimes** で個人用または共有の接続を作成し、許可するコーディングツールを選びます。
3. ページのインストールと Runner の登録の手順に従います。ツール、サインイン、モデルの報告を待ちます。
4. **Machine agents** で、利用できるツールとモデルの組み合わせを追加して有効にします。マシンがオンラインでも、エージェントが有効になっているわけではありません。
5. **Agent chat → Switch to runner agents** を開き、エージェントを選びます。

![接続の目的とコーディングツールを選ぶ](/assets/core/agents/runner-connection.png)

![Codex が検出された、接続済みの個人用の Runner](/assets/core/agents/runner-online.png)

マシン上のエージェントは、**Models** のキーとは別に、コーディングツールのモデルの認証情報を使います。タスクが始まらない場合は、ツールのサインイン、モデルが利用できるか、エージェントの有効化、実行の枠、ローカルの方針を確認してください。

まずワークスペースについて尋ねます。

```prompt
今どの作業ディレクトリにいて、どんなファイルがありますか？見るだけで、何も変更しないでください。
```

![マシン上のエージェントが実行した実際のコマンドと結果](/assets/core/agents/runner-chat.png)

**完了の目安**：記録に実行したコマンド、作業ディレクトリ、出力が含まれ、実行が `completed` になっていること。

通常の Runner の会話には専用のワークスペースがあり、アプリのソースに自動で入ることはありません。業務のプロジェクトで作業するには、チャットで入力されたホストのパスを信頼するのではなく、サーバーが認可したプロジェクトのディレクトリをアプリが提供する必要があります。組み込んだら、小さなタスクを試します。

```prompt
このプロジェクトのチャットのボタンに、英語と中国語のツールチップのテキストを追加してください。ほかの動作は同じままにしてください。
```

プロジェクトのタスクでは、コードの差分とチェックの結果も確認します。この例で検証したのは会話のワークスペースでの読み取り専用の実行だけで、プロジェクトの編集やビルドは検証していません。

## 主な仕組みと実装

### ファイルと画面の関係

| ファイルまたはディレクトリ | 役割 |
| --- | --- |
| `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` | プラグインの 3 つの提供内容を登録する |
| `client/routes.ts` | Home、サインイン、システム設定を残したまま、管理ページを組み立てる |
| `client/extensions/nocobase-agent-chat/` | Registry からインストールしたチャットの画面のソース |
| `client/components/agents-provider.tsx` | 現在のアカウントのチャットの状態を管理する |
| `client/layouts/app-layout.tsx`、`client/layouts/components/header-actions.tsx` | チャットのパネルと入口をマウントする |
| `client/components/release-notes-button.tsx` | リリースノートの会話を作成し、繰り返しのクリック、再試行、アカウントの変更を扱う |
| `server/providers/agents.ts`、`server/providers/index.ts` | リリースノートの会話の設定を登録する |
| `examples/release-notes/` | 業務のスキルと補助ファイル |
| `package.json`、`server/config/agents.ts`、`server/config/index.ts` | アプリの CLI の名前と配布を設定する |
| `client/locales/`、`client/pages/settings/page-permission-titles.ts` | 英語と中国語の文言と、権限のラベル |
| `tests/client/` | ページ、ロケール、権限のラベル、業務の入口のテスト |

モデルの設定、インポートしたスキル、チャットの履歴は実行時のデータで、ソースの配布物には含まれません。サンプルを起動したら、モデルを設定してスキルをインポートしてください。

### プラグインと管理ページを登録する

ここで使う Default テンプレートには、すでに Agents の依存関係が含まれていますが、登録はされていません。これらのコマンドで登録し、データベースの変更をプレビューして適用します。

```bash
pnpm nocobase plugin register agents --dry-run --json
pnpm nocobase plugin register agents --json
pnpm nocobase db apply --dry-run --json
pnpm nocobase db apply --json
```

登録により、3 つのプラグインの一覧が更新されます。データベースのコマンドは、プラグインのマイグレーションとシードデータを適用します。一般的なインストールとアップグレードの手順については [プラグインを管理する](../../developing-apps/manage-plugins.md) を参照してください。

`client/routes.ts` で、管理ページをアプリに組み込みます。

| エクスポート | 既定のパス | 役割 |
| --- | --- | --- |
| `modelsRoute` | `/models` | モデルサービスと接続のテスト |
| `agentsRoute` | `/agents` | マシン上のコーディングツールとモデルの組み合わせ |
| `runtimesRoute` | `/runtimes` | マシンの接続 |
| `skillsRoute` | `/skills` | 業務のスキルとバージョン |
| `usageRoute` | `/usage` | 使用量と価格 |

たとえば、Models にメニューのラベルとアイコンを追加します。

```ts
import { BrainCircuit } from 'lucide-react';
import { modelsRoute } from '@nocobase/app-plugin-agents/client/routes';

// Use this entry inside the application's existing defineAppRoutes contribution.
const modelsPage = {
  ...modelsRoute,
  navigation: { title: 'agentDemo.models', icon: BrainCircuit },
};
```

`modelsRoute` を展開すると、そのページのコンポーネント、サインインの要件、認可、子ルートが保たれます。ほかのページも同じように組み立て、元の `appRoutes` と一緒にエクスポートします。`/main` などのデプロイの接頭辞はランタイムが扱うので、ページのパスには含めないでください。メニューがない場合は、ルートの登録とユーザーの権限を確認してください。Models は `settings:agents.services` の認可を使います。

### チャットのコンポーネントとアカウントの状態

このサンプルは、Registry からチャットの画面をインストールしています。

```bash
pnpm exec shadcn add @nocobase/agent-chat
```

> [!NOTE]
> インストール後に、依存関係の変更を確認してください。この例では、Registry が Agents を `0.1.0-beta.14` にダウングレードしたため、テンプレートと互換性のある `1.0.0-beta.29` に戻してスキルを同期する必要がありました。以下のコマンドはこの例のバージョンに当てはまるものです。自分のテンプレートとの互換性を確認してください。

```bash
pnpm add @nocobase/app-plugin-agents@1.0.0-beta.29 --save-exact
pnpm nocobase skills sync --dry-run --json
pnpm nocobase skills sync --json
```

プラグインの `client/chat` は会話の状態とフックを提供し、Registry のコンポーネントがそれを表示します。ほかのレイアウトのコンポーネントは下では省いています。

```tsx
<AgentsProvider>
  {/* Preserve the application's existing layout and route providers. */}
  <header><ChatHeaderButton /></header>
  <div className="relative flex min-h-0 flex-1">
    <main className="relative min-w-0 flex-1 overflow-hidden">
      <Outlet />
    </main>
    <ChatPanel />
  </div>
  <ChatFloatingButton />
</AgentsProvider>
```

`ChatPanel` は `main` の横に置かれます。ヘッダーとモバイルのボタンは会話の状態を共有します。

`AgentsProvider` はこのサンプルが所有するコンポーネントで、プラグインの `ChatProvider` を包んでいます。サインインしたユーザーの ID を React の `key` と `memoryScope` に使い、身元が変わるとクエリーのキャッシュとパネルの状態をクリアして、前のアカウントのチャットを再利用しないようにしています。サーバーも引き続き、会話の所有とアクセスを確認します。

### 業務の会話でスキルを選ぶ

プロジェクトの `.agents/skills/` にある開発用のスキルは、コーディングツールがプラグインを組み込むのを導きます。アプリの **Skills** ライブラリーにある業務のスキルは、実行時のタスクを導きます。両者が自動で同期されることはありません。

リリースノートのスキルには、`SKILL.md` と `references/style.md` が含まれます。インポート後、`server/providers/agents.ts` が名前付きのスコープでそれを選び、`server/providers/index.ts` が Provider を読み込みます。主要なコードは次のとおりです。

```ts
const agents = this.app.container.resolve(agentsToken);
agents.onlineAgent.configurator.registerOnlineAgentScope(
  'release-notes',
  async () => {
    const skill = (await agents.skills.list()).find(
      (item) => item.slug === 'release-notes',
    );
    if (!skill)
      throw new Error('Create the release-notes Skill before using this scope.');
    return {
      agentId: 'online',
      tool: ['bash', 'skill'],
      skill: [skill.id],
      systemPromptTemplate:
        'Help write release notes from the supplied facts. Use the release-notes Skill and its supporting style guide when the user requests release notes. Never claim an unperformed check succeeded.',
    };
  },
);
```

`agentsToken` はプラグインの公開のサービスの入口です。サーバーは、slug で 1 つのスキルと、それを読むのに必要な `skill` と `bash` のツールを選びます。`systemPromptTemplate` はリリースノートのルールを加えます。スコープは機能を選ぶもので、業務上の権限は付与しません。

`ReleaseNotesButton` は、認証済みのアプリの API クライアントを使い、次のボディを `POST /api/agents/conversations` に送ります。

```json
{
  "agentId": "online",
  "title": "Draft release notes",
  "config": { "scope": ["release-notes"] },
  "selectedModel": { "modelService": "deepseek", "model": "deepseek-flash" }
}
```

作成後、ボタンは `panel.openChat({ conversationId })` を呼び出して会話を開きます。`modelService` は設定済みのサービスを識別し、`model` はそのサービスで有効になっている必要があります。`release-notes` のスコープのない通常の会話では、このスキルは自動では選ばれません。

Skills ページの **Global attachment** は、以降の Runner のタスクにスキルをまとめて加えます。モデル API の会話のスキルは選ばないため、上のサーバーのスコープが必要です。

### 実行とツールへのアクセス

コードでは、`agentId: 'online'` は `native` という名前のモデル API のバックエンドを選びます。マシンのタスクは、特定のエージェントの ID と `runner` のバックエンドを使います。どちらも `agentsToken.onlineAgent` の会話のサービスを共有します。モデル API のバックエンドは、JSON Schema による構造化されたバックグラウンドの実行にも対応しています。Runner には独自のタスクのキューがあり、そのバックグラウンドのインターフェースには対応していません。

モデル API のバックエンドの仮想シェルは、`/skills` を読み、`/tmp` に書き込めます。ホストのファイルシステムにはアクセスできず、プロジェクトの Node、Python、ビルド、テストを直接実行することもできません。注文の照会などの業務操作には、サーバー側で身元、入力、データアクセスを確認する、登録されたツールか許可された CLI のコマンドが必要です。タスクにドキュメントの検索が必要な場合は、[ナレッジベース](knowledge.md) を追加します。

## AI 開発の制約と検証

### 組み込みの際に確認すること

開発用のエージェントは、インストールされた `.agents/skills/nocobase-app-plugin-agents/SKILL.md` と、タスクに関係するリファレンスを読むべきです。依存関係をインストールまたはアップグレードしたら、`pnpm nocobase skills sync` を実行し、公開のエクスポートと型を確認します。ガイダンスと実装が異なる場合は、インターフェースを確認してから使ってください。

| 確認すること | 確かめる動作 |
| --- | --- |
| ページの認可 | 組み立てたルートが認可を保ち、権限のないユーザーが API の直接のリクエストで回避できない |
| アカウントの切り替え | サインアウトや切り替えのあと、古いチャット、キャッシュ、保留中のリクエストが新しいアカウントに影響しない |
| 業務のスキル | 会話が意図したスキルを選び、ツールの記録でその指示と補助ファイルが読まれたことがわかる |
| 追加したツール | サーバーが身元、入力、操作の権限、データアクセスを検証する |
| マシンのタスク | 実行するマシンと認可されたディレクトリが正しく、コマンドの出力、差分、チェックの結果がこのタスクのものである |

Runner のアクセスはマシンとコーディングツールの方針に依存し、Runner 自体はファイルシステムのサンドボックスではありません。プロンプトとスキルは、コードレベルの認可や実行時の検証の代わりにはなりません。

### 組み込みを確認する

まず、よくある操作の確認を開発用のエージェントに依頼します。

```prompt
チャットの返信が動作し、開き直しても履歴が残っていることを確認してください。アカウントを切り替えたら、前の人のチャットから何か見えてしまいませんか？
```

業務のスキルやマシンのタスクを追加した場合は、上の表の該当する行も確認します。モデルの主張は、正しい設定、スキルの使用、コードの実行を証明しません。接続の状態、ツールの記録、実際の結果を確認してください。

サンプルのアプリのディレクトリで、関連する自動テストを実行します。

```bash
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/app-locale-coverage.test.ts tests/client/page-permission-titles.test.ts tests/client/release-notes-button.test.tsx
```

引き渡しの前に、プロジェクトのチェックに従って `pnpm check` を実行し、パッケージのチェック、lint、フォーマット、型、テスト、ビルドを網羅します。ケースと結果を確認してください。テストが見つからないまま正常終了しても、検証にはなりません。ほかの方法については [テストと検収](../../developing-apps/testing-and-acceptance.md) を参照してください。

### サンプルの検証の範囲

これらの結果は、2026-10-29 に、Default テンプレート `1.0.0-beta.84`、Agents `1.0.0-beta.29`、SQLite、DeepSeek `deepseek-flash`、Runner `0.1.0-beta.20`、Codex `0.165.0` を使って記録したものです。

| 検証したこと | 結果 |
| --- | --- |
| 型、範囲を限定した lint、フォーマット | クライアント、サーバー、ツールのチェックに合格 |
| ページと業務の入口 | 4 つのテストファイル、23 のケースに合格。ルート、ロケール、権限のラベル、作成と再試行、繰り返しのクリック、アカウントの変更を網羅 |
| モデルのチャット | 接続に成功し、実際の返信が届き、開き直しても履歴が残った |
| 業務のスキル | 元のツールの記録で、スキルと `references/style.md` が読まれたことを確認 |
| Runner | アプリの CLI を用意したあと、空の会話のワークスペースで `pwd` と `ls -A1` が実行され、実行が完了した |
| 匿名でのアクセス | モデルサービスと Skills の API が 401 を返した |

完全な `pnpm check`、本番のビルドとデプロイ、複数アカウントでのブラウザーの検収、ロールの全組み合わせ、業務の書き込み、添付ファイルの解析、プロジェクトの編集とビルドは未検証のままです。狭い画面とダークのページは限定的に確認しただけで、中国語の IME、言語とモバイルの全組み合わせ、モデルのストリーミングの停止も完全には検証していません。このガイドの簡略化したプロンプトは再実行しておらず、スクリーンショットと結果は元の会話のものです。

### サンプルのソース

- [完全なサンプル](https://github.com/nocobase/docs-examples-v3/tree/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide)：コミット `b91adc8` に固定され、3 つのシナリオの組み込みのコードを含みます。
- [セットアップと検証](https://github.com/nocobase/docs-examples-v3/blob/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide/README.md)：バージョン、インストール、起動、テスト、制限。
- [ソースの ZIP をダウンロード](/assets/core/downloads/agents-doc-demo.zip)：そのコミットに一致し、シークレット、実行時のデータ、依存関係を除いています。
