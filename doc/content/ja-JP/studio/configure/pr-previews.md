---
title: リポジトリの PR プレビューを設定する
description: リポジトリごとに PR プレビューのビルド方法を選び、必要に応じて CI を接続します。
---

**Project settings › Code repositories** で対象リポジトリの **Previews** を開きます。[チェックの取得元](checks.md)とは別にビルド方法を選べます。たとえば GitHub Actions でチェックを実行し、プレビューは開発エージェントに任せられます。

## ビルド方法を選ぶ

- **Agent build** は、開発エージェントがプレビューを納品する場合に選びます。README または `AGENTS.md` にアプリのディレクトリ、ビルドコマンド、成果物のパスを記載します。エージェントは関連 PR の最新コミットをビルドし、`nb-studio deploy --preview --file <アーカイブのパス>` で公開します。初回は実行を依頼するメンバーにプレビューアプリの作成権限が必要です。
- **CI build** では、パイプラインがリポジトリの CI キーを使い、PR ごとにプレビューをビルドして公開します。
- **No build** を選ぶと、このリポジトリのプレビューはビルドされません。

選択したら **Save** を押します。

![Previews でビルド方法を選ぶ](https://static-docs.nocobase.com/studio-guide-en-preview-20261127-ad12d3e0f876.webp)

## CI からプレビューを公開する

**CI build** を選びます。外部 CI がこのリポジトリのキーでチェックを報告している場合は、プレビューにも同じキーを使えます。初回はパネルでキーを生成し、パイプラインのシークレット `NB_STUDIO_API_KEY` に保存します。CI ランナーから Studio に接続できることも確認してください。

**GitHub Actions を使う場合**

1. **GitHub Actions workflow** タブで、PR トリガーとプレビュー用のホスト環境を選びます。アプリのディレクトリには、リポジトリ直下なら `.` を、サブディレクトリなら `apps/shop` などの相対パスを指定します。表示されたアプリ ID を確認します。
2. リポジトリへのアクセス権を持つ Coding Agent にパネルのプロンプトを渡すか、手動設定を展開して生成されたワークフローを `.github/workflows/` に追加します。リポジトリのキーは GitHub Actions のシークレット `NB_STUDIO_API_KEY` に保存します。
3. PR を作成または更新します。公開が完了したら、Studio のリポジトリの **Build records** でアプリとコミットを確認し、タスクから [PR プレビュー](../release/previews.md)を開きます。

![CI build でリポジトリキーの設定とワークフローの選択肢を確認する](https://static-docs.nocobase.com/studio-guide-en-ci-build-20261127-a2f2cc4abfa1.webp)

**Jenkins などほかの CI を使う場合**

1. **Other CI** タブで手動設定を展開し、ビルド・公開コマンドを PR のパイプラインにコピーします。`NB_STUDIO_URL` とリポジトリのキーを設定し、同じジョブ内で、インストール済みの `nb-studio` にログインします。

   ```sh
   printf '%s' "$NB_STUDIO_API_KEY" | nb-studio login --server "$NB_STUDIO_URL" --api-key-stdin
   ```

2. `PR` には PR 番号、`SHA` には PR の最新コミット、`CI_RUN_URL` にはビルドログの URL を設定します。生成されたコマンドはビルド状態を報告し、プレビューが必要かどうかを Studio に問い合わせます。
3. 条件分岐の内側にあるビルド用のコメントをプロジェクトのコマンドに置き換えます。たとえば NocoBase アプリで `pnpm build --tar` を実行すると、`storage/exports/dist.tar.gz` が生成されます。デプロイコマンドの `--file` には実際の成果物を指定します。条件分岐を残すと、Studio がプレビューを省略した場合にビルドとデプロイも省略されます。
