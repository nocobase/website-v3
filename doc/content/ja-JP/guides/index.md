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

実行可能な完成版 CRM サンプルを主軸に、商談・見積モデリング、ワークスペース画面、権限、承認、添付・帳票、通知・定期タスク、メールから業務 AI・外部連携まで Core の各機能をテーマ別に学び、末尾に高度な応用シナリオをまとめています。

<div class="course-grid">

[<span class="course-title">データモデリングとスキーマ変更</span><span class="course-description">CRM の商談・商品・見積を題材に ER モデルとデータ辞書を整理し、変更スクリプト（Migration）で増分作成してトランザクション整合性を検証します。</span>](core-capabilities/data-modeling.md)

[<span class="course-title">ワークスペースと業務画面の構築</span><span class="course-description">UI Library と shadcn 規約に沿って CRM の営業ワークスペース、顧客一覧の絞り込み、詳細タブを構築します。</span>](core-capabilities/pages-and-ui.md)

[<span class="course-title">ロール権限とデータ範囲制御</span><span class="course-description">CRM の営業担当とマネージャー向けに操作権限、担当者別の顧客データ範囲、読み取り専用共有を設定し、画面と API の境界を検証します。</span>](core-capabilities/roles-and-permissions.md)

[<span class="course-title">承認ワークフローと To-do センター</span><span class="course-description">CRM 見積の割引しきい値に基づく承認フローを構成し、To-do センターでの承認・差し戻し・却下とロック制御を実装します。</span>](core-capabilities/approval-workflows.md)

[<span class="course-title">定期タスクと期限リマインダー</span><span class="course-description">定期実行タスクで CRM の顧客フォロー予定や見積回答期限を検出し、現在の担当者へ自動でアプリ内リマインダーを送ります。</span>](core-capabilities/scheduled-reminders.md)

[<span class="course-title">業務添付ファイルとファイル管理</span><span class="course-description">CRM 顧客詳細に要件資料のアップロード・プレビュー・ダウンロードを組み込み、顧客権限に基づくアクセス制御と一時ファイル整理を行います。</span>](core-capabilities/file-management.md)

[<span class="course-title">テンプレート印刷と帳票生成</span><span class="course-description">確定済み CRM 見積から固定テンプレートで不変の DOCX 見積書を生成し、スナップショット整合性とダウンロード権限を検証します。</span>](core-capabilities/template-print.md)

[<span class="course-title">業務イベントとアプリ内通知</span><span class="course-description">CRM の顧客担当変更や見積承認結果に合わせてアプリ内通知を自動送信し、配信記録と権限境界を確認します。</span>](core-capabilities/notifications.md)

[<span class="course-title">メール連携と業務送受信</span><span class="course-description">営業担当の個人メールボックスを接続して CRM 連絡先アドレスでやり取りを紐付け、発行済み見積 DOCX を添付送信します。</span>](core-capabilities/email.md)

[<span class="course-title">ナレッジベースを構築する</span><span class="course-description">CRM にナレッジベースを組み込み、商品資料・価格規定・営業トーク集をバージョン管理・検索・レビュー付きで運用します。</span>](core-capabilities/ai-assistant.md)

[<span class="course-title">業務 Agent を組み込む</span><span class="course-description">ロール権限を守る営業支援 Agent を CRM に組み込み、顧客・商談の照会、やり取りの要約、日常業務の推進を支援します。</span>](core-capabilities/business-agent.md)

[<span class="course-title">データ一括インポートとバックグラウンド処理</span><span class="course-description">バックグラウンドジョブとトランザクション検証を組み合わせ、CRM の顧客・連絡先データを一括取り込みし、重複処理とエラー報告を整えます。</span>](core-capabilities/data-import.md)

[<span class="course-title">外部 API とシステム連携</span><span class="course-description">API キーと標準エンドポイントで外部リード取り込みや ERP・会計システムとの受注・見積同期を設計し、冪等性と異常処理を整えます。</span>](core-capabilities/external-integrations.md)

[<span class="course-title is-pending">複雑なデータ範囲と権限設定</span><span class="course-description">デフォルトアクセス範囲、制限ルール、実行時の権限管理 UI を組み合わせ、部門横断や重複付与・取り消しの判定ルールを設計します。</span>](core-capabilities/index.md#コース一覧)

[<span class="course-title is-pending">複雑な承認と複数フローの連携</span><span class="course-description">購買や経費精算などを題材に、条件分岐、合議、タイムアウト・代理承認および複数サブフローの調整を設計します。</span>](core-capabilities/index.md#コース一覧)

</div>

</section>
