---
title: 要件をエージェントチームに任せる
metaDescription: デバイスの棚卸しの要件を例に、要件の提出、開始、割り振り、質問への回答から、チェックとレビュー、検収、マージまで、Studio でのタスクの流れを一通りたどります。
---

資産管理者から新しい要件が来ました。デバイスは四半期に一度棚卸しをしていますが、今はスプレッドシートを書き出して手作業でチェックしているため、漏れが出やすいとのことです。このページでは、この要件をエージェントチームに任せ、提出からマージまでを追います。

Studio では、要件はタスクです。人の判断が必要なステータスは、Blocked（あなたが回答する）と In review（あなたが検収する）の 2 つだけです。それ以外はコーディネーターエージェントが進めます。各ステータスの意味については、[タスクのステータスと権限](../studio/reference/statuses-and-permissions.md) を参照してください。

![タスクのボード：ステータスごとに 1 列](https://static-docs.nocobase.com/20261028201236304.png)

## 1. 要件を出してタスクにする

**My sessions** で **New session** をクリックし、コーディングエージェントとローカルの itam-lite ディレクトリを選び、プロジェクトに itam-lite を選びます（先に [自分の PC を接続](../studio/join/connect-computer.md) しておく必要があります）。

![New session](https://static-docs.nocobase.com/20261030155023637.png)

```prompt
資産管理者は四半期ごとにデバイスの棚卸しをしています。次のようにしたいです。
- 資産管理者が棚卸しを開始し、対象のデバイスを選ぶ。
- IT サポートがデバイスを 1 台ずつ確認する：あるか、場所は正しいか、使用者は正しいか。違っていれば、実際の状況を記録する。
- 棚卸しが終わると結果が出る：確認した台数、問題のなかった台数、すべての差異の一覧。
タスクを作成する前に、不明な点があれば質問してください。
```

エージェントはいくつか質問します。あなたは、対象は場所で選ぶ、棚卸し中もデバイスの申請は制限しない、従業員は棚卸しを見られない、と決めます。エージェントはこれらをタスクの説明と検収シナリオに書き込み、`ITAM-12 Device stocktake` を作成します。

<!-- TODO screenshot (English interface, browser width 1440): discussing the device stocktake in My sessions; after the agent asks and you answer, the session lists the created ITAM-12 issue and the Start button -->

**完了の目安**：itam-lite プロジェクトに「Device stocktake」タスクがあり、その説明に決めたルールと検収シナリオが含まれていること。

## 2. 開始する

セッションで **Start** をクリックします。タスクは In progress に移ります。コーディネーターエージェントはまずエージェントに方針（新しい 2 つのテーブル stocktakes と stocktake items、2 つのステータス、2 つのロールの権限）を書かせ、続いて別のエージェントに渡して、`agent/ITAM-12` ブランチで開発し、テストを書き、スクリーンショットを撮り、PR を作成させます。

タスクページ上部の **Now** と **Up next** に、だれが作業していて次に何をするかが表示され、**Activity** に各引き継ぎが表示されます。要件を追加するには、タスクにコメントします。[進捗を追う](../studio/use/follow-progress.md) を参照してください。

<!-- TODO screenshot (English interface, browser width 1440): the top of the ITAM-12 issue page, with Now showing the developing agent at work and Up next saying that after development it goes to another vendor for review -->

**完了の目安**：タスクが In progress で、実行者がコーディネーターエージェントになっていること。

## 3. 質問に答える

方針を書いている途中で、エージェントは人が決めるべき業務上の疑問に突き当たります。棚卸しで差異が見つかったら、デバイス台帳を自動で更新すべきか。タスクは Blocked に移り、**My issues** で **Needs your reply** の印が付きます。

![ブロックされたタスク：Needs you カードに、何を決める必要があるかが表示されます](https://static-docs.nocobase.com/20261028203035957.png)

タスクを開いて **Reply** をクリックします。

```text
台帳は自動で更新しないでください。棚卸しが終わったら差異を一覧にし、資産管理者が 1 件ずつ確認します。確認されたものだけ台帳を更新してください。
```

[エージェントの質問に答える](../studio/use/answer.md) を参照してください。

**完了の目安**：タスクが In progress に戻っていること。

## 4. チェックとレビュー

PR が作成されると、まず CI が実行され、続いて別ベンダーのエージェントがレビューします。開発したエージェントが問題を修正し、PR は再びレビューされます。すべて通過して初めて、あなたのもとに届きます。[チェックとレビュー](../studio/project/checks-and-review.md) を参照してください。

## 5. 検収してマージする

タスクは In review に移り、**My issues** で **Needs your acceptance** の印が付きます。引き渡しレポートとスクリーンショットを読み、タスクページからプレビューを開いて、最初の管理者として試します。資産管理者として場所で棚卸しを開始し、IT サポートに切り替えて何台かのデバイスを確認し、1 台はわざと間違った場所を入力します。棚卸しを終え、結果にその差異が一覧表示されるか、台帳が変更されていないかを確認します。[結果を検収する](../studio/use/accept.md) を参照してください。

![引き渡しレポートと、開発したエージェントが添付したスクリーンショット](https://static-docs.nocobase.com/20261028203712314.png)

![PR のプレビュー：タスクページに最初の管理者のユーザー名とパスワードが表示されます](https://static-docs.nocobase.com/20261028204209835.png)

期待どおりに動けば **Merge** をクリックします。そうでなければ **Send back for changes** をクリックし、何を変える必要があるかを書きます。

![検収待ちのタスク：Needs you カードの Merge ボタン](https://static-docs.nocobase.com/20261028201509073.png)

気になるタスクは、右上の星をクリックしてフォローすると、**My issues** の最上部に表示されます。

![タスクをフォローする](https://static-docs.nocobase.com/20261029152227386.png)

**完了の目安**：タスクが Done になり、デバイスの棚卸しが itam-lite の既定のブランチにマージされていること。
