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
