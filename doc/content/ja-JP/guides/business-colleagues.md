---
title: 業務部門の同僚に参加してもらう
metaDescription: 資産管理者を Studio に招待し、My sessions で業務の言葉で要件を出し、My issues で質問に答え、判断し、結果を検収してもらいます。エージェントのインストールは不要です。
---

デバイスの棚卸しの要件は資産管理者から来たものなのに、要件を伝え、質問に答え、結果を検収したのはあなたでした。このページでは、資産管理者（業務部門の同僚）の Xu Ning を itam-lite プロジェクトに直接招待します。Xu Ning は Studio の Web 画面で要件を出し、エージェントの業務上の質問に答え、結果を自分で検収します。コードを書いたり、エージェントをインストールしたりする必要はありません。

## 1. Xu Ning を招待する

**Settings › Members** を開き、**Invite members** をクリックして Xu Ning のメールアドレスを入力し、**Projects** で itam-lite を選んで **Send invitations** をクリックします。[メンバーを招待する](../studio/setup/invite.md) を参照してください。

![Invite members](https://static-docs.nocobase.com/20261030155133745.png)

Xu Ning は招待リンクを開いて名前とパスワードを入力し、**Create account and join** をクリックします。[サインインと個人設定](../studio/join/sign-in.md) を参照してください。

**完了の目安**：**Settings › Members** の一覧に Xu Ning が表示されていること。

## 2. Xu Ning が要件を出す

Xu Ning はデバイスの廃棄を管理したいと考えています。Studio で **My sessions** を開き、**New session** をクリックして **Runner Agent** モードを選び、プロジェクトに itam-lite を選びます。

```prompt
デバイスが壊れたり古くなりすぎたりしたら、廃棄します。今は台帳から削除するだけで、記録が残りません。次のようにしたいです。
- IT サポートが廃棄すべきデバイスを見つけたら、理由と写真を添えて廃棄申請を出す。
- 資産管理者が承認する。承認されると、デバイスのステータスが Retired に変わり、申請できるデバイスに表示されなくなる。
- 廃棄したデバイスについて、だれが申請し、だれが承認し、理由は何かを確認できる。
わからないことがあれば、先に質問してください。
```

エージェントが追加で質問し、Xu Ning は会社の規程に沿って答えます。ノート PC は 4 年、モニターは 5 年たてば廃棄できる。それより前は損傷を説明する必要がある。従業員がまだ持っているデバイスは先に返却する必要がある。承認は資産管理者が行う。Xu Ning が「タスクを作成して」と伝え、**Start** をクリックします。Xu Ning がタスク責任者なので、以降の質問と検収は Xu Ning に直接届きます。[My sessions](../studio/use/sessions.md) を参照してください。

<!-- TODO screenshot (English interface, browser width 1440): Xu Ning discussing device retirement in the Runner Agent mode of My sessions, with the created issue and Start listed on the right of the session -->

**完了の目安**：itam-lite プロジェクトに「Device retirement」タスクがあり、Xu Ning が責任者で、In progress になっていること。

## 3. Xu Ning が質問に答える

開発中、エージェントが尋ねます。廃棄したデバイスは台帳に表示し続けるべきか。Xu Ning は **My issues** でそのタスクに **Needs your reply** の印が付いているのを見て、**Reply** をクリックします。

```text
廃棄したデバイスは、既定では台帳に表示しないでください。ただし、ステータスで絞り込めば見られるようにしてください。監査で履歴が必要です。
```

<!-- TODO screenshot (English interface, browser width 1440): Xu Ning's My issues, with the device retirement issue marked Needs your reply in the Waiting for you group -->

## 4. Xu Ning が結果を検収する

タスクが In review に移ると、Xu Ning は引き渡しレポートとスクリーンショットを読み、プレビューで試します。従業員がまだ持っているデバイスの廃棄申請を出し、止められることを確認します。デバイスが返却されたあとでもう一度申請し、承認されたら、そのデバイスが申請できるデバイスに表示されなくなったことを確認します。期待どおりに動けば、Xu Ning は **Merge** をクリックします。[結果を検収する](../studio/use/accept.md) を参照してください。

**完了の目安**：「Device retirement」タスクが Done になり、Xu Ning がすべての業務上の質問に直接答えていること。
