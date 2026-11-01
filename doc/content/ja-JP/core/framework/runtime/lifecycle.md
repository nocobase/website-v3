---
title: アプリの起動とライフサイクル
---

ライフサイクルの段階は、サービスの宣言、非同期の初期化、コンシューマーの起動、後片付けを分けます。アプリとプラグインはこの順序を共有し、依存関係の準備のタイミングを明確にします。

## 段階の順序

```text
Server: validate → register → locales → boot → routes → start → ready
Client: register → boot → render configuration → validation → start → ready
Shutdown: reverse Provider order
```

各段階では、次の段階が始まる前にすべての Provider をたどります。サーバーは、準備完了後にテンプレートのサンプルデータの動作も扱います。これは業務のリクエストのトランザクションとは別のものです。

| フック | 適した作業 |
| --- | --- |
| `register()` | インスタンスや遅延評価の同期のファクトリーを結び付ける |
| `boot()` | 依存関係を解決し、非同期に準備し、ハンドラーを登録する |
| `start()` | リスナー、購読、コンシューマーを開始する |
| `ready()` | すべての Provider の起動後に、内部の準備を終える |
| `shutdown()` | 所有するリソースを停止し、それを待つ |

サーバーのルートのファクトリーは、`boot()` のあと、`start()` の前に実行されます。サービスを解決できますが、コンシューマーが動いているとは考えられません。ブラウザーのホストは、アプリの起動が成功してから React をレンダリングします。

## 依存関係と所有

先にファクトリーを登録し、適切な段階で依存関係を解決します。必要な起動の順序は、偶然のファイル名に頼るのではなく、集約の入口で表します。

終了時に初めてサービスが作られることのないよう、後片付けでは `resolveIfCreated()` を使います。データベースなどの共有のリソースは所有者が閉じ、利用側は自分の購読、ハンドラー、ハンドルだけを解放します。

## 失敗と検証

後片付けは、初期化が途中までしか行われていない場合や、繰り返し呼び出された場合にも耐える必要があります。ホストが終了が完了したかどうかを判断できるよう、後片付けの失敗は握りつぶさずに報告してください。通常の起動、依存関係がない場合、初期化の失敗、作業中の終了を検証します。

`ready()` は内部の準備ができたことを表します。リスナー、プロキシ、データベースが使えるかどうかは、それぞれのヘルスチェックで確認する必要があります。完全な [ServiceProvider の例](../../extension-development/service-provider.md) を参照してください。

## インターフェースと実装

- [Provider のレジストリー](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/registry.ts)
- [サーバーのライフサイクル](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [クライアントのライフサイクル](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
