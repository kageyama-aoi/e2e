---
name: local-safe-move
description: |
  e2e プロジェクト専用のファイル移動プロトコル。
  汎用の移動手順（git mv・参照修正）に加え、CodeceptJS 固有の確認（codecept.conf.js・
  support/repoRoot.js）と /doc-sync によるドキュメント更新まで一括実施する。
  以下のような依頼があったら使用すること：
  - 「〇〇を △△ に移動して」
  - 「このファイルをフォルダに整理したい」
  - ファイル名変更・ディレクトリ再編・統合・削除を伴うリファクタリング

  ワークフロー: 移動前grep確認 → git mv → 参照を修正してゼロ確認 → 特殊パス見直し → /doc-sync
---

# local-safe-move スキル — e2e ファイル移動プロトコル

AGENTS.md の「ファイル移動時のプロトコル（必須）」を確実に実行するスキル。
参照漏れ・パス壊れ・ドキュメント未更新を防ぐ。

---

## ワークフロー

### Step 1: 移動内容の確認

移動元・移動先・移動理由を確認する。

```
移動元: pages/tframe/FooPage.js
移動先: pages/tframe/subdir/FooPage.js
理由  : サブフォルダに整理
```

複数ファイルを一括移動する場合は全件リストアップしてから進める。

---

### Step 2: 移動前 — 旧パスへの参照数を確認

移動する前に必ず grep で参照数を把握する。

```bash
# JS の require 参照を確認（ファイル名から拡張子を除いて検索）
grep -r "FooPage" --include="*.js" . --include="*.json" -l

# パスを含む形で絞り込む場合
grep -r "pages/tframe/FooPage" --include="*.js" . -l
```

**参照ファイル数を記録しておく（修正後にゼロになったことを検証するため）。**

ドキュメント内の参照も確認する：
```bash
grep -r "FooPage" --include="*.md" .
```

---

### Step 3: ファイルを移動する

`git mv` を使うことで git の追跡が引き継がれる。

```bash
git mv pages/tframe/FooPage.js pages/tframe/subdir/FooPage.js
```

フォルダごと移動する場合：
```bash
git mv pages/tframe/olddir pages/tframe/newdir
```

**`rm` + `add` ではなく `git mv` を使うこと（履歴が rename として残る）。**

---

### Step 4: 旧パスへの参照を修正する

Step 2 で見つかったファイルの `require` パスを新パスに書き換える。

```javascript
// Before
const fooPage = require('../../pages/tframe/FooPage');

// After（移動先に合わせてパスを調整）
const fooPage = require('../../pages/tframe/subdir/FooPage');
```

修正後、旧パスへの参照がゼロになったことを確認する：

```bash
grep -r "pages/tframe/FooPage" --include="*.js" .
# → No matches found になるまで修正する
```

ドキュメント内の記述も同様に更新する。

---

### Step 5: 特殊ファイル別の追加確認

移動したファイルの種類に応じて以下を確認する。

#### run/ または scripts/ 内の .py を移動した場合

`REPO_ROOT` の取得パスがファイル位置からの相対計算になっているため、移動後に壊れる。

```python
# run/ 直下の場合（変更不要）
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# run/subdir/ に移動した場合（階層が増えた分 '..' を追加）
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
```

#### run/ または scripts/ 内の .ps1 を移動した場合

```powershell
# run/ps/ 直下の場合（変更不要）
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

# さらに深い階層に移動した場合は Split-Path を追加
$RepoRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
```

#### pages/ 内の Page Object を移動した場合

`codecept.conf.js` に登録パスがある場合は更新する：

```javascript
// Before
FooPage: './pages/tframe/FooPage',

// After
FooPage: './pages/tframe/subdir/FooPage',
```

確認コマンド：
```bash
grep -r "FooPage" codecept.conf.js
```

#### tests/ 内の .js から `support/repoRoot.js` を使っているファイルを移動した場合

`require('../../../support/repoRoot')` の `..` の数がファイルの深さに依存する。  
移動先の深さに合わせて `..` の数を調整する。

```javascript
// tests/tframe/page/ 配下（3階層）の場合
const repoRoot = require('../../../support/repoRoot');

// tests/tframe/page/sub/ 配下（4階層）に移動した場合
const repoRoot = require('../../../../support/repoRoot');
```

---

### Step 6: ドキュメント更新 — /doc-sync を呼び出す

ファイル移動はほぼ必ずドキュメント更新を伴う。

```
/doc-sync
```

移動内容に応じて以下のカテゴリが該当する：

| 移動内容 | 該当カテゴリ |
|---|---|
| pages/ tests/ data/ 等の構成変更 | カテゴリ A（README.md + project_architecture_guide.md） |
| data/tframe/ 内のファイル移動・削除 | カテゴリ B（data/tframe/README.md） |
| 配置ルールの変更が生じた場合 | カテゴリ C（AGENTS.md のルール表） |

---

### Step 7: 動作確認

移動後に影響範囲のテストを実行して壊れていないことを確認する。

```bash
# Page Object を移動した場合は、そのページを使うテストを実行
npx codeceptjs run ./tests/tframe/page/foo_test.js --profile tframe.culture_beta

# run/ のランチャーを移動した場合は起動確認
python run/subdir/foo_runner.py
```

---

## チェックリスト（完了確認）

```
□ git mv を使ったか（rm + add ではなく）
□ 旧パスへの参照が JS / JSON / MD 全ての grep でゼロになったか
□ .py / .ps1 のリポジトリルート取得パスを見直したか（該当する場合）
□ codecept.conf.js の Page Object 登録パスを更新したか（該当する場合）
□ support/repoRoot.js の .. カウントを調整したか（該当する場合）
□ /doc-sync を実行してドキュメントを更新したか
□ 影響範囲のテストが通ることを確認したか
```

---

## よくあるミスと対処

| ミス | 症状 | 対処 |
|---|---|---|
| `rm` + `add` で移動した | `git log --follow` で履歴が途切れる | 次回から `git mv` を使う（既に起きた場合は許容） |
| require パスを直し忘れた | `Cannot find module '...'` エラー | `grep -r "旧ファイル名"` で残りの参照を探して修正 |
| .py の REPO_ROOT を直し忘れた | ログが意図しない場所に保存される / ファイルが見つからない | `__file__` からの `..` の数を移動先の階層に合わせて修正 |
| codecept.conf.js を直し忘れた | `Injected page object not found` エラー | `grep ファイル名 codecept.conf.js` で確認して修正 |
| ドキュメント更新を忘れた | README や architecture_guide が古いまま | `/doc-sync` を実行 |
