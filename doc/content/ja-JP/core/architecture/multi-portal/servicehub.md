---
title: マルチポータルの例 - ServiceHub
metaDescription: ServiceHub の設備サービス例で、同じアカウントでのポータル切り替え、独立したレイアウト、ロール権限、チケットを共有する業務連携を体験します。
---

[ServiceHub のサンプルリポジトリ](https://github.com/nocobase/app-example-multi-portal)は、コーヒーショップの設備サービスを扱います。顧客が修理を依頼し、配車担当者がエンジニアを割り当て、作業後に顧客が完了を確認します。同じチケットに対して、各ポータルが利用者に必要な情報と操作を提供します。

![マネージャーが配車とエンジニアのポータルを切り替える画面](/assets/core/servicehub/portal-switching.png)

## シナリオとポータルの役割

4 つのポータルは 1 つのアプリのアカウントと業務データを共有し、それぞれ個別にインストール、アンインストールできます。

| ポータル | ページとレイアウト | 用途 |
| --- | --- | --- |
| Customer portal | 上部ナビゲーション：概要、設備、サービスチケット | 修理依頼、進捗確認、サービス完了の確認 |
| Dispatch console | サイドバー：チケット一覧、現場チーム、サービス概要 | 顧客を横断した割り当て、チームの作業量確認 |
| Engineer workspace | タスクカードと固定の下部ナビゲーション | 自分に割り当てられた作業と完了履歴 |
| Service insights | 分析サイドバー、状態別・店舗別の集計 | リアルタイム集計とポータル追加のデモ |

画面の既定言語は英語で、中国語にも対応しています。どちらも同じ架空の英語データを使用します。初期化すると、3 店舗、6 台の設備、12 件のチケット、7 つの業務アカウントが作成されます。

## インストールと初期化

Node.js 24 以降、pnpm 11.7.0、NocoBase 商用パッケージレジストリへの読み取り権限が必要です。サンプルのソースは公開されていますが、依存する商用マルチポータルプラグインのダウンロードには引き続き権限が必要です。

リポジトリをクローンし、プロジェクトのルートでレジストリへのログインと依存関係のインストールを行います。

```bash
git clone https://github.com/nocobase/app-example-multi-portal.git
cd app-example-multi-portal
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
pnpm install
```

ログイン時のパスワードには読み取りトークンを使用します。トークンはユーザーレベルの設定に保存し、リポジトリには書き込まないでください。レジストリの準備と権限確認は[マルチポータルアプリの作成](create-app.md)を参照してください。このリポジトリは完成したアプリなので、`create-app` を再実行する必要はありません。

以下はサンプルの既定の SQLite 構成を使用する手順で、別のデータベースサービスは不要です。初回起動前に設定を初期化し、サンプルデータを有効にします。

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set app.sampleData=true
pnpm nocobase config set client.app.title=ServiceHub i18n.defaultLocale=en-US client.app.defaultTheme=compact
pnpm nocobase config check
pnpm dev
```

初期化によってローカルの `config.yml` とアプリの暗号鍵が生成されます。ターミナルに表示されたアプリの URL を、`/main/` のパスを含めて開きます。初回起動時にマイグレーションとサンプル初期化が実行されます。別のデータベースを使用する場合は、ドライバーをインストールして設定を変更してください。詳細は[データベース設定](../../reference/database-configuration.md)を参照してください。

初期管理者は既定で `nocobase` / `admin123` です。`admin@nocobase.com` でもログインできます。初回起動前に `config.yml` の `users.initialAdmin` で変更できますが、既存アカウントは設定変更だけではリセットされません。

管理者で **System settings → Portal management** を開き、Customer portal、Dispatch console、Engineer workspace をインストールします。Service insights は未インストールのままにします。ホームに戻ると 3 つのポータルが表示されます。

公開されたデモ用パスワードを使うため、分離されたデモ環境で利用してください。詳細な手順とトラブルシューティングはリポジトリの [README](https://github.com/nocobase/app-example-multi-portal/blob/main/README.MD) にあります。

## デモアカウントと権限

以下の業務アカウントのパスワードはすべて **`ServiceHub2026!`** です。ユーザー名またはメールアドレスでログインできます。

| ユーザー名 | 氏名 | メールアドレス | データと操作の範囲 |
| --- | --- | --- | --- |
| `manager` | Morgan Brooks | `manager@servicehub.example` | 全チケットの割り当て、自分の現場作業、インストール済みのサービス分析 |
| `dispatcher` | Jordan Lee | `dispatcher@servicehub.example` | 顧客を横断したチケット参照とエンジニアの割り当て |
| `engineer1` | Taylor Chen | `engineer-1@servicehub.example` | 自分に割り当てられた作業 |
| `engineer2` | Sam Patel | `engineer-2@servicehub.example` | 自分に割り当てられた作業 |
| `customer1` | Alex Morgan | `customer-1@servicehub.example` | Harbor Coffee · London の設備とチケット |
| `customer2` | Sofia Rivera | `customer-2@servicehub.example` | Juniper Coffee · Amsterdam の設備とチケット |
| `customer3` | Jamie Park | `customer-3@servicehub.example` | Daylight Coffee · Singapore の設備とチケット |

マネージャーはシステム管理者ではなく、顧客ポータルの権限もありません。ポータルのインストールやデモデータの復元もできません。複数の利用者の連携を示すには、ブラウザーの別々のプロファイルでログインします。同じブラウザーの通常のタブはセッションを共有します。

## ポータルの切り替えと独立したレイアウト

`manager` でログインし、**Dispatch console** を開きます。サイドバーには **Ticket queue**、**Field team**、**Service overview** があります。チームページには実際の割り当てが表示され、チケットを選択すると詳細が開きます。

![配車ポータルのサイドバーとチームの作業量](/assets/core/servicehub/dispatch-team.png)

**Switch portal → Engineer workspace** を選びます。ログアウトせずにタスクカードと下部ナビゲーションに切り替わり、Morgan Brooks に割り当てられた作業だけが表示されます。初期状態では未完了の作業が 2 件あります。**Completed work** は最初は空で、顧客がサービス完了を確認すると履歴が追加されます。

<img src="/assets/core/servicehub/engineer-mobile.png" alt="ポータル切り替え、タスクカード、下部ナビゲーションを備えたエンジニアのモバイル画面" width="390" />

`customer1` でログインすると、上部ナビゲーションを使った別のレイアウトが表示されます。**Overview** にはウェルカムエリアと概要、**My devices** には設備ごとの修理依頼入口があり、**Service tickets** で進捗と完了を確認できます。

![顧客ポータルの上部ナビゲーションと設備概要](/assets/core/servicehub/customer-portal.png)

ServiceHub は業務ユーザー用のワークベンチと切り替えメニューを実装し、インストール済みかつ現在のアカウントがアクセスできるポータルだけを表示します。テンプレートの管理者用カタログをそのまま再利用しているわけではありません。サーバーもインストール状態、業務権限、レコードの範囲を独立して検証します。既定のテンプレートについては[ポータルへのアクセスと権限](access.md)を参照してください。

## サービス依頼を完了する

ブラウザーのプロファイルを 2 つ用意し、`customer1` と `manager` でログインします。

1. **修理を依頼する**：顧客ポータルの **My devices** から Linea espresso machine の修理を依頼し、タイトルを「Espresso machine not heating」にします。チケット番号を控えます。状態は **Unassigned** です。
2. **割り当てる**：マネージャーの **Dispatch console → Ticket queue** で番号を探し、詳細またはその他メニューの **Assign engineer** から **Morgan Brooks** に割り当てます。状態が **Assigned** になります。
3. **切り替えて作業を開始する**：**Switch portal → Engineer workspace** で同じチケットを探し、**View task** を開いて **Accept and start** を選びます。状態が **In progress** になります。
4. **結果を報告する**：**Resolution** に「Replaced the thermostat and verified normal operation.」などと入力し、**Submit resolution** を選びます。状態が **Awaiting review** になります。
5. **完了を確認する**：顧客の **Service tickets** を更新し、**Awaiting review** で絞り込みます。結果を確認して評価すると **Completed** になります。マネージャーのエンジニアポータルを更新すると、**Completed work** に表示されます。

担当者を分ける場合は、`dispatcher` で Taylor Chen に割り当て、`engineer1` で処理します。顧客と配車のポータルはレスポンシブなテーブルを使用し、行の操作をテキストのみのその他メニューにまとめています。

## ポータル管理とデモデータの復元

システム管理者のホームには業務ポータルの入口と **Portal management**、**Restore demo data** が表示されます。業務ユーザーにはこの 2 つの管理入口は表示されません。

![システム管理者のワークベンチ](/assets/core/servicehub/admin-workbench.png)

ポータル管理で **Service insights** をインストールし、マネージャーのページを更新すると、切り替えメニューに追加されます。状態別、店舗別の集計を確認できます。アンインストールすると入口は非表示になりますが、業務データは保持されます。ライフサイクルの規則は[ポータルの管理](manage.md)を参照してください。

![インストール済みの 3 ポータルと追加できるサービス分析](/assets/core/servicehub/portal-management.png)

次のデモの前に、管理者はホームの **Restore demo data** を選択して確定できます。デモ中に追加したチケットを削除し、サンプルの設備と 12 件のチケットを再作成します。アカウント、ロール、ポータルのインストール状態は維持されます。復元には `app.sampleData` が有効である必要があります。

初回起動時にサンプルデータが無効だった場合は、開発環境でサービスを停止し、以下を実行して再起動します。`db sample` は以前スキップされたサンプル初期化を実行するコマンドで、通常のデモ復元の代わりではありません。本番環境では実行できません。

```bash
pnpm nocobase config set app.sampleData=true
pnpm nocobase db sample
pnpm dev
```

## サンプルのソースを確認する

[サンプルリポジトリ](https://github.com/nocobase/app-example-multi-portal)にはアプリ全体が含まれています。以下はこの記事に対応するコミットへのリンクです。

| 入口 | 内容 |
| --- | --- |
| [4 つのポータルパッケージ](https://github.com/nocobase/app-example-multi-portal/tree/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/packages) | 各ポータルの独立した `client/layout.tsx` |
| [レイアウトと切り替え](https://github.com/nocobase/app-example-multi-portal/blob/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/client/pages/servicehub/portal-layout.tsx) | 許可されたポータルのメニュー、ナビゲーション、アカウント操作 |
| [業務 API](https://github.com/nocobase/app-example-multi-portal/blob/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/server/routes/servicehub.ts) | ポータル一覧、チケット操作、データ範囲の検証 |
| [シード](https://github.com/nocobase/app-example-multi-portal/tree/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/database/main/seeds) | 業務アカウント、ロール、設備、チケットの初期化 |

独自のポータルを追加する場合は、[業務ポータルの開発](develop.md)に進んでください。
