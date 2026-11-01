---
title: バックグラウンドジョブとエグゼキューター
---

HTTP リクエストより長く続くべき作業には `@nocobase/jobs` を使います。`@nocobase/app-server/jobs` から `jobExecutorServiceToken` を解決し、プラグインや業務領域の範囲を持つエグゼキューターを取得します。

## ジョブを定義する

タスクはサーバーのディレクトリに置きます。たとえば `server/jobs/count-orders-job.ts` です。

```ts
import { Job, type JobExecutionContext } from '@nocobase/jobs';

export class CountOrdersJob extends Job<{ orderIds: string[] }> {
  static readonly jobName: string = 'orders.count';

  async execute(context: JobExecutionContext): Promise<void> {
    context.signal.throwIfAborted();
    for (let index = 0; index < this.payload.orderIds.length; index += 1) {
      context.signal.throwIfAborted();
      await context.reportProgress(
        ((index + 1) / this.payload.orderIds.length) * 100,
      );
    }
  }
}
```

ペイロードは永続化される JSON の値で、試行のたびに新しいインスタンスが作られます。接続、コンテナ、関数、`Date`、`bigint`、`undefined` ではなく、レコードの ID と必要なパラメーターを渡します。日付は ISO 文字列で表します。

## 登録して投入する

アプリまたはプラグインのホストの `app.container` を起動のコードに渡し、公開のトークンで共有のサービスを解決します。

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ServiceResolver } from '@nocobase/service-provider';
import { CountOrdersJob } from './count-orders-job.js';

export async function startOrderJobs(container: ServiceResolver) {
  const service = container.resolve(jobExecutorServiceToken);
  const executor = service.getJobExecutor('@example/orders');
  executor.registerJob(CountOrdersJob);
  await executor.setup();
  const receipt = await executor.addJob(
    new CountOrdersJob({ orderIds: ['order-1', 'order-2'] }),
  );
  return { executor, receipt };
}
```

すべてのコンシューマーのプロセスは、`setup()` の前にタスクのクラスを登録します。投入側で登録しても、リモートのワーカーには登録されません。投入だけを行うプロセスでは `setup({ consume: false })` を呼び出せます。アプリでは、Provider の起動時にエグゼキューターを初期化し、ルートや業務サービスから投入し、後片付けで `shutdown()` を待ちます。

受付記録は受け付けたことを示すだけで、完了したことは示しません。アプリの名前空間、エグゼキューターのスコープ、固定の `jobName` が、永続化された作業を識別します。保留中のタスクがまだそれに依存している間は、名前を変えないでください。

## アプリとプラグインの役割

アプリは jobs の設定とアダプターを提供します。プラグインは固定のパッケージのスコープを使い、自分のジョブを登録します。この例では、流れを示すために初期化と 1 回の投入をまとめています。実際の組み込みでは、エグゼキューターを保持し、業務上のイベントが起きたときに投入します。プラグインが閉じるのは自分のエグゼキューターで、共有のホストの Jobs サービスではありません。

ジョブの投入は、業務のデータベースのトランザクションと自動でアトミックになるわけではありません。失ってはならない作業には、永続的な保留中のレコードやアウトボックスと、冪等な消費が必要です。[アプリのバックグラウンドタスク](../../developing-apps/background-tasks.md) と、完全な [プラグインの Provider の例](../../extension-development/background-jobs.md) を参照してください。

## ストレージ、失敗、終了

メモリは開発に向いており、分散したコンシューマーには Redis を使います。メモリでは、プロセスがクラッシュしたあとの復旧は保証できません。Redis の永続性も、永続化と追い出しの設定に依存します。

再試行によって業務操作が繰り返されることがあるため、外部の呼び出しとデータベースへの書き込みは冪等にしてください。`reportProgress()` は進捗を報告するもので、業務の完了を正式に示すものではありません。ローカルのイベントは永続的なタスクの履歴ではありません。中止の `signal` を確認し、依存するリソースが閉じる前に後片付けを終えてください。

定期的な作業については [スケジュール](scheduling.md) を、チャネルと低レベルの投入・消費の制御については [キュー](queues.md) を参照してください。

## インターフェースと実装

- [ジョブの取り決めと実行](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
- [ホストのジョブサービス](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/jobs/index.ts)
- [ホストのサービスの取り決め](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/jobs/token.ts)
