---
title: ロールと権限
metaDescription: 3 つのアカウントでそれぞれサインインし、設計書の権限マトリクスと照らし合わせて、従業員には自分のデータだけが見え、ボタンがロールに従い、API も同じ越権を拒否するようにします。
---

この章では、アカウントを切り替えながら [設計書](https://github.com/nocobase/docs-examples-v3/blob/main/apps/itam-lite/docs/design.md) のセクション 6 の権限マトリクスを項目ごとに確認し、見つかった問題をエージェントに直してもらいます。

## 1. 各アカウントで確認する

Alice（Employee）、Ben（IT support）、Cathy（Asset manager）の順にサインインし、次の表と比較します。

| 確認項目 | 期待される結果 | 実際の結果 |
| --- | --- | --- |
| Alice の **Device requests** | Alice 自身の申請だけ | Alice に全員の申請が見える |
| Alice の **Devices** | Alice に割り当てられたデバイスだけ | Alice にすべてのデバイスが見える |
| Ben が承認待ちの申請を開く | **Approve** も **Reject** もない | **Approve** があり、クリックすると Ben に権限がないと表示される |
| Cathy が貸与待ちの申請を開く | **Issue** がない | **Issue** があり、クリックすると Cathy に権限がないと表示される |
| システム管理者が **Permission management** で Employee ロールを開く | すべての業務操作とそのデータ範囲 | ページへのアクセスだけ |

![IT サポートに Approve が表示され、クリックすると拒否されます](https://static-docs.nocobase.com/20261030-itam-lite-roles-it-support-approve-denied.webp)

Ben が **Approve** をクリックすると操作は拒否されるので、サーバーの権限チェックは正しく機能しています。

## 2. 修正を依頼する

```prompt
docs/design.md の権限マトリクスに従って権限を修正してください。
1. 従業員は自分の申請だけを見て取り下げられ、台帳では自分に割り当てられたデバイスだけが見えるようにする。
2. 申請の詳細には、現在のロールが実行できる操作だけを表示する。
3. デバイスとデバイスの申請に関するすべての操作とデータ範囲を、Permission management で設定できるようにする。
```

エージェントの修正方法：

| 問題 | 修正 |
| --- | --- |
| 従業員にすべてが見える | 新しいシードで、Employee ロールの閲覧と取り下げを「自分が提出した申請」に、デバイスを「自分に割り当てられたデバイス」に変更します。ロールが初期の内容のままの場合にだけ変更します |
| ボタンがロールに従わない | 申請の詳細の API が現在のロールが実行できる操作を返し、ページはワークフローとロールの両方が許可するボタンだけを表示します |
| Permission management に業務操作がない | 2 つのグループの業務操作とワークフロー管理の設定を、権限エディターに登録します |
| API の越権 | 3 つの一般アカウントで API を直接呼び出す新しい権限テストで、上記の検収項目を網羅します |

エージェントは `pnpm nocobase db apply` を実行して、使用中のデータベースにシードを書き込みます。

## 3. もう一度確認する

Alice には自分が提出した 3 件の申請と、自分に割り当てられた 2 台のデバイスだけが見えます。Ben が承認待ちの申請を開くと、「Nothing for you to do on this request now.」とだけ表示されます。Alice がページを使わずに承認のリクエストを直接送っても、拒否されます。

![従業員には自分の申請だけが見えます](https://static-docs.nocobase.com/20261030-itam-lite-roles-employee-own-requests.webp)

システム管理者が **System settings › Permission management** で Employee ロールを編集すると、**Business operations** にすべての操作とそのデータ範囲が表示され、以降はここで調整できます。

![ロールの業務操作とデータ範囲](https://static-docs.nocobase.com/20261030-itam-lite-roles-business-operations.webp)

権限の宣言、チェック、検証の方法については [認証、権限、データ範囲](../core/developing-apps/authentication-and-permissions.md) を、権限管理のページについては [権限管理](../core/using-plugins/authorization/permissions.md) を参照してください。

**完了の条件**：3 つのアカウントのそれぞれで、見えるものとできることが権限マトリクスと一致すること。権限テストで、一般アカウントからの越権の API 呼び出しがすべて拒否されること。**Permission management** にすべての業務操作とデータ範囲が表示され、調整できること。
