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
