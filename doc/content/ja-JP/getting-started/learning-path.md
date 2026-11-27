---
title: 学習の進め方
metaDescription: "ドキュメントの全体像を確認し、アプリ開発、Studio での協働、実践プロジェクト、デプロイ・保守など目的に合わせた読み方を選びます。"
---

## ドキュメントの全体像

| セクション | 内容 | 読む場面 |
| --- | --- | --- |
| [はじめに](what-is-nocobase.md) | 製品紹介、最初のアプリ開発、Studio をすばやくインストール、Studio での協働、学習の進め方 | NocoBase 3 に初めて触れるとき |
| [Core マニュアル](../core/index.md) | Core の紹介、アプリ開発、組み込み機能とプラグイン、プラグイン開発、フレームワークの仕組み、マルチアプリ構成、デプロイと運用、リファレンス | 開発・保守している機能を調べるとき |
| [Studio マニュアル](../studio/index.md) | インストールと設定、メンバー参加、タスク開発、プロジェクト管理、エージェント管理、品質管理、リリース管理、システム管理、リファレンス | 今のタスクや操作に合わせて調べるとき |
| [実践プロジェクトチュートリアル](../guides/build-reliable-enterprise-apps.md) | 環境準備とエージェント選定、Core でのアプリ開発、Studio での協働、ベストプラクティス、付録 | ひとつのプロジェクトを通して順を追って実践したいとき |
| [FAQ](../faq/index.md) | Vibe Coding やローコードとの違い、V2 と V3 の関係、技術スタック、開発と連携、デプロイと保守 | 選定時の比較やよくある疑問を調べるとき |

## 最初のステップを完了する

まず [NocoBase 3 とは](what-is-nocobase.md)を読んでアプリケーション基盤（Core）とワークスペース（Studio）の関係を把握したうえで、今やりたいことに合わせて入口を選んでください。

- **ローカルのコーディングツールで最初のアプリを作る**：[最初のアプリを開発する](develop-your-first-app.md)に沿ってローカル環境にアプリケーション基盤を初期化し、顧客管理機能を開発してロールごとの権限を確認してから改修を進めます。
- **自分の PC で Studio を手軽に試す**：[Studio をすばやくインストール](quick-install-studio.md)に沿って、1 つのコマンドで無料の Studio コミュニティ版と最初のプロジェクトをセットアップします。
- **チームの Studio で要件をデリバリーする**：[Studio で協働開発する](collaborate-with-studio.md)から 1 つの要件を通して体験します。チーム向けにワークスペースを新規構築する場合は、先に[インストールの概要](../studio/setup/index.md)へ進んでください。

それぞれの入口に必要な前提条件がまとめられているため、あらかじめマニュアル全体を読み通す必要はありません。台帳、承認、権限、デプロイ、チーム協働までを一貫して体験したい場合は、[NocoBase 3 で信頼できるエンタープライズアプリを構築する](../guides/build-reliable-enterprise-apps.md)から始めることもできます。

## アプリの開発と拡張を深める

アプリが動くようになったら、[アプリ開発の概要](../core/developing-apps/overview.md)で機能構成を把握し、[プロジェクト構成](../core/developing-apps/project-structure.md)でファイルの配置を確認します。アプリ開発マニュアルでは、画面とインタラクション、サービスと API、データと権限、バックグラウンドジョブ、CLI、テストを網羅しています。

認証、ファイル、通知などの共通機能を使うときは[組み込み機能とプラグイン](../core/using-plugins/overview.md)を、機能を独立して保守したり複数アプリ間で再利用したりするときは[プラグイン開発](../core/extension-development/when-to-write-a-plugin.md)を参照してください。ランタイム、サービスコンテナ、HTTP、データベースといった内部の仕組みを理解したい場合は[フレームワークの概要](../core/framework/overview.md)へ進みます。

## Studio を利用・管理する

- **メンバーの日常業務**：[要件の提出](../studio/use/raise-a-request.md)と[セッション](../studio/use/sessions.md)から始め、必要に応じて[進捗を追う](../studio/use/follow-progress.md)、[質問に回答する](../studio/use/answer.md)、[タスクを検収する](../studio/use/accept.md)を参照します。
- **プロジェクト責任者**：[プロジェクト設定](../studio/project/settings.md)、[ナレッジベース](../studio/project/knowledge-base.md)、[プロジェクトメモリー](../studio/project/project-memory.md)、[プロジェクトの進捗](../studio/project/progress.md)を確認し、続けて[チェックとレビュー](../studio/project/checks-and-review.md)や[リリース管理](../studio/release/overview.md)へ進みます。
- **管理者**：[インストールの概要](../studio/setup/index.md)を終えたあと、必要に応じて[エージェント](../studio/configure/agents.md)、[ランタイム](../studio/configure/runtimes.md)、[スキル](../studio/project/skills.md)、[使用量](../studio/project/usage.md)、[メンバーとロール](../studio/admin/members-and-roles.md)、[アップグレードとバックアップ](../studio/admin/upgrade-and-backup.md)を管理します。

ステータス、権限、エージェントの実行ルール、コマンド、設定項目は Studio のリファレンスにまとまっています。

## 実践プロジェクトチュートリアルを進める

[NocoBase 3 で信頼できるエンタープライズアプリを構築する](../guides/build-reliable-enterprise-apps.md)では、IT 資産管理アプリを題材に、環境準備、設計、デバイス台帳、申請と承認、ロールと権限、検収、デプロイまでを順に構築し、そのうえで Studio によるチーム協働、ノウハウの蓄積、本番リリースへ進みます。

ひとつのプロジェクトを通して体系的に学びたい方に適したルートです。すでに最初のステップを終えている場合は、自分の進度に合った章から読み進め、個別の仕組みは各マニュアルで確認してください。

## デプロイ・保守・リファレンス

アプリを外部のユーザーに公開する準備ができたら、まず[デプロイ方法を選ぶ](../core/deployment/choose-a-deployment-method.md)を読み、更新時は[アプリの新バージョンをリリースする](../core/deployment/publish-app-release.md)に沿って配信します。データベース環境については[データベースの対応状況とバージョンの互換性](../core/developing-apps/compatibility.md)および[異なるデータベースでアプリを作成する](../core/developing-apps/database-configuration.md)を参照してください。

コマンドや設定値を調べたいときは、Core の[コマンドラインリファレンス](../core/reference/cli.md)と[設定リファレンス](../core/reference/configuration.md)、または Studio の [CLI](../studio/reference/cli.md)、[ランナーコマンド](../studio/reference/runner.md)、[設定](../studio/reference/config.md)を直接参照してください。
