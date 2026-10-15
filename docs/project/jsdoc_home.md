# e2e コードリファレンス（JSDoc）

`npm run docs:jsdoc` で生成される HTML のトップページです（原稿は `docs/project/jsdoc_home.md`）。

## 見方

- **探したい名前が分かっている** → 左上の検索ボックスに入力（例 `navigateToKouhosei`、`Syokai`）。
- **ファイル単位でたどる** → 左ナビの「Modules」。名前はファイルパスそのまま（例 `pages/shimamura/flow/SyokaiFlowPage` ＝ `pages/shimamura/flow/SyokaiFlowPage.js`）。
- 各メソッドの「Source」リンクからソースの該当行へ飛べます。

## どこから見るか

| 知りたいこと | 見る場所 |
|---|---|
| テストが何を確かめているか | `tests/<product>/flow/`（流れ）・`tests/<product>/page/`（画面単位） |
| 業務の流れの順番 | `pages/<product>/flow/`（FlowPage は部品を並べるだけ） |
| 流れの部品（候補生の昇格、経理ビューなど） | `pages/<product>/_common/` |
| 1画面の操作・セレクタ | `pages/<product>/screens/` |
| 共通ヘルパー（日付、待ち、スクショ） | `support/`・`support/<product>/` |

`<product>` は `shimamura` / `tframe` / `taskreport` です。

## 補足

- 生成物（`docs/generated/html/`）は git 管理外です。見るたびに `npm run docs:jsdoc` で作り直してください（古いページは毎回消えます）。
- `module.exports = { ... }` 形式のファイルにも、生成時にファイルパスから `@module` を自動で付けています（`scripts/docs/jsdoc_auto_module.js`）。ソースに `@module` を手で書く必要はありません。
- テストの一覧と目的は [`docs/project/test_catalog.md`](test_catalog.md)、全体像は [`docs/project/orientation.md`](orientation.md) のほうが早いです。
