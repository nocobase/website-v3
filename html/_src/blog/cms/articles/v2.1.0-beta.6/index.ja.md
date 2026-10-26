### 🎉 新機能

* **[AI 従業員]** 複数キーワードによる内蔵ドキュメント検索に対応し、複数ドキュメントを一括で読み込み可能に ([#8718](https://github.com/nocobase/nocobase/pull/8718)) by @2013xile

### 🚀 機能改善

* **[client]** テーブルでサマリー行（summary）を設定できるように対応 ([#8721](https://github.com/nocobase/nocobase/pull/8721)) by @chenos
* **[AI 従業員]** AI 対話における user prompt 機能を更新 ([#8717](https://github.com/nocobase/nocobase/pull/8717)) by @heziqiang
* **[NocoBase への埋め込み]** 権限プラグインにリレーションフィールド値をフィルタリングする API を追加 ([#8688](https://github.com/nocobase/nocobase/pull/8688)) by @mytharcher

### 🐛 不具合修正

* **[AI 従業員]** AI 対話メッセージ内に 0 が表示されてしまう問題を修正 ([#8723](https://github.com/nocobase/nocobase/pull/8723)) by @heziqiang
* **[データ可視化]** i18n チャートプラグインのエントリおよびプレースホルダー文言を修正 ([#8716](https://github.com/nocobase/nocobase/pull/8716)) by @heziqiang
* **[ワークフロー：JavaScript ノード]** Windows 環境でテストケースが正常に実行できない問題を修正 ([#8722](https://github.com/nocobase/nocobase/pull/8722)) by @mytharcher
* **[テンプレート印刷]** ACL API 変更への未対応により発生していたエラーを修正 by @mytharcher
* **[ワークフロー：承認]** 承認操作時にリレーションフィールドの値をフィルタリングし、不正な権限によるデータ操作を防止 by @mytharcher
* **[メール管理]** 画像 contentId の形式解析に関する問題を修正 by @jiannx
