---
type: "release"
product: "studio"
tag: "v1.0.0-beta.91"
channel: "beta"
version: "1.0.0-beta.91"
title: "NocoBase Studio · v1.0.0-beta.91"
date: "2026-11-25"
publishedAt: "2026-11-25T15:47:52Z"
---

### 🎉 新機能

- **[タスク]**
  - Mentioning the Lead Agent in a comment on your done or cancelled task moves it back to In progress and the Lead Agent picks up the comment.
  - 各プロジェクトに、タスクが人とエージェントの間でどう進むかを示す「ワークフロー」タブを追加しました。各タスクはチップから 1 つのワークフローを選んで従い、組み込みワークフローと品質スキルは変更できなくなりました。独立した依頼者がいる場合、依頼者も担当者も単独で相手を置き換えることはできません。
- **[品質]** {{edition:enterprise}} Choose who daily, release and project tests run as in quality settings, and give new follow-up tasks to the testing task's current owner without a takeover or requirement confirmation.
- **[Git]** 複数の Git 接続で 1 つの SSH キーを共有できるようになりました。キーは接続ダイアログで選択または作成し、設定 › Git の新しい「SSH キー」タブで管理できます。SSH 接続は「SSH 接続をテスト」に合格するだけで使えます。

### 🚀 改善

- **[Agent]** Studio のチャット、受信トレイ、設定ページと Agent ページのアクセス権を維持し、フレームワークのストレージ管理、アプリ内のモデルサービス、システムキー・メンバーキー・キールールの管理 API を既定で無効にします。
- **[品質]** {{edition:enterprise}}
  - A quality test with slow tests now updates the project's open test timing task instead of opening a new one, and the code quality cleanup task's title date follows the latest test.
  - A quality dimension without problems now opens its details on the overview, and its empty problems tab says no problems were found this time.
  - 品質ディメンション詳細の「問題」タブは、既定で重大度の高い順に表示されます。
  - プロジェクトの「品質」タブに、品質ページへのリンクではなく、そのプロジェクトの品質（概要、テストタスク、コアシナリオ、フォローアップ、指標、設定、テスト実行）を直接表示します。
- **[リリース]** 日本語のインターフェースでは更新ダイアログに日本語のリリースノートが表示され、各リリースに日本語のリリースノートと変更履歴も作成されます。
- **[タスク]**
  - 再試行された実行は、実行ログに全試行の合計時間と試行回数、各試行の時間と終了理由を表示します。
  - タスク一覧や詳細ページからタスクを開いたときに、進捗がより早く表示されるようになりました。
- **[プロジェクト]** プロジェクトページの「リリース」タブを「品質」の直後に移動しました。
- **[スキル]** エージェントは起動した人の権限の範囲で再びスキルライブラリを読み取り・変更できます。また、組み込みスキルはオーナーが英語を求めない限り他言語の UI スクリーンショットを受け付けます。

### 🐛 不具合修正

- **[品質]** {{edition:enterprise}}
  - 品質ページの読み込み中に画面がずれなくなり、概要の表示が速くなりました。
  - 結果の提出前にタスク番号でフォローアップタスクを登録すると、失敗したシナリオの問題記録にタスクが関連付けられない問題を修正しました。
- **[実行環境]** サブモジュール内に残った正常な linked worktree メタデータによるチェックアウト失敗を修正し、簡潔な Git エラーを表示するとともに、所有する実行一時ディレクトリの軽微な権限ずれを自動修復します。
- **[Agent]** 以前の Agent、実行環境、スキル、使用量ページを復元し、ロールで閲覧できない部分はエラーではなく権限がない旨を表示します。
- **[Git]** アップグレード時や HTTPS への切り替え時に SSH 鍵の関連付けが解除され、管理者が未使用の鍵を削除できます
