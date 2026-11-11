---
title: "ローカルのコーディングエージェントを使う"
description: "Claude Code や Codex から nb-studio でプロジェクトを調べ、タスクを作成し、結果を確認します。"
---

`nb-studio` を使うと、普段の Claude Code や Codex などから Studio を管理できます。エージェントは CLI でタスクと資料を読み、要件を作成し、コメントを追加します。開発作業は Studio のランタイムに任せられます。

## インストールとサインイン

1. Studio のアバターメニューで **Use Studio in your agent** を選びます。
2. 設定手順をコピーし、コーディングエージェントに渡します。
3. CLI のインストール後、案内された URL をブラウザーで開いて認可します。
4. エージェントが現在のアカウントを確認し、CLI のスキルをインストールします。

![Studio の設定手順をローカルのコーディングエージェントに渡す](https://static-docs.nocobase.com/studio-en-local-agent-20261111-normal-2x.webp)

Node.js 24 以降と npm が必要です。パッケージは接続先の Studio から取得し、サーバーのバージョンに一致します。リンクは 30 分で失効するため、必要に応じて再生成してください。

`nb-studio` は自分のアカウント権限で動作します。ブラウザーでの認可が完了するまで、ログインコマンドを実行したままにしてください。

## 作業を依頼する

```prompt
Studio で私の対応を待っているタスクを、緊急度の高い順に一覧にしてください。
```

```prompt
docs/supplier-rating.md を読み、要件を Supplier Management プロジェクトのタスクとして作成してください。まだ開始しないでください。
```

```prompt
PUR-23 が何で止まっているのかを調べ、私が補う必要のある情報を教えてください。
```

Studio のタスク URL をエージェントに渡すこともできます。

## 接続を確認する

```bash
nb-studio whoami
nb-studio docs
```

`whoami` は現在のアカウント、`docs` は接続先で使えるコマンドを表示します。[nb-studio コマンド](../reference/cli.md)を参照してください。

Studio のブラウザー画面で対話するには、[Runner Agent](runner-agent.md) を使います。
