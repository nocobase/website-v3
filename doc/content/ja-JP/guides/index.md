---
title: "チュートリアル"
description: "実際の業務シナリオで NocoBase 3 を実践します。Studio によるチーム連携・継続的デリバリーと、機能別のテーマ別実践を扱います。"
---

実際の業務シナリオを通して NocoBase の使い方を学びます。[Studio](../studio/index.md) で Agent やチームと要件からリリースまでを進め、[Core](../core/index.md) を基盤にデータ、画面、権限、ワークフローを実装します。

<section class="course-section">

<div class="course-section-head">

## はじめての方へ

</div>

NocoBase 3 を初めて使う場合は、まず以下の入門ガイドで最初の体験を完了してから、チーム連携やテーマ別実践へ進んでください。

<div class="course-grid">

[<span class="course-title">最初のアプリを開発する</span><span class="course-description">ローカル環境で Core アプリを作成・起動し、Agent に顧客管理を実装させて権限を確認します。</span>](../getting-started/develop-your-first-app.md)

[<span class="course-title">Studio で開発を進める</span><span class="course-description">Studio で要件を提出し、Agent の開発・チェック・レビューを追って検収とマージまで体験します。</span>](../getting-started/collaborate-with-studio.md)

</div>

</section>

<section class="course-section">

<div class="course-section-head">

## [Studio で協働する](team-delivery/index.md)

[学習を始める](team-delivery/index.md)

</div>

既存プロジェクトの接続、業務担当者の参加、ルールや知見の蓄積、品質管理、安全な本番リリースまで、チームで Studio を使いこなす方法を扱います。

<div class="course-grid">

[<span class="course-title">既存プロジェクトを接続する</span><span class="course-description">既存の Core リポジトリを接続し、チェックと PR プレビューを整えてチーム開発を始めます。</span>](team-delivery/open-crm-project.md)

[<span class="course-title">業務担当者と協働する</span><span class="course-description">業務担当者が Studio で直接要件を伝え、ルール確認からプレビューでの受け入れまでを進めます。</span>](team-delivery/business-colleagues.md)

[<span class="course-title">知識と経験を蓄積する</span><span class="course-description">確定した業務ルール、設計判断、レビュー項目をナレッジベースに残し、人や Agent が変わっても基準を保ちます。</span>](team-delivery/capture-knowledge.md)

[<span class="course-title">リリース品質を管理する</span><span class="course-description">継続テスト、主要シナリオのチェック、課題追跡を組み合わせ、並行開発の品質を維持します。</span>](team-delivery/enterprise-management.md)

[<span class="course-title">本番にリリースする</span><span class="course-description">プレビューとテスト環境で検証した更新を、既存の業務データを保ったまま本番へ反映します。</span>](team-delivery/release.md)

</div>

</section>

<section class="course-section">

<div class="course-section-head">

## [テーマ別実践](core-capabilities/index.md)

[学習を始める](core-capabilities/index.md)

</div>

実行可能な完成版 CRM サンプルを主軸に、商談・見積モデリング、ワークスペース画面、権限、承認、添付・帳票、通知・定期タスク、メールから業務 AI・外部連携まで Core の各機能をテーマ別に学びます。

### アプリの基礎

<div class="course-grid">

[<span class="course-title">データモデリングとスキーマ変更</span><span class="course-description">CRM の商談・商品・見積を題材に ER モデルとデータ辞書を整理し、変更スクリプト（Migration）で増分作成してトランザクション整合性を検証します。</span>](core-capabilities/data-modeling.md)

[<span class="course-title">業務画面の構築</span><span class="course-description">UI Library と shadcn 規約に沿って CRM の営業ワークスペース、顧客一覧の絞り込み、詳細タブを構築します。</span>](core-capabilities/pages-and-ui.md)

[<span class="course-title">ロール権限とデータ範囲制御</span><span class="course-description">CRM の営業担当とマネージャー向けに操作権限、担当者別の顧客データ範囲、読み取り専用共有を設定し、画面と API の境界を検証します。</span>](core-capabilities/roles-and-permissions.md)

</div>

### ワークフローと自動化

<div class="course-grid">

[<span class="course-title">承認ワークフローと To-do センター</span><span class="course-description">CRM 見積の割引しきい値に基づく承認フローを構成し、To-do センターでの承認・差し戻し・却下とロック制御を実装します。</span>](core-capabilities/approval-workflows.md)

[<span class="course-title">定期タスク</span><span class="course-description">チームのタイムゾーンに合わせて毎日 CRM の営業日報を作成し、日付をまたぐ記録で集計対象を確認します。</span>](core-capabilities/scheduled-reminders.md)

</div>

### ファイルと帳票

<div class="course-grid">

[<span class="course-title">ファイルストレージを設定して添付ファイルを使う</span><span class="course-description">ローカルディレクトリまたは非公開の S3 バケットを設定し、顧客のアクセス権限に従って添付ファイルをアップロード・閲覧・ダウンロードします。</span>](core-capabilities/file-management.md)

[<span class="course-title">テンプレートから帳票ファイルを生成する</span><span class="course-description">下書きの見積から英語の DOCX をダウンロードし、数量を変更して合計額を確認します。確定済みの見積からは正式な見積書を発行し、再ダウンロードできます。</span>](core-capabilities/template-print.md)

</div>

### 通知とメール

<div class="course-grid">

[<span class="course-title">業務イベントとアプリ内通知</span><span class="course-description">CRM の顧客担当変更や見積承認結果に合わせてアプリ内通知を自動送信し、配信記録と権限境界を確認します。</span>](core-capabilities/notifications.md)

[<span class="course-title">メール連携と業務送受信</span><span class="course-description">営業担当の個人メールボックスを接続して CRM 連絡先アドレスでやり取りを紐付け、発行済み見積 DOCX を添付送信します。</span>](core-capabilities/email.md)

</div>

### AI とナレッジベース

<div class="course-grid">

[<span class="course-title">ナレッジベースを構築する</span><span class="course-description">CRM にナレッジベースを組み込み、商品資料・価格規定・営業トーク集をバージョン管理・検索・レビュー付きで運用します。</span>](core-capabilities/ai-assistant.md)

[<span class="course-title">業務 Agent を組み込む</span><span class="course-description">ロール権限を守る営業支援 Agent を CRM に組み込み、顧客・商談の照会、やり取りの要約、日常業務の推進を支援します。</span>](core-capabilities/business-agent.md)

</div>

### データ取込と外部連携

<div class="course-grid">

[<span class="course-title">データ一括インポートとバックグラウンド処理</span><span class="course-description">バックグラウンドジョブとトランザクション検証を組み合わせ、CRM の顧客・連絡先データを一括取り込みし、重複処理とエラー報告を整えます。</span>](core-capabilities/data-import.md)

[<span class="course-title">外部 API とシステム連携</span><span class="course-description">API キーと標準エンドポイントで外部リード取り込みや ERP・会計システムとの受注・見積同期を設計し、冪等性と異常処理を整えます。</span>](core-capabilities/external-integrations.md)

</div>

</section>
