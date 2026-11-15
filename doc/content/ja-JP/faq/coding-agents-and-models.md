---
title: "使い慣れた Coding Agent やモデルを引き続き使えますか？"
---

はい。NocoBase は特定のモデル提供元に限定されません。Core では、アプリのディレクトリで Claude Code や Codex などのコーディングツールを使い、プロジェクトの開発指針と Skills に従って作業を進められます。[最初のアプリを開発する](../getting-started/develop-your-first-app.md)をご覧ください。

Studio では、接続した実行環境に対応するコーディングツールをインストールし、アカウントでログインします。Studio で選べるエージェントは、実行環境が報告するツールとモデルの組み合わせに基づきます。利用可否はツールの対応状況、アカウントの権限、実行環境の状態によって決まり、任意のモデル名を入力するだけでは追加できません。

初回は[実行環境の接続](../studio/setup/shared-runtimes.md)と[エージェントの設定](../studio/setup/agents.md)に進んでください。既存チームへのモデル追加や役割の調整は[エージェント設定](../studio/configure/agents.md)を参照してください。

## Codex CLI で DeepSeek モデルを使えますか？

はい。Codex はカスタムモデル提供元の設定に対応しています。DeepSeek は公式の Codex 連携ガイドを公開しており、Codex が使う Responses API にネイティブで対応しています。Codex のインストールやモデル名の変更だけでなく、提供元、モデル、DeepSeek API Key を設定します。設定方法とバージョン要件は [DeepSeek 連携ガイド](https://api-docs.deepseek.com/quick_start/agent_integrations/codex/)と [Codex のカスタム提供元設定](https://developers.openai.com/codex/config-advanced/)を参照してください。

互換性はツールとモデルのバージョンによって決まります。この組み合わせへの対応が、すべてのモデルへの対応を意味するわけではありません。まずプロジェクトのディレクトリで、モデルが動作し、開発指針を読んで作業できることを確認します。Studio を使う場合は、接続した実行環境がこの組み合わせを正しく報告し、利用できることも確認してください。
