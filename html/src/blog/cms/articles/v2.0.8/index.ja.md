### 🎉 新機能

* **[AI 社員]** AI対話のユーザープロンプト編集を更新 ([#8725](https://github.com/nocobase/nocobase/pull/8725)) by @heziqiang

### 🐛 不具合修正

* **[server]** hashパラメータを追加することでキャッシュが更新されない問題を解決 ([#8730](https://github.com/nocobase/nocobase/pull/8730)) by @chenos
* **[AI 社員]** AIデータソース設定のレンダリング異常を修正 ([#8731](https://github.com/nocobase/nocobase/pull/8731)) by @cgyrock
* **[ワークフロー：カスタム操作イベント]** カスタム操作イベントがサブフローとして呼び出された際に停止する問題を修正 ([#8738](https://github.com/nocobase/nocobase/pull/8738)) by @mytharcher
* **[ワークフロー：承認]**
  * 承認操作においてリレーションフィールドの値をフィルタリングし、越権データ操作を回避 by @mytharcher
  * 手動で承認ワークフローを実行した際のエラーを修正 by @mytharcher
  * 追加承認および転送承認後に `dataAfter` フィールド値が欠落し、一覧読み込み時にエラーが発生する問題を修正 by @mytharcher
  * ACLに基づくappendsパラメータのフィルタリング問題を修正 by @mytharcher
  * ユーザーに関連権限がない場合、リレーションフィールドが作成または更新されるべきでない権限問題を修正 by @mytharcher
