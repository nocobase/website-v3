---
title: 学習の進め方
metaDescription: "ドキュメントの全体像と、アプリ、Studio、プロジェクト全体、デプロイの学習ルートを確認します。"
---

## ドキュメントの全体像

| セクション | 内容 | 読む場面 |
| --- | --- | --- |
| [はじめに](what-is-nocobase.md) | 基本概念、最初のアプリ、Studio での協働、学習の進め方 | NocoBase 3 を初めて使うとき |
| [Core マニュアル](../core/index.md) | アプリ開発、プラグイン利用と開発、フレームワーク、デプロイ、リファレンス | 開発や保守の対象機能を調べるとき |
| [Studio マニュアル](../studio/index.md) | インストール、参加、タスク、プロジェクト、エージェント、品質、リリース、システム管理、リファレンス | 自分の役割に応じた操作を調べるとき |
| [プロジェクトのチュートリアル](../guides/build-reliable-enterprise-apps.md) | 環境とエージェントの選択、Core での開発、Studio での協働、ベストプラクティス、付録 | プロジェクトを通して順に実践するとき |
| [FAQ](../faq/from-v2.md) | NocoBase 2 と 3 の違い、機能の対応、移行 | バージョン間の関係を確認するとき |

## 最初のハンズオンを完了する

[NocoBase 3 とは](what-is-nocobase.md)で、アプリ基盤、開発のガバナンス、業務アプリの関係を理解します。

- 自分でアプリを作る場合：[最初のアプリを開発する](develop-your-first-app.md)で作成、起動、顧客管理の開発を行い、役割ごとの権限を確認してから改善を続けます。
- Studio のチームに参加する場合：[Studio で協働開発する](collaborate-with-studio.md)へ進めます。環境が未準備なら、管理者は[インストールと設定](../studio/setup/index.md)から始めます。

各ハンズオンに前提条件があり、先にすべてのマニュアルを読む必要はありません。

## アプリを開発、拡張する

アプリが動いたら、[アプリ開発の概要](../core/developing-apps/overview.md)で機能の構成を理解し、[プロジェクト構成](../core/developing-apps/project-structure.md)でファイルを探します。開発マニュアルでは、ページと操作、サービスと API、データと権限、バックグラウンド処理、CLI、テストを扱います。

認証、ファイル、通知などは[プラグイン利用](../core/using-plugins/overview.md)、独立した保守や複数アプリでの再利用は[プラグイン開発](../core/extension-development/when-to-write-a-plugin.md)を参照します。ランタイム、コンテナ、HTTP、データベースの内部を理解したいときは[フレームワーク](../core/framework/overview.md)へ進みます。

## Studio を利用、管理する

- メンバー：[要件の提出](../studio/use/raise-a-request.md)と[セッション](../studio/use/sessions.md)から始め、[進捗の確認](../studio/use/follow-progress.md)、[質問への回答](../studio/use/answer.md)、[検収](../studio/use/accept.md)を参照します。
- プロジェクト責任者：[設定](../studio/project/settings.md)、[ナレッジベース](../studio/project/knowledge-base.md)、[プロジェクトメモリ](../studio/project/project-memory.md)、[進捗](../studio/project/progress.md)に続き、[チェックとレビュー](../studio/project/checks-and-review.md)、[リリース](../studio/release/overview.md)を参照します。
- 管理者：[インストール](../studio/setup/index.md)後、[エージェント](../studio/configure/agents.md)、[実行環境](../studio/configure/runtimes.md)、[スキル](../studio/project/skills.md)、[使用量](../studio/project/usage.md)、[メンバーと役割](../studio/admin/members-and-roles.md)、[アップグレードとバックアップ](../studio/admin/upgrade-and-backup.md)を管理します。

状態、権限、エージェントの実行ルール、コマンド、設定は Studio のリファレンスにまとまっています。

## プロジェクト全体を実践する

[信頼できる業務システムの構築](../guides/build-reliable-enterprise-apps.md)では、資産管理アプリを題材に、環境準備、設計、機器管理、申請と承認、役割、検収、デプロイを順に進めます。その後、Studio での協働、知識の蓄積、リリースを扱います。

プロジェクト全体を継続して練習したい場合に適したルートです。ハンズオンを終えている場合は、自分の経験に合う段階から読み、個別の仕組みはマニュアルで確認できます。

## デプロイ、保守、詳細の参照

利用者にアプリを渡す前に[デプロイ方法の選択](../core/deployment/choose-a-deployment-method.md)、更新時には[アプリのリリース](../core/deployment/publish-app-release.md)を読みます。データベースは[互換性](../core/reference/compatibility.md)と[データベース設定](../core/reference/database-configuration.md)を参照してください。

必要に応じて Core の [CLI](../core/reference/cli.md)と[設定](../core/reference/configuration.md)、Studio の [CLI](../studio/reference/cli.md)、[実行機のコマンド](../studio/reference/runner.md)、[設定](../studio/reference/config.md)を調べます。
