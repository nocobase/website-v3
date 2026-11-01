---
title: コンポーネントとスタイル
description: プラグインのコンポーネントを整理し、ホストのスタイルとテーマに組み込み、コンポーネントを公開して、必要に応じて UI のソースアセットを配布します。
---

アプリやプラグインを開発するとき、フロントエンドのコンポーネントは自由に書き、整理できます。制約は 1 つだけで、**UI のプリミティブには shadcn を使います**。モジュール化された画面を組み立てるときは、まず [NocoBase UI Library](https://ui.nocobase.com/) のコンポーネントとブロックを参照してください。

NocoBase UI Library は、NocoBase の UI のソースアセットのライブラリーです。shadcn の UI Registry を使って、エージェントが取得、変更、組み合わせできるコンポーネントとブロックを配布しています。そのサイトには、コンポーネントの例とインストールの手順があります。

追加のコンポーネントやブロックを、**エージェントが取得、変更、組み合わせできるソースアセットとして公開したい**場合は、shadcn の UI Registry で配布します。公開するかどうかは、ソースをどう届けたいかによります。プラグインの中でコンポーネントを再利用する場合や、公開のパッケージの入口で公開する場合は、Registry は必要ありません。

この記事では、[最初のプラグインを書く](write-your-first-plugin.md) のお知らせの例を続けます。リストのコンポーネントを作ってページにつなぎ、必要に応じて独立したソースアセットとしてパッケージ化し、ローカルのパスで別のアプリやプラグインにインストールします。マシンをまたいで配布する必要がある場合は、既存の静的なホスティングを使います。

## エージェントを使う場合

既存のお知らせのプラグインに対して、次のように作業を説明します。

```prompt
お知らせのプラグインのリストを、独立したコンポーネントに切り出してください。
shadcn のプリミティブを使い、まず https://ui.nocobase.com/ の NocoBase UI Library のコンポーネントとブロックを参照してください。
お知らせのデータと、空のときのテキストをリストに渡してください。データの読み込みとエラー処理はページに残してください。
ルート、ナビゲーション、翻訳は保ち、データのあるリストと空のリスト、プラグインのビルドを確認してください。
```

以下は手動の手順です。**特に記載がない限り、コマンドはアプリのルートで実行します。コンポーネントの開発のセクションのパスは `packages/app-plugin-announcements/` からの相対パスです。ソースの配布のセクションでは、独立した Registry のパッケージの中のパスを示します。**

## コンポーネントを整理する

動作するお知らせのプラグインから始めます。そのページ、API、翻訳、登録については [最初のプラグインを書く](write-your-first-plugin.md) で扱っています。`client/components/announcement-list.tsx` を追加します。

```tree
packages/app-plugin-announcements/
├── client/
│   ├── components/
│   │   ├── ui/                      # shadcn のプリミティブ
│   │   └── announcement-list.tsx    # お知らせのリスト
│   ├── pages/
│   │   └── announcements.tsx        # データを読み込み、コンポーネントを組み立てる
│   ├── locales/                     # ページの翻訳
│   └── styles.css                   # shadcn のスタイルシートの設定
├── components.json                 # shadcn の設定
└── package.json                     # 依存関係、エイリアス、公開の入口
```

これは整理の方法の一例です。必要に応じて、領域ごとのディレクトリを追加したり、Hooks を切り出したり、コンポーネントの境界を変えたりしてください。その際はインポートとビルドの設定をそろえます。

## shadcn と NocoBase UI Library を使う

この例で使う shadcn の Card をインストールします。

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add card
```

作成のツールは、Client のコードを持つプラグインに `components.json`、スタイルシートの入口、パッケージ内のエイリアスを生成します。コマンドは選んだプラグインで実行されるため、そのプラグインの `client/components/ui/` に書き込まれます。ファイルがすでにある場合は差分を確認し、自分の変更を保ってください。

ページのコンテナ、ヘッダー、そのほかの業務のコンポーネントについては、まず [NocoBase UI Library](https://ui.nocobase.com/) を参照してください。たとえば、最初のプラグインのチュートリアルでは次をインストールします。

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

ファイルがすでにある場合は、このインストールを繰り返さないでください。`components.json` の `@nocobase` のエントリーは、NocoBase UI Library のソースの配布のエンドポイントを指しています。このエントリーがない古いプラグインでは、既存の `registries` の設定に次をマージします。

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

インストール後に `package.json` を確認します。プラグインの規約に従って Client の実行時の依存関係を `peerDependencies` として宣言し、適切なバージョンの範囲を保って、`pnpm install` を実行します。サーバーが引き続き直接インポートする依存関係は、適切なセクションに残します。パッケージのエイリアスと公開時の対応付けについては [プラグインの構成](plugin-structure.md#ui-コンポーネントとソースの所有) で扱っています。

## コンポーネントを書いて使う

### お知らせのリストを実装する

`client/components/announcement-list.tsx` を追加します。

```tsx
import type { ReactElement } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#components/ui/card';

export interface AnnouncementListItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
}

export interface AnnouncementListProps {
  readonly items: readonly AnnouncementListItem[];
  readonly emptyMessage: string;
}

export function AnnouncementList({
  items,
  emptyMessage,
}: AnnouncementListProps): ReactElement {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul className='grid gap-4'>
      {items.map((item) => (
        <li key={item.id}>
          <Card>
            <CardHeader>
              <CardTitle><h2>{item.title}</h2></CardTitle>
            </CardHeader>
            <CardContent>
              <p className='whitespace-pre-wrap text-muted-foreground'>
                {item.content}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
```

このコンポーネントはデータとテキストを受け取るため、ページで組み合わせることも、ソースアセットとして独立してインストールすることも簡単です。そのデータのインターフェースは必要なものだけを記述し、プラグインの非公開の `shared/` のファイルに依存しません。ページは既存の `Announcement[]` をそのまま渡せます。

プラグインのビルドは型の宣言を出力するため、この例では Props と戻り値に明示的に型を付けています。Card をインストールしたあと、`client/components/ui/card.tsx` も確認してください。`Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardAction`、`CardContent`、`CardFooter` の戻り値の型がない場合は `: React.ReactElement` を追加し、引数と実装は保ちます。これらの注釈がないと、プラグインの `isolatedDeclarations` のチェックが `TS9007` を報告します。新しくインストールするほかのプリミティブも、プラグインの宣言の生成の要件を満たす必要があります。

### ページにつなぐ

`client/pages/announcements.tsx` に次のインポートを追加します。

```tsx
import { AnnouncementList } from '#components/announcement-list';
```

ページの `useApiClient()`、`useTranslation()`、リクエストのロジックは保ちます。その `return` を次のように置き換えます。

```tsx
return (
  <PageContainer>
    <PageHeader title={t('title')} />
    {failed ? (
      <p role='alert'>{t('error')}</p>
    ) : items === null ? (
      <p role='status'>{t('loading')}</p>
    ) : (
      <AnnouncementList items={items} emptyMessage={t('empty')} />
    )}
  </PageContainer>
);
```

ここでは、ページがリクエスト、状態、翻訳を扱い、リストが表示を扱います。ほかのコンポーネントは、適切な場合に Client のサービスや Hooks を直接使えます。プラグインへの組み込みについては [クライアントのサービス](client-services.md) を、共通のコンテナの仕組みについては [ServiceProvider](service-provider.md) を参照してください。

## スタイルとテーマへの組み込み

### 生成の設定と実行時のスタイルを分ける

プラグインの `components.json` は、`tailwind.css` を `client/styles.css` に向けています。ひな形はこのファイルを shadcn のコンポーネントの生成に使います。このファイルは Tailwind、アニメーション、shadcn のスタイルをインポートし、テーマのトークンは明示的にホストのアプリに任せています。生成された `client/index.ts` はプラグインのファクトリーをエクスポートするだけで、この CSS ファイルはインポートしません。

既定のアプリは、`client/index.tsx` から自分の `client/styles.css` をインポートします。そのスタイルシートがテーマを読み込み、ユーティリティーを生成します。プラグインのコンポーネントは `bg-card` や `text-muted-foreground` などの意味的なクラスを使い、最終的な CSS はアプリの Client のビルドで生成されます。プラグインの TypeScript のビルドが出力するのは JavaScript と宣言で、アプリの完全なスタイルシートではありません。

そのため、プラグインの生成用のスタイルシートにルールを追加しても、ページには現れません。ルールを 1 つ読み込むためだけに、Tailwind の入口を含む生成用のスタイルシート全体を、アプリにもう一度インポートしないでください。

### プラグインのコンポーネントをホストのビルドのスキャンに含める

既定のテンプレートは、アプリのスタイルシートの `@config "../tailwind.config.mjs"` でスキャンの設定を読み込みます。この記事で確認した Core の基準 `7fb8311` では、その設定が `@nocobase/app-plugin-*` のパッケージの実際のパスを解決し、ソースの `client/` と公開版の `dist/client/` を含むディレクトリをスキャンします。pnpm のシンボリックリンクとコンパイル済みのプラグインも考慮されています。

`@my-company` などの独自のスコープでは、受け取る側のアプリのスキャンの設定にそのパッケージを明示的に含め、既存のエントリーを保ち、ローカルのソースとインストール済みのコンパイル後のディレクトリの両方を対象にします。名前を変えたパッケージは、既定の `@nocobase` のルールでは自動で対象になりません。シンボリックリンクをまたぐワイルドカードのパスだけでは、スキャンが機能することの証明になりません。

ユーティリティーの文字列は、静的な完全な形で書きます。バリエーションには、ビルドが直接見つけられない `bg-${color}` のような組み立てではなく、完全なクラス名を含む対応付けを使います。workspace での開発を確認したら、公開したパッケージをインストールしてビルドしたアプリでも確認してください。

### ホストのテーマのトークンを使い、独自のルールの範囲を限定する

`bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`border-border` などの意味的なクラスを使います。色、角の丸み、フォントはホストのテーマから来ます。お知らせのリストはすでに `text-muted-foreground` を使っており、別の配色は必要ありません。テーマのプリセットとカラースキームの選択はアプリが担います。[テーマとスタイル](../developing-apps/themes-and-styles.md) を参照してください。

独自の CSS は、グローバルな `body`、すべての `button`、`:root` を上書きするのではなく、プラグイン固有のクラスや属性で範囲を限定します。Portal の内容はページのルートの外にレンダリングされることがあるため、必要に応じて、実際のオーバーレイの内容に範囲のクラスを付けます。ホストの見た目を変えるために、shadcn を初期化し直したり、2 つ目のテーマの Provider をマウントしたりしないでください。

独自の実行時の CSS は別のリソースとして管理し、プラグインの Client のモジュールとアプリのスタイルシートのどちらがインポートするかを説明します。配布では、リソースのコピー、公開のエクスポート、パッケージのファイルへの含め方、利用側のバンドラーのローダーを考慮する必要があります。`tsc` は CSS を自動ではコピーしません。workspace にしかないファイルが公開したパッケージから消えないよう、利用側に必要なインポートを説明してください。この記事のお知らせのリストの例には、追加の CSS のリソースは必要ありません。

## コンポーネントを公開する

内部のコンポーネントには、新しいパッケージのエクスポートは必要ありません。アプリがパッケージからコンポーネントをインポートできるようにするには、公開の入口を追加し、ソースのエクスポートとコンパイル後の `publishConfig.exports` の対応付けをそろえます。[プラグインの宣言と公開のエクスポート](plugin-declarations.md#公開のエクスポート) を参照してください。コンポーネントをインポートしても、プラグインのルート、翻訳、サービスは自動では登録されません。

Props、公開の型、必要なスタイル、実行時の前提条件を説明します。コンポーネントがプラグインのサービスや翻訳に依存する場合は、利用側がどの入口を登録する必要があるかを示します。エクスポートするコンポーネントは、プラグインの翻訳の名前空間を明示的に指定します。[クライアントの多言語化](localization.md) を参照してください。プラグインへの組み込みについては [React の Context と Provider](react-context-and-providers.md) を、マウントの仕組みについては [React の Provider の登録とマウント](../framework/runtime/react-providers.md) を参照してください。

## 必要に応じて UI のソースアセットを配布する

エージェントがリストを対象のプロジェクトに取り込み、レイアウトを変え、操作を追加し、ほかのブロックと組み合わせられるようにするには、shadcn の UI Registry で配布します。プラグインは、保守された公開の実行時の機能を持つパッケージと、編集可能なソースを持つ Registry のアセットの両方を提供できます。

**Registry のアセットは独立したソースのモジュールです。** この例では、アプリの `packages/` の下に、`app-plugin-announcements/` と並べて、独自のマニフェストとビルドの設定を持つ `announcements-ui/` を追加します。その出力はローカルのパスで直接追加し、URL での配布が必要な場合にだけ静的なサイトにデプロイします。アプリとプラグインはアセットをインストールし、自分のプロジェクトでソースを組み込みます。1 つの Registry のパッケージで、複数のプラグインや業務のシナリオのアセットを提供できます。

### エージェントでソースアセットを用意する

```prompt
お知らせのリストを、shadcn の UI Registry で配布するソースアセットとして用意してください。
プラグインのパッケージと並べて、独立した packages/announcements-ui/ のパッケージで管理してください。
相対パスや非公開のエイリアスでプラグインのソースをインポートせず、公開の入口か渡された入力を使ってください。
ファイルと依存関係を宣言してください。データの渡し方、レイアウトの変え方、
お知らせの API へのつなぎ方を説明してください。ローカルのビルドをファイルのパスで別の
アプリかプラグインに追加して確認してください。Registry のサイトは不要です。
URL での配布が必要な場合にだけ、既存の静的なサイトに公開してください。
```

### アセットのソースを整理する

アプリのルートで、Registry のパッケージのソースのディレクトリを作成します。

```bash
mkdir -p packages/announcements-ui/registry/components
```

[上のお知らせのリストの実装](#お知らせのリストを実装する) を `packages/announcements-ui/registry/components/announcement-list.tsx` として保存します。データとテキストを受け取るため、独立して配布できます。関係するディレクトリは次のとおりです。

```tree
my-app/
├── packages/
│   ├── app-plugin-announcements/    # プラグインのパッケージ
│   │   ├── client/                 # プラグイン自身のフロントエンドの実装
│   │   ├── server/                 # プラグインのバックエンドの機能
│   │   └── package.json
│   └── announcements-ui/           # 独立した UI Registry のパッケージ
│       ├── registry/
│       │   └── components/
│       │       └── announcement-list.tsx
│       ├── registry.json           # 配布のマニフェスト
│       ├── package.json            # 独立したビルドのツールとスクリプト
│       └── public/
│           └── r/                  # 生成される Registry の JSON
└── pnpm-workspace.yaml             # workspace のパッケージの設定
```

アプリの `pnpm-workspace.yaml` に `packages/*` が含まれていることを確認し、既存の設定は保ちます。パッケージは workspace を共有していますが、Registry のアセットが隣のプラグインの内部に相対インポートしてはいけないことに変わりはありません。

`packages/announcements-ui/package.json` を追加します。

```json
{
  "name": "announcements-ui",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "shadcn build registry.json --output public/r",
    "check": "pnpm build"
  },
  "devDependencies": {
    "shadcn": "4.18.0"
  }
}
```

この例では、確認したビルドのツールのバージョンを固定しています。`check` のスクリプトは、ビルドを通じてマニフェストとソースのファイルを検証し、このパッケージがアプリの workspace のチェックに加わるようにします。コンポーネントの型とレンダリングは、利用側でも検証する必要があります。この `package.json` は Registry のパッケージのツールを管理するものです。利用側が必要とする npm のパッケージやほかの Registry のアイテムは、下のアセットのマニフェストで別に宣言します。Registry のパッケージを、アプリの Client、Server、CLI のプラグインの一覧に登録する必要はありません。

公開するソースは、この独立したパッケージで管理します。元のプラグインの `client/` のコンポーネントと、ほかのプロジェクトにインストールしたコピーは、それぞれ独立してカスタマイズできます。アセットの更新を取り込むには、変更を比較してマージするか、差分を確認してからインストールし直します。

### アセットとその依存関係を宣言する

`packages/announcements-ui/registry.json` を追加します。

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "announcements-ui",
  "homepage": "https://example.com",
  "items": [
    {
      "name": "announcement-list",
      "type": "registry:component",
      "title": "Announcement List",
      "description": "An editable announcement list with data and empty-state text supplied by its page.",
      "registryDependencies": ["card"],
      "files": [
        {
          "path": "registry/components/announcement-list.tsx",
          "type": "registry:component",
          "target": "client/components/announcement-list.tsx"
        }
      ],
      "docs": "Render AnnouncementList with items and emptyMessage. Keep data loading in the consuming page. This item does not register routes or install the announcements backend."
    }
  ]
}
```

例の `homepage` は、プロジェクトのホームページのプレースホルダーです。既存のプロジェクトやリポジトリの URL を使ってください。現在のビルドのツールはルートのマニフェストにこのメタデータを求めますが、これがインストール先のアドレスを決めたり、その URL に Registry のサービスを求めたりすることはありません。ローカルでの追加は、ビルドした JSON のファイルを直接読み取ります。このフィールドについては [shadcn の Registry のマニフェスト](https://ui.shadcn.com/docs/registry/registry-json#homepage) を参照してください。2 つのファイルのパスは役割が異なります。

- `path` は、公開側のアセットのソースを、Registry のパッケージのルートからの相対パスで示します。この例では `packages/announcements-ui/registry/components/announcement-list.tsx` を読み取ります。
- `target` は、受け取る側のアプリやプラグインのどこにファイルを書き込むかを示します。この例では、そのプロジェクトの `client/components/announcement-list.tsx` にインストールします。

そのため、公開側の `registry/` の構成と、利用側の `client/` の構成は異なっていてかまいません。`target` はインストール先を示すもので、アセットのソースをプラグインの `client/` のモジュールの一部にするものではありません。

`registryDependencies` には、`card` など、インストールするほかの Registry のアイテムを宣言します。直接インポートする npm のパッケージは、互換性のあるバージョンの範囲で `dependencies` に入れます。このコンポーネントが直接インポートするのは React だけで、対象の NocoBase のアプリにはすでにあります。複数のファイルを持つブロックでは、`registry:block` を使い、すべてのファイルとその書き込み先を列挙できます。フィールドについては [shadcn の Registry Item](https://ui.shadcn.com/docs/registry/registry-item-json) を参照してください。

### モジュールの依存の境界を決める

アセットは別のアプリやプラグインにインストールされるため、すべてのインポートが受け取る側のプロジェクトで動く必要があります。

- **相対パスでプラグインの内部をインポートしないでください。** 公開側でしか使えない非公開のエイリアスで、この境界を迂回することも避けます。これは、コンポーネント、Hooks、サービス、型、翻訳に当てはまります。
- プラグインの機能には、宣言された公開のパッケージの入口からアクセスし、互換性のある依存関係と登録の前提条件を示します。あるいは、利用側のページから Props、コールバック、アダプターを渡します。
- shadcn のプリミティブは `registryDependencies` で宣言し、この例の `#components/ui/card` のように、受け取る側のプロジェクトで解決できるエイリアスを使います。
- 1 つのアセットで一緒に配布するファイル同士は、すべてのファイルがマニフェストに列挙され、インストール後も相対的な位置関係が有効であれば、相対インポートを使えます。

このリストは Props でデータとテキストを受け取り、お知らせのプラグインの内部をインポートしません。アセットのインストールにお知らせのバックエンドは必要ありませんが、実際のお知らせを取得するページには、対応する Server のプラグインが引き続き必要です。

### ソースアセットをビルドする

**アプリのルート**で、workspace の依存関係をインストールし、Registry のパッケージだけをビルドします。

```bash
pnpm install
pnpm --filter announcements-ui build
```

フィルターは `package.json` の名前で `announcements-ui` を選び、そのパッケージでビルドのスクリプトを実行して、コンポーネントのソースを `packages/announcements-ui/public/r/announcement-list.json` に埋め込みます。プラグインのビルドは実行せず、独立してビルド、公開します。ビルドのオプションについては [shadcn CLI](https://ui.shadcn.com/docs/cli#build) を参照してください。

ローカルでの開発では、生成された JSON のファイルを `shadcn add` に直接渡し、静的なサーバーを起動する必要はありません。ソースのディレクトリや `registry.json` のビルドのマニフェストではなく、`files[].content` を含む個々のアセットのファイルをインストールします。

### 対象のプロジェクトでインストールして変更する

現在の**アプリのルート**で、同じ workspace のアセットをアプリにインストールします。

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

**同じマシンの別のアプリ**にインストールするには、受け取る側のアプリのルートで、そのディレクトリからの相対パスを使って実行します。たとえば、アプリのディレクトリが隣り合っていて、公開側の名前が `my-app` の場合：

```bash
pnpm exec shadcn add ../my-app/packages/announcements-ui/public/r/announcement-list.json
```

対象のアプリのプラグインにソースを置くには、そのパッケージのフィルターと、アセットへの**絶対パス**を使います。フィルターが作業ディレクトリを変えることで、相対パスの意味が変わるのを避けられます。パッケージ名とパスは置き換えてください。

```bash
pnpm --filter @my-company/app-plugin-dashboard exec shadcn add \
  /absolute/path/to/my-app/packages/announcements-ui/public/r/announcement-list.json
```

インストール先は、ソースの所有に合わせて選びます。ローカルのパスでのインストールでも `registryDependencies` は処理されるため、足りないプリミティブや npm の依存関係のためにネットワークへのアクセスが必要になることがあります。ファイルがすでにある場合は差分を確認し、プロジェクトのカスタマイズを保ってください。インストールされたファイル、依存関係、宣言の型を確認してから、対象のページで `AnnouncementList` をインポートし、データと空のときのテキストを渡します。ローカルのパスへの対応については [shadcn CLI](https://ui.shadcn.com/docs/cli#add) を参照してください。

エージェントは、インストールされたソースを直接変更できます。たとえば、1 列の表示をレスポンシブなグリッドに変えたり、業務の操作を追加したりできます。アプリにインストールしたソースはアプリが、プラグインにインストールしたソースはプラグインが保守します。プラグインのパッケージをアップグレードしても、このコピーは更新されません。新しい Registry のアセットを取り込むときは、変更を比較し、プロジェクトのカスタマイズを保ってください。

### 必要に応じて既存のサイトで公開する

ほかのマシンが URL でアセットを取得する必要がある場合は、生成された `packages/announcements-ui/public/r/` の内容を既存の静的なサイトの `/r/` の下にデプロイするか、既存のサービスの静的ファイルのホスティングを再利用します。Registry に専用のサービスは必要ありません。アセットの URL が `files[].content` を含む JSON を返すことを確認してください。[shadcn の Registry の入門](https://ui.shadcn.com/docs/registry/getting-started) を参照してください。

この手順は任意です。アセットの URL がすでにある場合は、受け取る側のアプリはローカルのファイルのパスの代わりにそれを使えます。たとえば次のようにします。

```bash
pnpm exec shadcn add https://example.com/r/announcement-list.json
```

### エージェント向けの使い方を書く

アセットの組み込みは、プラグインが保守するスキルで説明します。その場所と同期については [プラグインのスキル](write-plugin-skills.md) を参照してください。ローカルのアセットのビルド方法と場所、または公開の URL を、使いどころ、入力、前提条件、カスタマイズできる箇所、確認とあわせて説明します。サイトの公開は前提ではありません。たとえば、お知らせのスキルに次のローカルでのインストールの説明を追加します。

```markdown
## Compose an announcement list

Use the announcement-list source asset when the App needs an editable
announcement list. In the source App root, run
`pnpm --filter announcements-ui build`.

Locate packages/announcements-ui/public/r/announcement-list.json and resolve
its absolute path. From the receiving App root, run
`pnpm exec shadcn add /absolute/path/to/my-app/packages/announcements-ui/public/r/announcement-list.json`.
To install into a plugin, run the same add command with
`pnpm --filter <plugin-package> exec shadcn add <absolute-item-path>`.
No Registry server is needed. If the asset is already published, its URL
can be used instead of the local file path.

Render AnnouncementList with items containing id, title and content,
and pass translated emptyMessage text. The component does not fetch data.
Keep loading and error handling in the page. To use the announcements API,
first install and register the backend plugin that provides it.

Edit the installed source to change the layout or add business interactions.
Verify populated and empty lists, loading and request failures, translations,
and the receiving project's type checks and build.
```

スキルでは、ローカルで利用できるか公開済みのアセットと、実際に存在する API を説明します。Registry の `docs` フィールドは、短いインストールの注意書きに向いています。業務への組み込みの完全な手順と組み合わせの例は、スキルかそれが参照するドキュメントに書きます。

## テストと確認

まず元のプラグインでコンポーネントを確認します。タイトルと内容が正しくレンダリングされ、空のリストでは渡したテキストが使われることを確かめます。ページは引き続き、読み込み中、失敗、言語の切り替えを扱う必要があります。既存のテストは残し、切り出したコンポーネントに合わせて置き場所を調整します。[テストと検証](testing-and-verification.md) を参照してください。

実際のアプリで、ライトモードとダークモード、テーマのプリセット、狭い画面、キーボードのフォーカス、Portal の内容を確認します。プラグインがほかのページを変えないことも確認します。独自のスコープやインストール済みのパッケージでは、ホストのスキャンとビルドした CSS を確認します。コンポーネントのテストと型チェックでは、スタイルが読み込まれたことは証明できません。

アプリのルートで、プラグインのチェックとアプリのビルドを実行します。

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm build
```

ソースアセットを配布する場合は、対象のプロジェクトでもインストール、レンダリング、ビルドを行います。公開側の非公開のファイルをインポートしていないこと、必要なコンポーネント、依存関係、スタイルがすべてそろっていること、エージェントが説明どおりのカスタマイズを完了できることを確認します。プラグイン向けのアセットは、プラグインの宣言のビルドも通る必要があります。Registry の JSON を生成できても、配布用のファイルが作られたことを確認できるだけです。

パッケージの公開については [ビルドと公開](publish-plugin.md) を参照してください。ソースアセットのリリースは、独立させることも、プラグインのバージョンに合わせることもできます。両者の互換性を説明してください。
