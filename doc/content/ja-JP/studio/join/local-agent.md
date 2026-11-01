---
title: ローカルのコーディングエージェントから Studio を使う
status: 書き直し予定
description: nb-studio コマンドラインをインストールし、ターミナルの Claude Code や Codex にプロジェクトの照会、タスクの作成、問題の分析を手伝ってもらいます。
---

`nb-studio` は Studio のコマンドラインです。インストールしてサインインすると、ターミナルで使っている Claude Code や Codex などが、あなたとして Studio を操作できるようになります。タスクの照会と作成、コメントの投稿、ナレッジベースの閲覧などです。

[My sessions](../use/sessions.md) の「My agent」との違い：「My agent」は Studio のページから自分の PC 上のエージェントと対話するものです。`nb-studio` はターミナルにとどまったまま、エージェントにコマンドラインで Studio を操作させるものです。両方を同時に使え、PC を接続するときにも `nb-studio` がインストールされます。

## インストールとサインイン

1. Studio の右上のアバターをクリックし、**Use Studio in your agent** を選びます。
2. ページに生成された設定手順をコピーし、普段使っているコーディングツール（Claude Code、Codex など）に渡します。
3. エージェントは手順に従って次のことを行います。
   - Node.js 24 以降と npm があるかを確認し、ない場合はあなたの同意を得てからインストールします。
   - あなたの Studio から `nb-studio` をダウンロードしてインストールします。
   - `nb-studio login --server <Studio のアドレス>` を実行し、サインイン用のアドレスと確認コードを伝えて、あなたがブラウザーで確認するのを待ちます。
   - `nb-studio whoami` を実行して身元を確認し、`nb-studio docs` を実行して使えるコマンドを把握します。
   - `nb-studio skills install` を実行し、`nb-studio` を使うためのスキルをコーディングツールにインストールします。

設定手順に含まれるインストール用のリンクは 30 分間有効です。`nb-studio` は自分の Studio からだけインストールされ、バージョンは Studio と一致します。

> [!NOTE] 権限はあなたと同じ
> `nb-studio` はあなたとして動作し、使えるコマンドは Studio でのあなたの権限で決まります。サインインには、ブラウザーでのあなたの確認が必要です。

## 何を任せられるか

インストールしたら、やりたいことを自然な言葉でコーディングツールに伝えるだけで、`nb-studio` を呼び出して処理します。いくつかの例：

```text
https://studio.example.com/main/issues/PUR-23
このタスクがどこで止まっていて、どう対処すればよいかを分析してください。分析だけで、変更はしないでください。
```

```text
Studio で私の対応を待っているタスクを確認して、緊急度の高い順に並べてください。
```

```text
docs/supplier-rating.md を読んで、その要件をタスクに分割し、「Supplier Management」プロジェクトに作成してください。まだ開始しないでください。
```

```text
ナレッジベースで購買承認の規程を探して、ランク C の仕入先に発注するときにだれの承認が必要かを教えてください。
```

## よく使うコマンド

普段は自分でコマンドを入力する必要はありませんが、いくつか知っておくと、エージェントが何をしているかを理解しやすくなります。

| コマンド | 内容 |
| --- | --- |
| `nb-studio whoami` | 現在サインインしている身元と権限 |
| `nb-studio docs` | 使えるコマンドの説明 |
| `nb-studio <command> --help` | 個々のコマンドの詳しい使い方 |
| `nb-studio issue get <issue>` | タスクを読む |
| `nb-studio issue progress <issue>` | タスクが今何を待っているか |
| `nb-studio issue comment add <issue>` | タスクにコメントを投稿する |
| `nb-studio follow-up list` | あなたが責任者またはフォローしているタスクと、それぞれが待っているもの |
| `nb-studio kb read <document>` | ナレッジベースのドキュメントを読む |

コマンドの完全な一覧は [nb-studio コマンド](../reference/cli.md) を参照してください。
