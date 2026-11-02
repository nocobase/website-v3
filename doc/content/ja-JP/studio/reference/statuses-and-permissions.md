---
title: "タスクの状態と権限"
description: "タスクの状態、主な遷移、人とエージェントに許可される操作を確認します。"
---

## タスクの状態

<div class="states" aria-label="未着手から進行中へ。進行中と検収待ちを行き来し、完了へ"><span class="st-pill"><span class="si backlog"></span>Backlog</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si review"></span>In review</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>Done</span></div>
<div class="states" aria-label="進行中とブロック中を行き来する。未完了のタスクはキャンセル可能"><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>Blocked</span><span class="arrow">·</span><span>未完了のタスク</span><span class="arrow">→</span><span class="st-pill"><span class="si cancel"></span>Canceled</span></div>

| 状態 | 意味 |
| --- | --- |
| Backlog | 未着手。自動実行しない |
| In progress | エージェントチームが作業中 |
| Blocked | 情報、判断、復旧を待機 |
| In review | 引き渡し済みで責任者の検収待ち |
| Done | 検収済み、または関連 PR がすべてマージ済み |
| Canceled | 作業を続けない |

状態は固定で、プロジェクトごとに追加・削除・改名できません。タスクの編集権限を持つ人が変更できます。コーディネーターエージェントは In progress、Blocked、In review の間を移動します。実行エージェントは状態を変更しません。

Backlog のタスクは **Start** でコーディネーターエージェントに渡します。コメントでエージェントを指定しても、この操作は省略できません。

## 主な権限

| 操作 | Member の既定 | Admin の既定 |
| --- | --- | --- |
| タスクの閲覧と処理 | アクセス可能なプロジェクトと関連タスク | すべて |
| プロジェクト設定とナレッジ | 自分が責任者のプロジェクト | すべて |
| プロジェクト・タスクの削除 | 不可 | 可 |
| ランタイム | 個人用の接続・保守 | 共有ランタイムの管理 |
| Git 接続と組織キー | 管理不可 | 管理可 |
| 招待とロール割り当て | 不可 | 可 |
| アカウント無効化・他人のパスワード再設定 | 不可 | Owner が管理 |

プロジェクトの公開範囲と業務権限の両方でアクセスが決まります。カスタムロールで既定値を変更できます。[メンバーとロール](../admin/members-and-roles.md)を参照してください。

## エージェントの権限

エージェントは、代理するメンバーの権限とエージェント用に提供された操作の両方に制限されます。タスクは通常、その責任者のために実行し、会話は依頼者のために実行します。

実行エージェントはコミット、ブランチのプッシュ、PR 作成ができます。検収、PR のマージ、メンバー・ロール管理はできません。ナレッジは読み取り専用で、メモリーの変更はタスクの PR でレビューします。

プレビューの公開は、チェック取得元にも依存します。セルフチェックを選択した場合は、エージェントがタスクの PR プレビューを公開できます。[チェックと CI](../configure/checks.md)を参照してください。
