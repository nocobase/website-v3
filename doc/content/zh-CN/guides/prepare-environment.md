---
title: 准备开发环境
metaDescription: 装好 Node.js 24、pnpm 11.7 和 Git，Windows 用户准备好 WSL。
---

需要 Node.js 24 及以上、pnpm 11.7 及以上和 Git，命令都在类 Unix 终端里运行。

## Windows 用户：先装 WSL

在以管理员身份打开的 PowerShell 中运行，按提示重启后打开“Ubuntu”，之后所有工具、命令和应用目录都放在 WSL 里。见 [微软的 WSL 安装文档](https://learn.microsoft.com/zh-cn/windows/wsl/install)。

```powershell
wsl --install
```

## 安装 Node.js 和 pnpm

先按 [nvm 的说明](https://github.com/nvm-sh/nvm#installing-and-updating) 安装 nvm，再运行：

```bash
nvm install 24
```

如果用 fnm，先按 [fnm 的说明](https://github.com/Schniz/fnm#installation) 安装 fnm，再运行：

```bash
fnm install 24
```

然后启用 pnpm：

```bash
corepack enable && corepack prepare pnpm@11 --activate
```

装完打开一个新终端。

## 安装 Git

macOS 运行 `git --version`，按提示安装命令行开发工具；Linux 和 WSL 用包管理器安装，例如 `sudo apt install git`。然后设置署名：

```bash
git config --global user.name "你的名字"
git config --global user.email "you@example.com"
```

**完成的标志**：`node --version` 显示 `v24` 或更高，`pnpm --version` 显示 11.7 或更高，`git config user.name` 显示你的名字。
