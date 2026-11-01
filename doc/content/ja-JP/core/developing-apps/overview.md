---
title: アプリ開発の概要
description: NocoBase アプリを構成する部分、業務機能の実装方法、コードの置き場所、エージェントとの開発方法を理解します。
---

NocoBase Core とそのプラグインは、データベース、サーバー、クライアント、認証、権限などの機能を含む、業務アプリの基盤を提供します。開発者はこれらの機能を直接使い、基盤をゼロから作ることなく業務機能に集中できます。

コードを自分で書くことも、AI エージェントに要件から機能を開発してもらうこともできます。

## アプリは何で構成されているか

NocoBase アプリは、主に次の部分で構成されます。

| 部分 | 役割 |
| --- | --- |
| クライアント | ページ、フォーム、一覧、操作を作る |
| サーバー | API を提供し、業務ロジックを処理する |
| データベース | データ構造を定義し、業務データを保存する |
| プラグイン | 認証、権限、ファイル、通知など、すぐに使える機能を提供する |
| 設定 | データベースの接続、サービスのパラメーターなどの設定を管理する |

これらの部分は必要に応じて組み合わせます。すべての機能がすべての部分にかかわるわけではありません。

## 業務機能はどう実装されるか

CRM システムで顧客を作成する場合を考えます。

<div class="states" aria-label="顧客作成の流れ"><span>顧客情報を入力</span><span class="arrow" aria-hidden="true">→</span><span>API を呼び出す</span><span class="arrow" aria-hidden="true">→</span><span>業務ルールを適用</span><span class="arrow" aria-hidden="true">→</span><span>データベースに保存</span><span class="arrow" aria-hidden="true">→</span><span>ページを更新</span></div>

NocoBase では、通常、業務固有の部分だけを実装すれば済みます。

- **クライアント**：顧客のフォームと顧客一覧を作る。
- **サーバー**：顧客作成の API、権限チェック、業務ルールを実装する。
- **データベース**：顧客のデータ構造を定義する。
- **プラグイン**：既存の認証と権限の機能を再利用する。

## コードはどこに置くか

NocoBase アプリは、責任ごとにコードを整理します。

```tree
my-app/
├── client/       # ページ、コンポーネント、ルート
├── server/       # API と業務のサービス
├── database/     # マイグレーションと初期データ
├── tests/        # テスト
└── config.yml    # アプリの設定
```

機能に応じた適切なディレクトリにコードを書きます。新しいページ、API、サービスは、それぞれの登録の入口からアプリに接続します。

詳しくは [プロジェクト構成](project-structure.md) を参照してください。

## エージェントと開発する

NocoBase は、人とエージェントが協力してアプリを開発することを支援します。

一般的なワークフロー：

<div class="states" aria-label="エージェントとの開発ワークフロー"><span>要件を伝える</span><span class="arrow" aria-hidden="true">→</span><span>実装を計画する</span><span class="arrow" aria-hidden="true">→</span><span>機能を構築する</span><span class="arrow" aria-hidden="true">→</span><span>テストと検証</span><span class="arrow" aria-hidden="true">→</span><span>人による検収</span></div>

エージェントは、プロジェクトのルール、ドキュメント、スキルを使い、NocoBase の既存の機能で業務機能を実装できます。

開発者の主な役割は、要件を明確にし、重要な設計上の判断をレビューし、結果を検収することです。
