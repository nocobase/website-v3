---
title: Studio とは
description: Studio がチームの AI 開発と引き渡しをどのように取りまとめるか、そして NocoBase Core とどのように連携するか。
---

NocoBase Studio は、チームのための AI 開発プラットフォームです。コーディングエージェント、プロジェクト管理、ソフトウェアの引き渡しをつなぎ、チームでタスク、品質基準、プロジェクトの知識を共有できるようにします。

## ローカルの AI 開発からチームでの開発へ

ローカルのコーディングエージェントは、個人のソフトウェア開発を助けます。チームではさらに、届いた要件をさばき、作業を調整し、品質を検証し、リリースを追跡する必要があります。Studio はこれらを共通のワークフローにまとめ、個人の会話や手作業での調整への依存を減らします。

### エージェント間で仕事を割り振る

Studio は Claude Code、Codex、OpenCode などのツールとモデルを接続します。[コーディネーターエージェント](agent-team.md) が、各エージェントの得意分野に応じて設計、開発、レビュー、テストを割り振ります。結果を読んで次のステップを計画します。メンバーは [Runner Agent](../join/runner-agent.md) と直接対話して、要件を相談し、タスクを進めることもできます。

![コーディネーターエージェントが、明確な目標と引き渡し要件を添えて設計作業を割り振ります](https://static-docs.nocobase.com/studio-en-req-dispatch-20261111-normal-2x.webp)

### 依頼者と進捗を共有する

業務チームや顧客からの要件は、プロジェクトのタスクになります。議論、エージェントの実行、引き渡しの結果は各タスクに残り、プロジェクトメンバーはそこで進捗を追えます。タスク責任者は **My issues** で質問に答え、結果を検収します。

![タスク責任者は My issues で引き渡しレポートを確認し、結果を検収します](https://static-docs.nocobase.com/studio-en-req-accept-20261111-normal-2x.webp)

### 継続的にテストし、問題を追跡する

チームは [品質管理](../quality/overview.md) でコアシナリオを管理し、スケジュールまたは手動でテストを実行します。エージェントは機能、権限、パフォーマンスなどの観点でチェックし、レポートに結果と根拠を残します。

見つかった問題をフォローアップタスクにひも付け、修正後のテストで確認します。テスト範囲、結果、未解決の問題はプロジェクトに残るため、チームで継続して追跡できます。

![サンプルプロジェクトの機能、権限、セキュリティ、パフォーマンス、コード品質の結果](https://static-docs.nocobase.com/studio-en-quality-sample-20261111-normal-2x.webp)

### 変更を引き渡しまで追跡する

Studio は Git プラットフォームと CI/CD に接続し、タスク、プルリクエスト、チェック、レビューをひも付けます。チェックやレビューが失敗すると、コーディネーターエージェントが修正を割り振ります。責任者は引き渡しレポートと検収基準に照らして結果を確認し、必要に応じてプレビューやテスト環境を使います。チームは [Releases](../release/overview.md) でバージョンを追跡し、本番環境へのデプロイは自分たちで行って、本番バージョンを記録します。

![Releases にはバージョンと、そのテスト環境・本番環境での状況が表示されます](https://static-docs.nocobase.com/studio-en-supplier-releases-20261111-normal-2x.webp)

### 規約と知識をチームに残す

[スキル](../project/skills.md) は、設計、開発、レビュー、テストの共通要件を定めます。[ナレッジベース](../project/knowledge-base.md) には業務資料を保存します。[プロジェクトメモリー](../project/project-memory.md) には、確認済みのルールと経験を残します。担当者やモデルが変わっても、以降のタスクはこのコンテキストを再利用できます。

![プロジェクトメモリーに、確認済みの業務ルールが以降のタスクのために残されます](https://static-docs.nocobase.com/studio-en-supplier-memory-20261111-normal-2x.webp)

### ローカルのツールはそのまま、共有リソースを使う

[nb-studio CLI](../reference/cli.md) を使えば、メンバーはいつものコーディングエージェントからタスクを作成し、要件を追加し、結果を追跡できます。Studio が共有ランタイムで実行をスケジュールするので、ローカルの会話を開いたままにしておく必要はありません。進捗と結果は Studio でチームが確認できます。

![共有ランタイムがチームにコーディングツールと実行リソースを提供します](https://static-docs.nocobase.com/studio-en-runtimes-20261111-normal-2x.webp)

## 人が判断し、エージェントが開発する

人は要件を出し、業務ルールを確認し、結果を検収し、リリースの時期を決めます。エージェントは設計、コーディング、テスト、レビューを行います。

::figure roles | 人が判断して結果を検収し、コーディネーターエージェントが作業を取りまとめます

業務ルールや設計上のトレードオフに判断が必要なとき、コーディネーターエージェントはタスク責任者に質問します。引き渡し時には、責任者がレポートと検収基準を確認し、マージするか修正を依頼します。[要件が完了するまでの流れ](how-a-request-gets-done.md) を参照してください。

## Studio が引き渡しを管理し、Core がアプリを支える

Studio はエージェントを取りまとめ、NocoBase Core の上に業務アプリを開発させます。Core はデータ、権限、ワークフロー、ファイルを提供します。エージェントはこれらの基盤の上に業務機能を開発します。

<figure class="map studio-architecture" aria-label="チームは Studio でエージェントを取りまとめ、Core 上でアプリを開発させます">
<div class="row"><div class="box team"><b>自社のチーム</b><span>機能の要望 · ルールの確認 · 検収とリリース</span></div></div>
<div class="down">Studio を通じて仕事を進める</div>
<div class="delivery"><div class="delivery-title"><b>NocoBase Studio</b><span>開発と引き渡しを管理</span></div><div class="row c2"><div class="box"><b>コーディネーターエージェント</b><span>仕事の割り振り · 結果の確認 · 判断の依頼</span></div><div class="box"><b>実行エージェント</b><span>設計 · 開発 · テスト · レビュー</span></div></div><div class="delivery-tools">プロジェクトとタスク · Git と CI/CD · スキルとプロジェクトメモリー</div></div>
<div class="down">開発、検証、引き渡し</div>
<div class="application"><div class="app-title"><b>自社の業務アプリ</b><span>業務機能と画面</span></div><div class="core-base"><b>NocoBase Core</b><span>データ · 権限 · ワークフロー · ファイル</span></div></div>
</figure>

## セルフホスト

Studio は NocoBase の商用版の一部です。Core と、NocoCRM などの Solution アプリは無料のオープンソースです。Studio と自社のアプリは自社のインフラで稼働します。コードとデータは自社が所有し、コーディングエージェントとモデルも自社で選びます。
