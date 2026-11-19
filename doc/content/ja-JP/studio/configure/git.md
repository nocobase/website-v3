---
title: "Git プラットフォーム"
description: "チームのリポジトリ接続、アクセス権限、状態更新を設定します。"
---

管理者は **Settings › Git** でチームの接続を管理します。プロジェクトはこの接続でリポジトリにアクセスし、PR を作成し、チェック結果を取得します。メンバー個人の Git 認可は[サインインと個人設定](../join/sign-in.md)を参照してください。

![チームの Git 接続を管理する](https://static-docs.nocobase.com/studio-en-git-20261111-normal-2x.webp)

## リポジトリを接続して確認する

1. **Settings › Git** で接続を追加し、保存した接続に表示される組織またはグループを確認します。
2. プロジェクトのリポジトリ設定で、その接続からリポジトリを選びます。複数のグループが同じ Git サーバーを使う場合は、各接続のリポジトリ件数を展開すると対応を確認できます。
3. 初期化タスクか次の開発タスクを開きます。ランタイムがリポジトリを取得でき、リンク先の PR または MR が目的のプロジェクトにあることを確認します。コードプラットフォームの CI を使う場合は、パイプラインとジョブログも開きます。

## GitHub

GitHub App で GitHub または GitHub Enterprise Server に接続します。作成とインストールの手順は[Git プラットフォームを接続する](../setup/git.md)を参照してください。

| リポジトリへのアクセス | 用途 |
| --- | --- |
| All repositories | Studio で新しいリポジトリを作成する |
| Only select repositories | 指定した既存リポジトリだけを使う |

既存の GitHub App の設定を手動入力することもできます。同じ App の別のインストールを追加するには **Add installation** を使います。新しいリポジトリが見つからない場合は、インストール先のアカウントとアクセス範囲を確認してください。

## GitLab

リポジトリが `https://git.example.com/gitlab/inventory-team/warehouse.git` にある場合は、次のように設定します。

| Studio の項目 | 入力例 |
| --- | --- |
| Host（ホスト） | `https://git.example.com/gitlab`。GitLab の設置先パスも含める |
| グループ | URL に含まれるグループのパス `inventory-team`。サブグループなら `inventory-team/apps` のように親から指定する |
| 接続名 | 「在庫チーム」など、一覧で識別できる名前 |

グループトークンの作成には、そのグループの Owner 権限が必要です。GitLab.com では Premium または Ultimate プランが必要です。[GitLab のグループアクセストークン](https://docs.gitlab.com/user/group/settings/group_access_tokens/)

1. GitLab で対象グループの **Settings › Access tokens** を開き、**Add new token** を選びます。トークンには任意の名前を付けます。

   ![対象グループのアクセストークン画面でトークンを追加](https://static-docs.nocobase.com/studio-en-group-token-settings-20261119-7d9d3999c1.webp)

2. スコープに `api` を選びます。開発ブランチへのプッシュ、MR の作成、パイプラインの参照には Developer ロールを使えます。Studio で Webhook を自動作成する場合は Maintainer を選びます。

   ![Webhook を自動作成する場合は Maintainer と api を選択](https://static-docs.nocobase.com/studio-en-group-token-permissions-20261119-bd31e03fc3.webp)

3. Studio で GitLab 接続を追加し、インスタンス URL、グループのパス、トークンを入力します。保存後にグループと有効期限を確認し、プロジェクトでリポジトリを関連付けます。

   ![Studio に GitLab のホストとグループのフルパスを入力](https://static-docs.nocobase.com/studio-en-gitlab-20261119-49dfcbb2d9.webp)

メンバーは個人設定で自分の Git アカウントも接続できます。そのアカウントにも、実行する操作に応じたリポジトリ権限が必要です。

## Gitea

Gitea 接続を追加し、インスタンスの URL と専用アカウントの個人アクセストークンを入力します。URL にはデプロイ先のパスを含め、`/api/v1` は付けません。

トークンには `write:user`、`write:organization`、`write:repository`、`write:issue` が必要です。アカウント自体にも対象リポジトリへのアクセス権限が必要です。Webhook の作成にはリポジトリ管理者権限が必要です。リポジトリでは squash マージを有効にします。

メンバーは **Account settings › Git** で個人トークンを入力できます。ブラウザー認可を使う場合は、Gitea の OAuth2 アプリを作成し、Studio に表示されるコールバック URL、クライアント ID、シークレットを設定します。ランタイムには公式の `gt` CLI をインストールします。

## Webhook とポーリング

コードプラットフォームから Studio に HTTPS で接続できる場合は、Webhook を有効にします。プライベートネットワークやローカルアドレスの場合は無効にします。Studio が毎分 PR とチェック結果を取得します。

接続カードには、接続状態、リポジトリ数、Webhook の状態が表示されます。認証情報は期限前に更新してください。既存コードの接続は[プロジェクト設定](../project/settings.md#既存リポジトリを接続する)を参照してください。
