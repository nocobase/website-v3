---
title: チェックとプレビューを設定する
description: GitHub を例に、リポジトリのチェック結果の取得元と PR プレビューのビルド方法を設定します。
---

リポジトリごとに、チェック結果の取得元とプレビューのビルド方法を設定します。ここでは GitHub Actions でチェックを実行し、エージェントが PR プレビューをビルドします。

## チェックの取得元を選ぶ

**プロジェクト設定 › コードリポジトリ**で対象のリポジトリの **Checks** を編集します。既存の GitHub Actions を使う場合は **GitHub Actions** を選んで保存します。Studio が GitHub から結果を取得します。CI がまだない場合は、既定のセルフチェックを使えます。

![リポジトリのチェック取得元に GitHub Actions を選ぶ](https://static-docs.nocobase.com/studio-guide-en-checks-20261127-a6340eebb255.webp)

## プレビューのビルド方法を選ぶ

1. 同じリポジトリの **Previews** を編集します。
2. **Agent build** を選んで保存します。引き渡し時にエージェントがプロジェクトのスクリプトでアプリをビルドし、プレビューを公開します。プレビューが不要な場合は **No build** を選びます。
3. PR を関連付けたタスクを開き、**Code & previews** でチェック結果を確認します。公開後はここからプレビューを開けます。

![Previews でビルド方法を選ぶ](https://static-docs.nocobase.com/studio-guide-en-preview-20261127-ad12d3e0f876.webp)

## 次のステップ

プロジェクトに [メンバーを招待します](invite.md)。外部の CI、ほかのトリガー、キーの保守が必要になったら、[リポジトリのチェックと CI を設定する](../configure/checks.md) を参照してください。
