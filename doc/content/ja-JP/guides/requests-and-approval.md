---
title: デバイスの申請と承認
metaDescription: 従業員がデバイスを申請し、承認が必要なものは資産管理者に回り、IT サポートがデバイスを貸与して台帳に記録します。ワークフローと通知には、Core のすぐに使えるワークフローと通知のプラグインを使います。
---

この章では、[設計書](https://github.com/nocobase/docs-examples-v3/blob/main/apps/itam-lite/docs/design.md) のステップ 2 を実装します。従業員がデバイスを申請し、ノート PC とスマートフォンの申請と、すでに上限の台数を持っている人の申請は資産管理者の承認に回ります。続いて IT サポートがデバイスを貸与し、台帳に使用者が自動で記録されます。

## 1. 依頼する

```prompt
docs/design.md のステップ 2、デバイスの申請と承認を実装してください。各ステップで関係者に通知してください。承認が必要なカテゴリーと 1 人あたりのデバイスの上限は、管理者が調整できるようにしてください。
Employee、IT support、Asset manager のロールを今作成してください。だれがどのレコードを見られるかはステップ 3 で扱います。
```

エージェントが構築したもの：

| 部分 | 使った Core の機能 |
| --- | --- |
| 申請のワークフロー：Draft → Pending approval / Ready to issue → Issued、および Rejected と Withdrawn | ワークフロー（`@nocobase/lifecycle`）：ステータスは宣言された遷移に沿ってのみ変わり、各ステップでだれがいつ行ったかが記録され、古いページがほかの人の判断を上書きすることはできません |
| 承認ルール：承認が必要なカテゴリーと 1 人あたりのデバイスの上限 | ワークフローパラメーター。管理者が **System settings › Workflow management** で調整し、申請の提出時に読み込まれます |
| アプリ内メッセージ：承認が必要、貸与待ち、承認済み、却下、貸与済み | 通知とアプリ内メッセージのプラグイン。ワークフローの後続処理として送信され、失敗すると自動で再試行されます |
| Employee、IT support、Asset manager のロール | 権限プラグイン：各操作が個別の業務権限になります |
| **Device requests** ページ、サイドバーの **Inbox**、**Workflow management** ページ | テンプレートに付属のプロセス図とワークフロー管理のコンポーネント |

機能の一覧は [NocoBase Core](../core/index.md#共通機能を再利用する)、ワークフローを提供するパッケージは [Core とツールのパッケージ一覧](../core/reference/packages.md)、通知は [通知](../core/using-plugins/notifications/notification.md) を参照してください。多段階承認、合議、代理承認が必要で、商用の承認プラグインのライセンスがある場合は、代わりに [承認](../core/using-plugins/collaboration/approval.md) を使えます。

## 2. 3 つのアカウントを用意する

```prompt
テストユーザーを 3 人作成してください：Alice Wang は従業員、Ben Zhou は IT サポート、Cathy Liu は資産管理者です。それぞれのユーザー名とパスワードを教えてください。
```

エージェントは次の 3 つのアカウントを作成します。

| ユーザー | ロール |
| --- | --- |
| Alice Wang | Employee |
| Ben Zhou | IT support |
| Cathy Liu | Asset manager |

## 3. ワークフローを一通り試す

それぞれ別のブラウザー（またはプライベートウィンドウ）でサインインします。

1. **Alice** は **Device requests › New request** を開き、ノート PC を選んで用途を書き、提出します。申請は **Pending approval** になります。続いて Alice はモニターを申請し、こちらはそのまま **Ready to issue** になります。

   ![デバイスを申請する](https://static-docs.nocobase.com/20261030-itam-lite-requests-new-request.webp)

2. **Cathy** は **Inbox** を開き、メッセージをクリックして申請を開き、**Approve** をクリックします。

   ![資産管理者に、承認が必要な申請についてのアプリ内メッセージが届きます](https://static-docs.nocobase.com/20261030-itam-lite-requests-inbox-approval.webp)

3. **Ben** は **Inbox** で「is ready to issue」のメッセージを開き、**Issue** をクリックして、在庫のあるノート PC を選びます。

   ![IT サポートが貸与するデバイスを選びます](https://static-docs.nocobase.com/20261030-itam-lite-requests-issue-device.webp)

4. **Devices** を開くと、ノート PC は **In use** になり、Alice に割り当てられています。Alice には「デバイスが貸与された」というアプリ内メッセージが届きます。

## 4. 承認ルールを調整する

管理者が **System settings › Workflow management** を開いて **Device requests** をクリックすると、左にプロセス図、右に承認ルールが表示されます。デスクトップ PC にチェックを入れて保存すると、以降のデスクトップ PC の申請は Pending approval になります。すでに提出された申請には影響しません。

![ワークフローの定義と承認ルール](https://static-docs.nocobase.com/20261030-itam-lite-requests-workflow-definition.webp)

**Executions** には申請ごとに 1 件のエントリーがあり、たどったすべてのステップ、だれが行ったか、各アプリ内メッセージが送信されたかが表示されます。

![1 件の申請の実行記録](https://static-docs.nocobase.com/20261030-itam-lite-requests-workflow-execution.webp)

**完了の目安**：資産管理者がノート PC の申請を承認し、IT サポートが貸与すると、台帳のデバイスが In use になって申請者に割り当てられること。モニターの申請がそのまま Ready to issue になること。Cathy、Ben、Alice にそれぞれ対応するアプリ内メッセージが届くこと。**Workflow management** にプロセス図、承認ルール、実行記録が表示されること。
