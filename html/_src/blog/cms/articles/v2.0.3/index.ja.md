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
- **[ワークフロー]**

  - ワークフローキャンバス上でノードのコピー＆ペーストと、ドラッグによるノード位置移動をサポートしました ([#8559](https://github.com/nocobase/nocobase/pull/8559)) by @mytharcher
  - ノード移動用の API を追加しました ([#8507](https://github.com/nocobase/nocobase/pull/8507)) by @mytharcher
  - 「多条件分岐」ノードを追加し、`switch` / `case` に似た制御フローを提供します ([#7878](https://github.com/nocobase/nocobase/pull/7878)) by @mytharcher
- **[AI従業員]**

  - AI 会話がファイルのコピー＆ペーストをサポートしました ([#8487](https://github.com/nocobase/nocobase/pull/8487)) by @heziqiang
  - Gemini-3 モデルをサポートし、関数呼び出しの思考署名能力を含みます ([#8377](https://github.com/nocobase/nocobase/pull/8377)) by @heziqiang
  - AI プラグインのオンライン検索機能を改善しました ([#7580](https://github.com/nocobase/nocobase/pull/7580)) by @cgyrock
- **[ブロック：地図]** 2.0 地図ブロックを追加しました ([#7944](https://github.com/nocobase/nocobase/pull/7944)) by @katherinehhh
- **[データ可視化]**

  - チャート設定用の AI従業員を追加しました ([#7815](https://github.com/nocobase/nocobase/pull/7815)) by @heziqiang
  - チャート SQL データソースを追加しました ([#7830](https://github.com/nocobase/nocobase/pull/7830)) by @heziqiang
  - チャートタイプ「ドーナツチャート」を追加しました ([#7629](https://github.com/nocobase/nocobase/pull/7629)) by @heziqiang
- **[フロントエンド FlowEngine]** SQL を書く際に LiquidJS テンプレート文字列を使用できるようにサポートしました ([#7667](https://github.com/nocobase/nocobase/pull/7667)) by @2013xile
- **[データソース管理]**

  - メインデータソースがメインデータベースからデータテーブルを読み取ることをサポートし、フィールド interface の変更をサポートしました ([#7118](https://github.com/nocobase/nocobase/pull/7118)) by @aaaaaajie
  - メインデータソースがメインデータベースからデータテーブルを読み取ることをサポートし、フィールド interface の変更をサポートしました ([#7118](https://github.com/nocobase/nocobase/pull/7118)) by @aaaaaajie
- **[ブロック：リスト]** 2.0 リストブロックを追加しました ([#7574](https://github.com/nocobase/nocobase/pull/7574)) by @katherinehhh
- **[ブロック：操作パネル]** 2.0 操作パネルブロックを追加しました ([#7594](https://github.com/nocobase/nocobase/pull/7594)) by @katherinehhh
- **[テレメトリ]** 新規プラグイン：テレメトリ。OpenTelemetry ベースのアプリテレメトリプラグインで、CPU、メモリ、HTTP リクエスト等の指標を内蔵し、HTTP 経由のエクスポートをサポートします by @2013xile
- **[ワークフロー：承認]**

  - 承認処理画面でデータのスナップショットを表示するか最新状態を表示するか選択を許可します by @mytharcher
  - 誰が承認を開始できるかを制御するために、受信者設定項目を追加します by @mytharcher
- **[メール管理]** メール管理 2.0 実装 by @jiannx

### 🚀 機能改善

- **[undefined]**

  - AI従業員マニュアル文書を更新しました ([#8690](https://github.com/nocobase/nocobase/pull/8690)) by @heziqiang
  - チャートプラグインの英語文書を更新しました ([#7748](https://github.com/nocobase/nocobase/pull/7748)) by @heziqiang
  - チャート概要部分の文書を更新しました ([#7702](https://github.com/nocobase/nocobase/pull/7702)) by @heziqiang
- **[client]**

  - 時間・日付関連フィールドの値割り当て画面を最適化し、相対時間・相対日付を選択可能にしました。 ([#8630](https://github.com/nocobase/nocobase/pull/8630)) by @gchust
  - 値割り当て画面でリレーションフィールドのタイトルフィールドを指定できるようにサポートしました。 ([#8624](https://github.com/nocobase/nocobase/pull/8624)) by @gchust
  - テーブル 2.0 がドラッグ並び替えをサポートしました ([#8540](https://github.com/nocobase/nocobase/pull/8540)) by @jiannx
  - フィールド割り当てとデフォルト値関連設定をフォームレベル設定へリファクタリングしました。 ([#8596](https://github.com/nocobase/nocobase/pull/8596)) by @chenos
  - フィルターフォームのリレーションフィールドが独立したフィールド model を使用します ([#8511](https://github.com/nocobase/nocobase/pull/8511)) by @zhangzhonghe
  - 行内編集の子テーブル列幅設定方式をドロップダウン選択に調整しました ([#8561](https://github.com/nocobase/nocobase/pull/8561)) by @katherinehhh
  - 子テーブルの添付フィールドのアップロード／編集ボタンを改善し、ユーザーにアップロードを誘導します ([#8474](https://github.com/nocobase/nocobase/pull/8474)) by @katherinehhh
  - to-many サブフォームがデフォルトで 1 つのオブジェクトを含むように改善し、Add New をクリック不要で、未入力時はレコードを作成しません ([#8473](https://github.com/nocobase/nocobase/pull/8473)) by @katherinehhh
  - to-many サブフォームがデフォルトで 1 つのオブジェクトを含むように改善し、Add New をクリック不要で、未入力時はレコードを作成しません ([#8458](https://github.com/nocobase/nocobase/pull/8458)) by @katherinehhh
  - リッチテキストエディターがフォントサイズ調整、画像サイズ調整、ソフト改行をサポートしました ([#8401](https://github.com/nocobase/nocobase/pull/8401)) by @jiannx
  - イベントストリームが実行タイミング指定をサポートしました。 ([#8340](https://github.com/nocobase/nocobase/pull/8340)) by @gchust
  - セル更新によりテーブル全体が再レンダリングされる問題を修復しました ([#8349](https://github.com/nocobase/nocobase/pull/8349)) by @katherinehhh
  - AI 編集タスクフォーム内のテキスト入力欄が自動高さ調整をサポートしました。 ([#8350](https://github.com/nocobase/nocobase/pull/8350)) by @heziqiang
  - JS コードエディターがフルスクリーンをサポートしました。 ([#8294](https://github.com/nocobase/nocobase/pull/8294)) by @gchust
  - ツリーテーブルブロックの Add child 実装を改善し、対応する children 関連の Add new と同等にしました ([#8272](https://github.com/nocobase/nocobase/pull/8272)) by @katherinehhh
  - Color フィールドがデフォルト値のクリアをサポートしました ([#8268](https://github.com/nocobase/nocobase/pull/8268)) by @katherinehhh
  - アクション列の column width を Select 形式に変更しました ([#8218](https://github.com/nocobase/nocobase/pull/8218)) by @katherinehhh
  - テーブル列幅設定がカスタム幅入力をサポートしました ([#8200](https://github.com/nocobase/nocobase/pull/8200)) by @katherinehhh
  - テーブル列幅設定方式をオプション選択に調整しました ([#8188](https://github.com/nocobase/nocobase/pull/8188)) by @katherinehhh
  - データセレクターのスタイルを最適化し、maxTagCount を設定しました ([#8175](https://github.com/nocobase/nocobase/pull/8175)) by @katherinehhh
  - 設定項目を最適化（ブロック、フィールド、アクション）しました ([#8141](https://github.com/nocobase/nocobase/pull/8141)) by @katherinehhh
  - パーセンテージフィールドが数値フォーマット設定をサポートしました ([#8123](https://github.com/nocobase/nocobase/pull/8123)) by @katherinehhh
  - 子テーブルで行削除後に最後のページへ移動する問題を修復し、列レベルの検証ルール設定をサポートしました ([#8094](https://github.com/nocobase/nocobase/pull/8094)) by @katherinehhh
  - 編集モード子テーブルで大フィールドの表示を調整しました ([#8078](https://github.com/nocobase/nocobase/pull/8078)) by @katherinehhh
  - JSON フィールド内容が超過した際に省略表示をサポートしました ([#8067](https://github.com/nocobase/nocobase/pull/8067)) by @katherinehhh
  - 添付アップロードコンポーネントが「複数選択を許可」をサポートしました ([#8052](https://github.com/nocobase/nocobase/pull/8052)) by @katherinehhh
  - Select コンポーネントで折り畳まれた選択項目をホバー時に表示するよう最適化しました ([#8030](https://github.com/nocobase/nocobase/pull/8030)) by @katherinehhh
  - チャートの初回クエリ時にフィルターフィールドを選択できるようにサポートしました ([#7933](https://github.com/nocobase/nocobase/pull/7933)) by @heziqiang
  - モバイル端末コンポーネントに適配しました ([#7870](https://github.com/nocobase/nocobase/pull/7870)) by @zhangzhonghe
  - RunJS スクリプトコンテキストに Day.js ライブラリのサポートを追加し、日付と時間の操作を容易にしました。 ([#7841](https://github.com/nocobase/nocobase/pull/7841)) by @gchust
  - flow engine コンテキストにページバージョンを追加しました ([#7826](https://github.com/nocobase/nocobase/pull/7826)) by @gchust
  - Markdown エディターを最適化しました ([#7793](https://github.com/nocobase/nocobase/pull/7793)) by @katherinehhh
  - 2.0 ブロックが tableoid フィールドに適配しました ([#7809](https://github.com/nocobase/nocobase/pull/7809)) by @katherinehhh
  - JS コードエディターで jsx 構文のサポートを追加しました ([#7699](https://github.com/nocobase/nocobase/pull/7699)) by @gchust
  - JS field model がリレーションフィールドをサポートしました ([#7618](https://github.com/nocobase/nocobase/pull/7618)) by @gchust
- **[flow-engine]**

  - JS model コードエディター関連の自動補完とヒントを最適化しました。 ([#8575](https://github.com/nocobase/nocobase/pull/8575)) by @gchust
  - runjs の ctx.libs を最適化し、オンデマンド読み込みをサポートし、lodash, math, formula 事前定義ライブラリを追加しました。 ([#8468](https://github.com/nocobase/nocobase/pull/8468)) by @gchust
  - GridModel に `rowOrder` フィールドを追加し、行順序の一貫性を保証します ([#8371](https://github.com/nocobase/nocobase/pull/8371)) by @zhangzhonghe
  - runjs 環境が window.location.reload メソッドをサポートしました。 ([#8316](https://github.com/nocobase/nocobase/pull/8316)) by @gchust
  - 設定モード切替時の性能問題を最適化しました ([#8241](https://github.com/nocobase/nocobase/pull/8241)) by @zhangzhonghe
  - runjs 環境が FormData オブジェクトをサポートしました。 ([#8263](https://github.com/nocobase/nocobase/pull/8263)) by @gchust
  - 設定メニューの動的非表示をサポートしました ([#7924](https://github.com/nocobase/nocobase/pull/7924)) by @gchust
  - FlowModelRenderer に useCache オプションを追加しました ([#8072](https://github.com/nocobase/nocobase/pull/8072)) by @zhangzhonghe
  - `removeModelWithSubModels` メソッドを追加し、モデルと子モデルを再帰的に削除します ([#8064](https://github.com/nocobase/nocobase/pull/8064)) by @zhangzhonghe
  - flow model 型の動的切替をサポートしました ([#7952](https://github.com/nocobase/nocobase/pull/7952)) by @gchust
  - flow engine 層で models ツリー変更の監視をサポートしました。 ([#7905](https://github.com/nocobase/nocobase/pull/7905)) by @gchust
  - 現在レコードの変数解析を最適化し、モーダルの開く速度を向上しました ([#7895](https://github.com/nocobase/nocobase/pull/7895)) by @gchust
  - runjs コンテキストのサードパーティライブラリ api 構造を最適化し、Antd アイコンライブラリをサポートしました。 ([#7896](https://github.com/nocobase/nocobase/pull/7896)) by @gchust
  - ツールバーのスタイルを最適化し、アイコンが隠れるのを防止しました ([#7883](https://github.com/nocobase/nocobase/pull/7883)) by @zhangzhonghe
  - ページタブのツールバーのスタイルを最適化しました ([#7795](https://github.com/nocobase/nocobase/pull/7795)) by @zhangzhonghe
  - flow model の遅延操作をサポートしました ([#7786](https://github.com/nocobase/nocobase/pull/7786)) by @gchust
  - UID コピー失敗時のエラーメッセージを最適化し、より明確な解決指針を提供します。 ([#7718](https://github.com/nocobase/nocobase/pull/7718)) by @gchust
  - flow step でコンテキスト変数定義をサポートしました ([#7674](https://github.com/nocobase/nocobase/pull/7674)) by @gchust
  - URL クエリパラメータに skipRunJs=true を追加して runjs フローステップをスキップすることをサポートしました。 ([#7638](https://github.com/nocobase/nocobase/pull/7638)) by @gchust
  - モーダル変数をサポートしました ([#7583](https://github.com/nocobase/nocobase/pull/7583)) by @gchust
  - コードエディター体験を最適化し、より多くのコード片段を追加し、シーン別の補完を動的表示します ([#7559](https://github.com/nocobase/nocobase/pull/7559)) by @gchust
  - 自動フローを正規化し、統一して "beforeRender" イベントでトリガーし、フロー実行の一貫性と予測可能性を確保しました。 ([#7577](https://github.com/nocobase/nocobase/pull/7577)) by @gchust
  - ドラッグ機能を最適化しました ([#7526](https://github.com/nocobase/nocobase/pull/7526)) by @zhangzhonghe
- **[acl]** acl に generalFixedParams メソッドを追加しました ([#8363](https://github.com/nocobase/nocobase/pull/8363)) by @jiannx
- **[cli]** 環境変数で CDN ベースアドレス設定をサポートしました ([#8384](https://github.com/nocobase/nocobase/pull/8384)) by @chenos
- **[sdk]** api storage 実装を改善しました ([#8308](https://github.com/nocobase/nocobase/pull/8308)) by @chenos
- **[telemetry]**

  - 報告する指標の制御をサポートしました ([#7938](https://github.com/nocobase/nocobase/pull/7938)) by @2013xile
  - オンライン子アプリ数などのテレメトリ指標を追加しました ([#7743](https://github.com/nocobase/nocobase/pull/7743)) by @2013xile
- **[database]** フィールド暗号化プラグインをリファクタリングし、安全性を向上し、アプリ鍵の生成と交換、フィールド独立鍵をサポートしました。 ([#7769](https://github.com/nocobase/nocobase/pull/7769)) by @cgyrock
- **[ローカライズ]** i18n 欠損語条の自動作成 ([#8588](https://github.com/nocobase/nocobase/pull/8588)) by @jiannx
- **[ワークフロー：CC]** ワークフロー CC プラグインをリファクタリングして FlowModel アーキテクチャをサポートし、v1/v2 設定に互換しました ([#8405](https://github.com/nocobase/nocobase/pull/8405)) by @zhangzhonghe
- **[ワークフロー]**

  - ワークフロー子ページのルーティングパスを変更し、ワークフローページを `/admin/settings/workflow` 配下へ統一しました ([#8519](https://github.com/nocobase/nocobase/pull/8519)) by @mytharcher
  - 更新記録アクションボタンにワークフロー紐付け設定項目を補完しました ([#7668](https://github.com/nocobase/nocobase/pull/7668)) by @mytharcher
- **[ファイルマネージャー]**

  - ファイルマネージャーに拡張可能なプレビューコンポーネントを追加しました ([#8501](https://github.com/nocobase/nocobase/pull/8501)) by @mytharcher
  - OSS ストレージエンジンにリクエスト設定項目を追加し、サーバーからファイル取得時に追加リクエストパラメータを渡せるようにしました ([#8372](https://github.com/nocobase/nocobase/pull/8372)) by @mytharcher
- **[アクション：レコードエクスポート]** エクスポートボタンのデータ範囲を改善：優先は選択レコード、その次はフロントエンドのフィルター範囲 ([#8442](https://github.com/nocobase/nocobase/pull/8442)) by @katherinehhh
- **[フロントエンド FlowEngine]** 現在フォーム変数のうち編集フォームに追加されていないフィールド値の解析をサポートしました。 ([#8436](https://github.com/nocobase/nocobase/pull/8436)) by @gchust
- **[AI従業員]**

  - ワークフロー呼び出し結果を `execution.output` から取得するよう変更し、安定した結果取得のためにフロー出力ノード使用を明確化しました ([#8423](https://github.com/nocobase/nocobase/pull/8423)) by @mytharcher
  - AI従業員のメイン入口ボタンを最適化しました ([#8414](https://github.com/nocobase/nocobase/pull/8414)) by @heziqiang
  - 入口リスト内のビルド系 AI従業員を非表示；<br/> LLM 連携フローを最適化；<br/> Gemini-3 モデル関連文書を更新しました。 ([#8409](https://github.com/nocobase/nocobase/pull/8409)) by @heziqiang
  - Anthropic と Claude-4.5 をサポートしました ([#8389](https://github.com/nocobase/nocobase/pull/8389)) by @heziqiang
  - システムプロンプトのカスタム編集と自動更新をサポートしました ([#8378](https://github.com/nocobase/nocobase/pull/8378)) by @heziqiang
  - AI の LLM サービス／モデル層でのエラー処理を最適化しました ([#8351](https://github.com/nocobase/nocobase/pull/8351)) by @heziqiang
  - workflow の LLM ノードで Gemini 互換問題を修復しました。<br/>AI ツール dataSourceQuery の大データ量シーンでの処理性能を最適化しました。<br/>データモデリング関連問題を修復しました。<br/>AI 提案ツールを追加しました。<br/> ([#8249](https://github.com/nocobase/nocobase/pull/8249)) by @heziqiang
  - AI従業員の初回編集後に送信が無反応になる問題を解決<br/>不要な内蔵 AI従業員「Avery フォームアシスタント」を削除<br/>内蔵 AI従業員のデフォルト初期ロール権限を追加<br/>AI従業員のエラー処理と出力結果を最適化<br/>AI がモーダルコンテキスト変数へアクセスする能力を追加<br/>AI 外部データソースのサポートを追加<br/>大量データ処理時に会話内容が誤ってトリミングされる問題を修復<br/> ([#8191](https://github.com/nocobase/nocobase/pull/8191)) by @heziqiang
  - 内蔵 AI従業員プロンプトが編集をサポートしました。<br/>Nathan (AI従業員) のシステムプロンプトを最適化しました。<br/>サーバーが静的ファイルを読む問題を修復しました。 ([#8097](https://github.com/nocobase/nocobase/pull/8097)) by @heziqiang
  - LLM フォームに provider フィールドを追加しました ([#8049](https://github.com/nocobase/nocobase/pull/8049)) by @heziqiang
  - AI従業員プラグインに upgrade フック関数を追加しました ([#7951](https://github.com/nocobase/nocobase/pull/7951)) by @heziqiang
  - AI従業員のインタラクションとタスク設定体験を最適化しました ([#7707](https://github.com/nocobase/nocobase/pull/7707)) by @cgyrock
  - AI従業員がテーブルブロックのメタ情報に基づいて自律的にデータ照会できるようにしました ([#7703](https://github.com/nocobase/nocobase/pull/7703)) by @cgyrock
  - AI プログラミング体験を最適化し、AI従業員を使ってコードのレビュー、診断および修正を行えるようにしました。 ([#7679](https://github.com/nocobase/nocobase/pull/7679)) by @cgyrock
  - OpenAI LLM Provider をリファクタリングし、2 つの独立 Provider に分割して、OpenAI の Completions と Responses API をそれぞれサポートしました。 ([#7615](https://github.com/nocobase/nocobase/pull/7615)) by @cgyrock
  - 新しい LLM プロバイダー Ollama を追加しました ([#7612](https://github.com/nocobase/nocobase/pull/7612)) by @ReLaMi96
  - AI コード作成機能を最適化しました ([#7614](https://github.com/nocobase/nocobase/pull/7614)) by @cgyrock
  - モバイル端末レイアウトでチャットボックスに最小化ボタンを追加しました ([#7595](https://github.com/nocobase/nocobase/pull/7595)) by @cgyrock
- **[UI テンプレート]**

  - 詳細ブロックのフィールドテンプレートサポートを追加しました。 ([#8247](https://github.com/nocobase/nocobase/pull/8247)) by @gchust
  - UI テンプレートプラグインを追加し、ブロックテンプレートとモーダルテンプレートの再利用能力を提供します。 ([#8163](https://github.com/nocobase/nocobase/pull/8163)) by @gchust
- **[ブロック：操作パネル]** 設定状態でブロック／アクション／フィールドが隠されている時の表示を最適化しました ([#8174](https://github.com/nocobase/nocobase/pull/8174)) by @katherinehhh
- **[ブロック：リスト]** Table、List、Grid Card ブロックの Link ボタン設定を補完しました ([#8194](https://github.com/nocobase/nocobase/pull/8194)) by @katherinehhh
- **[ブロック：地図]** 地図フィールド表示モードがテキスト時に超過省略設定をサポートしました ([#8189](https://github.com/nocobase/nocobase/pull/8189)) by @katherinehhh
- **[ブロック：グリッドカード]**

  - グリッドカードブロックのスタイルを最適化し、レイアウトをよりコンパクトにしました ([#8152](https://github.com/nocobase/nocobase/pull/8152)) by @katherinehhh
  - グリッドカードに 1 ページ表示行数設定を追加し、pageSize 設定を削除して、pageSize を自動計算に変更しました ([#8055](https://github.com/nocobase/nocobase/pull/8055)) by @katherinehhh
- **[データテーブルフィールド：Markdown(Vditor)]** 読み取りモードで Markdown フィールドがデフォルトで変数を解析しないよう調整しました ([#8145](https://github.com/nocobase/nocobase/pull/8145)) by @katherinehhh
- **[アクション：レコードインポート]** インポート設定フィールドが ID 選択をサポートしました ([#8133](https://github.com/nocobase/nocobase/pull/8133)) by @katherinehhh
- **[非同期タスクマネージャー]** 子アプリで非同期タスク実行時、非同期プロセスが対応する子アプリだけを起動します ([#7927](https://github.com/nocobase/nocobase/pull/7927)) by @2013xile
- **[データ可視化]**

  - チャートヒントバーとイベントコードテンプレート注釈を更新しました ([#7814](https://github.com/nocobase/nocobase/pull/7814)) by @heziqiang
  - チャートの日付時刻フォーマットオプションを追加しました ([#7763](https://github.com/nocobase/nocobase/pull/7763)) by @heziqiang
  - 「まず“クエリ実行”をクリックしてからチャートオプションを設定してください」というヒントを追加しました ([#7685](https://github.com/nocobase/nocobase/pull/7685)) by @heziqiang
  - チャート設定パネルで公開プレビューをクリックした際にチャートデータを更新します ([#7678](https://github.com/nocobase/nocobase/pull/7678)) by @heziqiang
  - プラグインデータ VI 2.0 版を更新し、いくつかの問題を修復し UI を最適化しました。 ([#7597](https://github.com/nocobase/nocobase/pull/7597)) by @heziqiang
  - チャートタイプを拡張；UI とインタラクション体験を最適化しました。 ([#7581](https://github.com/nocobase/nocobase/pull/7581)) by @heziqiang
- **[マルチアプリ管理器（廃止済み）]**

  - 子アプリの非同期キュー起動をサポートしました ([#7749](https://github.com/nocobase/nocobase/pull/7749)) by @2013xile
  - app supervisor を改善しました ([#7661](https://github.com/nocobase/nocobase/pull/7661)) by @chenos
- **[データソース管理]** フィールドタイプと interface 列順を調整し、変更時に二次確認を追加しました ([#7680](https://github.com/nocobase/nocobase/pull/7680)) by @2013xile
- **[マルチワークスペース]**

  - マルチワークスペース権限制御が acl に接続しました by @jiannx
  - api.storage で localstorage を置換し、権限制御をリファクタリングし、問題を修復しました by @jiannx
- **[AI: ナレッジベース]** ビルド成果物を最適化し、AI ナレッジベースプラグインのパッケージサイズを縮小しました by @cgyrock
- **[アクション：レコードエクスポート Pro]**

  - エクスポートボタンのデータ範囲を改善：優先は選択レコード、その次はフロントエンドのフィルター範囲 by @katherinehhh
  - import pro と export pro ボタンが権限制御をサポートしました by @katherinehhh
- **[テレメトリ：Prometheus]** `@opentelemetry/exporter-prometheus` をアップグレードしました by @2013xile
- **[データテーブルフィールド：暗号化]** フィールド暗号化プラグインを最適化し、独立 IV 下のデータ検索をサポートしました by @cgyrock
- **[ワークフロー：承認]**

  - JS Field のサポートを削除しました by @zhangzhonghe
  - 本ワークフロー実行終了時に `approval.data` を承認データの最新バージョンに更新し、「最新」記録表示モードに一致させます by @mytharcher
  - 起案者データ範囲に移行後の修復ロジックを追加しました by @mytharcher
  - 単一承認伝票取得 API を調整し、コードを簡素化しました by @mytharcher
  - API へのアクセス制御を追加し、API 経由の権限超過操作を回避します by @mytharcher

### 🐛 不具合修正

- **[undefined]**

  - ダークモードでプラグインドキュメントのトップページのスタイルが崩れる問題を修正しました ([#7839](https://github.com/nocobase/nocobase/pull/7839)) by @gchust
  - 引用ブロックが、引用元ブロックを元ページから削除してしまう問題を修正しました ([#7969](https://github.com/nocobase/nocobase/pull/7969)) by @gchust
  - ルートパスのマッチングで新しいマルチアプリに対応しました ([#7570](https://github.com/nocobase/nocobase/pull/7570)) by @jiannx
  - カスタムアクションワークフロー実行時に、パラメータ／ペイロードが不正になる問題を修正しました by @mytharcher
  - コメント以外のテーブルでコメントブロックを使うと「現在のテーブルはコメントテーブルではないため、コメントブロックを使用できません」と表示するようにしました by @katherinehhh
  - コメントブロックでレコード削除に失敗する問題を修正しました by @katherinehhh
  - コメントブロックでコメント引用が効かない問題を修正しました by @katherinehhh**[flow-engine]**

  **[client]**

  * テーブルとグリッドカードのモバイル端末でのページネーション挙動を統一 ([#8691](https://github.com/nocobase/nocobase/pull/8691)) by @zhangzhonghe
  * チャートブロックのフィルタが無効になる問題を修復 ([#8671](https://github.com/nocobase/nocobase/pull/8671)) by @chenos
  * リレーションフィールドに値を設定する際、多対多のリレーションフィールドに単一レコードを設定すると不正確になる問題を修復。 ([#8652](https://github.com/nocobase/nocobase/pull/8652)) by @gchust
  * 日付ピッカーを使用して日付を解析し、パスワード強度検証などを追加 ([#8647](https://github.com/nocobase/nocobase/pull/8647)) by @jiannx
  * テーブル操作列で連動してボタンを非表示にした後に隙間が発生する問題を修復 ([#8646](https://github.com/nocobase/nocobase/pull/8646)) by @zhangzhonghe
  * `Action.Modal`（操作モーダル）が一部のインタラクション後に閉じられない問題を修復 ([#8642](https://github.com/nocobase/nocobase/pull/8642)) by @mytharcher
  * markdown item が不正な Liquid をレンダリングする際に例外を正しく処理できない問題を修復 ([#8637](https://github.com/nocobase/nocobase/pull/8637)) by @katherinehhh
  * フォーム内の多対多フィールド属性が常にバックエンド解析リクエストを送信する問題を修復。 ([#8636](https://github.com/nocobase/nocobase/pull/8636)) by @gchust
  * 数式フィールドの数値型で数値フォーマットが表示されず、日付型で日付フォーマット設定項目が表示されない問題を修復 ([#8625](https://github.com/nocobase/nocobase/pull/8625)) by @katherinehhh
  * フォームの最初の項目の上部ボーダーが完全に表示されない問題を修復 ([#8623](https://github.com/nocobase/nocobase/pull/8623)) by @katherinehhh
  * フォームのリレーションフィールドコンポーネントで、タイトルフィールドに外部キーを使用した場合にドロップダウンリストのデータ表示が異常になる問題を修復 ([#8619](https://github.com/nocobase/nocobase/pull/8619)) by @katherinehhh
  * 編集フォームのリレーションフィールドデータセレクターで選択済みデータを変更後に復元できない問題を修復 ([#8610](https://github.com/nocobase/nocobase/pull/8610)) by @katherinehhh
  * JS column のコードエディタで run ボタンをクリック後にテーブル列が再描画されない問題を修復。 ([#8608](https://github.com/nocobase/nocobase/pull/8608)) by @gchust
  * 非設定モード時に "read hidden" のレンダリングエラーが発生する可能性がある問題を修復。 ([#8591](https://github.com/nocobase/nocobase/pull/8591)) by @gchust
  * 編集フォーム内のサブテーブル（行内編集）を読み取り専用に設定後、閲覧モードに切り替えた際にも編集列フィールドが残る問題を修復 ([#8589](https://github.com/nocobase/nocobase/pull/8589)) by @katherinehhh
  * Grid レイアウトにプレースホルダーが存在する問題を修復 ([#8535](https://github.com/nocobase/nocobase/pull/8535)) by @zhangzhonghe
  * サブテーブルの行内編集時、列幅を縮小してもリアルタイム更新されず、複数行テキストフィールドで列幅拡大後も入力欄が列幅に自動適応しない問題を修復 ([#8573](https://github.com/nocobase/nocobase/pull/8573)) by @katherinehhh
  * ツリーテーブルを有効化後、ページをリフレッシュしないと「子レコードを追加」操作を追加できない問題を修復 ([#8574](https://github.com/nocobase/nocobase/pull/8574)) by @katherinehhh
  * 編集フォームでリレーションフィールドセレクターのクイック追加ボタンからデータを追加するとフォーム内データが上書きされる問題を修復。 ([#8567](https://github.com/nocobase/nocobase/pull/8567)) by @gchust
  * 非ツリー構造テーブルでテーブルブロック属性の「ツリーテーブルを有効化」と「すべての行をデフォルトで展開」を非表示 ([#8566](https://github.com/nocobase/nocobase/pull/8566)) by @katherinehhh
  * 追加操作モーダルにテーブル（追加）メニューが表示されるべきでない問題を修復。 ([#8562](https://github.com/nocobase/nocobase/pull/8562)) by @gchust
  * 初回モーダルを開いて閉じた後にページデータが誤って再読み込みされる問題を修復。 ([#8548](https://github.com/nocobase/nocobase/pull/8548)) by @gchust
  * イベントフローがモーダル間のターゲットブロックを更新する際に反映されない問題を修復。 ([#8541](https://github.com/nocobase/nocobase/pull/8541)) by @gchust
  * nanoid フィールドが新規フォーム送信後にデフォルト値を再生成しない問題を修復 ([#8538](https://github.com/nocobase/nocobase/pull/8538)) by @katherinehhh
  * カスケードコンポーネントでデフォルト値設定時にデータ表示が異常になる問題を修復 ([#8537](https://github.com/nocobase/nocobase/pull/8537)) by @katherinehhh
  * フォーム送信後にデータブロックが重複して再読み込みされる問題を修復。 ([#8531](https://github.com/nocobase/nocobase/pull/8531)) by @gchust
  * フィルタ関連の既知の問題を修復 ([#8514](https://github.com/nocobase/nocobase/pull/8514)) by @zhangzhonghe
  * 多階層の多対多フィールドのサブフォームで連動ルールがフォーム変数による代入を使用できない問題を修復。 ([#8518](https://github.com/nocobase/nocobase/pull/8518)) by @gchust
  * 多段モーダルおよびブロック間データ変更後にリフレッシュされない問題を修復。 ([#8471](https://github.com/nocobase/nocobase/pull/8471)) by @gchust
  * フィルタブロックで日時フィールドに時間を含む場合に時間フォーマットが重複する問題を修復 ([#8506](https://github.com/nocobase/nocobase/pull/8506)) by @zhangzhonghe
  * フィルタブロックで日時フィールドに時間を含む場合に時間フォーマットが重複する問題を修復 ([#8484](https://github.com/nocobase/nocobase/pull/8484)) by @zhangzhonghe
  * リッチテキストエディタのポップアップが遮られる問題を修復 ([#8443](https://github.com/nocobase/nocobase/pull/8443)) by @zhangzhonghe
  * filter リストの重複排除 ([#8431](https://github.com/nocobase/nocobase/pull/8431)) by @jiannx
  * 編集フォームで閲覧モードのサブ詳細データが正常に表示されない問題を修復 ([#8469](https://github.com/nocobase/nocobase/pull/8469)) by @katherinehhh
  * カスタム変数モーダルが遮られる問題を修復 ([#8463](https://github.com/nocobase/nocobase/pull/8463)) by @zhangzhonghe
  * リレーションファイルのクイック編集でファイル選択モーダルの階層が誤り、モーダル設定を保存できない問題を修復。 ([#8446](https://github.com/nocobase/nocobase/pull/8446)) by @gchust
  * クイックモーダルの高さがページ高さを超える問題を修復 ([#8437](https://github.com/nocobase/nocobase/pull/8437)) by @zhangzhonghe
  * ページネーション切り替え時にテーブルブロック操作列の状態が汚染される問題を修復。 ([#8438](https://github.com/nocobase/nocobase/pull/8438)) by @gchust
  * フォームのリレーションフィールドタイトルに添付URLを設定後、他フィールドに変更するとタイトル設定項目が消失する問題を修復 ([#8418](https://github.com/nocobase/nocobase/pull/8418)) by @katherinehhh
  * 新規フォームでリレーションフィールドを閲覧モードに設定後、タイトルフィールドを切り替えても反映されない問題を修復 ([#8413](https://github.com/nocobase/nocobase/pull/8413)) by @katherinehhh
  * 数値コンポーネントが値を表示しない ([#8410](https://github.com/nocobase/nocobase/pull/8410)) by @chenos
  * グリッドカードブロックで layout にコロンがないと反映されない問題を修復 ([#8399](https://github.com/nocobase/nocobase/pull/8399)) by @katherinehhh
  * リレーションファイルテーブルで一対一リレーションフィールドのファイル選択モーダル右下に送信ボタンが表示される問題を修復 ([#8398](https://github.com/nocobase/nocobase/pull/8398)) by @katherinehhh
  * フォーム内で数値入力時に漢字を入力しても値設定を防止しない問題を修復 ([#8397](https://github.com/nocobase/nocobase/pull/8397)) by @katherinehhh
  * targetKey オプションフィールドの処理ロジックを修復 ([#8333](https://github.com/nocobase/nocobase/pull/8333)) by @katherinehhh
  * リレーションフィールドをデータセレクターから選択コンポーネントへ切り替えた後もモーダルを開けてしまう問題を修復。 ([#8375](https://github.com/nocobase/nocobase/pull/8375)) by @gchust
  * 詳細・編集フォーム・リストブロックでページ切り替え後に連動ルールが再実行されない問題を修復。 ([#8366](https://github.com/nocobase/nocobase/pull/8366)) by @gchust
  * フィールドコンポーネントを切り替える過程で設定済みサブフォーム／サブテーブル内のフィールドが表示されない問題を修復。 ([#8365](https://github.com/nocobase/nocobase/pull/8365)) by @gchust
  * 詳細・リスト・フォームブロックでページ切り替え後にフィールドおよび操作の権限が再計算されない問題を修復。 ([#8336](https://github.com/nocobase/nocobase/pull/8336)) by @gchust
  * 編集モードのサブテーブルでリレーションフィールド Select の filter パラメータが誤っている問題を修復 ([#8335](https://github.com/nocobase/nocobase/pull/8335)) by @katherinehhh
  * targetKey オプションフィールドの処理ロジックを修復 ([#8333](https://github.com/nocobase/nocobase/pull/8333)) by @katherinehhh
  * 詳細ブロック内のサブ詳細モーダルのデータ誤りを修復 ([#8318](https://github.com/nocobase/nocobase/pull/8318)) by @katherinehhh
  * 連続してモーダルを開き、連動ルールおよびイベントフロー設定モーダルを開閉後に現在のモーダルを閉じるとエラーが発生する問題を修復。 ([#8312](https://github.com/nocobase/nocobase/pull/8312)) by @gchust
  * テーブルブロックのクイック編集スイッチ変更後にページをリフレッシュしないと反映されない問題を修復。 ([#8311](https://github.com/nocobase/nocobase/pull/8311)) by @gchust
  * メニュー切り替え時に URL のクエリパラメータが変更されると、そのパラメータに依存するデータ範囲ブロックが正しく更新されない問題を修復。 ([#8310](https://github.com/nocobase/nocobase/pull/8310)) by @gchust
  * リレーションフィールドコンポーネントの権限問題を修復 ([#8243](https://github.com/nocobase/nocobase/pull/8243)) by @katherinehhh
  * 詳細ブロック内のサブ詳細コンポーネントがページ切り替え時にデータ更新されない問題を修復 ([#8305](https://github.com/nocobase/nocobase/pull/8305)) by @katherinehhh
  * 編集フォームでページ切り替え時にサブフォーム内のネストされたサブテーブル内容が更新されない問題を修復 ([#8304](https://github.com/nocobase/nocobase/pull/8304)) by @katherinehhh
  * モーダルが開かない問題を修復し、ナビゲーションの安定性を改善 ([#8287](https://github.com/nocobase/nocobase/pull/8287)) by @zhangzhonghe
  * ドロップダウン選択コンポーネントから配列サブフォームコンポーネントへ切り替える際のエラーを修復 ([#8301](https://github.com/nocobase/nocobase/pull/8301)) by @katherinehhh
  * JS Field を通じてフォームに関連フィールドを追加できないようにする。 ([#8296](https://github.com/nocobase/nocobase/pull/8296)) by @gchust
  * レコード更新操作後にデータが複数回リフレッシュされる問題を修復。 ([#8299](https://github.com/nocobase/nocobase/pull/8299)) by @gchust
  * 多対多フィールドのサブフォームで AddNew 内容が選択データに上書きされる問題を修復 ([#8292](https://github.com/nocobase/nocobase/pull/8292)) by @katherinehhh
  * 詳細ブロックでレコード編集後に JS Item がリフレッシュされない問題を修復。 ([#8291](https://github.com/nocobase/nocobase/pull/8291)) by @gchust
  * データセレクターフィールドコンポーネントのモーダルで新規レコード追加後にリフレッシュされない問題を修復。 ([#8289](https://github.com/nocobase/nocobase/pull/8289)) by @gchust
  * 非表示状態の JS block ブロックでレンダリングエラーが発生する問題を修復。 ([#8286](https://github.com/nocobase/nocobase/pull/8286)) by @gchust
  * 手動ノードフォームで多対多データセレクターのフォームブロックメニューでエラーが発生する問題を修復 ([#8282](https://github.com/nocobase/nocobase/pull/8282)) by @mytharcher
  * リレーションフィールド削除後にブロックでエラーが発生する問題を修復 ([#8273](https://github.com/nocobase/nocobase/pull/8273)) by @katherinehhh
  * フィルタフォームのフィールドデフォルト値が初期レンダリング時に一度フィルタをトリガーしない問題を修復 ([#8232](https://github.com/nocobase/nocobase/pull/8232)) by @zhangzhonghe
  * テーブルブロックの操作列を削除できない問題を修復。 ([#8230](https://github.com/nocobase/nocobase/pull/8230)) by @gchust
  * プレビュー実行時に JSX コンパイル結果を stepParams に書き戻してしまい、保存後にソースコードが書き換えられる問題を修復。 ([#8171](https://github.com/nocobase/nocobase/pull/8171)) by @gchust
  * S3 Pro 添付ファイルアップロードエラーを修復し、ファイルプレビューを改善 ([#8211](https://github.com/nocobase/nocobase/pull/8211)) by @katherinehhh
  * 列幅調整時に単一行の合計幅がオーバーフローしないようにする ([#8166](https://github.com/nocobase/nocobase/pull/8166)) by @zhangzhonghe
  * フィルタフォームでチェックボックス「いいえ」を選択しても「はい」としてフィルタされる問題を修復。 ([#8170](https://github.com/nocobase/nocobase/pull/8170)) by @gchust
  * 役割が新規作成権限を持つ場合に新規フォームの送信ボタンが表示されない問題を修復 ([#8190](https://github.com/nocobase/nocobase/pull/8190)) by @katherinehhh
  * サブテーブル／サブフォームで既存データから選択時に未選択項目を送信するとデータがクリアされる問題を修復 ([#8172](https://github.com/nocobase/nocobase/pull/8172)) by @katherinehhh
  * 新規フォーム設定でデータ範囲設定が表示される問題を修復 ([#8176](https://github.com/nocobase/nocobase/pull/8176)) by @katherinehhh
  * フォーム内の tableoid フィールドのレンダリングエラーを修復 ([#8177](https://github.com/nocobase/nocobase/pull/8177)) by @katherinehhh
  * タブのイベントフローが保存できない ([#8168](https://github.com/nocobase/nocobase/pull/8168)) by @chenos
  * タブ非表示後も間隔を占有する問題を修復 ([#8167](https://github.com/nocobase/nocobase/pull/8167)) by @chenos
  * リレーション選択レコーダーで選択済み項目が誤ってフィルタされる問題を修復 ([#8151](https://github.com/nocobase/nocobase/pull/8151)) by @katherinehhh
  * リレーションフィールドのドロップダウンで options フィールド存在時にグレー表示で選択不可になる問題を修復 ([#8153](https://github.com/nocobase/nocobase/pull/8153)) by @katherinehhh
  * タグフィールド切り替え時にモーダル設定が失われる問題を修復。 ([#8136](https://github.com/nocobase/nocobase/pull/8136)) by @gchust
  * フィルタフォームで単一選択フィールドに複数選択演算子を使用時、中文入力で既存オプションが消える問題を修復。 ([#8140](https://github.com/nocobase/nocobase/pull/8140)) by @gchust
  * リレーションフィールド選択が子フィールドの disabled 制限を受ける問題を修復 ([#8131](https://github.com/nocobase/nocobase/pull/8131)) by @katherinehhh
  * フィルタフォームフィールドのデフォルトラベルが正しく多言語翻訳されない問題を修復。 ([#8135](https://github.com/nocobase/nocobase/pull/8135)) by @gchust
  * 日付フィルタフィールドで「過去」または「未来」選択時に UI コンポーネント幅が不一致となる問題を修復。 ([#8130](https://github.com/nocobase/nocobase/pull/8130)) by @gchust
  * JS block ブロックのタイトルと説明スタイルが他ブロックと一致しない問題を修復。 ([#8115](https://github.com/nocobase/nocobase/pull/8115)) by @gchust
  * 複数行テキストが改行されない問題を修復 ([#8122](https://github.com/nocobase/nocobase/pull/8122)) by @katherinehhh
  * 演算子が「いずれかを含む」および「いずれも含まない」の場合にオプションフィールドフィルタで全オプションが表示されない問題を修復。 ([#8118](https://github.com/nocobase/nocobase/pull/8118)) by @gchust
  * サブフォーム内ネストされたサブテーブルにデータが表示されない問題を修復 ([#8117](https://github.com/nocobase/nocobase/pull/8117)) by @katherinehhh
  * フィルタ操作で期間フィルタ値をクリア後に再度フィルタするとエラーになる問題を修復。 ([#8110](https://github.com/nocobase/nocobase/pull/8110)) by @gchust
  * フィルタフォームのリレーションフィールドで選択可能データが正しくない問題を修復。 ([#8109](https://github.com/nocobase/nocobase/pull/8109)) by @gchust
  * フィルタフォームのカスタムフィールド設定が正しく反映・一部設定が有効にならない問題を修復。 ([#8106](https://github.com/nocobase/nocobase/pull/8106)) by @gchust
  * Checkbox フィールドのフィルタが機能しない問題を修復。 ([#8103](https://github.com/nocobase/nocobase/pull/8103)) by @gchust
  * フィルタ操作で number フィールド値が正しく反映されない問題を修復。 ([#8104](https://github.com/nocobase/nocobase/pull/8104)) by @gchust
  * フィルタフォームで一部フィールドの演算子が正しくデータをフィルタできない問題を修復。 ([#8100](https://github.com/nocobase/nocobase/pull/8100)) by @gchust
  * ブロック削除後にフィルタブロック内の該当フィールドが削除されない問題を修復。 ([#8098](https://github.com/nocobase/nocobase/pull/8098)) by @gchust
  * ボタン非表示後、非設定モードで余分な間隔が表示される問題を修復 ([#8092](https://github.com/nocobase/nocobase/pull/8092)) by @katherinehhh
  * フィルタフォームのリセットボタン文言を変更できない問題を修復。 ([#8089](https://github.com/nocobase/nocobase/pull/8089)) by @gchust
  * フィールドフィルタ演算子が \$in および \$notIn の場合に複数入力値をサポートしない問題を修復。 ([#8081](https://github.com/nocobase/nocobase/pull/8081)) by @gchust
  * データブロック追加後にフィルタフォームのフィールドメニューに自動表示されない問題を修復。 ([#8085](https://github.com/nocobase/nocobase/pull/8085)) by @gchust
  * フィルタフォームのリレーションフィールド設定メニューにクイック作成が表示されるべきでない。 ([#8083](https://github.com/nocobase/nocobase/pull/8083)) by @gchust
  * リストブロック内のリレーションサブテーブルデータ誤りを修復 ([#8082](https://github.com/nocobase/nocobase/pull/8082)) by @katherinehhh
  * データテーブルで設定した数値フィールド検証ルールがフォームで有効にならない問題を修復 ([#8025](https://github.com/nocobase/nocobase/pull/8025)) by @katherinehhh
  * フィルタフォームのフィールドがバックエンド検証ルールにより制限される問題を修復。 ([#8074](https://github.com/nocobase/nocobase/pull/8074)) by @gchust
  * サブテーブルで大きなフィールド編集時の表示異常を修復 ([#8069](https://github.com/nocobase/nocobase/pull/8069)) by @katherinehhh
  * 多対多リレーションのドロップダウンで複数選択許可をオフにするとクイック追加でエラーになる問題を修復 ([#8034](https://github.com/nocobase/nocobase/pull/8034)) by @katherinehhh
  * json フィールドのクイック編集エラーを修復 ([#8059](https://github.com/nocobase/nocobase/pull/8059)) by @katherinehhh
  * json フィールドは送信時にオブジェクトであるべき ([#8057](https://github.com/nocobase/nocobase/pull/8057)) by @katherinehhh
  * Enter キーでフィルタ操作をトリガーできない問題を修復。 ([#8056](https://github.com/nocobase/nocobase/pull/8056)) by @gchust
  * 多対多ドロップダウンで複数選択無効化後に N/A と表示される問題を修復 ([#8050](https://github.com/nocobase/nocobase/pull/8050)) by @katherinehhh
  * データセレクターブロックで一括削除が失敗する問題を修復 ([#8023](https://github.com/nocobase/nocobase/pull/8023)) by @katherinehhh
  * コメントブロック追加時に現在レコードメニューが表示される問題を修復。 ([#8039](https://github.com/nocobase/nocobase/pull/8039)) by @gchust
  * フィルタ操作で日付フィールドを時間フィールドに切り替えた際のレンダリングエラーを修復。 ([#8036](https://github.com/nocobase/nocobase/pull/8036)) by @gchust
  * 編集操作および新規操作モーダルのデフォルトタイトルが不正確な問題を修復。 ([#8033](https://github.com/nocobase/nocobase/pull/8033)) by @gchust
  * 詳細ブロック内の JS field のデフォルトスタイルが不正確な問題を修復。 ([#8031](https://github.com/nocobase/nocobase/pull/8031)) by @gchust
  * サブテーブルの列幅設定が無効な問題を修復 ([#8027](https://github.com/nocobase/nocobase/pull/8027)) by @katherinehhh
  * サブテーブルの列ドラッグが無効な問題を修復 ([#8026](https://github.com/nocobase/nocobase/pull/8026)) by @katherinehhh
  * リレーションフィールドで開いたモーダル内の現在モーダルレコード変数を正しく解析できない問題を修復。 ([#8019](https://github.com/nocobase/nocobase/pull/8019)) by @gchust
  * markdown フィールドの Popover スタイル問題を修復 ([#8012](https://github.com/nocobase/nocobase/pull/8012)) by @katherinehhh
  * モーダル内でリレーションフィールドデータ読み込み時にエラーが発生する問題を修復し、表示と機能を改善。 ([#7985](https://github.com/nocobase/nocobase/pull/7985)) by @gchust
  * ツリーテーブルブロックで子ノードを展開できない問題を修復 ([#8011](https://github.com/nocobase/nocobase/pull/8011)) by @katherinehhh
  * 複合主キーテーブルブロックで行選択と削除が無効な問題を修復 ([#7978](https://github.com/nocobase/nocobase/pull/7978)) by @katherinehhh
  * ページ遷移時にページタブ状態とルーティングが一致しない問題を修復 ([#7991](https://github.com/nocobase/nocobase/pull/7991)) by @zhangzhonghe
  * markdown フィールドの html モードで幅超過時の省略表示が異常な問題を修復 ([#7994](https://github.com/nocobase/nocobase/pull/7994)) by @katherinehhh
  * カスケードドロップダウンセレクターで検索データが不完全な問題を修復 ([#7990](https://github.com/nocobase/nocobase/pull/7990)) by @katherinehhh
  * id 以外のリレーションフィールドモーダル詳細ブロックでエラーが発生する問題を修復。 ([#7973](https://github.com/nocobase/nocobase/pull/7973)) by @gchust
  * id 以外のリレーションフィールドモーダルでリレーションデータ読み込みエラーを修復。 ([#7970](https://github.com/nocobase/nocobase/pull/7970)) by @gchust
  * 数値フィールドのフォーマット精度設定が無効な問題を修復 ([#7967](https://github.com/nocobase/nocobase/pull/7967)) by @katherinehhh
  * フィルタリセットボタン押下時にフィルタ値がクリアされない問題を修復 ([#7966](https://github.com/nocobase/nocobase/pull/7966)) by @zhangzhonghe
  * 新規 2.0 ページタイプが不正確な問題を修復 ([#7945](https://github.com/nocobase/nocobase/pull/7945)) by @zhangzhonghe
  * 詳細ブロックでテキストフィールドが幅超過時にデフォルトで改行するようにする ([#7955](https://github.com/nocobase/nocobase/pull/7955)) by @katherinehhh
  * 多段カスケードセレクターでデータクリア時のエラーを修復 ([#7943](https://github.com/nocobase/nocobase/pull/7943)) by @katherinehhh
  * ツリーテーブルボタンが非ツリーテーブルブロックに表示される問題を修復 ([#7931](https://github.com/nocobase/nocobase/pull/7931)) by @katherinehhh
  * JS block ブロックのタイトルと説明が表示されない問題を修復。 ([#7913](https://github.com/nocobase/nocobase/pull/7913)) by @gchust
  * ブロックが非表示後もページスペースを占有する問題を修復。 ([#7906](https://github.com/nocobase/nocobase/pull/7906)) by @gchust
  * 新規フォームのサブフォームフィールド権限判定エラーを修復 ([#7902](https://github.com/nocobase/nocobase/pull/7902)) by @katherinehhh
  * フィルタボタンでリセットボタンがデフォルト条件をクリアする問題を修復 ([#7903](https://github.com/nocobase/nocobase/pull/7903)) by @zhangzhonghe
  * フォームフィールド設定項目の不具合を修復 ([#7867](https://github.com/nocobase/nocobase/pull/7867)) by @katherinehhh
  * リッチテキストフィールドでデフォルト値入力不可および複数選択フィールドで複数デフォルト値設定不可問題を修復。 ([#7864](https://github.com/nocobase/nocobase/pull/7864)) by @gchust
  * デフォルト js field 設定が表示モード設定を使用していない問題を修復。 ([#7862](https://github.com/nocobase/nocobase/pull/7862)) by @gchust
  * フィルタフォーム日付フィールドのデフォルト値を正しく設定できない問題を修復。 ([#7853](https://github.com/nocobase/nocobase/pull/7853)) by @gchust
  * テーブルブロックのクイック編集操作でデータ更新が正しく反映されない問題を修復。 ([#7845](https://github.com/nocobase/nocobase/pull/7845)) by @gchust
  * コードエディタでプレビュー時に jsx 構文使用でエラーが発生する問題を修復 ([#7836](https://github.com/nocobase/nocobase/pull/7836)) by @gchust
  * テーブル行データ更新後に行操作ボタンの連動ルールが再実行されない問題を修復し、データ変更時に正しく適用されるようにする。 ([#7832](https://github.com/nocobase/nocobase/pull/7832)) by @gchust
  * フィルタフォームのリレーションフィールドで “value.replace is not a function” エラーを修復 ([#7824](https://github.com/nocobase/nocobase/pull/7824)) by @zhangzhonghe
  * 現在データテーブル変数がフィルタコンポーネントの変数セレクターから選択できないようにする ([#7818](https://github.com/nocobase/nocobase/pull/7818)) by @gchust
  * onChange コールバック引数誤りを修復 ([#7807](https://github.com/nocobase/nocobase/pull/7807)) by @zhangzhonghe
  * テーブルブロック操作列を非表示にできない問題を修復 ([#7804](https://github.com/nocobase/nocobase/pull/7804)) by @gchust
  * データテーブルセレクターフィールドでデータ選択できない問題を修復 ([#7794](https://github.com/nocobase/nocobase/pull/7794)) by @katherinehhh
  * AI 従業員指示で変数オブジェクト全体を選択可能にする ([#7791](https://github.com/nocobase/nocobase/pull/7791)) by @gchust
  * テーブル操作列と jsColumn 列幅設定が無効な問題を修復 ([#7777](https://github.com/nocobase/nocobase/pull/7777)) by @katherinehhh
  * ページイベントフローでページブロックのデータ範囲設定が反映されない問題 ([#7788](https://github.com/nocobase/nocobase/pull/7788)) by @gchust
  * リレーションフィールドタイトルが省略表示設定しても反映されない問題 ([#7778](https://github.com/nocobase/nocobase/pull/7778)) by @katherinehhh
  * 更新操作ボタンの連動ルールが無効になる問題 ([#7774](https://github.com/nocobase/nocobase/pull/7774)) by @gchust
  * Markdown Vditor フィールド必須検証失敗問題を修復 ([#7764](https://github.com/nocobase/nocobase/pull/7764)) by @katherinehhh
  * 変数関連コンポーネントで列挙型ラベルが対応言語で正しく表示されない問題を修復。 ([#7765](https://github.com/nocobase/nocobase/pull/7765)) by @gchust
  * フロントエンド検証設定後に必須設定すると必須マークが欠落する問題を修復 ([#7760](https://github.com/nocobase/nocobase/pull/7760)) by @katherinehhh
  * フィルタフォームのリレーションフィールドでデータ範囲設定をサポート ([#7761](https://github.com/nocobase/nocobase/pull/7761)) by @zhangzhonghe
  * フォーム内の非タイムゾーン日付クリア時の異常を修復 ([#7759](https://github.com/nocobase/nocobase/pull/7759)) by @katherinehhh
  * 連動ルール設定の必須フィールドが正常動作しない問題を修復 ([#7756](https://github.com/nocobase/nocobase/pull/7756)) by @zhangzhonghe
  * サブテーブル時間フィールドのフォーマット誤りを修復 ([#7750](https://github.com/nocobase/nocobase/pull/7750)) by @katherinehhh
  * フィルタフォーム日付フィールドで「指定日」削除時に Invalid Date になる問題を修復 ([#7746](https://github.com/nocobase/nocobase/pull/7746)) by @katherinehhh
  * 現在フォーム変数フィールドを読み込めない ([#7745](https://github.com/nocobase/nocobase/pull/7745)) by @gchust
  * 変数解析結果が配列で「対一」フィールド値またはデフォルト値に設定された場合にエラーとなる問題を修復。解析結果の正しい処理を保証し、安定性と正確性を向上。 ([#7735](https://github.com/nocobase/nocobase/pull/7735)) by @gchust
  * 現在フォームの関連フィールド変数が正しく認識されない問題を解決し、データ処理の正確性を向上。 ([#7726](https://github.com/nocobase/nocobase/pull/7726)) by @gchust
  * フィルタ不可フィールドが誤ってフィルタオプションに表示される問題を修復し、利用可能フィールドのみ表示。 ([#7700](https://github.com/nocobase/nocobase/pull/7700)) by @gchust
  * データテーブルのリレーションフィールド削除後に UI ブロック表示が異常になる問題を修復 ([#7706](https://github.com/nocobase/nocobase/pull/7706)) by @katherinehhh
  * サブフォーム連動ルールの既知問題を修復 ([#7698](https://github.com/nocobase/nocobase/pull/7698)) by @zhangzhonghe
  * フィルタフォームの JS ブロックフィールドが読み込めない ([#7690](https://github.com/nocobase/nocobase/pull/7690)) by @gchust
  * フィールドが読み取り専用時にデフォルト値設定不可問題を修復し、設定を円滑化。 ([#7689](https://github.com/nocobase/nocobase/pull/7689)) by @gchust
  * モーダルでタブ切替後に二次モーダルを開閉し全モーダル閉鎖後に URL が正しく更新されない問題を修復。 ([#7630](https://github.com/nocobase/nocobase/pull/7630)) by @gchust
  * usePlugin のコンテキスト欠如時のエラーを修復 ([#7627](https://github.com/nocobase/nocobase/pull/7627)) by @chenos
  * `一括更新` と `更新` 操作で代入フィールド設定不可 ([#7565](https://github.com/nocobase/nocobase/pull/7565)) by @gchust
  * コードエディタの「実行」機能が正常動作しない問題を修復し、正しく実行可能にする。 ([#7547](https://github.com/nocobase/nocobase/pull/7547)) by @gchust
  * フォーム送信後にデータがリフレッシュされない問題を修復 ([#7560](https://github.com/nocobase/nocobase/pull/7560)) by @zhangzhonghe
  * テーブルページ切替時にページ表示が異常となる問題を修復 ([#7572](https://github.com/nocobase/nocobase/pull/7572)) by @zhangzhonghe
- - フィルターフィールド子メニューに検索文字があると展開できない問題を修正しました ([#8604](https://github.com/nocobase/nocobase/pull/8604)) by @gchust
  - JS block で Blob オブジェクトを作成できない問題を修正しました ([#8603](https://github.com/nocobase/nocobase/pull/8603)) by @gchust
  - JS Models の "ctx.sql" 実行時にコンテキストが不正になる問題を修正しました ([#8602](https://github.com/nocobase/nocobase/pull/8602)) by @gchust
  - 子テーブル（モーダル編集）で createModelOptions 設定後に列削除が効かない問題を修正しました ([#8576](https://github.com/nocobase/nocobase/pull/8576)) by @katherinehhh
  - 子テーブル（モーダル編集）で createModelOptions 設定後に列削除が効かない問題を修正しました ([#8560](https://github.com/nocobase/nocobase/pull/8560)) by @katherinehhh
  - JS block で一部の外部ライブラリが正しく読み込めない問題を修正しました ([#8545](https://github.com/nocobase/nocobase/pull/8545)) by @gchust
  - ページ切替後にモーダルを開いて送信しても更新されない問題を修正しました ([#8554](https://github.com/nocobase/nocobase/pull/8554)) by @gchust
  - runjs が一部 ESM を AMD と誤判定して読み込みが崩れる問題を修正しました ([#8536](https://github.com/nocobase/nocobase/pull/8536)) by @gchust
  - filterTargetKey が単要素配列のとき FilterByTK 処理が誤る問題を修正しました ([#8522](https://github.com/nocobase/nocobase/pull/8522)) by @katherinehhh
  - 埋め込みモーダルで連携ルール設定とイベントフロー設定を開閉後にエラーになる問題を修正しました ([#8368](https://github.com/nocobase/nocobase/pull/8368)) by @gchust
  - runjs の変数が実行前に解析される問題を修正しました ([#8445](https://github.com/nocobase/nocobase/pull/8445)) by @gchust
  - クイック追加モーダルでモーダル変数を選択できない問題を修正しました ([#8450](https://github.com/nocobase/nocobase/pull/8450)) by @gchust
  - 設定メニューから複数の設定モーダルを開けてしまう問題を修正しました ([#8448](https://github.com/nocobase/nocobase/pull/8448)) by @gchust
  - モーダルを開くと動的イベントフローが 2 回走る問題を修正しました ([#8435](https://github.com/nocobase/nocobase/pull/8435)) by @gchust
  - モーダルを複数回開くと状態が汚染される問題を修正しました ([#8327](https://github.com/nocobase/nocobase/pull/8327)) by @gchust
  - フィルター操作の選択欄の高さが小さすぎる問題を修正しました ([#8288](https://github.com/nocobase/nocobase/pull/8288)) by @gchust
  - モーダルタブの内容が表示されない問題を修正しました ([#8281](https://github.com/nocobase/nocobase/pull/8281)) by @zhangzhonghe
  - 子ページを開くと主ページのアンマウント／不要な再レンダリングが起きる問題を修正しました ([#8276](https://github.com/nocobase/nocobase/pull/8276)) by @zhangzhonghe
  - ツリーテーブルで子レコード追加の権限判定が誤る問題を修正しました ([#8240](https://github.com/nocobase/nocobase/pull/8240)) by @katherinehhh
  - ドラッグ後に新規追加したアクション／タブが表示されない問題を修正しました ([#8224](https://github.com/nocobase/nocobase/pull/8224)) by @gchust
  - 外部データソースの権限判定の欠陥を修正しました ([#8221](https://github.com/nocobase/nocobase/pull/8221)) by @katherinehhh
  - 外部データソースのアクションが権限ありでも隠れる問題を修正しました ([#8217](https://github.com/nocobase/nocobase/pull/8217)) by @katherinehhh
  - モーダル uid 再利用時に送信してもブロックが更新されない問題を修正しました ([#8202](https://github.com/nocobase/nocobase/pull/8202)) by @gchust
  - 一部ブロックのモーダルレコード関連変数の表示が誤る問題を修正しました ([#8060](https://github.com/nocobase/nocobase/pull/8060)) by @gchust
  - 添付ダウンロードエラーを修正しました ([#8154](https://github.com/nocobase/nocobase/pull/8154)) by @katherinehhh
  - integer 型がオプションのとき正しく変換されない問題を修正しました ([#8138](https://github.com/nocobase/nocobase/pull/8138)) by @chenos
  - useModel 未指定で toggleable 子モデルメニューが切替できない問題を修正しました（createModelOptions.use から推論） ([#8105](https://github.com/nocobase/nocobase/pull/8105)) by @zhangzhonghe
  - コンポーネント切替後に旧設定が残る問題を修正しました ([#8095](https://github.com/nocobase/nocobase/pull/8095)) by @gchust
  - useEffect の配置を調整しました ([#8088](https://github.com/nocobase/nocobase/pull/8088)) by @zhangzhonghe
  - フィルター操作フィールドに非対応の関連フィールドが出る問題を修正しました ([#8086](https://github.com/nocobase/nocobase/pull/8086)) by @gchust
  - コメント編集後に保存が失敗する問題を修正しました ([#8035](https://github.com/nocobase/nocobase/pull/8035)) by @katherinehhh
  - モーダル内送信で閉じてもブロックが更新されない問題を修正しました ([#8021](https://github.com/nocobase/nocobase/pull/8021)) by @gchust
  - 詳細ブロックで現在レコード変数のバックエンド解析が走らない問題を修正しました ([#8004](https://github.com/nocobase/nocobase/pull/8004)) by @gchust
  - 詳細ブロックのツールバーアイコンがずれる問題を修正しました ([#7929](https://github.com/nocobase/nocobase/pull/7929)) by @zhangzhonghe
  - クイック編集フォームがエラーになる問題を修正しました ([#7923](https://github.com/nocobase/nocobase/pull/7923)) by @gchust
  - 再ログイン後に acl 権限データが再読込されない問題を修正しました ([#7874](https://github.com/nocobase/nocobase/pull/7874)) by @gchust
  - イベントフロー変更にページ更新が必要な問題を修正しました ([#7811](https://github.com/nocobase/nocobase/pull/7811)) by @gchust
  - UI で変更したサブフォーム関連フィールドの変数が解析できない問題を修正しました ([#7799](https://github.com/nocobase/nocobase/pull/7799)) by @gchust
  - 複数主キーの編集フォームがエラーになる問題を修正しました ([#7798](https://github.com/nocobase/nocobase/pull/7798)) by @gchust
  - 「ビューを開く」アクションの設定が一部反映されない問題を修正しました ([#7790](https://github.com/nocobase/nocobase/pull/7790)) by @gchust
  - ページ切替後に行アクションボタンが更新されない問題を修正しました ([#7779](https://github.com/nocobase/nocobase/pull/7779)) by @gchust
  - フィルター値が false のときデータ範囲リクエストが不正になる問題を修正しました ([#7766](https://github.com/nocobase/nocobase/pull/7766)) by @gchust
  - 最終ページ削除後のページネーションパラメータが不正になる問題を修正しました ([#7755](https://github.com/nocobase/nocobase/pull/7755)) by @katherinehhh
  - サブフォームの現在オブジェクト変数の関連フィールド値が解析できない問題を修正しました ([#7751](https://github.com/nocobase/nocobase/pull/7751)) by @gchust
  - イベントフローのステップが設定メニューに出る問題を修正しました ([#7723](https://github.com/nocobase/nocobase/pull/7723)) by @gchust
  - モーダル内の関連フィールドのデータ範囲で「現在のモーダルレコード」選択が不正な問題を修正しました ([#7675](https://github.com/nocobase/nocobase/pull/7675)) by @gchust
  - FlowModel でカスタム flow action を設定できない問題を修正しました ([#7666](https://github.com/nocobase/nocobase/pull/7666)) by @gchust
  - js コードエディターのコピー＆ペーストでエラーになる問題を修正しました ([#7641](https://github.com/nocobase/nocobase/pull/7641)) by @gchust
  - antd の翻訳が効かない問題を修正しました ([#7621](https://github.com/nocobase/nocobase/pull/7621)) by @zhangzhonghe
  - 引用ブロックで現在ビュー変数が取得できない問題を修正しました ([#7620](https://github.com/nocobase/nocobase/pull/7620)) by @gchust
- **[server]**

  - 外部データソースで Snowflake ID (53 bits) 型フィールドに対応しました ([#8185](https://github.com/nocobase/nocobase/pull/8185)) by @2013xile
  - license-kit を最新に更新しました ([#8173](https://github.com/nocobase/nocobase/pull/8173)) by @jiannx
  - 引用フィールド複製時に field.targetKey を保持するようにしました ([#7599](https://github.com/nocobase/nocobase/pull/7599)) by @chenos
  - 主キー移行スクリプトのエラーを修正しました ([#7563](https://github.com/nocobase/nocobase/pull/7563)) by @2013xile
- **[database]**

  - ネスト関連の深度更新の不具合を修正しました ([#8492](https://github.com/nocobase/nocobase/pull/8492)) by @chenos
  - 多対多検索で through scope 条件を付与するようにしました ([#8277](https://github.com/nocobase/nocobase/pull/8277)) by @2013xile
  - 複合キーのテーブルで `filterByTk` に配列を渡せるようになりました ([#7986](https://github.com/nocobase/nocobase/pull/7986)) by @chenos
  - `runSQL` 実行前に `search_path` を設定するようにしました ([#7611](https://github.com/nocobase/nocobase/pull/7611)) by @2013xile
- **[sdk]** token 共有の実装を改善しました ([#8357](https://github.com/nocobase/nocobase/pull/8357)) by @chenos
- **[acl]** acl.allow が早期実行される問題を修正しました ([#8065](https://github.com/nocobase/nocobase/pull/8065)) by @chenos
- **[utils]**

  - フィルターボタンで “Invalid filter item type” が出る問題を修正しました ([#7838](https://github.com/nocobase/nocobase/pull/7838)) by @zhangzhonghe
  - イベントフローで “Unrecognized operation” が出る問題を修正しました ([#7835](https://github.com/nocobase/nocobase/pull/7835)) by @zhangzhonghe
- **[ローカライズ]** i18n 欠損 key の扱いを改善しました ([#8673](https://github.com/nocobase/nocobase/pull/8673)) by @chenos
- **[AI従業員]**

  - aiTools:list が 403 を返す問題を修正しました ([#8672](https://github.com/nocobase/nocobase/pull/8672)) by @chenos
  - AI従業員使用時にメモリが枯渇してクラッシュする問題を修正しました ([#8653](https://github.com/nocobase/nocobase/pull/8653)) by @mytharcher
  - オンライン検索後に参考リンクが表示されない問題を修正しました ([#8651](https://github.com/nocobase/nocobase/pull/8651)) by @cgyrock
  - openai API 呼び出し時の引数エラーを修正しました ([#8633](https://github.com/nocobase/nocobase/pull/8633)) by @cgyrock
  - LLM ノードでメッセージ送信に失敗する問題を修正しました ([#8569](https://github.com/nocobase/nocobase/pull/8569)) by @2013xile
  - AI モデリング中のツール自動呼び出し例外を修正しました ([#8532](https://github.com/nocobase/nocobase/pull/8532)) by @cgyrock
  - ビルド後に起動できない問題を修正しました ([#8523](https://github.com/nocobase/nocobase/pull/8523)) by @cgyrock
  - AI モデリングとデータソース管理で選択可能フィールドが一致しない問題を修正しました ([#8488](https://github.com/nocobase/nocobase/pull/8488)) by @cgyrock
  - LLM ノードのメッセージ内容が表示されない問題を修正しました ([#8257](https://github.com/nocobase/nocobase/pull/8257)) by @heziqiang
  - AI 対話記録テキストが改行されない問題を修正しました ([#8096](https://github.com/nocobase/nocobase/pull/8096)) by @heziqiang
  - AI データソースロール名がコンパイルされない問題を修正しました ([#8076](https://github.com/nocobase/nocobase/pull/8076)) by @heziqiang
  - 一部の現在レコードフィールドが変数選択リストに出ない問題を修正しました ([#8053](https://github.com/nocobase/nocobase/pull/8053)) by @gchust
  - AI従業員が SQL を異常出力する問題を修正しました ([#7956](https://github.com/nocobase/nocobase/pull/7956)) by @heziqiang
  - v1 ページで AI従業員のチャットボタンを非表示にしました ([#7829](https://github.com/nocobase/nocobase/pull/7829)) by @cgyrock
  - Gemini の Web Search ロジックとヒントを改善しました ([#7720](https://github.com/nocobase/nocobase/pull/7720)) by @cgyrock
  - API リソースを含むブロック選択時にデータ取得が不正になる問題を修正しました ([#7688](https://github.com/nocobase/nocobase/pull/7688)) by @cgyrock
  - モバイルレイアウトで AI従業員チャットのレイアウト問題を修正しました ([#7591](https://github.com/nocobase/nocobase/pull/7591)) by @cgyrock
  - AI従業員の権限設定ページがエラーになる問題を修正しました ([#7548](https://github.com/nocobase/nocobase/pull/7548)) by @2013xile
  - chatGPT-4o 使用時の AI従業員モデリングツールの異常を修正しました ([#7566](https://github.com/nocobase/nocobase/pull/7566)) by @cgyrock
- **[カレンダー]** N/A ([#8498](https://github.com/nocobase/nocobase/pull/8498)) by @sembaev-a-a
- **[ファイルマネージャー]**

  - ファイルタイプフィールド無効化後も選択モーダルを開ける問題を修正しました ([#8617](https://github.com/nocobase/nocobase/pull/8617)) by @katherinehhh
  - List／Grid card ブロックで子詳細データ表示が誤る問題を修正しました ([#8087](https://github.com/nocobase/nocobase/pull/8087)) by @katherinehhh
  - 閲覧モード子テーブルで Attachment フィールドが読み込まれない問題を修正しました ([#8073](https://github.com/nocobase/nocobase/pull/8073)) by @katherinehhh
  - 添付アップロードが指定ストレージを使わない問題を修正しました ([#7947](https://github.com/nocobase/nocobase/pull/7947)) by @katherinehhh
  - テーブルブロックのフィールド設定関連の欠陥を修正しました ([#7843](https://github.com/nocobase/nocobase/pull/7843)) by @katherinehhh
- **[フロントエンド FlowEngine]**

  - ブロックテンプレートをコピー方式で使うとモーダルが空になる問題を修正しました ([#8581](https://github.com/nocobase/nocobase/pull/8581)) by @gchust
  - ハイフンを含む変数を解析できない問題を修正しました ([#8432](https://github.com/nocobase/nocobase/pull/8432)) by @gchust
  - filterByTk が配列のとき変数解析が不正になる問題を修正しました ([#8412](https://github.com/nocobase/nocobase/pull/8412)) by @gchust
  - レコード変数解析で、レコードとそのフィールドを同時に使うと常に完全レコードを返す問題を修正しました ([#7917](https://github.com/nocobase/nocobase/pull/7917)) by @gchust
  - 連携ルールの変数割り当てで変数解析できない問題を修正しました ([#7684](https://github.com/nocobase/nocobase/pull/7684)) by @gchust
  - 上位モーダルのレコード変数解析が不正な問題を修正しました ([#7637](https://github.com/nocobase/nocobase/pull/7637)) by @gchust
- **[ブロック：地図]**

  - 「テンプレートとして保存」が 2 つ出る問題を修正しました ([#8584](https://github.com/nocobase/nocobase/pull/8584)) by @katherinehhh
  - メニュー切替後のズーム表示が不正な問題を修正しました ([#8193](https://github.com/nocobase/nocobase/pull/8193)) by @katherinehhh
- **[データテーブルフィールド：添付（URL）]** 添付 URL フィールドでファイル名表示が効かない問題を修正しました ([#8571](https://github.com/nocobase/nocobase/pull/8571)) by @katherinehhh
- **[UI テンプレート]**

  - 関連フィールドの新規追加モーダルをテンプレート保存後、再度開いて送信するとエラーになる問題を修正しました ([#8564](https://github.com/nocobase/nocobase/pull/8564)) by @gchust
  - 引用テンプレートブロックがイベントフローでデータ範囲を設定できない問題を修正しました ([#8472](https://github.com/nocobase/nocobase/pull/8472)) by @gchust
  - 旧モーダルをテンプレート化後に再利用できない問題を修正しました ([#8283](https://github.com/nocobase/nocobase/pull/8283)) by @gchust
  - フィールドテンプレートで連携ルール／レイアウトが適用できない問題を修正しました ([#8266](https://github.com/nocobase/nocobase/pull/8266)) by @gchust
  - 関連フィールドモーダルで非関連フィールドモーダルテンプレートを開くとエラーになる問題を修正しました ([#8233](https://github.com/nocobase/nocobase/pull/8233)) by @gchust
- **[ブロック：テンプレート（廃止済み）]**

  - 継承テンプレート(v1)の編集ページに入れない問題を修正しました ([#8376](https://github.com/nocobase/nocobase/pull/8376)) by @gchust
  - モーダルの開閉で不要なテンプレートリクエストが走る問題を修正しました ([#7561](https://github.com/nocobase/nocobase/pull/7561)) by @gchust
- **[アクション：一括更新]** 外部データソースの一括更新がエラーになる問題を修正しました ([#8320](https://github.com/nocobase/nocobase/pull/8320)) by @gchust
- **[データ可視化]**

  - AI 円グラフの label 表示誤りを修正し、正規化オプションを追加しました。<br/> ソートフィールドは選択済みフィールドからのみ選べるようにしました。<br/> ([#8309](https://github.com/nocobase/nocobase/pull/8309)) by @heziqiang
  - 外部データソース選択／loading 表示／設定取消後エラーの問題を修正しました。 ([#8169](https://github.com/nocobase/nocobase/pull/8169)) by @heziqiang
  - 保存後にブロックが更新されない問題を修正しました ([#7920](https://github.com/nocobase/nocobase/pull/7920)) by @heziqiang
  - プレビュー時のみ debug モードを使うようにしました ([#7893](https://github.com/nocobase/nocobase/pull/7893)) by @heziqiang
  - 初期化時に sql:runById でデータ取得するようにしました ([#7677](https://github.com/nocobase/nocobase/pull/7677)) by @heziqiang
  - SQL 変数自動解析の不具合を修正しました ([#7642](https://github.com/nocobase/nocobase/pull/7642)) by @heziqiang
  - orders パラメータ欠落を修正しました ([#7636](https://github.com/nocobase/nocobase/pull/7636)) by @heziqiang
  - 登録タイムアウトにより表示できない問題を修正しました ([#7608](https://github.com/nocobase/nocobase/pull/7608)) by @heziqiang
- **[アクション：レコードインポート]**

  - ファイルインポート時にワークスペースを検証するようにしました ([#8285](https://github.com/nocobase/nocobase/pull/8285)) by @jiannx
  - インポートフィールド一覧表示の不具合を修正しました ([#7710](https://github.com/nocobase/nocobase/pull/7710)) by @katherinehhh
- **[非同期タスクマネージャー]** 取消の案内文言の不具合を修正しました ([#8245](https://github.com/nocobase/nocobase/pull/8245)) by @mytharcher
- **[ワークフロー]**

  - 「外部データソース」更新後にイベントが失効する問題を修正しました ([#8207](https://github.com/nocobase/nocobase/pull/8207)) by @cgyrock
  - ワークフロー追加後に固まる問題を修正しました ([#7541](https://github.com/nocobase/nocobase/pull/7541)) by @mytharcher
- **[データテーブルフィールド：多対多（配列）]** Snowflake ID (53 bits) のターゲットキーで作成できない問題を修正しました ([#8226](https://github.com/nocobase/nocobase/pull/8226)) by @2013xile
- **[データテーブルフィールド：数式]**

  - BigInt を詳細／フォームブロックに追加できない問題を修正しました ([#8201](https://github.com/nocobase/nocobase/pull/8201)) by @katherinehhh
  - 数式フィールドに値入力できない問題を修正しました ([#8102](https://github.com/nocobase/nocobase/pull/8102)) by @gchust
  - 数式フィールドをフィルターフォームに追加できない問題を修正しました ([#8071](https://github.com/nocobase/nocobase/pull/8071)) by @gchust
- **[ブロック：操作パネル]** 操作パネルの List レイアウト間隔を改善しました ([#8084](https://github.com/nocobase/nocobase/pull/8084)) by @katherinehhh
- **[データソース管理]** 外部データソースのパスワード更新エラーを修正しました ([#8024](https://github.com/nocobase/nocobase/pull/8024)) by @cgyrock
- **[アクション：レコードエクスポート]**

  - エクスポート可能フィールド一覧にシステム項目が欠ける問題を修正しました ([#8002](https://github.com/nocobase/nocobase/pull/8002)) by @katherinehhh
  - エクスポート可能フィールド一覧表示が誤る問題を修正しました ([#7714](https://github.com/nocobase/nocobase/pull/7714)) by @katherinehhh
- **[マルチアプリ管理器（廃止済み）]**

  - 子アプリ停止時に同期シグナルを発行して他ノードにも停止を通知するようにしました ([#7849](https://github.com/nocobase/nocobase/pull/7849)) by @2013xile
  - 子アプリ状態テレメトリの収集不具合を修正しました ([#7772](https://github.com/nocobase/nocobase/pull/7772)) by @2013xile
  - 旧マルチアプリ管理を無効化できない問題を修正しました ([#7633](https://github.com/nocobase/nocobase/pull/7633)) by @jiannx
  - マルチアプリ移行前のポート検証を修正しました ([#7540](https://github.com/nocobase/nocobase/pull/7540)) by @jiannx
- **[ブロック：グリッドカード]** リストとグリッドカードで同じレコードが表示される問題を修正しました ([#7773](https://github.com/nocobase/nocobase/pull/7773)) by @katherinehhh
- **[マルチワークスペース]**

  - 移行スクリプトで x-ready-pretty を削除しました by @jiannx
  - read-pretty 属性を削除しました by @jiannx
  - セレクター色がテーマに追従するようにしました by @jiannx
  - 関連追加時にワークスペースも関連付けるようにしました by @jiannx
  - モバイルでワークスペース切替に対応しました by @jiannx
  - システムテーブルで他フィールド作成できる問題を修正しました by @jiannx
  - マルチワークスペース関連ユーザーの不具合を修正しました by @jiannx
- **[アクション：レコードインポート Pro]**

  - 統計数字とメッセージ翻訳を修正しました by @mytharcher
  - アップロード時のオプション変更が効かない問題を修正しました by @katherinehhh
  - import pro フィールド一覧表示が誤る問題を修正しました by @katherinehhh
- **[AI: ナレッジベース]** ビルド後に起動できない問題を修正しました by @cgyrock
- **[アクション：レコードエクスポート Pro]** 添付エクスポートで「各レコードにフォルダ生成」が効かない問題を修正しました by @katherinehhh
- **[テンプレート印刷]**

  - ボタンがエラーになる問題を修正しました by @katherinehhh
  - 2.0 でワークスペースフィールドを表示します by @jiannx
  - 設定モーダルから下部ボタンを削除しました by @katherinehhh
  - 同一 key によるレンダリングエラーを修正しました by @jiannx
  - 外部データソース未対応を修正しました by @katherinehhh
  - 設定ページの一覧表示不具合を修正しました by @katherinehhh
  - 行操作でテンプレート追加失敗する問題を修正しました by @katherinehhh
  - ワークスペースフィールドに対応しました by @jiannx
  - 設定モーダルが遮られる問題を修正しました by @zhangzhonghe
- **[マルチアプリ]**

  - 移行で hooks が動かない問題を修正しました by @jiannx
  - プロキシでキャッシュに対応しました by @jiannx
- **[plugin-demo-platform]** demo がアプリを自動で閉じられるようになりました by @jiannx
- **[ワークフロー：承認]**

  - データ削除後に API がエラーになる問題を修正しました by @mytharcher
  - 既有人員範囲無効化後のロール追加でエラーが出る問題を修正しました by @mytharcher
  - 削除済みワークフローのフォールトトレランスを追加し、待办リストの読み込みエラーを回避しました by @mytharcher
  - 1.x 承認記録モーダルの不具合を修正しました by @mytharcher
  - パラメータ不正による読み込みエラーを修正しました by @mytharcher
  - 承認タスクカードのフィールドが表示されない問題を修正しました by @zhangzhonghe
  - 依存欠落によるビルドエラーを修正しました by @mytharcher
  - 承認情報ブロック作成時のエラーを修正しました by @mytharcher
  - 承認者送信時に入力内容が消える問題を修正しました by @mytharcher
- **[メール管理]**

  - 設定モーダルが遮られる問題を修正しました by @zhangzhonghe
  - 同一メールボックス関連の不具合を修正し、性能も改善しました by @jiannx
  - Outlook の返信チェーンが途切れることがある問題を修正しました by @jiannx
  - テキスト選択時に折り畳まれない問題と、添付ダウンロード失敗を修正しました by @jiannx
  - 管理画面にフィルターを追加しました by @jiannx
  - 会話チェーンの不具合を修正しました by @jiannx
  - 親ノード id を修正できるようにしました by @jiannx
  - 「全員に返信」ボタンを表示し、子メールをデータ範囲で絞り込めるようにしました by @jiannx
  - 下書きの不具合を修正しました by @jiannx
  - Gmail の予約送信状態を同期しないようにしました by @jiannx
  - 異常データ時のフォールバック処理を追加しました by @jiannx
  - ShadowHtml 更新時のエラーを修正しました by @jiannx
