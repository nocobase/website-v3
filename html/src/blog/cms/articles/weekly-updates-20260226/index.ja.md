週間のプロダクトアップデートログを要約し、最新リリースは[当社のブログ](https://www.nocobase.com/ja/blog/timeline)でご確認いただけます。

**NocoBaseは現在、`main`、`next`および`develop`の3つのブランチで更新されています。**

![version.png](https://static-docs.nocobase.com/ba5f04e27e99c625cb3822da5df07860.png)

* `main`：現時点で最も安定したバージョンで、インストールを推奨します；
* `next`：ベータ版で、近日公開予定の新機能を含み、初期テスト済みです。既知・未知の不具合が存在する可能性があります。主にテストユーザー向けで、フィードバックを収集し機能の最適化を図るためのものです。早期に新機能を体験し意見を提供したいテストユーザーに最適です；
* `develop`：アルファ版で、最新の機能コードを含みますが、不完全または不安定な可能性があり、主に内部開発や迅速なイテレーション向けです。製品の最先端に関心のある技術ユーザー向けですが、潜在的な問題や未完成の機能があるため、本番環境での使用は推奨されません。

## main

![main.png](https://static-docs.nocobase.com/47a3c71734c1d0f908b51f9ebd53c0ac.png)

### [v2.0.5](https://www.nocobase.com/ja/blog/v2.0.5)

*リリース日：2026-02-26*

### 🐛 不具合修正

* **[client]** モバイル端末において、ページ遷移を実行する前にメニューを閉じるよう修正 ([#8699](https://github.com/nocobase/nocobase/pull/8699)) by @zhangzhonghe
* **[AI LLM：GigaChat]** 2.0においてGigaChatプラグインが使用できない問題を修正 ([#8707](https://github.com/nocobase/nocobase/pull/8707)) by @cgyrock
* **[AI 社員]**
  * ContentBlockオブジェクトを使用してchatGPT APIのファイル入力を統一 ([#8696](https://github.com/nocobase/nocobase/pull/8696)) by @cgyrock
  * ユーザーがAIエージェントのツール実行確認リクエストを無視して新しいメッセージを直接送信した場合に発生するAPIエラーを修正 ([#8697](https://github.com/nocobase/nocobase/pull/8697)) by @cgyrock
* **[AI: ナレッジベース]** AIナレッジベースの起動時エラーを修正 by @cgyrock
* **[メール管理]** 画像表示エラーを修正 by @jiannx

### [v2.0.3](https://www.nocobase.com/ja/blog/v2.0.3)

*リリース日：2026-02-25*

### 🎉 新機能

- **[undefined]**

  - 実験的な「引用ブロック」プラグインを追加し、引用とコピーの方式で既存のブロックを再利用できるようにサポートしました。 ([#7584](https://github.com/nocobase/nocobase/pull/7584)) by @gchust
  - フォーム下書き by @chenos
- **[acl]** 複数の商用プラグインをオープンソース化し、ライセンスを AGPL-3.0 から Apache-2.0 に調整しました ([#8682](https://github.com/nocobase/nocobase/pull/8682)) by @chenos
- **[client]**

  - ページ、ページタブ、モーダル、モーダルタブでブラウザのタブタイトルを設定できるようにサポートしました ([#8590](https://github.com/nocobase/nocobase/pull/8590)) by @zhangzhonghe
  - フォーム内でリレーションフィールドのフィールドを設定できるようにサポートしました ([#8578](https://github.com/nocobase/nocobase/pull/8578)) by @katherinehhh
  - データ読み込み方式を設定できるようにサポートしました ([#8551](https://github.com/nocobase/nocobase/pull/8551)) by @zhangzhonghe
  - 子テーブル（モーダル編集）フィールドコンポーネントを追加しました ([#8280](https://github.com/nocobase/nocobase/pull/8280)) by @katherinehhh
  - データテーブル作成時にプリセットidフィールド型を変更できるようにしました ([#8129](https://github.com/nocobase/nocobase/pull/8129)) by @cgyrock
  - to-many サブフォームに、データ追加を許可、既存データの選択および関連解除の設定項目サポートを追加しました ([#8099](https://github.com/nocobase/nocobase/pull/8099)) by @katherinehhh
  - テーマエディターでグローバルスタイルをカスタマイズできるようにサポートしました ([#7960](https://github.com/nocobase/nocobase/pull/7960)) by @ljmiaoo
  - 詳細ブロックでデフォルトの並び替えルールを設定できるようにサポートしました ([#8070](https://github.com/nocobase/nocobase/pull/8070)) by @katherinehhh
  - 数値フィールドのデータ型を設定できるようにサポートし、選択肢は double、float、decimal を含みます ([#8058](https://github.com/nocobase/nocobase/pull/8058)) by @chenos
  - テーブル列フィールドで並び替えを有効にできるようにサポートしました ([#7900](https://github.com/nocobase/nocobase/pull/7900)) by @katherinehhh
  - リレーションフィールドのドロップダウンセレクターにクイック追加機能を追加しました ([#7887](https://github.com/nocobase/nocobase/pull/7887)) by @katherinehhh
  - ツリー表リレーションフィールドでカスケードセレクターを使用できるようにサポートしました ([#7846](https://github.com/nocobase/nocobase/pull/7846)) by @katherinehhh
  - テーブル列アクションのドラッグをサポートしました ([#7842](https://github.com/nocobase/nocobase/pull/7842)) by @zhangzhonghe
  - 子テーブルがページネーション表示をサポートしました ([#7754](https://github.com/nocobase/nocobase/pull/7754)) by @katherinehhh
  - イベントストリーム： 新しい事前定義アクションを追加し、イベント処理のカスタムオプションを強化し、ユーザーがワークフローを簡素化して効率を高められるようにしました ([#7672](https://github.com/nocobase/nocobase/pull/7672)) by @zhangzhonghe
  - 2.0 Markdown ブロックを追加しました ([#7613](https://github.com/nocobase/nocobase/pull/7613)) by @katherinehhh
  - サブフォームに連動ルールを設定できるようにサポートしました ([#7640](https://github.com/nocobase/nocobase/pull/7640)) by @zhangzhonghe
  - テーブル行クリックイベントの監視をサポートを追加し、ユーザーがテーブルのある行をクリックした際に特定操作を実行できるようにしました ([#7622](https://github.com/nocobase/nocobase/pull/7622)) by @zhangzhonghe
  - カスタム変数のサポートを追加しました ([#7585](https://github.com/nocobase/nocobase/pull/7585)) by @zhangzhonghe
  - 「現在のデバイスタイプ」変数を追加しました ([#7576](https://github.com/nocobase/nocobase/pull/7576)) by @zhangzhonghe
- **[flow-engine]** ESM_CDN_BASE_URL 環境変数の設定をサポートしました ([#8529](https://github.com/nocobase/nocobase/pull/8529)) by @chenos
- **[server]** アプリ監督器をリファクタリングし、異なるシナリオ下のマルチアプリ管理ニーズに適合させました ([#8043](https://github.com/nocobase/nocobase/pull/8043)) by @2013xile
- **[test]** デフォルトタスクマネージャーにプロセスレベルの同時実行制御を追加しました ([#8343](https://github.com/nocobase/nocobase/pull/8343)) by @cgyrock
- **[アクション：一括編集]** 一括編集 2.0 ([#8526](https://github.com/nocobase/nocobase/pull/8526)) by @jiannx
- **[ブロック：グリッドカード]**

  - ブロックが高さ設定をサポートしました ([#8583](https://github.com/nocobase/nocobase/pull/8583)) by @katherinehhh
  - 2.0 グリッドカードブロックを追加しました ([#7579](https://github.com/nocobase/nocobase/pull/7579)) by @katherinehhh
- **[アクション：レコード複製]** 2.0 複製アクションを追加しました ([#8580](https://github.com/nocobase/nocobase/pull/8580)) by @katherinehhh

紙面の都合により、完全なリリースノートは下記リンクをご参照ください。

[https://www.nocobase.com/ja/blog/v2.0.3](https://www.nocobase.com/ja/blog/v2.0.3)

### [v1.9.48](https://www.nocobase.com/ja/blog/v1.9.48)

*リリース日：2026-02-24*

### 🚀 機能改善

* **[権限制御]** 権限プラグインに、関連フィールドの値をフィルタリングできる API を追加 ([#8601](https://github.com/nocobase/nocobase/pull/8601)) by @2013xile

### 🐛 不具合修正

* **[ワークフロー：承認]** 承認処理において関連フィールドの値を適切にフィルタリングし、権限外のデータ操作を防止するよう修正 by @mytharcher

### [v2.0.2](https://www.nocobase.com/ja/blog/v2.0.2])

*リリース日：2026-02-22*

### 🐛 不具合修正

* **[カレンダー]** カレンダーのローカライズおよび日付表示形式に関する不具合を修正 ([#8498](https://github.com/nocobase/nocobase/pull/8498)) by @sembaev-a-a

### [v2.0.1](https://www.nocobase.com/ja/blog/v2.0.1)

*リリース日：2026-02-16*

### 🐛 不具合修正

* **[AI 従業員]** AI 従業員利用時にブラウザのメモリを過剰に消費し、クラッシュが発生する不具合を修正 ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v1.9.47](https://www.nocobase.com/ja/blog/v1.9.47)

*リリース日：2026-02-13*

### 🐛 不具合修正

* **[client]** 編集フォームで関連する添付ファイルフィールドを削除後に保存しても変更が反映されない不具合を修正 ([#8616](https://github.com/nocobase/nocobase/pull/8616)) by @katherinehhh
* **[utils]**`formula.js` 数式エンジンにおけるセキュリティ上の問題を修正 ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
* **[ワークフロー：承認]** 「データ保存前」モードで、承認記録のモーダル画面において関連フィールドが表示されない不具合を修正 by @mytharcher

## next

![next.png](https://static-docs.nocobase.com/8ed17a0f08cc585018f6de6c8b13947d.png)

### [v2.1.0-beta.2](https://www.nocobase.com/ja/blog/v2.1.0-beta.2)

*リリース日：2026-02-22*

### 🐛 不具合修正

* **[カレンダー]** カレンダーのローカライズおよび日付表示形式に関する不具合を修正 ([#8498](https://github.com/nocobase/nocobase/pull/8498)) by @sembaev-a-a
* **[AI 従業員]** AI 従業員利用時にブラウザでメモリ不足（OOM）が発生する不具合を修正 ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v2.1.0-beta.1](https://www.nocobase.com/ja/blog/v2.1.0-beta.1)

*リリース日：2026-02-14*

### 🎉 新機能

* **[server]** さまざまなシナリオにおけるマルチアプリ管理ニーズに対応するため、アプリケーションマネージャーを再設計 ([#8043](https://github.com/nocobase/nocobase/pull/8043)) by @2013xile

### 🚀 機能改善

* **[client]**
  * 日時関連フィールドの設定画面を改善し、相対日時を選択できるよう対応 ([#8630](https://github.com/nocobase/nocobase/pull/8630)) by @gchust
  * フィールド設定画面で、関連フィールドにタイトル用フィールドを指定できるよう改善 ([#8624](https://github.com/nocobase/nocobase/pull/8624)) by @gchust

### 🐛 不具合修正

* **[flow-engine]**
  * フィルターフィールドのサブメニューに検索文字がある場合、展開できない不具合を修正 ([#8604](https://github.com/nocobase/nocobase/pull/8604)) by @gchust
  * サブテーブル（モーダル編集）で createModelOptions 設定後、列操作の削除が機能しない不具合を修正 ([#8560](https://github.com/nocobase/nocobase/pull/8560)) by @katherinehhh
* **[client]**
  * 関連フィールドの値設定時に、多対多フィールドへ単一レコードを設定すると正しく処理されない不具合を修正 ([#8652](https://github.com/nocobase/nocobase/pull/8652)) by @gchust
  * 日付ピッカーによる日付解析を導入し、あわせてパスワード強度チェックを追加 ([#8647](https://github.com/nocobase/nocobase/pull/8647)) by @jiannx
  * テーブル操作列でボタンを連動非表示にした際、余白が発生する不具合を修正 ([#8646](https://github.com/nocobase/nocobase/pull/8646)) by @zhangzhonghe
  * `Action.Modal`（操作モーダル）が特定の操作後に閉じられない不具合を修正 ([#8642](https://github.com/nocobase/nocobase/pull/8642)) by @mytharcher
  * markdown item が不正な Liquid をレンダリングした際の例外処理を修正 ([#8637](https://github.com/nocobase/nocobase/pull/8637)) by @katherinehhh
  * フォーム内の多対多フィールド属性が常にバックエンドへ解析リクエストを送信する不具合を修正 ([#8636](https://github.com/nocobase/nocobase/pull/8636)) by @gchust
  * 数式フィールドで、数値型の数値フォーマットおよび日付型のフォーマット設定が表示されない不具合を修正 ([#8625](https://github.com/nocobase/nocobase/pull/8625)) by @katherinehhh
  * フォーム最上部の項目の上枠線が正しく表示されない不具合を修正 ([#8623](https://github.com/nocobase/nocobase/pull/8623)) by @katherinehhh
  * ツリー構造でないテーブルでは、テーブルブロック設定内の「ツリーテーブルを有効化」「すべての行をデフォルトで展開」を非表示に変更 ([#8566](https://github.com/nocobase/nocobase/pull/8566)) by @katherinehhh
* **[utils]**`formula.js` 数式エンジンにおけるセキュリティ問題を修正 ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
* **[AI 従業員]**
  * オンライン検索後に、ダイアログへ参考リンクが表示されない不具合を修正 ([#8651](https://github.com/nocobase/nocobase/pull/8651)) by @cgyrock
  * OpenAI API 呼び出し時のパラメータエラーを修正 ([#8633](https://github.com/nocobase/nocobase/pull/8633)) by @cgyrock
* **[テンプレート印刷]** 同一キーのフィールドによりレンダリングエラーが発生する不具合を修正 by @jiannx
* **[ワークフロー：承認]**
  * 承認中のデータ削除により API エラーが発生する不具合を修正 by @mytharcher
  * 「データ保存前」モードで、承認記録モーダル内の関連フィールドが表示されない不具合を修正 by @mytharcher

## develop

![develop.png](https://static-docs.nocobase.com/7fcdd9456a17286d8a439eee52bcb8d2.png)

### [v2.1.0-alpha.6](https://www.nocobase.com/ja/blog/v2.1.0-alpha.6)

*リリース日：2026-02-25*

### 🎉 新機能

* **[acl]** 複数の商用プラグインをオープンソース化し、ライセンスを AGPL-3.0 から Apache-2.0 へ変更 ([#8682](https://github.com/nocobase/nocobase/pull/8682)) by @chenos

### 🚀 機能改善

* **[undefined]** AI 従業員マニュアルを更新 ([#8690](https://github.com/nocobase/nocobase/pull/8690)) by @heziqiang

### 🐛 不具合修正

* **[client]**
  * テーブルとグリッドカードのモバイル環境におけるページネーション挙動を統一 ([#8691](https://github.com/nocobase/nocobase/pull/8691)) by @zhangzhonghe
  * チャートブロックのフィルターが機能しない不具合を修正 ([#8671](https://github.com/nocobase/nocobase/pull/8671)) by @chenos
* **[AI 従業員]** aiTools:list API が 403 エラーを返す不具合を修正 ([#8672](https://github.com/nocobase/nocobase/pull/8672)) by @chenos
* **[ローカライズ]** i18n の未定義キーに対する処理ロジックを改善 ([#8673](https://github.com/nocobase/nocobase/pull/8673)) by @chenos

### [v2.1.0-alpha.3](https://www.nocobase.com/ja/blog/v2.1.0-alpha.3)

*リリース日：2026-02-16*

### 🐛 不具合修正

* **[AI 従業員]** AI 従業員利用時にブラウザのメモリを過剰消費し、クラッシュが発生する不具合を修正 ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher

### [v2.1.0-alpha.2](https://www.nocobase.com/ja/blog/v2.1.0-alpha.2)

*リリース日：2026-02-15*

### 🎉 新機能

* **[ワークフロー：承認]** 承認関連 API にアクセス制御を追加 by @mytharcher
* **[認証：DingTalk]**`unionId` を用いたユーザー紐付けに対応 by @2013xile

### 🚀 機能改善

* **[AI: ナレッジベース]** ビルド成果物を最適化し、プラグインの容量を削減 by @cgyrock
* **[マルチスペース]** マルチスペースの権限制御を acl に統合 by @jiannx
* **[操作：レコードエクスポート Pro]** エクスポート時のデータ範囲を改善し、選択レコードを優先、次にフロントエンドのフィルタ範囲を適用 by @katherinehhh
* **[ワークフロー：承認]**
  * JS Field のサポートを廃止 by @zhangzhonghe
  * クエリパラメータを簡素化し、検索性能を向上 by @mytharcher
  * API 経由での権限逸脱操作を防ぐためアクセス制御を強化 by @mytharcher
  * 申請者データ範囲に対するマイグレーション後の補正処理を追加 by @mytharcher
* **[認証：DingTalk]** ユーザー紐付けに `userid` をデフォルト採用し、既存の携帯電話番号認証との互換性を維持 by @2013xile

### 🐛 不具合修正

* **[マルチスペース]**
  * スペースフィールド内の x-ready-pretty を削除するマイグレーションスクリプトを追加 by @jiannx
  * 関連データ追加時にスペースを関連付けるよう修正 by @jiannx
  * スペースセレクターのカラーをテーマに追従するよう修正 by @jiannx
  * スペースフィールドから read-pretty 属性を削除 by @jiannx
* **[フィールドコンポーネント：マスク]** マスクフィールド設定モーダル内で全ユーザーロールを正しく読み込めない問題を修正 by @gchust
* **[操作：レコードインポート Pro]**
  * 非同期インポートによってトリガーされたワークフローイベントが遅延実行される問題を修正 by @mytharcher
  * インポート結果の統計数値およびメッセージ翻訳を修正 by @mytharcher
* **[AI: ナレッジベース]** ビルド後にシステムが起動できない問題を修正 by @cgyrock
* **[データソース：REST API]** リクエストコンテキストにフォールトトレランスを追加し、メソッドが存在しない場合のエラーを回避 by @mytharcher
* **[ワークフロー：カスタム操作イベント]** カスタム操作ワークフローをトリガーした際にパラメータおよびペイロードデータが正しくない問題を修正 by @mytharcher
* **[操作：レコードエクスポート Pro]** メインアプリでインポート／エクスポートProプラグインが有効化されていない場合、サブアプリで非同期インポート／エクスポートタスク実行時にエラーが発生する問題を修正 by @cgyrock
* **[ワークフロー：Webhook トリガー]**
  * サブアプリ内で webhook リクエストが 404 エラーを返す問題を修正 by @mytharcher
  * リクエストボディ解析が未設定の場合に、トリガーデータ内の該当データが欠落する問題を修正 by @mytharcher
* **[ワークフロー：サブフロー]** ワークフローリンクのルーティングパスを修正 by @mytharcher
* **[テンプレート印刷]**
  * テンプレート印刷ボタンのテンプレート設定ページにおいて、フィールド一覧の表示異常を修正 by @katherinehhh
  * 同一 key のフィールドによるレンダリングエラーを修正 by @jiannx
  * テンプレート設定モーダルが遮蔽される問題を修正 by @zhangzhonghe
  * テンプレート印刷の設定モーダルから下部ボタンを削除 by @katherinehhh
  * 複合ロール時に印刷ボタンの権限ロジックが誤っている問題を修正 by @jiannx
  * スペースフィールドをサポート by @jiannx
  * 2.0 バージョンでスペースフィールドを表示 by @jiannx
* **[ファイルストレージ：S3 (Pro)]** ファイルリネームモードが機能しない問題を修正 by @mytharcher
* **[データ可視化：ECharts]** ECharts のスペルミスを修正 by @heziqiang
* **[ワークフロー：承認]**
  * 承認中のデータが削除された後に発生するAPIエラーを修正 by @mytharcher
  * 保存前モードにおける手動実行エラーを修正 by @mytharcher
  * 「データ保存前」モードにおいて、承認記録モーダル内で承認データのリレーションフィールドが表示されない問題を修正 by @mytharcher
  * 削除済みワークフローにフォールトトレランスを追加し、ToDo一覧の読み込みエラーを回避 by @mytharcher
  * 「自分の申請」詳細モーダル内でフィールド値が欠落する問題を修正 by @mytharcher
  * 1.x 承認記録モーダルのエラーを修正 by @mytharcher
  * JSONフィールド追加により発生していた一覧API読み込み時の性能問題（MySQL）を修正 by @mytharcher
  * 詳細データ読み込み時に誤った id パラメータを使用していた問題を修正 by @mytharcher
  * 同時送信によりフローが重複して再開実行される問題を修正 by @mytharcher
  * 依存関係の欠落によるビルドエラーを修正 by @mytharcher
  * 誤ったパラメータにより発生するデータ読み込みエラーを修正 by @mytharcher
  * 分岐モードの承認が指定ノードへ正しく差し戻されない問題を修正 by @mytharcher
  * 既存の対象範囲ワークフローを無効化後にユーザーへロール追加時に発生するエラーを修正 by @mytharcher
  * `ValueBlock.Result` コンポーネント未注入により値ブロック内容が表示されない問題を修正 by @mytharcher
  * 承認タスクカードのフィールドが表示されない問題を修正 by @zhangzhonghe
  * ToDoセンターでフィルターフィールドが正常に使用できない問題を修正 by @mytharcher
* **[メール管理]**
  * 会話スレッドを修正 by @jiannx
  * Outlookの返信スレッドが断続的に切断される問題を修正 by @jiannx
  * テキスト選択時に本文が折りたたまれないよう修正。添付ファイルダウンロード失敗を修正 by @jiannx
  * 複数ユーザー間で同一メールアドレスのメール処理に関する問題を修正し、性能を最適化 by @jiannx
  * 管理ページにフィルターを追加 by @jiannx
  * 「全員に返信」ボタンを表示し、データ範囲でサブメールのフィルタリングをサポート by @jiannx
  * メール設定モーダルが遮蔽される問題を修正 by @zhangzhonghe
* **[企業版WeChat]** ユーザーに携帯番号がない場合に自動登録できない問題を修正 by @2013xile
* **[マイグレーション管理]** マイグレーション異常発生後に出力される例外オブジェクトに含まれるSQLが過大でプロセスがフリーズする問題を修正 by @cgyrock

### [v2.1.0-alpha.1](https://www.nocobase.com/ja/blog/v2.1.0-alpha.1)

*リリース日：2026-02-14*

### 🎉 新機能

* **[操作：一括編集]** 一括編集 2.0 をリリース ([#8526](https://github.com/nocobase/nocobase/pull/8526)) by @jiannx

### 🚀 機能改善

* **[client]**
  * 日時関連フィールドの設定画面を改善し、相対日時を選択できるよう対応 ([#8630](https://github.com/nocobase/nocobase/pull/8630)) by @gchust
  * フィールド設定画面で、関連フィールドにタイトル用フィールドを指定できるよう改善 ([#8624](https://github.com/nocobase/nocobase/pull/8624)) by @gchust
  * テーブル 2.0 でドラッグ＆ドロップによる並び替えに対応 ([#8540](https://github.com/nocobase/nocobase/pull/8540)) by @jiannx
  * フィールド値およびデフォルト値に関する設定をフォームレベルの構成へ再設計 ([#8596](https://github.com/nocobase/nocobase/pull/8596)) by @chenos
* **[ローカライズ]** 不足している i18n エントリを自動生成するよう改善 ([#8588](https://github.com/nocobase/nocobase/pull/8588)) by @jiannx

### 🐛 不具合修正

* **[flow-engine]** フィルターフィールドのサブメニューに検索文字が含まれる場合に展開できない不具合を修正 ([#8604](https://github.com/nocobase/nocobase/pull/8604)) by @gchust
* **[client]**
  * 関連フィールド設定時に、多対多フィールドへ単一レコードを割り当てると正しく処理されない不具合を修正 ([#8652](https://github.com/nocobase/nocobase/pull/8652)) by @gchust
  * 日付ピッカーによる日付解析を導入し、あわせてパスワード強度チェックを追加 ([#8647](https://github.com/nocobase/nocobase/pull/8647)) by @jiannx
  * テーブル操作列でボタンを連動非表示にした際に余白が生じる不具合を修正 ([#8646](https://github.com/nocobase/nocobase/pull/8646)) by @zhangzhonghe
  * markdown item が不正な Liquid をレンダリングした際の例外処理を修正 ([#8637](https://github.com/nocobase/nocobase/pull/8637)) by @katherinehhh
  * フォーム内の多対多フィールド属性が常にバックエンドへ解析リクエストを送信してしまう不具合を修正 ([#8636](https://github.com/nocobase/nocobase/pull/8636)) by @gchust
  * `Action.Modal`（操作モーダル）が特定の操作後に閉じられない不具合を修正 ([#8642](https://github.com/nocobase/nocobase/pull/8642)) by @mytharcher
  * 数式フィールドで数値フォーマットおよび日付フォーマット設定が表示されない不具合を修正 ([#8625](https://github.com/nocobase/nocobase/pull/8625)) by @katherinehhh
  * フォーム最上部の項目の上枠線が正しく表示されない不具合を修正 ([#8623](https://github.com/nocobase/nocobase/pull/8623)) by @katherinehhh
  * 編集フォームで関連する添付ファイルフィールドを削除後に保存しても変更が反映されない不具合を修正 ([#8616](https://github.com/nocobase/nocobase/pull/8616)) by @katherinehhh
  * 関連フィールドのタイトルに外部キーを指定した場合、ドロップダウン表示が乱れる不具合を修正 ([#8619](https://github.com/nocobase/nocobase/pull/8619)) by @katherinehhh
  * 編集フォームの関連フィールドデータセレクターで、選択済みデータ変更後に元へ戻せない不具合を修正 ([#8610](https://github.com/nocobase/nocobase/pull/8610)) by @katherinehhh
  * 編集フォームの関連フィールドを編集可能から読み取り専用へ切り替えた際、選択肢が即時更新されない不具合を修正 ([#8611](https://github.com/nocobase/nocobase/pull/8611)) by @katherinehhh
* **[utils]**`formula.js` 数式エンジンにおけるセキュリティ問題を修正 ([#8416](https://github.com/nocobase/nocobase/pull/8416)) by @mytharcher
* **[AI 従業員]**
  * オンライン検索後に参考リンクがダイアログへ表示されない不具合を修正 ([#8651](https://github.com/nocobase/nocobase/pull/8651)) by @cgyrock
  * OpenAI API 呼び出し時のパラメータエラーを修正 ([#8633](https://github.com/nocobase/nocobase/pull/8633)) by @cgyrock
* **[ファイルマネージャー]** フォーム内でファイルタイプフィールドを無効化しても選択モーダルが開ける不具合を修正 ([#8617](https://github.com/nocobase/nocobase/pull/8617)) by @katherinehhh
