---
title: データの照会と操作
description: 業務レコード、リレーション、ページネーション、トランザクション、一括操作には Repository を使い、Query を使うべき場面を判断します。
---

データアクセスは Repository から始めます。Repository はコレクションのフィールドとリレーションを理解し、業務レコードの読み取り、作成、変更に対応します。Query はテーブルと結果セットを操作し、Repository では表現できないレポートや集計に使います。どちらも、呼び出し側が先に身元と権限を確定する必要があります。

コード片はアプリのサーバーで動作し、[過去のプロジェクトデータのセットアップ](https://github.com/nocobase/website-v3/blob/e7f20aeea2f9e63d396cb99a4e3775902823f3cb/doc/content/core/developing-apps/data-models-and-migrations.md) の `tutorialProjects` と `tutorialTasks` を使います。サンプルアプリは既定のテンプレート `1.0.0-beta.78` を使っています。これは独立した過去のプロジェクトの例で、`tasks` テーブルを持つ現在の入門用アプリではありません。これらはデータアクセスの抜粋です。サービスについては [過去のプロジェクトのサービスのソース](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/server-business-services.md) を、エンドポイントへの組み込みについては [HTTP ルートと API](apis-and-services.md) を参照してください。

## エージェントを使う場合

```text
既存のプロジェクト一覧の照会を改善し、検索、並べ替え、ページネーションの整合性が保たれるようにしてください。

現在のユーザーが閲覧できるプロジェクトだけを返し、件数もそのプロジェクトだけを数えてください。
名前で検索でき、既定では新しい順にしてください。作成日時が同じ場合も順序が安定するようにしてください。
1 ページあたり最大 100 件とし、負のページ番号と、制限のない全件取得のリクエストは拒否してください。

タスクのプロジェクトを変更するときは、タスクと移動先のプロジェクトの両方の権限を確認してください。
どこかのステップが失敗したら、部分的に保存せず、元の割り当てを保ってください。
検索、ページネーション、権限の範囲、失敗後のデータを、実際のデータベースで検証してください。既存のユーザーへの付与は変更しないでください。
```

## エージェントを使わない場合

### Repository を取得する

ルートのファクトリーでデータベースを一度解決するか、コンストラクターで業務サービスに注入します。

```ts
import { databaseManagerToken } from '@nocobase/db';

const database = app.container.resolve(databaseManagerToken);
```

`database.repository('tutorialProjects')` は、既定の接続とコレクションの論理名を使います。物理的なテーブル名を推測したり、データベースサービスをブラウザーに公開したりしないでください。

Repository は現在のリクエストのユーザーを推測しません。外部からのリクエストでは、認可から `RepositoryPolicy` を取得し、`withPolicy()` でレコードの範囲とフィールドの権限を結び付けます。ユーザーが指定したフィルターでその範囲を絞り込むことはできますが、それは認可の根拠にはなりません。

### 絞り込み、並べ替え、ページネーション

この関数は、検証済みのページネーションのパラメーターと、現在の読み取りポリシーを受け取ります。業務サービスに置き、エンドポイントで先に `page >= 1`、`1 <= pageSize <= 100`、検索文字列の長さを検証します。

```ts
import type {
  DatabaseManager,
  RepositoryFilter,
  RepositoryPolicy,
} from '@nocobase/db';

export async function listProjects(
  database: DatabaseManager,
  policy: RepositoryPolicy,
  input: { page: number; pageSize: number; q?: string },
) {
  const projects = database.repository('tutorialProjects').withPolicy(policy);
  const filter: RepositoryFilter<Record<string, unknown>> = (f) =>
    f.and(input.q ? [f.string('name').includes(input.q)] : []);

  const data = await projects.findMany({
    filter,
    select: (s) => s.fields('id', 'name', 'createdAt'),
    sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
    limit: input.pageSize,
    offset: (input.page - 1) * input.pageSize,
  });
  const total = await projects.count({ filter });
  return { data, meta: { page: input.page, pageSize: input.pageSize, total } };
}
```

行と件数には、同じ Repository とフィルターを使います。行だけを絞り込むと、許可された範囲外の件数が漏れ、存在しないページが生じます。2 つ目の並べ替えのフィールド `id` は、同じタイムスタンプの順序を確定させるためのものです。UUID が時系列で増えるという意味ではありません。

2 つのページネーションの照会が同じデータベースのスナップショットを共有する保証はありません。並行した変更によって、件数と現在のページが一時的に影響を受けることがあります。必要に応じて、スナップショットの整合性やカーソルによるページネーションを別に設計してください。すべてのデータをダウンロードしてブラウザーで切り出すことは、サーバーでのページネーションの代わりにはなりません。

### リレーションを読み取る

マイグレーションで `tutorialTasks.project` を宣言したら、セレクターでリレーションを読み取ります。

```ts
const task = await database
  .repository('tutorialTasks')
  .withPolicy(taskPolicy)
  .findOne({
    filter: { id: taskId },
    select: (s) =>
      s
        .fields('id', 'title', 'projectId')
        .include('project', (p) => p.fields('id', 'name')),
  });
```

`taskPolicy` は、対応するフィールドとリレーションの読み取りを許可している必要があります。`include()` は認可ではありません。タスクとプロジェクトで別々の操作範囲が必要な場合は、プロジェクトの割り当てと同様に、それぞれのポリシーを結び付けて個別に照会します。タスクを読めるからといって、すべてのプロジェクトにアクセスできるわけではありません。

レスポンスのフィールドは明示的に選びます。フィールドの対応やリレーションのルールを重複させる手書きの結合より、宣言されたリレーションを優先します。

### 作成、更新、削除

| 必要なこと | Repository のメソッド | 考慮すべき動作 |
| --- | --- | --- |
| 1 件を読み取る | `findOne()` | 最初に一致したものを返す。レコードがないこともある |
| 1 件を作成する | `createOne()` | 変更の結果を返す。レコードは `result.record` |
| 1 件を更新または削除する | `updateOne()`、`deleteOne()` | 範囲内にちょうど 1 件のレコードが必要 |
| 複数件を作成する | `createMany()` | リレーションのネストした書き込みには対応しない |
| 一括で更新または削除する | `updateMany()`、`deleteMany()` | 明示的な範囲が必要。空の範囲のエラーを回避するために `all: true` を使わない |

このサービスの抜粋は完了状態を更新します。`taskId` は検証済みで、`updatePolicy` はその操作の認可から得たものです。

```ts
const result = await database
  .repository('tutorialTasks')
  .withPolicy(updatePolicy)
  .updateOne({
    filter: { id: taskId },
    values: { completed: true, updatedAt: new Date() },
    select: (s) => s.fields('id', 'completed', 'updatedAt'),
  });
const savedTask = result.record;
```

`values` はリクエストのボディ全体を渡すのではなく、明示的なフィールドの許可リストから組み立てます。一括操作でも、検証済みの入力、ポリシー、上限のあるサイズ、全件成功か部分的な成功かの判断が必要です。メソッド名が `Many` で終わっても、これらを代わりに決めてくれるわけではありません。

### 複数ステップの書き込みとトランザクション

一緒に成功または失敗すべき操作は、業務サービスで 1 つの接続のトランザクションにまとめます。実装、ロールバック、外部への送信の境界については [トランザクションとデータの整合性](transactions-and-consistency.md) を参照してください。読み取りと書き込みには、外側の Repository ではなく、トランザクションの接続を使う必要があります。

## Query を使うべき場面

| 状況 | まず使うもの |
| --- | --- |
| コレクションのレコードと宣言されたリレーション | Repository |
| ポリシー、フィールドのエンコード、リレーションの書き込み | Repository |
| リレーションのないレポート用の結合、複雑なサブクエリー、グループ化した結果のページネーション | Query |
| マイグレーションでの集合単位の過去データの変換 | 通常はマイグレーションのコンテキストの Query。マイグレーションを自己完結に保つため |

実行時のコードでは `database.query()` を使い、トランザクションのコールバックでは `connection.query` プロパティを使います。Query はコレクションのリレーションや命名の上書きを読まず、自動の権限ポリシー、楽観的ロック、リレーションの書き込みも適用しません。それでも接続レベルの命名変換は使うため、手動で連結した物理名が常に動くとは考えないでください。

Query の条件は `where(field, operator, value)` を取り、値はパラメーター化されます。これは Knex の API ではありません。`where(field, value)` や `whereIn()` をそのまま写さないでください。更新と削除には `where` が必要です。`allowAllRows()` は、明示的に意図したテーブル全体の操作にだけ使います。

## 結果を確認する

フィルター、安定した順序、空の結果、リレーション、一括操作の範囲には実際のテスト用データベースを、認可には実際のアプリと一般ユーザーを使います。トランザクション内で失敗を起こし、データベースを読み直して、それより前の書き込みもロールバックされたことを確認します。Repository をモックしても、その動作は確認できません。

プロジェクトのサービスの全体は [過去のプロジェクトのサービスのソース](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/server-business-services.md) を、フィクスチャーの選び方は [テストと検収](testing-and-acceptance.md) を参照してください。
