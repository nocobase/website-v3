---
title: Git プラットフォームを接続する
description: GitHub を例に Git プラットフォームを接続し、Studio がリポジトリを作成してコードを提出できるようにします。
---

Git プラットフォームを接続すると、Studio がリポジトリを作成でき、エージェントがコードを提出して PR を作成できるようになります。

このガイドでは GitHub を例にします。GitLab などの選択肢については、[コードプラットフォームの設定](../configure/git.md) を参照してください。

## GitHub を接続する

1. **Settings › Integrations › Git** を開き、**Add connection** を選んで **GitHub** を選びます。
2. アカウントまたは組織を選びます。組織の場合は、その名前を入力します。
3. PR とチェックの更新をすぐに受け取れるよう、**Webhook** を有効にすることをおすすめします。ローカルで試す場合や、Git プラットフォームから Studio に到達できないプライベートネットワークへのデプロイでは、オフにします。その場合、Studio は更新をポーリングします。
4. **Create on GitHub** を選び、App に名前を付けて確定します。
5. 対象のアカウントまたは組織に App をインストールします。次に作成するリポジトリにアクセスできるよう、**Repository access** で **All repositories** を選びます。
6. Studio に戻ります。

![ローカルで試す例：Webhook を無効にして GitHub 組織を接続します](https://static-docs.nocobase.com/studio-en-setup-github-connection-20261030.png)

**All repositories** は、既存のリポジトリと今後作成するリポジトリの両方を対象にします。GitHub に表示される権限を確認してください。App の作成と組織へのインストールには、それぞれ対応する権限が必要です。

## 接続を確認する

接続カードに **Connected** と、アクセスできるリポジトリの数が表示されます。

![GitHub App が組織に接続されています](https://static-docs.nocobase.com/studio-en-setup-github-connected-20261030.png)

次に、[ランタイムを接続します](shared-runtimes.md)。

既存の App、特定のリポジトリへのアクセス、Webhook、その他の Git プラットフォームについては、[コードプラットフォーム](../configure/git.md) を参照してください。
