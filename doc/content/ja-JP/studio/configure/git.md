---
title: "Git プラットフォーム"
description: "チームのリポジトリ接続、アクセス権限、状態更新を設定します。"
---

管理者は **Settings › Git** でチームの接続を管理します。プロジェクトはこの接続でリポジトリにアクセスし、PR を作成し、チェック結果を取得します。メンバー個人の Git 認可は[サインインと個人設定](../join/sign-in.md)を参照してください。

![チームの Git 接続を管理する](https://static-docs.nocobase.com/studio-en-guide-git-20261031.png)

## GitHub

GitHub App で GitHub または GitHub Enterprise Server に接続します。作成とインストールの手順は[Git プラットフォームを接続する](../setup/git.md)を参照してください。

| リポジトリへのアクセス | 用途 |
| --- | --- |
| All repositories | Studio で新しいリポジトリを作成する |
| Only select repositories | 指定した既存リポジトリだけを使う |

既存の GitHub App の設定を手動入力することもできます。同じ App の別のインストールを追加するには **Add installation** を使います。新しいリポジトリが見つからない場合は、インストール先のアカウントとアクセス範囲を確認してください。

## GitLab

1. `api` スコープと Developer ロールでグループアクセストークンを作成します。
2. Studio に GitLab 接続を追加し、サーバーアドレスと認証情報を入力します。
3. 保存後にグループ、権限、有効期限を確認します。

Developer 権限でブランチのプッシュ、マージリクエスト、パイプラインの参照ができます。Webhook の自動作成には Maintainer 権限が必要です。それ以外はポーリングを使ってください。

## Webhook とポーリング

コードプラットフォームから Studio に HTTPS で接続できる場合は、Webhook を有効にします。プライベートネットワークやローカルアドレスの場合は無効にします。Studio が毎分 PR とチェック結果を取得します。

接続カードには、接続状態、リポジトリ数、Webhook の状態が表示されます。認証情報は期限前に更新してください。既存コードの接続は[プロジェクト設定](../project/settings.md#既存リポジトリを接続する)を参照してください。
