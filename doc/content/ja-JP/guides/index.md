---
title: "チュートリアル"
description: "実際の業務シナリオで NocoBase 3 を実践します。Studio によるチーム連携・継続的デリバリーと、機能別のテーマ別実践を扱います。"
---

実際の業務シナリオを通して NocoBase の使い方を学びます。[Studio](../studio/index.md) で Agent やチームと要件からリリースまでを進め、[Core](../core/index.md) を基盤にデータ、画面、権限、ワークフローを実装します。

<section class="course-intro">

## はじめての方へ

NocoBase 3 を初めて使う場合は、まず以下の入門ガイドで最初の体験を完了してから、チーム連携やテーマ別実践へ進んでください。

<div class="course-grid">

[<span class="course-title">最初のアプリを開発する</span><span class="course-description">ローカル環境で Core アプリを作成・起動し、Agent に顧客管理を実装させて権限を確認します。</span>](../getting-started/develop-your-first-app.md)

[<span class="course-title">Studio で協働開発する</span><span class="course-description">Studio で要件を提出し、Agent の開発・チェック・レビューを追って検収とマージまで体験します。</span>](../getting-started/collaborate-with-studio.md)

</div>

</section>

<section class="course-section">

<div class="course-section-head">

## [チーム連携と継続的デリバリー](team-delivery/index.md)

[学習を始める](team-delivery/index.md)

</div>

既存プロジェクトの接続、業務担当者の参加、ルールや知見の蓄積、品質管理、安全な本番リリースまで、チームで Studio を使いこなす方法を扱います。

<div class="course-grid">

[<span class="course-title">既存プロジェクトを Studio に接続する</span><span class="course-description">既存の Core リポジトリを接続し、チェックと PR プレビューを整えてチーム開発を始めます。</span><span class="course-status">準備中</span>](open-crm-project.md)

[<span class="course-title">業務担当者が要件に直接関わる</span><span class="course-description">業務担当者が Studio で直接要件を伝え、ルール確認からプレビューでの受け入れまでを進めます。</span>](business-colleagues.md)

[<span class="course-title">業務ルールと開発経験を蓄積する</span><span class="course-description">確定した業務ルール、設計判断、レビュー項目をナレッジベースに残し、人や Agent が変わっても基準を保ちます。</span>](capture-knowledge.md)

[<span class="course-title">Studio で品質を管理する</span><span class="course-description">継続テスト、主要シナリオのチェック、課題追跡を組み合わせ、並行開発の品質を維持します。</span><span class="course-status">準備中</span>](enterprise-management.md)

[<span class="course-title">更新をリリースしてアプリを保守する</span><span class="course-description">プレビューとテスト環境で検証した更新を、既存の業務データを保ったまま本番へ反映します。</span>](release.md)

</div>

</section>

<section class="course-section">

<div class="course-section-head">

## [テーマ別実践](core-capabilities/index.md)

[学習を始める](core-capabilities/index.md)

</div>

Core の各機能を独立したテーマごとに学びます。一般的なテーマは最新状態の完成版 CRM サンプルで動作を確認でき、複雑なテーマは購買や経費などのシナリオで扱います。

### データモデリング

<div class="course-grid">

[<span class="course-title">複数テーブルの関連設計と履歴スナップショット</span><span class="course-description">親子関係や明細テーブルをマイグレーションで設計し、マスタ更新後も過去の金額スナップショットを保持します。</span><span class="course-status">他言語版あり</span>](opportunities-and-quotes.md)

</div>

### UI 開発

<div class="course-grid">

[<span class="course-title">UI Library で業務ワークスペースを構築する</span><span class="course-description">UI Library で一覧、絞り込み、フォーム、詳細タブを組み合わせ、日常操作に適した業務画面を整えます。</span><span class="course-status">他言語版あり</span>](sales-workspace.md)

</div>

### 権限とデータ範囲

<div class="course-grid">

[<span class="course-title">ロール権限とデータ範囲制御</span><span class="course-description">ロールごとの操作権限、担当者ベースのデータ範囲、読み取り専用共有を設定して閲覧・操作範囲を制御します。</span><span class="course-status">他言語版あり</span>](team-permissions.md)

[<span class="course-title">設定可能な権限管理画面</span><span class="course-description">運用中に柔軟な権限変更が必要な業務向けに、管理者や業務責任者向けの権限管理 UI を設計します。</span><span class="course-status">計画中</span>](core-capabilities/index.md#権限とデータ範囲)

[<span class="course-title">複雑なデータ範囲と権限ルール</span><span class="course-description">部門横断・複数条件のデータ範囲と、権限の重複付与・取り消し時の評価ルールを設計します。</span><span class="course-status">計画中</span>](core-capabilities/index.md#権限とデータ範囲)

</div>

### ワークフローと承認

<div class="course-grid">

[<span class="course-title">承認ワークフローと To-do センター</span><span class="course-description">業務伝票の承認フローを構成し、To-do センターで承認・差し戻し・却下とステータス反映を行います。</span><span class="course-status">他言語版あり</span>](quote-approvals.md)

[<span class="course-title">複雑な承認ルール</span><span class="course-description">購買や経費精算などを題材に、条件分岐、合議、差し戻し再申請、タイムアウト、引き継ぎと代理承認を設計します。</span><span class="course-status">計画中</span>](core-capabilities/index.md#ワークフローと承認)

</div>

### ファイルと帳票印刷

<div class="course-grid">

[<span class="course-title">業務添付ファイルとファイル管理</span><span class="course-description">業務レコードへのファイル添付・プレビュー・ダウンロードを組み込み、権限検証と一時ファイル整理を行います。</span><span class="course-status">他言語版あり</span>](file-management.md)

[<span class="course-title">テンプレート印刷と帳票生成</span><span class="course-description">固定テンプレートから確定済み伝票の不変な DOCX ファイルを生成し、プレビューとダウンロードに対応します。</span><span class="course-status">他言語版あり</span>](template-print.md)

</div>

### 通知と定期タスク

<div class="course-grid">

[<span class="course-title">業務イベントとアプリ内通知</span><span class="course-description">担当変更や承認結果の更新に合わせてアプリ内通知を自動送信し、配信記録と権限境界を検証します。</span><span class="course-status">他言語版あり</span>](notifications.md)

[<span class="course-title">定期タスクと期限リマインダー</span><span class="course-description">定期実行タスクで期限の近い項目や未処理レコードを検出し、現在の担当者へ自動でリマインダーを送ります。</span><span class="course-status">他言語版あり</span>](scheduled-reminders.md)

</div>

### メール

<div class="course-grid">

[<span class="course-title">メール連携と業務送受信</span><span class="course-description">個人メールボックスを接続して連絡先アドレスでやり取りを紐付け、業務画面から添付付きメールを送信します。</span><span class="course-status">他言語版あり</span>](email.md)

</div>

### 業務 AI

<div class="course-grid">

[<span class="course-title">アプリ内業務 Agent の組み込み</span><span class="course-description">ロール権限に従って業務データを扱えるアプリ内 Agent を組み込み、日常業務を支援します。</span><span class="course-status">準備中</span>](business-agent.md)

[<span class="course-title">ナレッジベースと AI による業務支援</span><span class="course-description">業務データと対応履歴をもとに、AI で要約や次のアクション案を作成します。</span><span class="course-status">準備中</span>](ai-assistant.md)

</div>

### データ取り込みとシステム連携

<div class="course-grid">

[<span class="course-title">データ一括インポート</span><span class="course-description">外部スプレッドシートの業務データを一括検証・取り込みし、重複処理、エラー報告、ロールバックを整えます。</span><span class="course-status">準備中</span>](data-import.md)

[<span class="course-title">外部 API とシステム連携</span><span class="course-description">標準 API で ERP や会計などの外部システムと連携し、データ同期、冪等性、エラー処理を設計します。</span><span class="course-status">準備中</span>](external-integrations.md)

</div>

</section>
