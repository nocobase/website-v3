---
title: チュートリアル
---

<p class="course-intro">実例を通して NocoBase 3 の使い方を幅広く学びます。</p>

## はじめに

AI Agent を使うと、業務アプリの最初のバージョンを短期間で作れます。業務で使い続けるには、信頼できるデータ管理と権限、明確な開発規約、そしてチームで要件や業務ルールを共有する方法も必要です。NocoBase 3 は、アプリの開発と実行を支える Core と、チームの協働を支える Studio を提供します。

[NocoBase Core](../core/index.md) は、AI による開発と業務システムの実行を支えるオープンソースのアプリ基盤です。データ、ユーザーと権限、ファイル、ワークフローなどの共通機能と、プロジェクト規約や開発 Skill を提供し、Agent による業務機能の実装を支えます。[NocoBase Studio](../studio/index.md) は、人と Agent が協働して開発するためのガバナンスプラットフォームです。タスク、チェック、レビューで協働を管理し、ナレッジベースとプロジェクトメモリーにチームの知識を蓄積します。Core だけでアプリを開発・デプロイでき、チームでの協働が必要になった段階で Studio を利用できます。

## サンプルプロジェクトから始める

同じ CRM アプリを少しずつ発展させます。営業担当者が顧客とフォロー記録を管理し、商談を記録して見積を作成します。チームではロール権限で顧客へのアクセスを制御し、承認、添付ファイル、通知、AI などの機能を追加していきます。

各レッスンでは具体的な業務要件から始め、Agent と開発する方法と結果の確認方法を説明します。クイックスタートでは顧客フォロー用のアプリを完成させ、実践編では同じプロジェクトに機能を追加します。初めての方は順番に進めてください。経験のある方は前提条件を確認してテーマを選び、サンプルの要件を自分の業務ルールに置き換えて実践できます。

## Core：業務アプリの開発

Core のレッスンはアプリテンプレートから始め、三つの領域を扱います。データモデル、関連付け、マイグレーションで業務データを整理し、ページと UI コンポーネントで操作画面を作ります。認証、権限、ワークフロー、ファイル、通知などの共通機能で業務ルールを支えます。アプリの `AGENTS.md` と開発 Skill が実装の指針となり、テストと実際の操作で結果を確認します。各機能の詳細は [Core マニュアル](../core/index.md)を参照してください。

<section class="course-section">

<div class="course-heading">

### クイックスタート

<span class="course-range">第1課〜第4課</span>

</div>

プロジェクトの作成からテストとデプロイまで、顧客フォロー用のアプリを構築します。

<div class="course-grid">

[<span class="course-title">1. アプリの作成</span><span class="course-description">Core のアプリテンプレートから始めます。</span>](create-app.md)

[<span class="course-title">2. CRM の要件を明確にする</span><span class="course-description">業務の範囲・ルール・受け入れ基準を決めます。</span>](define-requirements.md)

[<span class="course-title">3. 顧客フォロー機能の開発</span><span class="course-description">データとページの機能で顧客フォローを実装します。</span>](customers-and-follow-ups.md)

[<span class="course-title">4. アプリのテストとデプロイ</span><span class="course-description">自動テスト・ビルド・デプロイを行います。</span>](test-and-deliver.md)

</div>

</section>

<section class="course-section">

<div class="course-heading">

### 実践編

<span class="course-range">第5課〜第14課</span>

</div>

同じ CRM を題材に、関連データ、チームの権限、承認、通知、AI などの機能を学びます。

<div class="course-grid">

[<span class="course-title">5. 商談と見積のデータ設計</span><span class="course-description">データの関連付け・クエリ・マイグレーションを使います。</span>](opportunities-and-quotes.md)

[<span class="course-title">6. 営業ワークスペースの UI 構築</span><span class="course-description">UI Library で業務ページを構成します。</span>](sales-workspace.md)

[<span class="course-title">7. ロール権限と顧客アクセス制御</span><span class="course-description">認証・データ権限・共有ルールを組み合わせます。</span>](team-permissions.md)

[<span class="course-title">8. 見積承認と対応事項</span><span class="course-description">ライフサイクル・承認・対応事項を連携させます。</span>](quote-approvals.md)

[<span class="course-title">9. 添付ファイル管理と見積書生成</span><span class="course-description">ファイルストレージとテンプレート印刷を使います。</span>](attachments-and-documents.md)

[<span class="course-title">10. 業務通知とチャネル連携</span><span class="course-description">アプリ内通知で業務の結果を伝えます。</span>](notifications.md)

[<span class="course-title">11. メールボックス連携と顧客メール</span><span class="course-description">メールボックスの同期とメール送信を連携させます。</span>](email.md)

[<span class="course-title">12. 定期フォローと期限リマインダー</span><span class="course-description">定期ジョブと通知でリマインダーを送ります。</span>](scheduled-reminders.md)

[<span class="course-title">13. AI による顧客フォロー支援</span><span class="course-description">ナレッジ・モデル・業務 Agent を接続します。</span>](ai-assistant.md)

[<span class="course-title">14. 顧客インポートと API 連携</span><span class="course-description">データ API と API キーで外部システムと連携します。</span>](import-and-integrations.md)

</div>

</section>

## Studio：チームでの開発

<section class="course-section">

<span class="course-range">第 15〜19 課</span>

同じ CRM で見積バージョン比較と顧客引き継ぎを開発し、チームでルールの確認、受け入れ、公開を進めます。

<div class="course-grid">

[<span class="course-title">15. Studio に接続する</span><span class="course-description">既存リポジトリ、チェック、PR プレビューを接続します。</span>](bring-into-studio.md)

[<span class="course-title">16. Agent チームと開発する</span><span class="course-description">見積バージョン比較を開発して受け入れます。</span>](agent-team-request.md)

[<span class="course-title">17. 業務担当者と協働する</span><span class="course-description">営業責任者が顧客引き継ぎを依頼して確認します。</span>](business-colleagues.md)

[<span class="course-title">18. 知識と経験を残す</span><span class="course-description">業務ルール、チェックリスト、記憶を維持します。</span>](capture-knowledge.md)

[<span class="course-title">19. 本番に公開する</span><span class="course-description">テスト後に本番を更新し、バージョンを記録します。</span>](release.md)

</div>

</section>

## ベストプラクティス

未執筆。
