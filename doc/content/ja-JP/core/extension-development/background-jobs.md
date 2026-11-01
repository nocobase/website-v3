---
title: バックグラウンドジョブとエグゼキューター
description: プラグインのお知らせの要約のジョブを定義し、アプリからエグゼキューターを取得して、登録、投入、所有するリソースの解放を行います。
---

この記事では、お知らせの要約を非同期で生成し、`server/jobs/`、Provider、アプリの Jobs のサービスをつなぎます。この例は先頭の 80 個の Unicode のコードポイントを取り出してログに記録します。AI もデータベースも使わず、タスクの管理のページも提供しません。永続的な結果が必要な場合は、ログのコールバックを業務のサービスに置き換えてください。

共通の取り決めとバックエンドについては [バックグラウンドジョブとエグゼキューター](../framework/background/jobs.md) を、定期的なルールについては [定期スケジュール](../framework/background/scheduling.md) を参照してください。プラグインのディレクトリがジョブを自動で登録することはありません。バックエンドを選ぶのはアプリです。

## 前提条件とファイル

`@nocobase/app-plugin-announcements` の既存の Server の入口を使います。アプリは、既定のテンプレートと同様に `jobExecutorServiceToken` と `loggingToken` を提供している必要があります。Client のコード、データベース、前の章のプレビューのサービスは前提ではありません。

新しいプラグインでは `server.jobs` を選べます。既存のプラグインには、Server の提供内容を保ったまま、これらのファイルと宣言を追加します。`@nocobase/jobs`、`@nocobase/app-server`、`@nocobase/service-provider` への依存を確認し、ひな形での分類と互換性のあるバージョンを保ってください。パスはプラグインのルートからの相対パスです。

## エージェントを使う場合

```text
先頭の 80 個の Unicode のコードポイントをログに記録する、お知らせの要約の非同期のジョブを追加してください。
ホストの Jobs のサービスからパッケージの範囲のエグゼキューターを取得し、処理を始める前にジョブのクラスを登録してください。
投入の機能を公開し、起動前と停止後の投入は拒否してください。ペイロードには JSON のテキストを使ってください。
自分が所有するエグゼキューターの停止は待ちますが、ホストの Jobs やログのサービスは閉じないでください。
実際のメモリーでの実行、再試行、キャンセル、起動に失敗したあとのクリーンアップを確認してください。
```

## ジョブを定義する

`server/jobs/summary.ts` を追加します。

```ts
import { Job, type JobClass, type JobExecutionContext } from '@nocobase/jobs';

export interface SummaryPayload { readonly text: string; }
export type WriteSummary = (summary: string, signal: AbortSignal) => Promise<void>;

export function createSummaryJob(writeSummary: WriteSummary): JobClass<SummaryPayload> {
  return class SummaryJob extends Job<SummaryPayload> {
    public static readonly jobName: string = '@nocobase/app-plugin-announcements/summary';
    public async execute(context: JobExecutionContext): Promise<void> {
      context.signal.throwIfAborted();
      const summary = Array.from(this.payload.text.trim()).slice(0, 80).join('');
      await writeSummary(summary, context.signal);
      await context.reportProgress(100);
    }
  };
}
```

ジョブのコンストラクターは、永続化できる JSON のペイロードだけを受け付けます。業務の依存関係は、ペイロードではなくファクトリーのクロージャーで結び付けます。キューにある作業をすべてのコンシューマーが認識できるよう、ファイルやクラスの名前を変えても、タスクの種類の名前は変えないでください。

この例は短いテキストを運びます。業務のレコードの場合は、通常 ID を運び、実行するサービスでデータを読み直して、認可とバージョンを確認します。時間のかかる操作にはキャンセルを渡します。再試行で操作が繰り返されることがあるため、業務の書き込みは冪等にする必要があります。

## エグゼキューターと投入のサービスを登録する

`server/jobs/provider.ts` を追加するか、既存のものにマージします。

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { JobClass, JobExecutor, JobReceipt } from '@nocobase/jobs';
import { createServiceToken, ServiceProvider, type ServiceContainer, type ServiceToken } from '@nocobase/service-provider';
import { createSummaryJob, type SummaryPayload } from './summary.js';

export interface AnnouncementSummaryJobs {
  enqueue(text: string): Promise<JobReceipt>;
}
export const announcementSummaryJobsToken: ServiceToken<AnnouncementSummaryJobs> =
  createServiceToken<AnnouncementSummaryJobs>('@nocobase/app-plugin-announcements/summary-jobs');

export interface AnnouncementJobsApplication { readonly container: ServiceContainer; }
export class AnnouncementJobsProvider extends ServiceProvider<AnnouncementJobsApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/jobs';
  private executor: JobExecutor | undefined;
  private SummaryJob: JobClass<SummaryPayload> | undefined;
  private accepting: boolean = false;

  public override register(): void {
    this.app.container.singleton(announcementSummaryJobsToken, () => ({
      enqueue: async (text: string): Promise<JobReceipt> => {
        if (!this.accepting || !this.executor || !this.SummaryJob) {
          throw new Error('Announcement jobs are not ready.');
        }
        if (!text.trim() || text.length > 2000) throw new Error('Invalid announcement text.');
        return this.executor.addJob(new this.SummaryJob({ text }));
      },
    }));
  }
  public override async start(): Promise<void> {
    const logger = this.app.container.resolve(loggingToken).getLogger('announcements');
    const service = this.app.container.resolve(jobExecutorServiceToken);
    this.SummaryJob = createSummaryJob(async (summary, signal) => {
      signal.throwIfAborted();
      logger.info({ summary }, 'Announcement summary generated');
    });
    this.executor = service.getJobExecutor('@nocobase/app-plugin-announcements');
    this.executor.registerJob(this.SummaryJob);
    await this.executor.setup();
    this.accepting = true;
  }
  public override async shutdown(): Promise<void> {
    this.accepting = false;
    const executor = this.executor;
    this.executor = undefined;
    this.SummaryJob = undefined;
    await executor?.shutdown();
  }
}
```

Provider は `register()` で投入の機能を公開し、`start()` でホストのサービスを解決し、ジョブのクラスを登録して、エグゼキューターを起動します。このコンシューマーが必要とするすべてのクラスは `setup()` の前に登録します。起動に失敗してもクリーンアップで見つけられるよう、エグゼキューターの参照は起動の前に保存し、投入を受け付けるのはセットアップが成功してからにします。

停止では、まず新しい投入を止め、次に自分が所有するエグゼキューターの `shutdown()` を待ちます。プラグインからホストの Jobs や Logging のサービス全体を閉じないでください。コールバックはログを記録するだけです。本番で使う場合は、再試行、キャンセル、冪等性に対応した業務の動作に置き換えてください。

## Server の Provider を提供する

既存の `server/plugin.ts` で `AnnouncementJobsProvider` をインポートし、`serviceProviders` に追加します。業務の Provider の配列がすでにある場合は、ルート、ロケール、データベースのリソース、そのほかのフィールドを保ったまま、このフィールドを使います。

```ts
serviceProviders: [...serviceProviders, AnnouncementJobsProvider],
```

`server/providers/index.ts` ですでに Jobs の Provider を集約している場合は、ここで再び追加しないでください。`jobs/` はソースを整理するだけです。以前の `queue.jobs` の宣言では、これらのタスクは見つかりません。

アプリやほかのプラグインが作業を投入できるようにするには、`server/index.ts` の既定のエクスポートを保ち、次を追加します。

```ts
export { announcementSummaryJobsToken } from './jobs/provider.js';
export type { AnnouncementSummaryJobs } from './jobs/provider.js';
```

アプリが Server の入口を登録したあと、身元、認可、入力を確認した業務の入口が `app.container.resolve(announcementSummaryJobsToken).enqueue(text)` を呼び出します。投入はルートのファクトリーの作成中ではなく、アプリの起動後に行います。CLI は、投入する前に `withApp()` の中でアプリを起動し、必要な作業を待つ必要があります。

受付の確認は、バックエンドが受け付けたことを意味し、要約が完了したことではありません。HTTP で受付の確認を返すことはできますが、それを業務の完了した結果として扱ってはいけません。状態を照会できるようにするには、タスクの記録を別に永続化します。例のエラーはサービスの例外です。HTTP と CLI の入口は、スタックトレースを返すのではなく、それぞれのエラーの取り決めに変換します。

## バックエンド、再試行、配信

`jobs` の設定はホストが所有します。既定のメモリーでの実行は、単一プロセスの開発に向いています。正常な停止での永続化は、クラッシュからの復旧を保証しません。複数プロセスのデプロイでは、共有のバックエンドと、すべてのコンシューマーに登録された同じジョブの実装が必要です。プラグインが自分のタスクのためにアプリ全体の設定を置き換えるべきではありません。

再試行で外部への影響が冪等になるわけではありません。ここではログが繰り返されてもかまいませんが、永続的な要約では、業務の ID、バージョン、一意制約で結果の重複を防ぐ必要があります。データベースのコミットとキューへの投入は 1 つのトランザクションではありません。確実な配信の考慮事項については [バックグラウンドジョブと定期実行](../developing-apps/background-tasks.md) を参照してください。定期的な起動は任意です。このチュートリアルで別のタイマーを追加するのではなく、[定期スケジュール](../framework/background/scheduling.md) を使ってください。

ジョブのコードは Server のビルドとともにプラグインの成果物に入ります。キューにある作業がまだ依存している間は、`jobName` とエグゼキューターの範囲を保ち、古いペイロードとの互換性を定義します。ファイルや表示名が変わったというだけで、これらの識別子の名前を変えないでください。

## 実行とクリーンアップを確認する

ひな形の Node のテストの環境を保ち、実際のメモリーのエグゼキューターを使います。この `tests/server/jobs.test.ts` は、状態を一時ディレクトリに保存し、ログのコールバックを観察します。直接インポートしている `@nocobase/logging` は、互換性のある開発用の依存関係として宣言します。

```ts
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { createJobExecutorService } from '@nocobase/jobs';
import { createLogging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';
import { AnnouncementJobsProvider, announcementSummaryJobsToken } from '../../server/jobs/provider.js';

it('runs accepted jobs and stops accepting after shutdown', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'announcement-jobs-'));
  const jobs = createJobExecutorService(undefined, { appName: 'test', storagePath: directory });
  const logging = createLogging();
  const log = vi.spyOn(logging.getLogger('announcements'), 'info').mockImplementation(() => {});
  const container = new ServiceContainer();
  container.instance(jobExecutorServiceToken, jobs);
  container.instance(loggingToken, logging);
  const provider = new AnnouncementJobsProvider({ container });
  provider.register();
  const submit = container.resolve(announcementSummaryJobsToken);
  try {
    await expect(submit.enqueue('Hello')).rejects.toThrow('not ready');
    await provider.start();
    const receipt = await submit.enqueue('  Hello 👋  ');
    expect(receipt.jobName).toBe('@nocobase/app-plugin-announcements/summary');
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(
      { summary: 'Hello 👋' }, 'Announcement summary generated',
    ));
    await provider.shutdown();
    await expect(submit.enqueue('Hello')).rejects.toThrow('not ready');
  } finally {
    try { await provider.shutdown(); } finally {
      try { await jobs.shutdown(); } finally {
        await logging.close();
        await rm(directory, { recursive: true, force: true });
      }
    }
  }
});
```

不正な入力、業務の失敗後の再試行、中断されたシグナル、セットアップの失敗、アプリ全体の停止の順序も確認します。ログを業務のサービスに置き換えたら、同じ業務の ID を繰り返しても結果が重複しないことを確認します。メモリーでのテストでは、Redis、複数プロセス、デプロイ環境での復旧の動作は確認できません。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

最後に、対象のアプリの認可された入口からテキストを投入し、受付の確認とログを確認して、停止後に解放済みのリソースにアクセスするタスクが残らないことを確認します。
