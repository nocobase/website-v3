---
title: ページ、ルート、ナビゲーション
description: ルーティング専用のアプリを使い、ページの登録、パラメーター、ドロワーとダイアログ、タブ、ナビゲーション、パンくずリスト、アクセス制御、コンポーネントの上書きを学びます。
---

`defineAppRoutes()` を使って、ページのアドレス、コンポーネント、ナビゲーション、アクセスのルールを宣言します。[サンプルアプリ][app] を実行してアカウントを用意するには、[環境と起動](#環境と起動) を参照してください。

## ページを登録する

### ルートを宣言してランタイムに接続する

ページは [client/pages/projects/routes.ts][routes] で宣言し、[client/routes.ts][collection] でランタイム用にまとめます。この抜粋はプロジェクト一覧の宣言だけを残し、外側のグループと子ルートを省いています。

```ts
// client/pages/projects/routes.ts (excerpt: outer group and child routes omitted)
import { FolderKanban } from 'lucide-react';
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export const projectRoutes = defineAppRoutes([
  {
    name: 'projects',
    path: '/projects',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
    navigation: { title: 'demo.projects', icon: FolderKanban },
    componentLoader: () => import('./index.js'),
  },
]);
```

```ts
// client/routes.ts
import { projectRoutes, appendedRoutes } from './pages/projects/routes.js';
// Retain the template appRoutes and systemSettingsRoutes.
export default [appRoutes, appendedRoutes, projectRoutes, systemSettingsRoutes];
```

`defineAppRoutes()` は読み取り専用の定義の配列を受け取り、凍結された `{ parent: 'app', routes: [...] }` の提供内容を返します。コンポーネントをすぐに読み込むことはありません。ランタイムの `routes` は、1 つの提供内容、または提供内容のフラットな配列を受け付けます。テンプレートは、すでに `client/runtime.ts` でこのファイルをインポートしています。使われていないファイルで関数を呼び出しても、何も登録されません。返されたオブジェクトを変更したり、提供内容の配列を `defineAppRoutes()` に渡し戻したりしないでください。

サンプルのホームページから **Project list** を開くと、登録されたページとそのナビゲーションの項目が表示されます。その `authz` はプロジェクトへのアクセスを求めており、サンプルの管理者はそれを持っています。

![デフォルトエクスポートのコンポーネントとナビゲーションの項目を持つ静的なプロジェクトのページ](/assets/core/developing-apps/pages-routes-and-navigation/projects.png)

[ソースを見る][routes]

### ページのコンポーネントを読み込む

`componentLoader` は `Promise<{ default: Component }>` を返す必要があります。プロジェクト一覧は `import('./index.js')` を使い、[index.tsx][list] のデフォルトエクスポートを読み込みます。ページは、テンプレートの再利用できる `PageContainer`、`PageHeader`、`DataTable` コンポーネントを使います。

モジュールが名前付きのエクスポートを提供することもできます。単独のプロジェクトのルートは [workspace.tsx][workspace] の `ProjectPage` を使い、必要な構造に合わせています。

```ts
// client/pages/projects/routes.ts
componentLoader: () =>
  import('./workspace.js').then((module) => ({ default: module.ProjectPage })),
```

プロジェクトのドロワーで **Open as a full page** を選ぶと、`/project-pages/p100` でこの名前付きのエクスポートが表示されます。

ローダーはルートのパラメーターを受け取らず、データを取得する関数でもありません。パラメーターはコンポーネントの中で読み取り、データの取得については [データのリクエストと状態管理](data-requests-and-state.md) を参照してください。ローダーから JSX 要素を直接返さないでください。

![名前付きのエクスポートで読み込まれた単独のプロジェクトのページ](/assets/core/developing-apps/pages-routes-and-navigation/standalone.png)

[ソースを見る][workspace]

## パスのパラメーターとページの移動

### 静的なパスと動的なパラメーター

ルートの `path` はアプリからの相対パスです。既定の `/main` のデプロイの接頭辞では、`/projects` はブラウザーでは `/main/projects` と表示されます。ルートの宣言に `/main` を含めないでください。

[サンプルのルート][routes] は、静的なパスと動的なパラメーターの両方を使っています。

| アプリのパス | 用途 |
| --- | --- |
| `/projects` | プロジェクト一覧 |
| `/projects/new` | 下書きのフォーム。静的な `new` は `:projectId` より優先される |
| `/projects/:projectId` | プロジェクトの ID で詳細を開く |
| `/projects/:projectId/tasks/:taskId` | プロジェクトとタスクの両方を特定する |

[detail.tsx][detail] は React Router の [`useParams()`](https://reactrouter.com/api/hooks/useParams) を使ってパラメーターを読み取り、デモ用のレコードを探します。

```tsx
import { useParams } from 'react-router';
import { projects } from './data.js';

// Inside the ProjectDetail component
const { projectId } = useParams();
const project = projects.find((item) => item.id === projectId);
```

パラメーターの値は文字列で、子は親のパラメーターも読み取れます。`/projects/p100` は Harbor launch に解決され、`/projects/missing` はレコードがないことを示すメッセージを表示します。ルートの照合はテンプレートが担い、レコードの検索とレコードがない場合の処理はページが実装します。

![不明なプロジェクトでは、レコードがないことを示すメッセージが表示されます](/assets/core/developing-apps/pages-routes-and-navigation/missing.png)

[ソースを見る][detail]

### クエリーのパラメーターと移動

**Search projects** に `Harbor` と入力します。アドレスは `/projects?q=Harbor` になり、**Harbor launch** を選ぶと `/projects/p100?q=Harbor` が開きます。[index.tsx][list] は React Router の [`useSearchParams()`](https://reactrouter.com/api/hooks/useSearchParams) でクエリーを更新します。この抜粋では、テーブルの設定と無関係なコンポーネントの props を省いています。

```tsx
// client/pages/projects/index.tsx
const location = useLocation();
const [search, setSearch] = useSearchParams();
const query = search.get('q') ?? '';

<Input
  value={query}
  onChange={(event) => {
    const next = new URLSearchParams(search);
    if (event.target.value) next.set('q', event.target.value);
    else next.delete('q');
    setSearch(next, { replace: true });
  }}
/>

// Inside the DataTable name cell
<RecordLink to={{ pathname: row.original.id, search: location.search }}>
  {row.original.name}
</RecordLink>
```

`RecordLink` は React Router の [`Link`](https://reactrouter.com/api/components/Link) を包んだものです。相対パスの `p100` は一覧のパスに付け加えられます。クエリーは明示的に渡してください。ネストしても自動では保たれません。一覧は `q` でフィクスチャーを絞り込みます。`setSearch(next, { replace: true })` は、編集のたびに履歴のエントリーが作られるのを防ぎます。

![q のクエリーが一覧を絞り込み、詳細のリンクにも含まれます](/assets/core/developing-apps/pages-routes-and-navigation/filtered.png)

[ソースを見る][list]

## ネストしたルートとページの表示方法

### 単独のページと子ルート

ページは単独で登録することも、別のページの子として登録することもできます。違いは、親のコンテンツの Outlet を通してレンダリングされるかどうかです。

| 宣言 | アドレスの例 | 内容の場所 |
| --- | --- | --- |
| 一覧の兄弟 | `/project-pages/p100` | 単独のページ。一覧の Outlet の外 |
| 一覧の `children` の中 | `/projects/p100` | 一覧の `Outlet` |

[routes.ts][routes] の単独のページは一覧の兄弟で、`ProjectPage` を再利用します。

```ts
// A sibling route of projects
{
  name: 'projectStandalone',
  path: '/project-pages/:projectId',
  authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
  breadcrumb: { title: 'demo.projectPage' },
  componentLoader: () =>
    import('./workspace.js').then((module) => ({ default: module.ProjectPage })),
}
```

[ページのコンポーネントを読み込む](#ページのコンポーネントを読み込む) のスクリーンショットを参照してください。単独のページは、一覧の Outlet なしで名前付きのエクスポートを再利用しています。

ドロワーで **Open as a full page** を選ぶと、この独立したページが開きます。代わりに一覧の中に詳細を置くには、`children` で階層を宣言します。

```ts
// Children of the projects page (excerpt)
children: [
  {
    name: 'projectDetail',
    path: ':projectId',
    componentLoader: () => import('./detail.js'),
    children: [
      {
        name: 'projectTask',
        path: 'tasks/:taskId',
        componentLoader: () => import('./task.js'),
      },
    ],
  },
],
```

親は React Router の [`Outlet`](https://reactrouter.com/api/components/Outlet) をレンダリングする必要があります。この一覧は `context` でクエリーも渡しており、詳細のコンポーネントは `useOutletContext()` でそれを読み取ります。

```tsx
// client/pages/projects/index.tsx
const context = useMemo(() => ({ listSearch: location.search }), [location.search]);

<Outlet context={context} />
```

`children` は階層を定め、`Outlet` はレンダリングの場所を提供します。内容を埋め込むか、親を覆うか、ドロワーやダイアログで表示するかは、ページのコンポーネントが選びます。子ルートを宣言しても、それらの表示方法が自動で作られるわけではありません。

[ソースを見る][routes]

### 埋め込みの子ページと既定のタブ

**Project reports** を開きます。`/reports` は `/reports/summary` にリダイレクトされ、**Owners** で `/reports/owners` に切り替わります。[reports/index.tsx][reports] は、アドレスが親と完全に一致するときだけリダイレクトします。

```tsx
// client/pages/reports/index.tsx (excerpt)
const location = useLocation();
const parent = useResolvedPath('.');
if (matchPath({ path: parent.pathname, end: true }, location.pathname)) {
  return <Navigate replace to={{ pathname: 'summary', search: location.search }} />;
}

// These elements go in the navigation and content returned by the component.
<NavLink to={{ pathname: 'owners', search: location.search }}>
  {t('demo.owners')}
</NavLink>
<Outlet />
```

`Navigate replace` は、余分な親のエントリーを履歴に追加しないようにします。`end: true` は、Owners に直接アクセスしたときに Summary にリダイレクトされるのを防ぎます。`NavLink` は有効なタブを示し、`Outlet` がその内容をレンダリングします。両方の子は、レポートのページの認可を引き継ぎます。

![親のレポートのアドレスでは、既定で Summary が開きます](/assets/core/developing-apps/pages-routes-and-navigation/summary.png)
![Owners を直接開くと、そのタブと親のナビゲーションが保たれます](/assets/core/developing-apps/pages-routes-and-navigation/owners.png)

[ソースを見る][reports]

### 親の内容を覆う子ページ

ドロワーで **Open workspace** を選ぶと、`/projects/workspace/p100?q=Harbor` が開きます。[workspace.tsx][workspace] は、テンプレートの `RouteChildPage` を使って親の内容を覆い、アプリのナビゲーションは使えるままにします。

```tsx
// Another child of the projects page
{
  name: 'projectWorkspace',
  path: 'workspace/:projectId',
  breadcrumb: { title: 'demo.workspace' },
  componentLoader: () => import('./workspace.js'),
}

// client/pages/projects/workspace.tsx
export default function ProjectWorkspace() {
  return <RouteChildPage><ProjectPage /></RouteChildPage>;
}
```

ワークスペースは、引き続き一覧の Outlet を通してレンダリングされます。その見出しとパンくずリストにはプロジェクト名を使います。その設定については [静的と動的なパンくずリスト](#静的と動的なパンくずリスト) を参照してください。

![RouteChildPage は、アプリのナビゲーションを残したまま一覧の内容を覆います](/assets/core/developing-apps/pages-routes-and-navigation/workspace.png)

[ソースを見る][workspace]

### ルートのドロワーとネストしたダイアログ

[detail.tsx][detail] は、テンプレートの `RouteDrawer` を使ってプロジェクトを表示します。この抜粋では、レコードの検索、レコードがない場合の処理、ほかのボタンを省いています。

```tsx
// client/pages/projects/detail.tsx (excerpt)
const { projectId } = useParams();
const { listSearch } = useOutletContext<{ listSearch: string }>();

<RouteDrawer title={project.name} footer={<CloseButton />}>
  <RecordLink to={{ pathname: `tasks/${task.id}`, search: listSearch }}>
    {task.name}
  </RecordLink>
  <Outlet />
</RouteDrawer>
```

プロジェクトを選ぶと、絞り込んだ一覧の上にドロワーが開きます。`/projects/p100?q=Harbor` を開いたり再読み込みしたりすると、このページの状態が復元されます。

![詳細のドロワーの後ろに、絞り込んだ一覧が残ります](/assets/core/developing-apps/pages-routes-and-navigation/drawer.png)

**Prepare launch checklist** を選ぶと、`/projects/p100/tasks/t200?q=Harbor` が開きます。[task.tsx][task] は自分のパラメーターと親のパラメーターを読み取り、`RouteDialog` をレンダリングします。

```tsx
// client/pages/projects/task.tsx (excerpt)
const { projectId, taskId } = useParams();

<RouteDialog title={task.name} footer={<CloseTask />}>
  <p>{t('demo.taskPath', { projectId, taskId })}</p>
</RouteDialog>
```

2 つ目の `Outlet` は詳細のドロワーの中に置きます。これがタスクのダイアログをレンダリングします。**Back to project** は内側のダイアログだけを閉じます。続いてドロワーを閉じると一覧に戻ります。

![プロジェクトのドロワーの上のタスクのダイアログは、両方のパスのパラメーターを読み取ります](/assets/core/developing-apps/pages-routes-and-navigation/task.png)

[詳細のソースを見る][detail] · [タスクのソースを見る][task]

## 戻る操作と離れるときの確認

### 親に戻り、クエリーのパラメーターを保つ

`/projects?q=Harbor` から下書きのダイアログを試します。**New draft** で `/projects/new?q=Harbor` が開きます。名前を入力して **Preview draft** を選び、続いて **Finish preview** を選ぶと、検索を保ったまま `/projects?q=Harbor` に戻ります。これらの操作でプロジェクトは作成されません。

![静的な new の子ルートで下書きのフォームが開きます](/assets/core/developing-apps/pages-routes-and-navigation/draft.png)
![ダイアログを閉じる操作がある下書きのプレビュー](/assets/core/developing-apps/pages-routes-and-navigation/draft-preview.png)

[フォームの全体][draft] では、ダイアログ内にレンダリングされるコンポーネントの中で `useRouteOverlay()` から `close()` を取得します。

```tsx
// Call this inside a button component rendered within RouteDialog.
const { close } = useRouteOverlay();

<Button onClick={() => {
  onFinish(); // Clear the draft dirty flag in this example.
  void close();
}}>
  {t('demo.finishPreview')}
</Button>
```

`close()` は一致した親のルートに戻り、クエリーを保つため、URL の最後のセグメントについて仮定する必要がありません。閉じるアイコン、Escape、背景も同じ閉じる流れを使います。通常のプログラムからの移動については、React Router の [`useNavigate()`](https://reactrouter.com/api/hooks/useNavigate) を参照してください。

[ソースを見る][draft]

### 保存していない変更から離れる前に確認する

名前を入力したあとで Close を選びます。**Discard this unsaved draft?** で、編集を続けるか、破棄して一覧に戻るかを選べます。

```tsx
// client/pages/projects/new.tsx (excerpt)
const dirtyRef = useRef(false);
const pendingDecisionRef = useRef<{
  promise: Promise<boolean>;
  resolve: (allowed: boolean) => void;
} | null>(null);
const [confirmOpen, setConfirmOpen] = useState(false);

const canLeave = useCallback((): boolean | Promise<boolean> => {
  if (!dirtyRef.current) return true;
  if (!pendingDecisionRef.current) {
    let resolve!: (allowed: boolean) => void;
    const promise = new Promise<boolean>((done) => { resolve = done; });
    pendingDecisionRef.current = { promise, resolve };
    setConfirmOpen(true);
  }
  return pendingDecisionRef.current.promise;
}, []);

useNavigationGuard(canLeave);
// RouteDialog also receives canLeave as beforeClose.
// AlertDialog buttons call decide(false) or decide(true).
const decide = (allowed: boolean) => {
  setConfirmOpen(false);
  if (allowed) dirtyRef.current = false;
  pendingDecisionRef.current?.resolve(allowed);
  pendingDecisionRef.current = null;
};
useEffect(() => () => pendingDecisionRef.current?.resolve(false), []);
```

同じ非同期の判断を、`RouteDialog.beforeClose` と `useNavigationGuard()` に渡します。これらは、ブラウザーの履歴の移動を含め、オーバーレイを閉じる操作とアプリ内の移動を網羅します。既定のテンプレートは、ルートの外側に `NavigationGuardProvider` を置いています。`false` を返すと離れるのを防ぎ、`true` で許可し、Promise では選択を待ちます。

確認が開いている間に重なった要求は 1 つの Promise を共有するため、1 回の選択ですべての待機が解決し、コールバックが上書きされることはありません。アンマウント時には、保留中の要求を `false` で解決してください。離れることを許可するときは変更済みのフラグをクリアし、閉じるときの移動で 2 回目の確認が出ないようにします。

実装の全体では、再読み込みやサイトから離れる場合の `beforeunload` も扱っています。その確認の文言はブラウザー独自のもので、アプリのナビゲーションのガードはその代わりにはなりません。

![非同期のナビゲーションのガードが、破棄するかどうかの判断を待ちます](/assets/core/developing-apps/pages-routes-and-navigation/guard.png)

[ソースを見る][draft]

## ナビゲーションのメニューとパンくずリスト

### メニューの設定、グループ、選択状態

ルートの `navigation` がメニューの項目を作ります。パスのない **Projects** グループが一覧をまとめます。ページの宣言全体を省くと、そのグループは次のようになります。

```ts
{
  name: 'business',
  navigation: { title: 'demo.business', order: 10 },
  children: [
    // Place the projects page declaration here.
  ],
}
```

Reports は、`/reports` の接頭辞を持つ **Insights** グループを使います。グループにはコンポーネントがなく、自分の `Outlet` がなくても子をまとめます。

```ts
{
  name: 'reportsGroup',
  path: '/reports',
  navigation: { title: 'demo.insights', order: 20 },
  children: [
    {
      name: 'reports',
      path: '/',
      authz: 'skip',
      navigation: { title: 'demo.reports', icon: ChartColumn },
      componentLoader: () => import('../reports/index.js'),
      children: [
        { name: 'reportSummary', path: 'summary',
          componentLoader: () => import('../reports/summary.js') },
        { name: 'reportOwners', path: 'owners',
          componentLoader: () => import('../reports/owners.js') },
      ],
    },
  ],
}
```

子の `path: '/'` はグループのアドレス `/reports` に着地します。グループ自体はページのアドレスを持ちません。メニューの項目を作るのは `navigation` だけです。詳細とタスクは、メニューを追加しなくてもレコードのリンクからアクセスできます。

`title` はテキストまたは翻訳キーで、`icon` は Lucide のアイコンなどの React コンポーネントです。文字列や JSX 要素ではありません。`order` は有限の数値で、既定は `0` です。兄弟は昇順に並びます。グループの見出しにはアイコンは表示されません。ネストしたタスクでも Project list が選択されたままです。認可によって、アクセスできないページと空のグループは隠されます。

![パスのないグループと接頭辞付きのグループ。Insights の下に追加のページがあります](/assets/core/developing-apps/pages-routes-and-navigation/navigation.png)

[ソースを見る][routes]

### 静的と動的なパンくずリスト

`breadcrumb` と `usePageBreadcrumb()` は、ルートのメタデータとページの内容を、アプリのテンプレートのパンくずリストに接続します。

`breadcrumb: { title: 'demo.workspace' }` は静的なルートのタイトルを提供します。プロジェクトが取得できたら、`usePageBreadcrumb()` がそれをプロジェクト名に置き換えます。

```tsx
// client/pages/projects/workspace.tsx (excerpt)
usePageBreadcrumb(
  project
    ? [
        {
          label: t('demo.projects'),
          to: { pathname: '/projects', search: location.search },
        },
        { label: project.name },
      ]
    : undefined,
);
```

`label` は表示するテキストで、`to` は任意の移動先です。最後の項目はリンクになりません。既定のルートのパンくずリストを使うには、`undefined` または `null` を渡します。最も内側の有効な宣言が優先され、アンマウントすると外側の宣言に戻ります。

[親の内容を覆う子ページ](#親の内容を覆う子ページ) のスクリーンショットには、**Project list → Harbor launch** が表示されています。**Project list** を選ぶと、`q=Harbor` を付けて戻ります。テンプレートは、現在の階層でアクセスした祖先のクエリーを記憶しますが、ディープリンクや再読み込みではその履歴がないことがあります。そうした場合にもクエリー付きで戻る必要があるときは、`to` を明示的に指定します。

[ソースを見る][workspace]

## 認証とページの権限

### サインインの要件とページのレイアウト

[ルートの定義][routes] は、3 つの `auth` の値を別々のルートツリーで示しています。

```ts
// Three independent routes, not a parent/child tree.
{ name: 'projects', path: '/projects', auth: 'required', /* ... */ }
{ name: 'welcome', path: '/welcome', auth: 'guest', authz: 'skip', /* ... */ }
{ name: 'publicProjects', path: '/public-projects', auth: 'optional', authz: 'skip', /* ... */ }
```

| 使い方 | 操作 | 既定のテンプレートの動作 |
| --- | --- | --- |
| `required` | サインアウトしたウィンドウで `/projects` を開く | `/login` にリダイレクトする。サインインしたページは、サイドバー付きのアプリのレイアウトを使う |
| `guest` | サインアウトした状態で `/welcome` を開く | ゲスト向けのウェルカムページを表示する。サインインした訪問者はほかへリダイレクトされる |
| `optional` | サインインしていてもいなくても `/public-projects` を開く | どちらの身元でも単独のレイアウトを開ける |

![required のルートは、サインアウトした訪問者をログインページに送ります](/assets/core/developing-apps/pages-routes-and-navigation/login.png)
![guest のルートは、サインイン前にウェルカムページを表示します](/assets/core/developing-apps/pages-routes-and-navigation/guest.png)
![optional のルートはサインインなしで使え、単独のレイアウトを使います](/assets/core/developing-apps/pages-routes-and-navigation/public.png)

ルートのルートは既定で `required` です。子孫は `auth` を引き継ぎ、ほかの値に変えることはできません。認証だけでは、ページへのアクセスは付与されません。

現在のテンプレートは、保護されたページへのアクセスを `/login` にリダイレクトしますが、元の移動先を自動では引き継ぎません。サインインした状態でアクセスしたゲスト向けのページは、安全なアプリ内の `redirect` のクエリーを使うか、ホームに戻ります。たとえば `/welcome?redirect=%2Freports%2Fowners` は、サインインした訪問者を Owners に送ります。任意のディープリンクがサインイン後に自動で再開されるとは考えないでください。

[ソースを見る][routes]

### 権限の宣言、継承、アクセスの拒否

[ルートの全体][routes] は、次の認可の宣言を使っています。

```ts
// Project list and children without their own authorization declaration
 authz: { resource: { type: 'page', id: 'projects' }, action: 'access' }
// The draft page requires another page grant
 authz: { resource: { type: 'page', id: 'project-drafts' }, action: 'access' }
// Reports skip their own page authorization check but still require sign-in
 authz: 'skip'
// Administrator notes require an unrestricted identity
 authz: 'unrestricted'
```

**System settings → Permission management → Roles and permissions** で、プロジェクトのページへのアクセスだけを付与する `Project viewer` ロールを作成します。**Users** でデモ用のユーザーを作成し、そのロールを割り当てます。別のブラウザーのセッションでサインインし、[README][readme] に従って次を確認します。

- 一覧、詳細、タスク、ワークスペースにアクセスできる。独自の `authz` のない子は、最も近い祖先のページの有効な値を引き継ぐ。
- **New draft** は隠され、`/projects/new` は拒否される。子自身の付与が、親のチェックの代わりになることはない。
- Reports は `skip` によって使えるが、サインインは引き続き必要。
- 管理者のメニューは隠され、`/admin-notes/child` は拒否される。子の `skip` で、親の `unrestricted` の要件を回避することはできない。

![プロジェクトの閲覧者は、下書きや管理者の操作なしで一覧を使えます](/assets/core/developing-apps/pages-routes-and-navigation/viewer.png)
![プロジェクトへのアクセスだけでは、新しい下書きは開けません](/assets/core/developing-apps/pages-routes-and-navigation/draft-denied.png)
![skip の子で、unrestricted の親を回避することはできません](/assets/core/developing-apps/pages-routes-and-navigation/admin-denied.png)

管理者は **Administrator notes → Open child page** を開けます。`unrestricted` は、サインインしたすべてのユーザーではなく、制限のないアクセスを持つ身元を意味します。

![制限のないアカウントは、管理者の親と子を開けます](/assets/core/developing-apps/pages-routes-and-navigation/admin.png)

引き継ぐ祖先のページがない場合、`authz` を省略すると、`required` では `unrestricted`、`guest` と `optional` では `skip` が既定になります。各ツリーの最初のページでは明示的に宣言してください。純粋なグループでは `authz` を宣言できません。

`resource.type`、`resource.id`、`action` は空でない文字列である必要があります。ルート名と権限の ID は別のもので、保存されたロールの付与はリソースの ID を参照します。ナビゲーションやパンくずリストのタイトルがないページには、[page-permission-titles.ts][permission-titles] で読みやすい名前が必要です。たとえば `projectCreate: 'demo.newDraft'` です。`useCan()` は、同じ権限でボタンを制御します。フロントエンドのページの付与は、API やクライアントにバンドルされたデータを保護しません。この例のプロジェクトのデータは公開の架空のものです。業務のリソースとサーバーでの強制については [認証、権限、データ範囲](authentication-and-permissions.md) を参照してください。

[ソースを見る][routes]

## ルートの組み立て、接続、上書き

### パッケージ内とパッケージ間で接続する

**Insights** の下の **Export instructions** を `/reports/exports` で開きます。別の提供内容が、`parent: 'reportsGroup'` でそれを接続しています。

```ts
export const appendedRoutes = defineAppRoutes([
  {
    parent: 'reportsGroup',
    name: 'reportExports',
    path: 'exports',
    authz: 'skip',
    navigation: { title: 'demo.exports', order: 10 },
    componentLoader: () => import('../examples/exports.js'),
  },
]);
```

[client/routes.ts][collection] では、接続先があとで宣言されてもよいことを示すため、意図的に `appendedRoutes` を `projectRoutes` より先にまとめています。大きなアプリでは、提供内容を別々のファイルに置き、フラットな配列にまとめます。

![同じパッケージの別の提供内容が Insights の下に表示されます](/assets/core/developing-apps/pages-routes-and-navigation/exports.png)

[reporting-plugin.ts][plugin] は、このアプリに置いたクライアントの提供内容のファクトリーです。`@example/project-reporting` はプラグインの名前空間を示すもので、インストールする別の npm パッケージではありません。パッケージをまたいで接続するには `package:group` を使います。

```ts
// client/reporting-plugin.ts
{
  parent: 'pages-routes-navigation:reportsGroup',
  name: 'snapshot',
  path: 'snapshot',
  authz: 'skip',
  navigation: { title: 'demo.snapshot', order: 20 },
  componentLoader: () => import('./pages/examples/plugin-original.js'),
}
```

このエントリーをアプリの `reportsGroup` に接続すると、`/reports/snapshot` になります。ルートと翻訳の名前空間は引き続きプラグインに属し、プラグインが両方のロケールを登録します。出荷時の設定では [コンポーネントの上書き](#ページのコンポーネントを置き換える) が有効です。下の元のページを見るには、`client/route-overrides.ts` の上書きの配列を一時的に空にし、そのあと元に戻します。

![コンポーネントの上書きを一時的に外して撮影した、元のレポートの提供内容](/assets/core/developing-apps/pages-routes-and-navigation/plugin-original.png)

`parent` は提供内容のルートのエントリーでだけ使え、ページではなくグループを指す必要があります。接続先がない、循環している、既存の `children` の中で `parent` を使っている、といった場合は検証に失敗します。ページの子は `children` で追加します。兄弟は `navigation.order` で並び、値が同じ場合は既存の子が先に、続いて追加された提供内容が登録順に並びます。

[アプリのルートのソースを見る][routes] · [プラグインの提供内容のソースを見る][plugin]

### プラグインのオプションでルートを有効にする

プラグインの `routes` は、その登録オプションを受け取る同期の関数にできます。[reporting-plugin.ts][plugin] は `enabled` を使って、ページを提供するかどうかを決めます。

```ts
// client/reporting-plugin.ts (excerpt)
export default defineClientPlugin<{ enabled?: boolean }>({
  packageName: '@example/project-reporting',
  // The complete file also registers en-US and zh-CN locales.
  routes: (options) => defineAppRoutes(options.enabled === false ? [] : [
    {
      parent: 'pages-routes-navigation:reportsGroup',
      name: 'snapshot',
      path: 'snapshot',
      authz: 'skip',
      navigation: { title: 'demo.snapshot', order: 20 },
      componentLoader: () => import('./pages/examples/plugin-original.js'),
    },
  ]),
});

// Inside the defineClientPlugins array in client/plugins.ts
reportingPlugin({ enabled: true }),
```

`routes(options)` は、1 つの提供内容またはフラットな配列を返す同期の登録関数です。React の状態や現在のユーザーが変わっても、再び実行されることはありません。提供内容の無効化を試すには、`enabled` を `false` に変え、存在しないルートを指さないよう [コンポーネントの上書き](#ページのコンポーネントを置き換える) の配列を `[]` にします。終わったら両方を元に戻します。分離したテストでも、このオプションを確認しています。

![レポートの提供内容を無効にすると、Insights から Reporting snapshot がなくなります](/assets/core/developing-apps/pages-routes-and-navigation/plugin-disabled.png)

[ソースを見る][plugin]

### ページのコンポーネントを置き換える

既定のサンプルでは、カスタマイズした **Reporting snapshot** を表示します。コンポーネントを置き換えるには、その `package:route` の ID を指定します。

```ts
// client/route-overrides.ts
import { defineClientRouteComponentOverrides } from '@nocobase/app-client/plugins';

export default defineClientRouteComponentOverrides([
  {
    routeId: '@example/project-reporting:snapshot',
    componentEntry: './client/pages/examples/plugin-custom',
    componentLoader: () => import('./pages/examples/plugin-custom.js'),
  },
]);

// client/runtime.ts (excerpt)
import routeComponentOverrides from './route-overrides.js';
const appRuntime = defineAppRuntime({
  // Retain createAppConfig, locales, routes, plugins and other existing options.
  routeComponentOverrides,
});
```

ランタイムは `route-overrides.ts` を自動では見つけないため、明示的に `defineAppRuntime()` に渡します。上書きでは、パス、認可、ナビゲーション、所有するパッケージ、子が保たれます。コンポーネントは、引き続き元のパッケージの翻訳の名前空間で実行されます。`componentEntry` はソースの入口を記録し、`componentLoader` がコンポーネントを読み込みます。

![カスタマイズしたレポートのコンポーネントは、元のメニューの項目と URL を保ちます](/assets/core/developing-apps/pages-routes-and-navigation/plugin-custom.png)

元のコンポーネントを見るには、一時的に空の上書きの配列を使い、そのあと元に戻します。対象はグループではなく、登録されたページである必要があり、各 ID の上書きは 1 回だけです。ページを置き換えるために、重複したパスを登録しないでください。

[上書きのソースを見る][overrides] · [ランタイムでの登録のソースを見る][runtime]

## 読み込みの状態とエラー処理

### ページの読み込みと失敗

**Try a slow page** で `/route-status/loading` が開きます。この [デモ用のローダー][routes] は 1.2 秒待ち、テンプレートの読み込み中の状態を見せます。

```ts
{
  name: 'slowPage',
  path: '/route-status/loading',
  authz: 'skip',
  componentLoader: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return import('../examples/loaded.js');
  },
}
```

![ルートのコンポーネントを読み込んでいる間のテンプレートの読み込み中の状態](/assets/core/developing-apps/pages-routes-and-navigation/loading.png)
![コンポーネントの読み込み後のページの内容](/assets/core/developing-apps/pages-routes-and-navigation/loaded.png)

**Try a page error** で `/route-status/error` が開きます。そのコンポーネントは、[ClientRoute][client-route] のエラーの画面を示すために、わざと例外を投げます。本番のページにこの意図的な例外を残さないでください。コンポーネントやネットワークの問題を直したら再読み込みします。ローダーの Promise が reject された場合も、同じエラーの画面になります。

![コンポーネントの例外では、エラーの画面と再試行の操作が表示されます](/assets/core/developing-apps/pages-routes-and-navigation/error.png)

[ローダーのソースを見る][routes] · [テンプレートのエラー処理のソースを見る][client-route]

### 一致しないアドレスを処理する

**Try an unknown address** で、登録されていない `/unknown-example` が開きます。現在の [app-router.tsx][app-router] は、それをホームページにリダイレクトします。このフォールバックはアプリのテンプレートに属し、`defineAppRoutes()` は `path: '*'` を受け付けません。

![テンプレートは、不明なアドレスをサンプルのホームページにリダイレクトします](/assets/core/developing-apps/pages-routes-and-navigation/unknown.png)

[ソースを見る][app-router]

## ルートの設定リファレンス

### 設定のフィールドと既定値

| フィールド | ページ | 純粋なグループ |
| --- | --- | --- |
| `name` | 必須。パッケージ内で一意 | 必須。パッケージ内で一意 |
| `path` | 必須 | 任意。子の接頭辞 |
| `componentLoader` | 必須 | 使えない |
| `children` | 任意 | 必須。空でもよい |
| `navigation` | 任意。`{ title, icon?, order? }` | 必須 |
| `breadcrumb` | 任意。`{ title }` | 任意 |
| `auth` | 任意。ルートは既定で `required`、子孫は引き継ぐ | 任意。子孫に渡される |
| `authz` | 任意。最初のページでは明示的に宣言する | 使えない |
| `parent` | 任意。提供内容のルートだけ | 任意。提供内容のルートだけ |

名前は英字または数字で始まり、その後に英字、数字、ドット、アンダースコア、ハイフンを含められます。タイトルは文字列、アイコンはコンポーネントで、ユーザーごとの設定のコールバックではありません。`index`、`element`、`loader`、`action`、`errorElement` などの React Router のフィールドは、この宣言の API のフィールドではありません。

[ソースを見る][routes]

### パスのルールと衝突のチェック

- トップレベルのページのパスは `/` で始まります。子のパスは親に付け加えられます。`new` も `/new` も付け加えられ、後者がルートに飛ぶことはありません。重複したスラッシュと末尾のスラッシュは正規化されます。
- クエリーとハッシュは `path` に含めません。ワイルドカードの `*`、任意のパラメーターの `?`、バックスラッシュ、`.` や `..` のセグメントはサポートされません。
- ページのアドレスは、アプリとそのプラグイン全体で一意です。衝突の判定では、静的なセグメントの大文字小文字とパラメーター名は無視されます。`/Projects` は `/projects` と、`/:id` は `/:projectId` と衝突します。静的な `new` は `:projectId` と共存できます。
- 名前は、ファイル、グループ、階層をまたいでパッケージ内で一意である必要があります。別のパッケージは名前を再利用できますが、ページのアドレスは再利用できません。
- `/` を提供できるのはアプリだけです。`/login`、`/register`、`/forgot-password`、`/reset-password` には `auth: 'guest'` を使う必要があります。

無効な定義は、動作中のアプリには入りません。[routing-contract.test.ts][contract-tests] は、拒否されるケースを分離して再現します。

## サンプルのソースとセットアップ

### 環境と起動

[サンプルアプリ][app] は既定のテンプレート `1.0.0-beta.85` を使い、`@nocobase/app-client` を `4.0.0-beta.5` に固定しています。Node.js 24 と pnpm 11.7.0 が必要です。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 2700e75f5ed0d927c0c37b53e4ffdf105961cc52
cd apps/pages-routes-navigation
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

SQLite は、この例のデモと検証の環境です。別のデータベースサービスは不要で、ルーティングの要件でもありません。別のデバイスからアプリを開くには、[サンプルの README][readme] の説明に従って待ち受けのアドレスと `app.publicOrigin` を設定し、そのアドレスで `/main/` を開きます。ローカルの `config.yml` の `users.initialAdmin` で、初期のアカウントを定義します。

ホームページには、各デモへのリンクがあります。プロジェクトとタスクは公開の架空のフィクスチャーです。**New draft** はルーティングとフォームの状態を示すもので、業務レコードは保存しません。ユーザー、ロール、認証には、アプリの実際の SQLite のデータベースを使います。

![サンプルのホームページには、各ルーティングのデモへのリンクがあります](/assets/core/developing-apps/pages-routes-and-navigation/home.png)

### サンプルを検証する

サンプルのディレクトリで実行します。

```bash
pnpm typecheck
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/routing-contract.test.ts tests/client/routing-behavior.test.tsx tests/client/app-locale-coverage.test.ts tests/client/page-permission-titles.test.ts
pnpm build
```

クライアントの操作のテストは、制御した認可のレスポンスを使い、ネストした閉じる操作、クエリーの保持、既定のタブ、アクセスの拒否、下書きの確認を確認します。実際のアカウントでの確認の代わりにはなりません。[README][readme] には、ブラウザーでの検証、スクリーンショットの再現のコマンド、テストした環境が記録されています。

[app]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation
[readme]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/README.MD
[routes]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/routes.ts
[collection]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/routes.ts
[list]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/index.tsx
[detail]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/detail.tsx
[task]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/task.tsx
[workspace]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/workspace.tsx
[draft]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/new.tsx
[reports]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/reports/index.tsx
[permission-titles]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/settings/page-permission-titles.ts
[plugin]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/reporting-plugin.ts
[client-route]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/routing/client-route.tsx
[app-router]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/routing/app-router.tsx
[contract-tests]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/tests/client/routing-contract.test.ts
[overrides]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/route-overrides.ts
[runtime]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/runtime.ts
