---
title: バックグラウンドジョブと定期実行
description: バックグラウンドジョブを定義して投入し、スケジュール、再試行、正常な復旧を設定し、実行のバックエンドを選びます。
---

`JobExecutor` を使うと、業務の入口がリクエストを受け付けたことだけを返し、レポートはバックグラウンドで生成できます。`ScheduleExecutor` を使うと、一定の間隔や毎日の指定時刻に作業を起動できます。レポートの生成、繰り返し実行への対処、結果の保存は業務コードが担います。

[注文レポートの例](https://github.com/nocobase/docs-examples-v3/tree/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks) は、固定の注文データから実際の CSV ファイルを生成します。サーバーだけの単独のアプリで、ページ、データベース、商用プラグインなしにコマンドで実行します。インストールについては [サンプルのソースとセットアップ](#サンプルのソースとセットアップ) を参照してください。

## 実行モデルを選ぶ

| 必要なこと | 方法 |
| --- | --- |
| 現在のリクエストで業務の結果を受け取る必要がある | 業務サービスを直接呼び出す |
| 作業を一度投入し、あとで完了させてよい | `Job` と `JobExecutor` |
| アプリのコードで、定期的な片付け、集計、同期を宣言する | `ScheduleExecutor` |
| 管理者がルールを有効にし、実行記録を確認する必要がある | [定期タスクプラグイン](../using-plugins/automation/scheduler.md) |

アプリの既存のサービスは、`@nocobase/app-server/jobs` の `jobExecutorServiceToken` で解決します。通常のジョブとスケジュールは `jobs` の設定を使います。遅延投入や優先度などのメッセージングの機能については [キュー](../framework/background/queues.md) を参照してください。キューは別の設定を使います。

## バックグラウンドジョブを定義して投入する

### ジョブとそのパラメーターを定義する

ジョブは `server/jobs/report-job.ts` で定義します。`jobs/` ディレクトリはアプリの慣習で、中身が自動でスキャンされたり登録されたりはしません。

```ts
import { Job, type JobExecutionContext } from '@nocobase/jobs';

export interface ReportPayload {
  readonly reportId: string;
  readonly stepMs: number;
  readonly failure: 'none' | 'first' | 'always';
}

export type GenerateReport = (
  payload: ReportPayload,
  context: JobExecutionContext,
) => Promise<void>;

export function createReportJob(generateReport: GenerateReport) {
  return class ReportJob extends Job<ReportPayload> {
    static readonly jobName: string = 'reports.generate';

    async execute(context: JobExecutionContext): Promise<void> {
      context.signal.throwIfAborted();
      await generateReport(this.payload, context);
    }
  };
}
```

`reportId` は 1 つの業務レポートを識別します。`stepMs` と `failure` は、遅い処理と失敗を再現するためのデモ用の制御です。業務のペイロードに含める必要はありません。ジェネレーターは 3 件の固定の注文を処理し、1 件ごとに進捗を報告して、ファイルを書き込みます。

ペイロードには JSON のデータだけを含めます。関数、データベースの接続、リクエストのオブジェクト、`Date` のインスタンスは渡さないでください。日付は ISO 文字列にシリアライズします。投入時にペイロードのスナップショットが取られ、実行の試行ごとに新しいジョブのインスタンスが作られます。インスタンスのフィールドで、再試行の回数や復旧の進捗を保つことはできません。

`createReportJob()` はこの例独自のファクトリー関数です。そのクロージャーが業務の依存関係を結び付けており、フレームワークの注入の API ではありません。ジョブのコンストラクターが受け取るのは、引き続きペイロードだけです。`jobName` は空白やコロンを含まない固定の名前にし、すべてのコンシューマーのプロセスで対応するクラスを登録します。

[ジョブの定義](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/jobs/report-job.ts) · [レポートのジェネレーター](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

### Provider で登録して起動する

`server/providers/reports.ts` の `register()` は、レポートのサービスを `reportJobsToken` に結び付けます。

```ts
override register(): void {
  this.app.container.singleton(reportJobsToken, () => new ReportJobs());
}
```

`start()` はジョブのクラスを作成し、エグゼキューターを起動します。この抜粋は起動部分を示しています。完全な Provider には、インポート、フィールドの宣言、失敗時の後片付けが含まれます。

```ts
const executors = this.app.container.resolve(jobExecutorServiceToken);
const reports = this.app.container.resolve(reportJobsToken);
const config = this.app.config.get<ReportsConfig>('reports')!;
const ReportJob = createReportJob((payload, context) =>
  generateReport(this.app.paths.storage('reports'), payload, context),
);

this.jobs = executors.getJobExecutor('app.reports');
this.schedules = executors.getScheduleExecutor('app.reports.schedule');
this.unsubscribe = this.jobs.subscribe((event) => reports.record(event));

this.jobs.registerJob(ReportJob);
await this.jobs.setup({ consume: config.consume });
reports.attach(this.jobs, ReportJob, this.schedules);
if (config.schedule) await reports.schedule(config.schedule);
await this.schedules.setup({ consume: config.consume });
```

`reports` の設定は既定で `consume: true` を使います。通常のジョブは `setup()` の前に登録してから投入を受け付けると、以前の実行で残ったタスクをワーカーが処理できます。投入だけを行うプロセスでは `setup({ consume: false })` を使えます。最初の `setup()` で消費のモードが決まり、以降の呼び出しで切り替わることはありません。`pnpm test` の投入専用のケースでは、投入側が終了したあとに新しいコンシューマーが作業を実行する様子を示しています。[テストを見る](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/tests/reports.test.ts)。

`app.reports` はエグゼキューターの業務上のスコープです。アップグレード後も既存の作業を見つけられるよう、アプリの名前空間、スコープ、ジョブの種類の名前は固定にしておきます。

既定のテンプレートのアプリでは、既存の `server/providers/index.ts` の配列に `ReportsProvider` を追加し、それが読み取る `reports` の設定を追加します。テンプレートの Jobs サービスを使い、`SubmissionProvider` を含む既存の Provider は残してください。テンプレートの beta.85 は、期限切れの受付記録を毎時片付ける処理をすでに登録しているので、改めて追加しないでください。Provider の一般的な使い方は [サーバー側のサービス](server-business-services.md) を参照してください。

[Provider の全体](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/providers/reports.ts) · [サンプルのアプリの入口](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/app.ts)

### ジョブを投入して進捗を確認する

`server/reports/service.ts` の `ReportJobs.enqueue()` は、ペイロードを準備して検証し、`addJob()` で投入します。

```ts
const payload: ReportPayload = {
  reportId,
  stepMs: 30,
  failure: 'none',
  ...options,
};
validatePayload(payload);
if (!this.jobs || !this.ReportJob)
  throw new Error('Report jobs are not ready.');
return this.jobs.addJob(new this.ReportJob(payload));
```

起動後、Provider は `attach()` で `this.jobs` と `this.ReportJob` を渡します。コマンドはこのサービスを解決します。

```ts
const reports = app.container.resolve(reportJobsToken);
const receipt = await reports.enqueue('order-summary');
console.log('Accepted:', receipt.jobId);
```

`addJob()` を呼び出すたびに、新しいジョブ ID が発行されます。`reportId` を再利用しても、エグゼキューターが投入の重複を取り除くわけではありません。

受付記録には `jobId`、`jobName`、`enqueuedAt` が含まれます。これはバックエンドが受け付けたことを示すだけです。HTTP の入口では `202` とジョブ ID を返せますが、認証、認可、入力は入口で確認する必要があります。バックグラウンドジョブはブラウザーの身元を引き継ぎません。ユーザーのジョブには、実行時に信頼できる実行者と明示的な認可の範囲が必要です。サンプルのコマンドはローカルの運用担当者として実行され、HTTP のインターフェースは公開しません。

`pnpm demo manual` を実行します。受け付けられたジョブ ID が表示され、完了後に CSV の内容が表示されます。ファイルは、コマンドが表示したディレクトリの下の `storage/reports/order-summary.csv` にあります。

```csv
orderId,customer,total
ORD-1001,Cedar Books,120
ORD-1002,Harbor Supply,75
ORD-1003,Maple Market,210
```

[投入のサービス](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts) · [コマンドの入口](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/scripts/demo.ts)

ジェネレーターは、実行のコンテキストを通じて 0 から 100 までの進捗を報告します。1 件の注文を処理するたびに、次を呼び出します。

```ts
await context.reportProgress((index + 1) * 30);
```

ファイルを公開したあとに `100` を報告します。Provider は消費が始まる前に購読します。

```ts
this.unsubscribe = this.jobs.subscribe((event) => reports.record(event));
```

`JobStart`、`JobProgress`、`JobEnd`、`JobError` は、現在のインスタンスが実行した試行を表します。タスクは `jobId` で対応付け、開始は `attempt` で区別します。`JobError` のあとに再試行が続くことがあり、その場合は進捗が最初からやり直されます。

`pnpm demo manual` は次の実行イベントを表示します。

```text
JobStart attempt=1
JobProgress attempt=1 progress=30
JobProgress attempt=1 progress=60
JobProgress attempt=1 progress=90
JobProgress attempt=1 progress=100
JobEnd attempt=1
```

この例では、コマンドの出力用に、上限のあるメモリ上の配列にイベントを保持しています。再起動すると消えます。インスタンスをまたいだ状態や実行の履歴が必要な場合は、業務レコードを保存してください。イベントの配列も進捗の割合も、永続的な業務の結果ではありません。

[進捗の報告](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts) · [イベントの記録](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

## 定期実行を設定する

### 一定の間隔で実行する

`ScheduleExecutor.addJob()` は、ハンドラーとルールを固定の名前で登録します。これは `server/reports/service.ts` の `ReportJobs.schedule()` です。`scheduleName` は `order-summary` に固定され、`ScheduleJobOption` は `@nocobase/jobs` からインポートします。

```ts
async schedule(options: ScheduleJobOption) {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.addJob({
    name: scheduleName,
    options,
    payload: {},
    execute: async ({ scheduledAt, signal }) => {
      signal.throwIfAborted();
      await this.enqueue(`scheduled-${scheduledAt.getTime()}`);
    },
  });
}
```

Provider は、スケジュールのエグゼキューターの `setup()` を呼び出す前にルールを宣言します。起動時に、消費が始まる前にルールが書き込まれます。`scheduledAt` は予定された起動時刻で、実際の実行はそれより遅れて始まることがあります。この例では、その予定時刻での繰り返しの投入が同じ業務の結果になるよう、レポート ID にそれを含めています。

間隔を指定するには、`every` をミリ秒で渡します。

```ts
await reports.schedule({ every: 200, limit: 2 });
```

`pnpm demo interval` を実行します。ルールが 2 回起動して 2 つのレポートを生成し、`Completed reports: 2` と表示されます。`limit` が制限するのは予定された起動の回数で、通常のジョブの再試行の回数ではありません。

スケジュールのハンドラーが成功したことは、レポートが投入されたことを意味するだけで、レポートの生成はあとで失敗することがあります。コマンドは、ジョブが終了してからレポートを数えます。短い定期的な操作であれば、別のジョブを投入せずに、スケジュールのハンドラーから業務サービスを直接呼び出せます。

[ルールとハンドラーのソース](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

### Cron とタイムゾーンで実行する

選んだタイムゾーンで、毎日 02:00 にレポートを生成するには次のようにします。

```ts
await reports.schedule({ cron: '0 2 * * *', tz: 'Asia/Shanghai' });
```

タイムゾーンは業務の IANA タイムゾーンに置き換えます。省略すると、サーバーのローカルのタイムゾーンではなく UTC が使われます。Cron は 5 つまたは 6 つのフィールドを受け付け、`every` と組み合わせることはできません。

`pnpm demo cron` を実行すると、加速したルール `{ cron: '*/1 * * * * *', tz: 'UTC', limit: 2 }` が 2 回実行されます。`pnpm demo rules` は毎日のルールを登録し、翌日まで待たずに次の予定時刻を表示します。

[2 つの Cron のデモ](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/scripts/demo.ts)

### ルールを更新・削除する

ルールを更新するには、同じ名前で `addJob()` をもう一度呼び出します。定義が変わらなければ、既存の予定はそのまま残ります。名前を変えると古いルールが残るため、明示的に移行または削除してください。

`ReportJobs` は、同じ `scheduleName` を使い、エグゼキューターの公開 API でルールを照会・削除します。

```ts
async getSchedule() {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.getJob(scheduleName);
}

async removeSchedule() {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.removeJob(scheduleName);
}
```

サービスは、スケジュールのエグゼキューターの `getJob('order-summary')` と `removeJob('order-summary')` を呼び出します。`pnpm demo rules` を実行すると、間隔のルールを作成し、毎日の Cron のルールに更新して、`nextRunAt` を表示し、削除します。削除の受付記録には `Job removed` と表示され、その後の照会は `undefined` を返します。

`removeJob()` はルールとその保留中の起動を削除しますが、このプロセスではハンドラーの登録を残します。アプリの終了時には `shutdown()` を使い、終了のたびにルールを削除しないでください。保存されたルールには実行可能なコードが含まれないため、再起動時にはハンドラーを改めて登録します。

[ルールの管理のメソッド](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

## 失敗と繰り返し実行に対処する

`attempts` は、エグゼキューターが選んだ `jobs` の設定から来ます。既定は `1` で、最初の実行も含みます。この例では `server/config.ts` で設定しています。

```ts
import type { AppJobsConfig } from '@nocobase/app-server/jobs';

export const jobs: AppJobsConfig = {
  default: 'memory',
  memory: { adapter: 'memory', concurrency: 1, attempts: 3 },
};
```

これにより、通常の失敗に対して最大 3 回の試行が許されます。`concurrency` はエグゼキューターのワーカーごとに適用され、デプロイ全体で適用されるわけではありません。既定のテンプレートのアプリでは、既存の `server/config/jobs.ts` またはデプロイの設定にこれらの値を追加します。

デモ用のオプションで、最初の試行での失敗を起こします。

```ts
await reports.enqueue('order-summary', { failure: 'first', stepMs: 30 });
```

ジェネレーターは `context.attempt` を読み取り、試行 1 では最初の注文を処理したあとに例外を投げます。`failure: 'always'` では、毎回の試行で例外を投げます。

- `pnpm demo retry`：試行 1 は 30% で失敗し、試行 2 でレポートを生成し直して完了します。
- `pnpm demo failure`：すべての試行が失敗し、3 つの `JobError` イベントが発生して CSV は作成されません。コマンドは、この想定どおりの失敗を確認してから正常終了します。

`context.attempt` は復旧も含めた実行の開始回数を数えるもので、試行の枠を消費した通常の失敗の回数ではありません。

[再試行の設定](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/config.ts) · [失敗の制御](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

再試行、復旧、繰り返しの投入によって、業務上の影響が繰り返されることがあります。操作は冪等にしてください。同じレポートをもう一度生成しても、結果は 1 つだけ残るべきです。この例では、完全な一時ファイルを書き込んでから、ハードリンクで出力先の CSV をアトミックに作成します。同じ `reportId` の既存のファイルは変わりません。

ファイルの公開の実装は、下のソースのリンクを参照してください。データベースへの書き込み、在庫の引き当て、外部の呼び出しには、それぞれトランザクション、一意制約、冪等性キーが必要です。1 つのレポート ID は 1 つのデータのスナップショットを識別します。データの範囲が変わるときは新しい ID を使います。

`pnpm demo repeat` を実行します。2 回の投入はそれぞれ別のジョブ ID を受け取りますが、変わらない CSV が 1 つだけ残ります。業務のデータベースへの書き込みとジョブの投入も、トランザクションを共有しません。失ってはならない作業には、永続的な配信待ちのレコードと復旧のロジックが必要です。[サーバー側のサービス](server-business-services.md) を参照してください。

[ファイルの公開のロジックの全体](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

## エグゼキューターを終了し、ジョブを復旧する

まず定期的な起動を止め、次に投入の受け付けを止めてから、通常のエグゼキューターを終了します。最後の中断のイベントを受け取れるよう、イベントの購読は終了が完了するまで残しておきます。

```ts
override async shutdown(): Promise<void> {
  try {
    await this.schedules?.shutdown();
  } finally {
    this.app.container.resolve(reportJobsToken).stopAccepting();
    try {
      await this.jobs?.shutdown();
    } finally {
      this.unsubscribe?.();
    }
  }
}
```

`shutdown()` は実行中のジョブのシグナルを中止し、ハンドラーが終わるのを待ちます。業務コードを強制終了することはできません。長い処理はバッチに分け、`signal` を確認し、キャンセルに対応する処理にはそれを渡します。

未完了の作業では、キャンセル後に `signal.throwIfAborted()` を呼び出すか、シグナルが中止されている間に `JobInterruptedError` を投げます。そうすれば、通常のジョブは通常の失敗の枠を消費せずに、復旧のために保持されます。ハンドラーが正常に戻れば、ジョブはそのまま完了します。業務上の影響をすべてコミットしたあとで、中断を宣言しないでください。

この例では、中止できる遅延で遅い処理を再現しています。Node のタイマーの `AbortError` を `signal.reason` に変換し、エグゼキューターが通常の失敗ではなく中断として認識できるようにしています。

`pnpm demo recovery` を実行します。最初の進捗のイベントのあと、コマンドはアプリを終了し、同じストレージのディレクトリを使って新しいアプリを作成します。出力には次が含まれます。

```text
Interrupted during shutdown; reopening the same storage.
JobEnd, attempt 2
```

同じジョブ ID が試行 2 でレポートを生成し、進捗は最初からやり直されます。これで確認できるのは正常な復旧で、プロセスが強制終了された場合やマシンの障害後の復旧ではありません。

[終了のロジック](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/providers/reports.ts) · [キャンセルの処理](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

## 実行のバックエンドを設定する

### 単一プロセスのメモリ

Jobs のコアにはメモリが含まれています。設定が選ばれておらず、`jobs.default` もない場合も、組み込みのメモリが使われます。デプロイでの選択を明示するには、`jobs.default: memory` を設定します。

メモリは起動時に状態を読み込み、実行中はメモリ上で状態を変え、正常な終了時に `storage/jobs/` 以下に書き込みます。強制終了すると、新しい作業が失われたり、次の起動時に古い作業が再実行されたりすることがあります。複数のプロセスでジョブを分散させるのには使えず、同じ状態ファイルに並行して書き込むべきではありません。

各デモは分離したストレージのディレクトリを作成します。終了後にそのディレクトリを開き直すのは、復旧のデモだけです。[設定とパス](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/app.ts)

### 商用の Redis プラグインと複数インスタンス

> [!NOTE]
> Redis の実行バックエンドは、商用の `@nocobase/app-plugin-jobs-redis` プラグインで提供されます。基本的なジョブ、スケジュール、このページのメモリの例には必要ありません。

Redis を使う前に、プラグインの利用許可を取得し、すべての投入側とコンシューマーに Server プラグインをインストールして登録してから、`adapter: redis` の Jobs の設定を定義して選びます。接続と保持のオプションは、インストールしたプラグインのバージョンの手順に従って設定します。

`jobs.default: redis` や接続アドレスを設定するだけでは不十分です。Jobs のコアには Redis が同梱されなくなりました。登録されていない実装を選ぶと、メモリにフォールバックせずに `JobsBackendNotRegisteredError` が投げられます。古いアプリをアップグレードするときは、既存の接続、名前空間、スコープとともに `adapter: redis` を明示的に残してください。

複数インスタンスでの消費と障害からの復旧は、実際の Redis のデプロイで検証してください。メモリでの結果ではその動作は確認できません。Redis でも、業務上の影響は冪等である必要があります。バックエンドの組み込みの取り決めについては、[このリビジョンの Jobs のソースガイド](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/jobs/README.md) を参照してください。

## サンプルのソースとセットアップ

[サンプルの全体と検証の記録](https://github.com/nocobase/docs-examples-v3/tree/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks)。Node.js 24 と pnpm 11.7.0 を使います。ロックファイルで App Server `3.0.0-beta.5`、Jobs `1.0.0-beta.5`、ServiceProvider `0.0.2-beta.2` を固定しています。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 3cfe5c53612d783d038a7b2a46c7b05fda1e1c26
cd apps/background-tasks
pnpm install --frozen-lockfile
pnpm demo manual
```

`pnpm demo` と検証のコマンドは、すべて `apps/background-tasks` で実行します。別のシナリオを実行するには、各セクションのコマンドを使います。各コマンドは分離した結果のディレクトリを表示し、終了前にアプリを終了します。Web サーバーは不要です。

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

この例は実際の NocoBase の Application を使い、ハードリンクに対応した出力先のファイルシステムが必要です。`pnpm build` は TypeScript をコンパイルするだけで、デプロイ用のアーカイブは作成しません。[サンプルの README](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/README.md) には、各使い方とそのソース、コマンド、検証の対応が記載されています。
