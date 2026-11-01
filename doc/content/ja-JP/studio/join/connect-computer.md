---
title: 自分の PC を接続する
status: 書き直し予定
description: 自分の PC を Studio に接続し、My sessions で自分の PC 上のコーディングツールと相談します。
---

## 接続する

「My agent」を使う前に、PC を Studio に接続します。

1. **My sessions** を開き、**Connect your computer** をクリックします。
2. ページの設定手順をコピーし、その PC のコーディングツール（Claude Code、Codex など）に渡して実行させます。ツールは `nb-studio` コマンドラインをインストールし、ブラウザーでサインインを確認するよう求め、`nb-studio acp service install` を実行して、PC の起動後に自動で接続を保つようにします。
3. Studio に戻り、その PC がオンラインと表示されていることを確認します。

![「My computers」：接続済みの PC、検出されたコーディングツール、許可されたディレクトリ](https://static-docs.nocobase.com/studio-zh-connect-computer-20261030-v2.png)

- Codex、Claude Code、Gemini CLI、GitHub Copilot、Cursor、OpenCode などのコーディングツールに対応しています。PC は macOS、Linux、Windows のいずれでもかまいません。
- 既定ではエージェントにユーザーディレクトリ全体へのアクセスを許可します。「My computers」で特定のディレクトリに変更できます。これらのディレクトリでのエージェントの権限は、自分のターミナルでそのツールを使うときと同じです。
- 設定手順に含まれるインストール用のリンクは 30 分間有効です。期限が切れたら生成し直してください。

## 今後追加する内容

- 接続：設定手順をコピーして PC のコーディングツールに実行させる
- アクセスを許可するディレクトリ：「My computers」
- 一時的な接続とオンラインの維持
- PC の切断と削除
