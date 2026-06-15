---
name: doc-sync
description: |
  開発作業完了後のドキュメント連動更新を確認・実施するスキル。
  以下のような場面で使うこと：
  - 開発作業（テスト追加・ファイル移動・配置ルール変更など）を終えた後
  - 「ドキュメントの更新漏れがないか確認して」という依頼
  - 他のスキル（/tframe-ichiran-dev, /tframe-registration-dev 等）の仕上げとして呼び出す

  ワークフロー: 変更内容を確認 → 更新すべきドキュメントを特定 → 各ドキュメントを更新 → 完了確認
---

# doc-sync スキル — ドキュメント連動更新

開発作業後に AGENTS.md のドキュメント連動ルール表に基づいて、
更新漏れなくドキュメントをセットで更新するスキル。

---

## ドキュメント連動ルール（AGENTS.md より）

| 変更カテゴリ | 更新が必要なドキュメント |
|---|---|
| **A** ディレクトリ構成の変更（追加・削除・移動） | `README.md` / `docs/project/project_architecture_guide.md` |
| **B** `data/tframe/` のファイル追加・削除・移動 | `data/tframe/README.md` の対応表 |
| **C** 配置ルールの変更・新カテゴリの追加 | `AGENTS.md` のディレクトリ配置ルール表 |
| **D** 新スキルの追加 | `AGENTS.md` のスキル一覧 |
| **E** `tests/tframe/` に新テストファイルを追加 | `run/test_descriptions.json` |

---

## ワークフロー

### Step 1: 変更内容の把握

まず直近の変更を確認する。

```bash
git diff --stat HEAD
# または（まだコミットしていない場合）
git status
```

作業内容から変更カテゴリ（A〜E）を特定する。複数該当することもある。

---

### Step 2: 更新すべきドキュメントを特定・提示

該当するカテゴリとそれに対応する更新先をユーザーに提示する。

例：「一覧検索テストを新規追加した」場合
- カテゴリ **E** → `run/test_descriptions.json` の更新が必要
- カテゴリ **B** → `data/tframe/README.md` に CSV 対応表の行を追加が必要

---

### Step 3: 各ドキュメントを更新する

#### カテゴリ A: ディレクトリ構成の変更

**README.md（自動更新）**

```bash
npm run docs:update-readme-map
```

実行後に `README.md` の差分を確認する（ディレクトリツリーが最新化される）。

**docs/project/project_architecture_guide.md（手動更新）**

- ファイルを読み込み、変更に合わせて該当箇所を修正する
- 更新すべき可能性がある箇所：
  - `pages/tframe/` の構成例（ファイル追加・削除・移動の場合）
  - `tests/` の構成ツリー（新サブフォルダを作った場合）
  - ディレクトリ役割の表（新ディレクトリを追加した場合）
- ファイル先頭の `最終更新:` 日付も更新する

---

#### カテゴリ B: data/tframe/ のファイル変更

**data/tframe/README.md（手動更新）**

ファイルを読み込み、変更内容に応じて以下のいずれかを更新する：

| 変更内容 | 更新箇所 |
|---|---|
| 登録テスト CSV 追加 | 「登録テスト — CSV対応表」に行を追加 |
| 一覧検索テスト CSV 追加 | 「一覧検索テスト — CSV対応表」に行を追加 |
| SideMenu 系ファイルの変更 | 「メニュー定義 — SideMenu 対応表」を更新 |
| CSV ファイルの削除・移動 | 対応する行を削除または修正 |

各行のフォーマット：
```markdown
<!-- 登録テスト -->
| `tests/tframe/page/{module}_touroku_test.js` | `{module}_touroku_data.csv` | — | 実装済み |

<!-- 一覧検索テスト -->
| `tests/tframe/page/{module}_ichiran_test.js` | `{module}_ichiran_search_data.csv` | B: 空検索→結果あり確認 / C: {検索条件}で絞り込み→特定レコード確認 |
```

---

#### カテゴリ C: 配置ルールの変更

**AGENTS.md のディレクトリ配置ルール表（手動更新）**

`AGENTS.md` を読み込み、「各ディレクトリの『置いてよいもの／置いてはいけないもの』」の表を更新する。

新カテゴリを追加した場合は「新概念が生まれたときのフロー」のフローに沿って AGENTS.md にルールを追記する。

---

#### カテゴリ D: 新スキルの追加

**AGENTS.md のスキル一覧（手動更新）**

`AGENTS.md` を読み込み、「利用可能なスキル一覧」の表に追記する：

```markdown
| `/{skill-name}` | {スキルの用途を1行で} |
```

---

#### カテゴリ E: tests/tframe/ への新テスト追加

**run/test_descriptions.json（手動更新）**

`run/test_descriptions.json` を読み込み、`"tframe"` セクションに追記する：

```json
"page/{module}_ichiran_test.js":  "{画面名}一覧の空検索と条件絞り込み検索を確認",
"page/{module}_touroku_test.js":  "{画面名}の新規登録フォームへの入力・保存を確認",
```

登録とフォーマット：
- キーは `"page/"` または `"check/"` 等のサブフォルダから始める相対パス
- 値は何をテストしているかを20字以内で
- **これを忘れると GUI（run_gui.py）の TestFile 欄で日本語説明が表示されない**

---

### Step 4: 完了チェックリスト

更新が終わったら以下を確認する：

```
□ 変更カテゴリを全て特定したか
□ 各カテゴリのドキュメントを更新したか
□ README.md の自動更新（npm run docs:update-readme-map）を実行したか（カテゴリAの場合）
□ project_architecture_guide.md の最終更新日を変えたか（カテゴリAの場合）
□ 更新したドキュメントをコミットに含めたか
```

ドキュメントのコミットは開発変更と同じコミットに含める（別コミットにしない）。

---

## 呼び出しタイミングの目安

| タスク | 該当カテゴリ |
|---|---|
| `/tframe-registration-dev` でテスト追加 | B, E |
| `/tframe-ichiran-dev` でテスト追加 | B, E |
| `/local-safe-move` でファイル移動 | A（変更量による） |
| 新しいスキルを作成した | D |
| `pages/` や `tests/` に新ディレクトリを追加した | A, C |
| `data/tframe/` のファイルを整理した | B |
