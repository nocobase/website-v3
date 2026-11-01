---
title: NocoBase 3 ドキュメント
description: NocoBase は、AI で業務システムを継続的に開発・運用するためのオープンソースプラットフォームです。エージェントが業務コードを書き、NocoBase が基盤とガバナンスを提供し、人が目標を定めて意思決定を行います。
---

## ここから始める

| やりたいこと | 入口 |
| --- | --- |
| NocoBase 3 について知る | [NocoBase 3 とは](start/what-is-nocobase.md) |
| 自分のエージェントで Core 上にアプリを開発する | [NocoBase Core](core/index.md) → [アプリを作成する](core/getting-started/create-app.md) |
| エージェントチームを率いて複数のプロジェクトを同時に進める | [Studio とは](studio/intro/what-is-studio.md) |
| アプリをデプロイして運用する | [デプロイ](core/deployment/choose-a-deployment-method.md) |
| NocoBase 2 から移行してきた | [NocoBase 2 を使っていた方へ](start/from-v2.md) · [プラグインを管理する](core/developing-apps/manage-plugins.md) |

## アーキテクチャ

<figure class="layers" aria-label="Studio は人とエージェントが一緒に業務アプリを開発する場であり、アプリは Core の上に構築されます">
<div class="ly-b st"><b>NocoBase Studio</b><span>人とエージェントが協働開発するためのガバナンスプラットフォーム</span></div>
<div class="ly-t"><b>意思決定は人が行い、コードと実務はエージェントが担う</b><span>Claude Code、Codex、OpenCode をひとつのエージェントチームにまとめ、タスクを自律的に進めます。進捗はひと目でわかり、重要な判断は人が下します。</span></div>
<div class="ly-k down">開発 · 引き渡し · ガバナンス · 進化</div><div class="ly-gap"></div>
<div class="ly-b"><b>業務アプリ</b><span>自社の業務システム</span></div>
<div class="ly-t"><b>アプリはエージェントが開発し、所有するのは自社。リリース後は独立して稼働</b><span>オープンソースの NocoCRM など、すぐに使える Solution アプリから始めて、そのまま使うことも、カスタマイズを続けることもできます。</span></div>
<div class="ly-k up">共通機能 · 開発規約</div><div class="ly-gap"></div>
<div class="ly-b co"><b>NocoBase Core</b><span>オープンソースのアプリケーション基盤</span></div>
<div class="ly-t"><b>20 以上の共通機能と、統一されたプロジェクト構成・開発規約</b><span>データ、権限、ワークフローと承認、ファイル、通知、AI 連携などがそろっているため、エージェントは業務ロジックだけを開発します。</span></div>
</figure>

- **[Core](core/index.md)** は、業務システムを開発・運用するためのオープンソースの基盤です。Core だけでも、自分のエージェントに直接アプリを開発させられます。
- **[Studio](studio/index.md)** は、人がエージェントチームを率いてアプリを開発するワークスペースで、商用版で提供しています。Studio で開発するアプリも Core の上に構築されます。

## このドキュメントについて

- ドキュメントは 3 つのパートに分かれており、上部のバーで切り替えます。**はじめに**（サイト全体に共通する紹介と用語）、**Core**、**Studio** です。
- Core ではチームのタスク管理アプリを例に、開発、テスト、デプロイを説明します。Studio では購買チームのシナリオを例に、人がエージェントチームを率いる方法を説明します。
- ドキュメントは英語の画面をもとに書かれています。製品に含まれる画面上の名称は **太字** で示し、パスは **A › B** の形で書きます。たとえば **System settings › User management** です。
- NocoBase 3 のパッケージは現在すべてベータ版のため、API や画面は今後変わる可能性があります。実際の製品の挙動を正としてください。
- 左のメニューで薄い色で表示されているページは、まだ執筆されていません。
