---
title: 開発環境を準備する
metaDescription: Node.js 24、pnpm 11.11、Git をインストールし、Windows の場合は WSL を設定します。
---

Node.js 24 以降、pnpm 11.11 以降、Git が必要で、すべてのコマンドは Unix 系のターミナルで実行します。

## Windows の場合：先に WSL をインストールする

管理者として開いた PowerShell で次を実行し、促されたら再起動してから「Ubuntu」を開きます。以降は、すべてのツール、コマンド、アプリのディレクトリを WSL 内に置きます。[Microsoft の WSL インストールガイド](https://learn.microsoft.com/ja-jp/windows/wsl/install) を参照してください。

```powershell
wsl --install
```

## Node.js と pnpm をインストールする

[nvm の手順](https://github.com/nvm-sh/nvm#installing-and-updating) に従って nvm をインストールしてから、次を実行します。

```bash
nvm install 24
```

fnm を使う場合は、[fnm の手順](https://github.com/Schniz/fnm#installation) に従って fnm をインストールしてから、次を実行します。

```bash
fnm install 24
```

続いて pnpm をインストールします。

```bash
npm install -g pnpm@11.11
```

終わったら、新しいターミナルを開きます。

## Git をインストールする

macOS では `git --version` を実行し、表示に従ってコマンドライン・デベロッパー・ツールをインストールします。Linux と WSL では、パッケージマネージャーでインストールします。たとえば `sudo apt install git` です。続いて名前とメールアドレスを設定します。

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

**完了の条件**：`node --version` に `v24` 以降、`pnpm --version` に 11.11 以降が表示され、`git config user.name` に自分の名前が表示されること。
