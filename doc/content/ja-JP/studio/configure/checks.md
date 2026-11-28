---
title: リポジトリのチェックを設定する
description: PR のチェック結果の取得元とブランチルールを設定し、タスクで結果を確認します。
---

## チェック結果の取得元を選ぶ

**Project settings › Code repositories** で対象リポジトリの **Checks** を開き、結果の取得元を選んで保存します。

| 取得元 | 選ぶ場面 | Studio が結果を取得する方法 |
| --- | --- | --- |
| Agent self-check（既定） | 開発エージェントがチェックを実行する | プロジェクトのスクリプトを実行し、`nb-studio check report` で報告する |
| コードホストの CI | GitHub Actions や GitLab CI などでチェックを実行している | Studio が関連する PR または MR から結果を読み取る |
| External CI | Jenkins など別のパイプラインでチェックを実行する | パイプラインが結果とログのリンクを Studio に送る |

![リポジトリのチェック取得元に GitHub Actions を選ぶ](https://static-docs.nocobase.com/studio-guide-en-checks-20261127-a6340eebb255.webp)

## 外部 CI を接続する

リポジトリの **Checks** で **External CI** を選びます。ここでは、PR をビルドする Jenkins パイプラインを例にします。**Jenkins** を選ぶと、設定用のプロンプトをコピーしてローカルの Coding Agent に渡せます。手動で設定する場合は、パネルの手順を展開します。

1. パネルでリポジトリの CI キーを生成します。Jenkins でパイプラインから使える **Secret text** の認証情報を作成し、ID を `nb-studio-api-key` にします。キーが表示されるのは一度だけで、既定の有効期限は 90 日です。
2. 生成された `ci/nb-studio-check.sh` をリポジトリに追加します。`Jenkinsfile` があれば、例の環境変数とチェックステージを既存のパイプラインに組み込みます。新規の場合は生成されたファイルを使えます。`NB_STUDIO_URL` にはランナーから到達できる Studio のアドレスを指定します。`NB_STUDIO_API_KEY` は Jenkins の認証情報から読み込みます。
3. 各ステージのコマンドをプロジェクトに合わせて変更します。Studio で個別に確認したいチェックには別々の名前を付けます。たとえば `test` という名前でテストを実行するコマンドは次の通りです。

```bash
sh ci/nb-studio-check.sh test pnpm test
```

スクリプトは最初に `pending` を送信し、コマンドの終了コードに応じて成功または失敗を報告します。結果には Jenkins のビルドログへのリンクが付きます。変更をコミットして PR のパイプラインを実行し、タスクの **Code & previews** で現在のコミットに `test` が表示されることを確認します。

ほかの CI では **Other CI** を選び、Studio の URL とリポジトリのキーを設定します。同じスクリプトで既存のチェックを実行できます。`BUILD_URL` にジョブのログ URL を設定すると、Studio からログを開けます。CLI がリポジトリやコミットを特定できない場合は、スクリプト内の `nb-studio check report` に `--repository` と `--sha` を明示します。

## ブランチルールを設定する

**Project settings › Code repositories › Branch rules** で設定します。

- 必須チェックの失敗時にコーディネーターエージェントを起動するか。
- チェック通過時に次のステップを開始するか。
- PR の競合時に修正を開始するか。
- どのチェックを参考情報とし、Studio の通常のマージを妨げないようにするか。

参考情報に指定していないチェックは必須です。コードプラットフォームのブランチ保護も適用されます。自動起動を無効にした場合は、タスクのコメントでコーディネーターエージェントに続行を依頼します。

## タスクでチェック結果を確認する

PR に関連付けたタスクの **Code & previews** で、各チェックの状態とログを確認します。**Not reported yet** は選んだ取得元からまだ結果が届いていない状態です。失敗時の対応は [PR のチェックとコードレビュー](../project/checks-and-review.md)を参照してください。
