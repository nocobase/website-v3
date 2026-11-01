---
title: トランザクション
---

トランザクションは、1 つの接続上の操作をまとめてコミットまたはロールバックします。その範囲は業務サービスが定め、Repository、Query、Builder の作業はコールバックの接続を使う必要があります。

## 接続を伝播させる

```ts
import type { DatabaseManager } from '@nocobase/db';

export async function markPaid(db: DatabaseManager, orderNo: string,
  notify: (orderNo: string) => Promise<void>) {
  return db.transaction(async (connection) => {
    const result = await connection.repository('orders').updateOne({
      filter: { orderNo }, values: { status: 'paid' },
    });
    connection.afterCommit(() => notify(orderNo));
    return result.record;
  });
}
```

これはコミット後の通知を示すもので、注文の認可や状態の確認を完全に行うものではありません。実際の業務の境界の中で、ポリシーと並行性の制約を追加してください。

コールバックの中で、外側のマネージャーの Repository や、以前に取得したハンドルを使わないでください。それらは自動ではトランザクションに参加しません。コールバックの接続を、完了後も続く作業に渡すこともできません。

## コミットとロールバックのコールバック

無効化やスケジュールには `afterCommit()` を使います。ロールバックすると、これらのコールバックは破棄されます。成功したネストしたトランザクションはコールバックを外側のトランザクションに統合し、ネストしたトランザクションがロールバックすると自分のコミットのコールバックを破棄します。

トランザクションの Promise はコミット後のコールバックを待ちますが、それらが失敗してもコミットは取り消されず、そのトランザクションも reject されません。エラーは接続の `onTransactionCallbackError` に送られ、設定されていなければ警告になります。確実な配信には、別に保存した保留中の作業が必要です。プロセス内のコールバックだけでは不十分です。

`afterRollback()` は、ロールバック後の記録や後片付けを行います。トランザクションの外では afterCommit はすぐに始まり、完了を待たないため、待機の意味が異なります。

## 並行性とダイアレクト

トランザクションで業務上のすべての競合がなくなるわけではありません。必要に応じて、一意制約、条件付きの更新、バージョン、ロックを使います。セーブポイント、トランザクション内の DDL、分離レベルは、ダイアレクトごとに検証してください。

`builder.transaction()` は、現在データベースのトランザクションを開始しません。マネージャーか接続を使ってください。接続のトランザクションは、ほかの接続や、外部のメールや HTTP のシステムも対象外です。

正常なコミット、それより前の書き込み後の失敗、コールバックの失敗、並行した変更をテストします。例外が起きただけでは、ロールバックの証明にはなりません。

アプリでの使い方と検証については [トランザクションとデータの整合性](../../developing-apps/transactions-and-consistency.md) を参照してください。

## インターフェースと実装

- [トランザクションの伝播](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/transactions.md)
- [トランザクションの API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/transactions.md)
