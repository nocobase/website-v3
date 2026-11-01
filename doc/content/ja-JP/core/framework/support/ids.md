---
title: ID の生成
---

`@nocobase/snowflake` は、時刻の順に並ぶ、JavaScript で安全な整数の ID を生成します。アプリは `@nocobase/app-server/id-generator` の `idGeneratorToken` で生成器を共有します。

## ホストの生成器

```ts
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import type { ServiceResolver } from '@nocobase/service-provider';

export function nextOrderId(container: ServiceResolver): string {
  return container.resolve(idGeneratorToken).generateString();
}
```

`generate()` は安全な整数を、`generateString()` はその文字列表現を返します。API とデータベースのフィールドの型はそろえてください。サードパーティの任意の大きさの ID を、JavaScript の数値に強制的に変換しないでください。

単独の呼び出し側は `new SnowflakeIdGenerator({ workerId })` を作成できます。呼び出すたびに作り直すと同じ秒の中でシーケンスがやり直されるため、1 つのインスタンスを再利用してください。

アプリとプラグインは、サービスや Provider を通じて `app.container` を渡し、ホストの生成器を共有します。ワーカーはデプロイの設定で割り当てます。プラグインがそれぞれ同じワーカーで生成器を作成してはいけません。ブラウザーのコードは、サーバーで新しいレコードの ID を生成する業務 API にリクエストします。

```yaml
snowflake:
  workerId: 1
```

この例は 1 つのインスタンスを設定しています。インスタンス間では異なる値を割り当ててください。業務のテストでは、固定のシーケンスの生成器を代わりに注入できます。アルゴリズムのテストでは、独立した生成器を使って、同じ秒のシーケンス、時計の巻き戻り、境界値を確認します。

## ワーカーと時計

この実装は、秒単位の時刻、5 ビットのワーカー、16 ビットのシーケンスを使います。ワーカー ID は 0〜31 の範囲で、`snowflake.workerId` または `SNOWFLAKE_WORKER_ID` で設定します。同じ ID 空間で並行して動く生成器には、別々のワーカー ID が必要です。設定が自動でそれを割り当てることはありません。

1 秒のシーケンスを使い切った場合、時計が最後に生成した時刻より前に戻った場合、安全な整数の範囲を超えた場合は、黙って重複を生成するのではなく例外を投げます。安定した時計とワーカーの割り当てでデプロイしてください。ワーカーを短時間で再起動する場合も、同じ秒のシーケンスの再利用を考慮する必要があります。データベースの一意制約は残しておきます。

## 業務の境界

時刻の順序は、厳密なグローバルなコミットの順序ではありません。異なるワーカーの ID は、トランザクションの順序を証明しません。ID は時刻とワーカーの情報を明らかにするため、予測できない認証情報ではありません。

パスワード再設定のリンク、セッションのシークレット、API トークンに Snowflake を使わないでください。データベースのキー、業務の番号、外部向けのランダムな識別子には、それぞれ別の仕組みを使うことがあります。ID を生成しても、認可の代わりにはなりません。

## インターフェースと実装

- [Snowflake の実装](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/snowflake/src/snowflake.ts)
- [ホストの ID のサービス](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/id-generator/provider.ts)
