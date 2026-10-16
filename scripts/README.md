# scripts/ — 開発・保守の補助ツール

テストの実行には使わない、開発・保守のときに動かす道具の置き場です。
テストの実行で使う道具は `run/`、Claude Code のフックは `.claude/hooks/` にあります（置き場所のルールは AGENTS.md「run/ と scripts/ の配置ルール」）。

**コマンドはすべてリポジトリの直下（e2e/）で実行します。**

## 名前の付け方

`<動詞>_<製品>_<対象>`。製品に関係ない道具は `<動詞>_<対象>`。

| 動詞 | 意味 | 例 |
|---|---|---|
| `fetch` | 実機にログインして画面の HTML を取ってくる | `fetch_shimamura_screens.js` |
| `extract` | 手元の HTML から必要な部分を抜き出す | `extract_tframe_form_fields.js` |
| `gen` | ドキュメントや表を作り直す（generate の略） | `gen_test_catalog.py` |
| `check` | ずれ・間違いを点検する | `check_doc_refs.py` |
| `cleanup` | テスト環境のデータを片付ける | `cleanup_shimamura_gessya_fees.js` |
| `debug` | デバッガで中を追うための練習台 | `debug_shimamura_syokai.js` |
| `install` | 環境の準備をする | `install_git_hooks.js` |

動詞が付いていないものは、ほかの道具から読み込まれる部品（`html/shimamura_route.js`）か、決まった形の設定・プラグイン（`docs/jsdoc_*.js`）です。

## ツール一覧

### docs/ — ドキュメントの生成と点検（pre-commit・CI からも呼ばれる）

| ツール | やること | 動かし方 |
|---|---|---|
| `gen_readme_tree.py` | README の「ディレクトリ構成」を作り直す | `npm run docs:update-readme-map` |
| `gen_test_catalog.py` | テスト一覧 `docs/project/test_catalog.md` を作り直す | `npm run docs:catalog` |
| `gen_tframe_menu_coverage.js` | tframe のアイコン別マッピング表を作り直す | `npm run docs:menu-coverage` |
| `gen_shimamura_menu_coverage.js` | shimamura のアイコン別マッピング表を作り直す | `npm run docs:menu-coverage:shimamura` |
| `gen_decision_tables.js` | デシジョンテーブルの定義から仕様書の表を作る | `npm run docs:decision-tables` |
| `check_doc_refs.py` | docs・スキルに書いたパスや関数名が実在するか点検する（除外は `check_doc_refs.ignore`） | `npm run docs:check-refs` |
| `jsdoc_auto_module.js` | JSDoc のプラグイン。ファイルパスから `@module` を付ける | `npm run docs:jsdoc` が読み込む |
| `jsdoc_widen_nav.js` | JSDoc の左ナビの幅を広げる後処理 | `npm run docs:jsdoc` の後に自動 |

### html/ — 画面 HTML の取得と抜き出し（スキルの下調べ用）

置き場（snapshots/・inputs/）と画面の探し方は [html/README.md](./html/README.md)。

使い捨ての調査スクリプトは `scripts/` に置かず、git に入らない `output/probe/_tmp_<名前>/` に作る（出力も同じフォルダへ）。

| ツール | やること | 動かし方 |
|---|---|---|
| `fetch_shimamura_screens.js` | shimamura の画面 HTML をまとめて取る（対象は中の TARGETS） | `node scripts/html/fetch_shimamura_screens.js shimamura.testgcp` |
| `fetch_shimamura_menus.js` | 上部アイコン × サイドバーを全件採取し menuSnapshot JSON を更新する | `node scripts/html/fetch_shimamura_menus.js [profile]` |
| `fetch_shimamura_nav.js` | ナビ（サイドバー・上部アイコン）の HTML を取る | `node scripts/html/fetch_shimamura_nav.js <profile>` |
| `fetch_shimamura_teacher_edit.js` | 講師編集画面（各タブ）の HTML を取る | `node scripts/html/fetch_shimamura_teacher_edit.js <profile>` |
| `fetch_tframe_forms.js` | tframe の登録画面 HTML をまとめて取る | `node scripts/html/fetch_tframe_forms.js tframe.culture_beta` |
| `fetch_tframe_chosekin_person_id.js` | chosekin 登録の personId ポップアップから講師 ID を取る | `node scripts/html/fetch_tframe_chosekin_person_id.js <profile>` |
| `extract_tframe_form_fields.js` | 登録画面の HTML からテストデータの雛形と PO の fill メソッドを作る | `node scripts/html/extract_tframe_form_fields.js [file.html]` |
| `extract_shimamura_submenus.py` | `<tr id="submenu__...">` を抜き出す | 下の「抜き出しツールの詳細」 |
| `extract_tframe_side_menu_groups.py` | サイドメニューのグループと子項目を抜き出す | 同上 |
| `extract_shimamura_body_only_fields.py` | `<td id="body_only_td">` のフォーム要素を抜き出す | 同上 |
| `shimamura_route.js` | URL を「画面を区別する route 文字列」にする部品 | `fetch_shimamura_menus.js` と `gen_shimamura_menu_coverage.js` が読み込む |

置き場:
- `html/snapshots/tframe/`：取ってきた tframe の画面 HTML（参考資料・git 管理）
- `html/inputs/`：人が手で貼る入力（`tframe_form.html`・`tframe_side_menu.html` など）
- git に入らないもの（shimamura の取ってきた HTML・スクリーンショット・抜き出し結果）は `output/html/`・`output/probe/`

### その他

| ツール | やること | 動かし方 |
|---|---|---|
| `setup/install_git_hooks.js` | git フックの置き場を `.githooks/` に向ける | `npm install` の後に自動（postinstall） |
| `testdata/cleanup_shimamura_gessya_fees.js` | 月謝一括作成テストで作った料金・入出金を画面操作で消す（testgcp） | `node scripts/testdata/cleanup_shimamura_gessya_fees.js [名前]` |
| `debug/debug_shimamura_syokai.js` | `syokai_helpers.js` を VS Code のデバッガで1行ずつ追う | VS Code「実行とデバッグ」→「Debug: syokai_helpers 単体」 |

## 抜き出しツールの詳細（extract_shimamura_*.py）

3 本とも Python 標準ライブラリだけで動きます。文字コードは `utf-8` を優先して自動判定し、だめなら `cp932` を試します（UTF-8 でないときは標準エラーに注意を出します）。

### サブメニュー抽出 — `extract_shimamura_submenus.py`

HTML から `tr id="submenu__..."` のブロックを抜き出し、JSON / CSV で出します。

```bash
python scripts/html/extract_shimamura_submenus.py            # 対話式で出力形式を選ぶ
python scripts/html/extract_shimamura_submenus.py page.html  # 入力を指定
```

- 出力形式: `1` JSON / `2` CSV / `3` CSV（フラット）
- 入力（既定）: `scripts/html/inputs/shimamura_page.html`（画面の HTML を貼る）
- 出力: `output/probe/submenu_extract/`（`submenu_extract.json` / `.csv` / `_flat.csv`）

### サイドメニューグループ抽出 — `extract_tframe_side_menu_groups.py`

サイドメニューの HTML から「グループ名」と「配下のメニュー項目」を JSON / CSV で出します。
ファイル名は、抜き出した先頭の日本語とタイムスタンプから自動で付きます。

```bash
python scripts/html/extract_tframe_side_menu_groups.py                                  # 入力は html/inputs/tframe_side_menu.html
python scripts/html/extract_tframe_side_menu_groups.py "./scripts/html/inputs/tframe_side_menu.html" --jp-only  # 日本語だけの軽い JSON
python scripts/html/extract_tframe_side_menu_groups.py "./scripts/html/inputs/tframe_side_menu.html" --format csv
```

- JSON: `group_count`（グループ数）、`groups[].name`（グループ名。例 `Eメール`）、`groups[].items[]`（子メニュー）
- `--jp-only`: ID や href を省き、グループ名と子メニュー名だけにする
- 出力: `output/probe/side_menu_extract/<先頭の日本語>/<先頭の日本語>_<timestamp>_side_menu_groups{.json,_ja.json,.csv}`

### 画面フォーム要素抽出 — `extract_shimamura_body_only_fields.py`

HTML の `<td id="body_only_td">` 内のフォーム要素（`input` / `select` / `textarea` / `button`）を JSON / CSV で出します。`select` の `option` は `select` の中に入れて出します。

```bash
python scripts/html/extract_shimamura_body_only_fields.py            # 対話式で出力形式を選ぶ
```

- 出力形式: `1` JSON / `2` CSV / `3` CSV（フラット）
- 入力（既定）: `scripts/html/inputs/shimamura_page.html`（サブメニュー抽出と共用）
- 出力: `output/probe/body_only_extract/`（`body_only_fields.json` / `.csv` / `_flat.csv`）
