---
title: リポジトリの PR プレビューを設定する
description: リポジトリごとに PR プレビューのビルド方法を選び、必要に応じて CI を接続します。
---

**Project settings › Code repositories** で対象リポジトリの **Previews** を開きます。[チェックの取得元](checks.md)とは別にビルド方法を選べます。たとえば GitHub Actions でチェックを実行し、プレビューは開発エージェントに任せられます。

## ビルド方法を選ぶ

- **Agent build** では、エージェントがプロジェクトのスクリプトでアーカイブを作成し、納品時にプレビューを公開します。
- **CI build** では、パイプラインがアーカイブを作成し、リポジトリの CI キーで公開します。
- **No build** を選ぶと、このリポジトリの PR プレビューを作成しません。

選択したら **Save** を押します。

![Previews でビルド方法を選ぶ](https://static-docs.nocobase.com/studio-guide-en-preview-20261127-ad12d3e0f876.webp)

## CI からプレビューを公開する

1. **CI build** を選びます。パイプラインにこのリポジトリの CI キーを設定済みなら、そのまま使えます。初回はパネルでキーを生成し、シークレット `NB_STUDIO_API_KEY` に保存します。`NB_STUDIO_URL` は CI ランナーから接続できる Studio のアドレスに設定します。
2. コードホストの CI を使う場合は、PR トリガー、プレビュー用のホスト環境、アプリのディレクトリ（リポジトリ直下は `.`）を選びます。生成された設定をリポジトリに追加します。ほかの CI を使う場合は、パネルのビルド・公開コマンドをパイプラインに追加します。
3. PR を作成します。公開が完了したら、リポジトリの **Build records** でアプリとコミットを確認し、タスクから [PR プレビュー](../release/previews.md)を開きます。

![CI build でリポジトリキーの設定とワークフローの選択肢を確認する](https://static-docs.nocobase.com/studio-guide-en-ci-build-20261127-a2f2cc4abfa1.webp)
