---
title: 基本概念
description: プロジェクト、タスク、セッション、エージェント、ランタイム、共有の知識、そしてコードの変更とリリースの関係。
---

Studio はタスクとコードをプロジェクト単位で整理します。人は判断して結果を検収します。エージェントは共有のスキル、業務資料、プロジェクトメモリーを使ってアプリを開発します。

<figure class="map concept-map" aria-label="プロジェクトがタスクとコードをまとめ、エージェントとランタイムが作業を実行し、共有の知識がコンテキストを提供します">
<div class="row"><div class="box brand"><b>プロジェクト</b><span>関連するタスク、リポジトリ、チームの知識</span></div></div>
<div class="down">タスクとコードは同じプロジェクトに属する</div>
<div class="row c2"><div class="box human"><b>タスク</b><span>要件、責任者、進捗、引き渡し</span></div><div class="box"><b>リポジトリ</b><span>コード、プルリクエスト、バージョン</span></div></div>
<div class="down">エージェントチームがタスクを実行し、変更を提出する</div>
<div class="row c2"><div class="box agent"><b>エージェント</b><span>コーディネーターエージェントが割り振り、実行エージェントが引き渡す</span></div><div class="box agent"><b>ランタイム</b><span>コーディングツール、モデル、実行リソース</span></div></div>
<div class="row"><div class="box knowledge"><b>スキル · ナレッジベース · プロジェクトメモリー</b><span>開発規約、業務資料、プロジェクトの経験</span></div></div>
</figure>

## プロジェクトとリポジトリ

**プロジェクト** は、タスク、メンバー、リポジトリ、ドキュメントをまとめます。プロジェクトリーダーが設定、共有の知識、リリースを管理します。

**リポジトリ** はアプリのコードを保存します。1 つのプロジェクトに複数のリポジトリを持てます。新しいリポジトリは既定で NocoBase Core で初期化されます。既存のリポジトリを接続することもできます。

![Supplier Management プロジェクトでタスクの進捗がまとめて表示され、ナレッジ、メンバー、リリースへの入口があります](https://static-docs.nocobase.com/studio-en-project-overview-20261030.png)

[最初のプロジェクトを作成する](../setup/new-project.md) と [プロジェクト設定](../project/settings.md) を参照してください。

## タスクと責任者

**タスク** には、要件、検収基準、議論、引き渡しの結果が記録されます。たとえば「仕入先の評価とランク分け」です。サブタスクで作業を分割し、先行タスクで依存関係を表します。

各タスクには **責任者** がいて、質問に答え、トレードオフを確認し、結果を検収します。コーディネーターエージェントが実行を取りまとめます。設計、開発、レビューの結果はタスクに残ります。

タスクには 6 つのステータスがあります。よくある遷移は次のとおりです。

<div class="states" aria-label="Backlog から In progress へ、In progress と In review を繰り返し、Done へ"><span class="st-pill"><span class="si backlog"></span>Backlog</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si review"></span>In review</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>Done</span></div>
<div class="states" aria-label="In progress と Blocked は繰り返すことがあり、未完了のタスクはキャンセルできます"><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>Blocked</span><span class="arrow">·</span><span>未完了のタスク</span><span class="arrow">→</span><span class="st-pill"><span class="si cancel"></span>Canceled</span></div>

**Blocked** のタスクは判断を必要としています。**In review** のタスクは検収を待っています。これらは **My issues** の先頭に表示されます。

![責任者が My issues で引き渡しレポートを読み、タスクを検収します](https://static-docs.nocobase.com/studio-en-req-accept-20261030.png)

タスクの責任者は役割上の責任であり、システムのロールではありません。エージェントは依頼者の権限の範囲内で動作します。[タスクのステータスと権限](statuses-and-permissions.md) を参照してください。

## セッション

**セッション** は、要件を相談し、タスクを作成し、結果を追跡するためのエージェントとの会話です。1 つのセッションを複数のタスクにひも付けられ、その進捗は会話に戻ってきます。

セッションは所有者だけが見られます。タスクはプロジェクトの権限に従って共有されます。

![エージェントが確認済みのルールをタスクにまとめ、会話の横に進捗が表示されます](https://static-docs.nocobase.com/studio-en-req-session-20261030.png)

[My sessions](../use/sessions.md) を参照してください。

## エージェントとランタイム

| 概念 | 役割 |
| --- | --- |
| コーディネーターエージェント | ステップを割り振り、結果を読み、責任者に質問し、作業を検収に回します。 |
| 実行エージェント | コーディングツールとモデルの組み合わせで、設計、開発、テスト、レビューを行います。 |
| ランタイム | エージェントの作業を実行するマシン、ツール、モデルを提供します。 |

![エージェントは得意分野ごとに設定され、コーディネーターエージェントにはメインとフォールバックのモデルがあります](https://static-docs.nocobase.com/studio-en-agent-team-20261030.png)

1 つのランタイムで複数のエージェントを提供でき、同じエージェントを複数のマシンで実行できます。共有ランタイムはチームに提供されます。個人ランタイムは、所有者が開始したタスクだけを実行します。

![Runtimes には、マシン、利用できるコーディングツール、共有範囲が一覧表示されます](https://static-docs.nocobase.com/studio-en-shared-runtimes-20261030.png)

実行のたびに、処理内容、結果、使用量を含む **実行記録** が作成されます。1 つのタスクには通常、複数の実行があります。

[エージェントチームの仕組み](agent-execution.md) と [ランタイムを接続する](../setup/shared-runtimes.md) を参照してください。

## スキル、ナレッジベース、プロジェクトメモリー

| 概念 | 保存するもの | 例 |
| --- | --- | --- |
| [スキル](../project/skills.md) | 開発の方法と実行時の要件 | 設計の手順、レビューの基準、引き渡しレポートの形式 |
| [ナレッジベース](../project/knowledge-base.md) | チームが作成またはアップロードした業務資料 | 仕入先評価シート、購買規程 |
| [プロジェクトメモリー](../project/project-memory.md) | 確認済みのルール、経験、判断の理由 | ランク C の仕入先への発注は、金額にかかわらずすべて承認が必要 |

スキルはグローバル、プロジェクト、リポジトリのいずれにも適用できます。プロジェクトメモリーはエージェントが管理し、タスクの PR と一緒にレビュー・マージされて、以降の作業で再利用されます。

![プロジェクトメモリーに、確認済みのルールとその出典が残されます](https://static-docs.nocobase.com/studio-en-project-memory-20261030.png)

## PR、環境、バージョン

**PR**（プルリクエスト）は、タスクとコードの変更をひも付けます。エージェントがコードを提出し、チェックとレビューを済ませます。責任者が結果を検収してマージします。

**プレビュー環境とテスト環境** のアプリは、Studio の子プロセスとして動作し、変更を検証します。

| 環境 | 用途 |
| --- | --- |
| PR プレビュー | CI が作成し、マージ前に変更を検証します |
| テスト環境 | マージ済みのコードを動かし、まとめた変更を検証します |

**本番環境** は、イメージをビルドして自社のインフラにデプロイします。Studio は本番バージョンを記録しますが、本番環境へのデプロイは行いません。

**バージョン** は、リリースラインに一致するリポジトリのタグから作られるリリースを表します。Studio はバージョンをそのタスクと成果物にひも付けます。

![Releases でバージョンとタスクがひも付けられ、テスト環境・本番環境での状況が表示されます](https://static-docs.nocobase.com/studio-en-releases-20261030.png)

タスクが完了したら、バージョンとデプロイ記録を見て、本番に反映されているかを確認します。[リリースの概要](../release/overview.md) を参照してください。
