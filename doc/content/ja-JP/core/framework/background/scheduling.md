---
title: 定期スケジュール
---

`ScheduleExecutor` は、Cron または一定の間隔で作業を起動します。コードで定義する片付け、集計、同期に使います。運用担当者がタスクの一覧、有効・無効の切り替え、実行記録を必要とする場合は、定期タスクプラグインを使います。

## スケジュールを宣言する

`jobExecutorServiceToken` を解決し、Provider からこの起動の関数を呼び出します。

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ServiceResolver } from '@nocobase/service-provider';

export async function startOrderSchedule(
  container: ServiceResolver,
  runDigest: (signal: AbortSignal) => Promise<void>,
) {
  const service = container.resolve(jobExecutorServiceToken);
  const executor = service.getScheduleExecutor('@example/orders');
  await executor.addJob({
    name: 'daily-digest',
    payload: {},
    options: { cron: '0 2 * * *', tz: 'Asia/Shanghai' },
    execute: async ({ signal }) => runDigest(signal),
  });
  await executor.setup();
  return executor;
}
```

`runDigest` は呼び出し側が提供する業務の関数です。消費が始まるときにハンドラーが存在するよう、`setup()` の前にルールを登録します。固定の名前で既存のルールが更新されます。名前を変えても、古いルールは削除されません。

## 時刻の設定

| 設定 | 意味 |
| --- | --- |
| `cron` | 5 つまたは 6 つのフィールドの Cron 式 |
| `every` | ミリ秒単位の間隔。`cron` とは同時に使えない |
| `tz` | Cron のタイムゾーン。既定は UTC |
| `startDate` / `endDate` | スケジュールの範囲 |
| `limit` | 起動の最大回数 |
| `immediately` | Cron での最初の即時実行。開始時刻の設定に従う |

業務のタイムゾーンは明示的に宣言してください。スケジュールはリアルタイムの保証ではありません。負荷、停止時間、再試行が実際の実行に影響します。明示的な業務上の時間枠を持つ、繰り返し可能なジョブを優先してください。

## 更新と終了

`addJob()` は固定の名前でルールを作成または更新します。定義が変わらなければ、スケジュールはそのまま保たれます。変更したルールでは、今後の起動が再スケジュールされ、起動の回数の上限もやり直されることがあるため、ルールの移行は明示的に計画してください。

アプリの停止時には `shutdown()` を呼び出し、永続化されたルールは残ります。`removeJob()` は業務操作としてルールを削除するもので、プロセスの終了のたびに実行すべきではありません。並行性、再試行、保持は、ホストの jobs の設定で設定します。

ハンドラーはキャンセルを確認し、冪等であるべきです。ローカルのイベントは、全体の履歴を提供しません。履歴、権限、管理ページにはプラグインを使います。[バックグラウンドジョブ](jobs.md) を参照してください。

## インターフェースと実装

- [スケジュールのエグゼキューター](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
- [ホストのサービスの取り決め](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/jobs/token.ts)
