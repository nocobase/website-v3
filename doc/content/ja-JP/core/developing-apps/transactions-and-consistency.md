---
title: トランザクションとデータの整合性
description: サービスのトランザクションの境界を定め、ロールバック、並行性、接続をまたぐ影響や外部への影響を検証します。
---

トランザクションは、1 つのデータベース接続上の一連の操作をまとめてコミットまたはロールバックします。割り当てを保存する前に、タスクと移動先のプロジェクトが条件を満たしているかを確認するなど、業務上の結果を単位に組み立てます。

このガイドは、現在の入門用の `tasks` モデルではなく、[過去のプロジェクトデータのセットアップ](https://github.com/nocobase/website-v3/blob/e7f20aeea2f9e63d396cb99a4e3775902823f3cb/doc/content/core/developing-apps/data-models-and-migrations.md) の過去の `tutorialTasks`/`tutorialProjects` モデルと前提条件をそのまま使います。サービスの全体は [過去のプロジェクトのサービスのソース](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/server-business-services.md) を参照してください。

## サービスでトランザクションの接続を使う

一緒に成功または失敗すべき操作にはトランザクションを使い、すべての操作をコールバックの `connection` から取得します。

```ts
await database.transaction(async (connection) => {
  const tasks = connection.repository('tutorialTasks').withPolicy(taskPolicy);
  const projects = connection
    .repository('tutorialProjects')
    .withPolicy(projectPolicy);

  const task = await tasks.findOne({ filter: { id: taskId } });
  if (!task) throw new Error('Task unavailable.');
  const project = await projects.findOne({ filter: { id: projectId } });
  if (!project) throw new Error('Project unavailable.');

  await tasks.updateOne({
    filter: { id: taskId },
    values: { projectId, updatedAt: new Date() },
  });
});
```

これはトランザクションの構造を示すものです。本番のサービスでは区別できる業務エラーを使い、ルートがそれを API エラーに変換します。[HTTP ルートと API](apis-and-services.md) を参照してください。外側の `database.repository()` を呼び出すと、このトランザクションの外で実行されます。エラーを捕捉して正常に戻ると、作業の一部がコミットされることがあります。

トランザクションは、並行した上書きを自動では防ぎません。最後に成功した書き込みが勝つことが許容できない場合は、バージョンの条件などの並行性の制御を追加します。通知などの外部への影響は、コミット後に起こします。`connection.afterCommit()` はその境界に役立ちますが、失敗してもコミット済みのデータは元に戻せず、外部へのメッセージの配信も保証されません。

## 協調するメソッドに接続を渡す

ヘルパーのメソッドにはトランザクションの接続を渡し、グローバルなマネージャーに戻らせないでください。接続をシングルトンに保存したり、トランザクションの終了後にバックグラウンドの処理に渡したりしないでください。

名前付きの接続には `database.connection('analytics').transaction(...)` を使います。既定の接続のトランザクションは、analytics への書き込みを対象にしません。複数の接続は分散トランザクションではありません。[複数のデータベース接続](multiple-databases.md) を参照してください。

## トランザクションは業務上の制約の代わりにならない

| 要件 | 追加の仕組み |
| --- | --- |
| 業務上のキーを一意にする | データベースの一意制約と、競合の処理 |
| 参照先が既存のレコードを指す | 適切な外部キーと削除のルール |
| ほかのユーザーの最近の変更を上書きしない | バージョンの前提条件などの並行性の制御 |
| 認可されたレコードだけを変更する | トランザクションの Repository に結び付けた認可ポリシー |

更新の前に読み取っても、更新の喪失は自動では防げません。プロジェクトの例は楽観的ロックを約束していません。必要に応じてバージョンのフィールドと条件を定義し、対象のデータベースで並行時の動作をテストしてください。

## コミット後の処理は確実な配信ではない

`connection.afterCommit()` のコールバックはコミット後に実行され、ロールバック時には破棄されます。コールバックが失敗しても、コミット済みのデータは元に戻らず、トランザクションの Promise も reject されません。それは `onTransactionCallbackError` が扱い、既定では警告を出します。待機とネストの意味については [トランザクションの仕組み](../framework/database/transactions.md) を参照してください。

メール、HTTP の呼び出し、ジョブの投入は、データベースと一緒にはロールバックされません。コミット後に最終的に配信するには、同じトランザクションで配信待ちのレコードを保存し、業務上の冪等性キーを持つ、復旧可能なバックグラウンドの処理を使います。[バックグラウンドジョブと定期実行](background-tasks.md) を参照してください。

## 保存された結果を検証する

分離されたデータベースで、正常なコミット、最初の書き込み後の失敗、コミット後のコールバックの失敗を網羅します。失敗後にデータを読み直して、ロールバックされたかどうかを確認します。例外が起きたことを確認するだけでは不十分です。

一意キーの競合、バージョンの競合、認可の範囲、接続の分離もテストします。SQLite で基本的なルールは検証できますが、ほかのデータベースの分離レベル、ロック、DDL の動作は検証できません。プロジェクトのエンドポイントのテストは [過去のプロジェクトの API の例](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/apis-and-services.md) からリンクされています。テストの構成については [テストと検収](testing-and-acceptance.md) を参照してください。
