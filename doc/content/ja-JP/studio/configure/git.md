---
title: コードプラットフォーム
description: Settings › Integrations › Git で GitHub または GitLab を接続し、Studio がリポジトリを作成・読み取り、エージェントが PR を作成できるようにします。
---

Studio は Git 接続を通じてコードホストにアクセスします。リポジトリの作成と読み取り、PR とチェック結果の追跡、Studio からのマージに使います。Git 接続がなくてもプロジェクトは作成できますが、PR、チェック、プレビューは使えません。

## GitHub を接続する

Studio は GitHub 上に GitHub App を作成し、必要な権限をすべてあらかじめ入力します。あなたは GitHub でそれを確認し、自分のアカウントまたは組織にインストールします。

1. **Settings › Integrations › Git** を開き、**Add connection** をクリックして **GitHub** を選びます。
2. **Owner of the app** で、**My account** または **An organization** を選びます。セルフホストの GitHub Enterprise Server の場合は、それを選んでサーバーのアドレスを入力します。
3. **Webhook** を設定します。下の [Webhook をオンにすべきか](#webhook-をオンにすべきか) を参照してください。
4. **Create on GitHub** をクリックします。GitHub で App に名前を付けて確定します。
5. 続いて、App を自分のアカウントまたは組織にインストールします。Studio が作成するリポジトリにアクセスできるよう、**Repository access** で **All repositories** を選びます。
6. インストールが終わったら Studio に戻ります。**Settings › Integrations › Git** に接続が表示されます。

すでに GitHub App がある場合は、**Already have a GitHub App? Enter it manually** をクリックします。1 つの App を複数のアカウントや組織にインストールできます。接続の **Add installation** をクリックしてください。

> [!NOTE] App に一部のリポジトリだけへのアクセスを許可する場合
> インストール時に **Only select repositories** を選んだ場合、App は Studio が作成するリポジトリにアクセスできず、プロジェクトの作成時に「The repository was created, but the App could not confirm access.」と表示されます。GitHub の App のインストール設定で新しいリポジトリを追加してから、もう一度プロジェクトを作成し、**Existing repository** を選んでください。

## GitLab を接続する

1. GitLab で、使いたいグループのグループアクセストークンを作成します。スコープは `api`、ロールは Developer にします。
2. **Settings › Integrations › Git** で **Add connection** をクリックし、**GitLab** を選んで、インスタンスのアドレス（既定は gitlab.com）とトークンを入力します。

保存すると、Studio はトークンのスコープ、有効期限、グループ、ロールを確認し、問題があればすぐに知らせます。Developer のトークンでは、エージェントはグループ内のすべてのプロジェクトでブランチのプッシュ、マージリクエストの作成、パイプラインの表示と再実行ができますが、プロジェクトの設定や保護ブランチは変更できません。Studio がプロジェクトに Webhook を自動で作成するには、ロールが Maintainer である必要があります。Developer の場合、Studio は代わりに定期的にポーリングします。

トークンの期限が切れると、この接続を使うすべての実行が失敗するため、その前に置き換えてください。

## Webhook をオンにすべきか

| Studio の状況 | Webhook | 動作 |
| --- | --- | --- |
| インターネットから到達できる HTTPS アドレスがある | オン | コードホストが PR とチェック結果を発生時に Studio へプッシュします |
| 内部ネットワークにしかない、または `localhost` で試している | オフ | Studio は Webhook を作成せず、PR とチェック結果を 1 分ごとに確認します |

Studio が内部ネットワークにしかない場合は、Webhook をオフにする必要があります。GitHub は到達できない Webhook アドレスを拒否し、Webhook をオンにしたまま App を作成すると「Hook url is not supported because it isn't reachable over the public Internet」というエラーで失敗します。Studio に公開アドレスができたら、あとからオンにできます。

## メンバーは自分のアカウントを使う

各メンバーは **Account settings › Git** で自分のコードホストのアカウントを接続できます。接続すると、エージェントがそのメンバーのために作成する PR と、そのメンバーが Studio で行うマージは、本人の名前で行われます。それまでは、この Git 接続が使われます。[自分の Git アカウントを接続する](../join/sign-in.md#自分の-git-アカウントを接続する) を参照してください。

- GitHub では、メンバーはブラウザーで認可するか、コードで接続できます。コードで接続するには、GitHub の App の設定で「Enable Device Flow」をオンにする必要があります。
- 各接続には、メンバーが個人トークンを使えるかどうかの設定 **Allow personal tokens** があり、既定ではオンです。

## 接続を確認する

**Settings › Integrations › Git** に接続が **Connected** として表示され、アクセスできるリポジトリの数と、「webhooks off, Studio polls」などの Webhook の状態が示されます。

> [!NOTE] 既定のブランチを保護する
> Studio はブランチを保護しません。GitHub や GitLab で既定のブランチの保護ルールをオンにし、たとえばマージ前にチェックの通過を必須にしてください。

次に、[共有ランタイムを接続します](../setup/shared-runtimes.md)。
