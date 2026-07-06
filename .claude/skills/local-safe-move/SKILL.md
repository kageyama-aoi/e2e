---
name: local-safe-move
description: |
  e2e プロジェクト専用のファイル移動プロトコル。
  汎用の移動手順（/safe-move）に加え、CodeceptJS 固有の確認（codecept.conf.js・
  support/repoRoot.js）と /doc-sync によるドキュメント更新まで一括実施する。
  e2e プロジェクト内のファイル移動では汎用の /safe-move ではなく必ずこちらを使うこと。
  以下のような依頼があったら使用すること：
  - 「〇〇を △△ に移動して」
  - 「このファイルをフォルダに整理したい」
  - ファイル名変更・ディレクトリ再編・統合・削除を伴うリファクタリング

  ワークフロー: /safe-move の汎用手順 → e2e 固有の追加確認 → /doc-sync → テスト実行確認
---

# local-safe-move スキル — e2e ファイル移動プロトコル

AGENTS.md の「ファイル移動時のプロトコル（必須）」を確実に実行するスキル。
参照漏れ・パス壊れ・ドキュメント未更新を防ぐ。

**汎用の移動手順そのものは /safe-move スキルに定義されている。このファイルには
e2e（CodeceptJS）固有の差分だけを書く（手順の二重管理を防ぐため）。**

---

## ワークフロー

### Step 1: 汎用プロトコルの実施（/safe-move に従う）

`/safe-move` スキルの Step 1〜5 をそのまま実施する：

1. 移動内容の確認（移動元・移動先・理由。複数ファイルは全件リストアップ）
2. 移動前に旧パスへの参照数を grep で記録（`*.js` / `*.json` / `*.md`）
3. `git mv` で移動（`rm` + `add` 禁止）
4. 参照を修正し、旧パスへの grep がゼロになるまで確認
5. `.py` / `.ps1` のリポジトリルート取得パスの見直し

e2e での参照元は `--include="*.js" --include="*.json" --include="*.md"` を対象にすること
（codecept.conf.js と run/test_descriptions.json が JSON、ドキュメントが MD にあるため）。

---

### Step 2: e2e 固有の追加確認

移動したファイルの種類に応じて以下を確認する。

#### pages/ 内の Page Object を移動した場合

`codecept.conf.js` に登録パスがある場合は更新する：

```javascript
// Before
FooPage: './pages/tframe/screens/FooPage',

// After
FooPage: './pages/tframe/screens/subdir/FooPage',
```

確認コマンド：
```bash
grep "FooPage" codecept.conf.js
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

#### run/ の .ps1 を移動した場合（e2e の定型）

```powershell
# run/ps/ 直下の場合（変更不要）
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

# さらに深い階層に移動した場合は Split-Path を追加
```

---

### Step 3: ドキュメント更新 — /doc-sync を呼び出す

ファイル移動はほぼ必ずドキュメント更新を伴う。

```
/doc-sync
```

移動内容に応じて以下のカテゴリが該当する：

| 移動内容 | 該当カテゴリ |
|---|---|
| pages/ tests/ data/ 等の構成変更 | カテゴリ A（README.md + project_architecture_guide.md） |
| data/tframe/ 内のファイル移動・削除 | カテゴリ B（data/tframe/README.md） |
| tests/ 配下のテストファイル移動 | カテゴリ E（run/test_descriptions.json のキー修正） |
| 配置ルールの変更が生じた場合 | カテゴリ C（AGENTS.md のルール表） |

---

### Step 4: 動作確認

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
□ /safe-move の汎用手順（git mv・参照ゼロ確認・REPO_ROOT 見直し）を完了したか
□ codecept.conf.js の Page Object 登録パスを更新したか（該当する場合）
□ support/repoRoot.js の .. カウントを調整したか（該当する場合）
□ run/test_descriptions.json のキー（相対パス）を更新したか（テスト移動の場合）
□ /doc-sync を実行してドキュメントを更新したか
□ 影響範囲のテストが通ることを確認したか
```

---

## e2e 固有のよくあるミスと対処

汎用のミス（git mv 忘れ・require 直し忘れ・REPO_ROOT）は /safe-move の表を参照。

| ミス | 症状 | 対処 |
|---|---|---|
| codecept.conf.js を直し忘れた | `Injected page object not found` エラー | `grep ファイル名 codecept.conf.js` で確認して修正 |
| repoRoot.js の `..` カウントを直し忘れた | `Cannot find module '.../support/repoRoot'` | 移動先の深さに合わせて `..` を調整 |
| test_descriptions.json を直し忘れた | GUI の TestFile 欄で日本語説明が消える | キーを新しい相対パスに修正 |
| ドキュメント更新を忘れた | README や architecture_guide が古いまま | `/doc-sync` を実行 |
