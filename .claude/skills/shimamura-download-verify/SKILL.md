---
name: shimamura-download-verify
description: |
  shimamura の画面でボタン押下によりファイルをダウンロードする E2E テストを新規作成・修正するスキル。
  以下のような依頼があったら使用すること：
  - shimamura の「出力」「ダウンロード」ボタンを押して CSV / 固定長ファイルを取得するテストを作りたい
  - ダウンロードしたファイルの中身（件数・構造）を E2E で検証したい
  - sideMenus.js に新しいメニュー定義を追加したい

  ワークフロー:
    sideMenus.js 追記 → IchiranPage.js にメソッド追記 → テストファイル作成 → 実行確認

  ※ 一覧検索テストは /shimamura-ichiran-dev を使うこと
  ※ 登録・処理フローは /shimamura-registration-dev を使うこと
---

# shimamura ダウンロード検証テスト開発スキル

shimamura の画面でボタン押下によりファイルをダウンロードし、
その内容を E2E で検証するテストを作成する際の標準手順。

---

## 重要な前提知識

### なぜ Promise.all が必須か

Playwright のダウンロードイベントは **クリック前にリスナーを登録しなければ取りこぼす**。
`click` の後で `waitForEvent('download')` を呼んでも間に合わない。

```javascript
// ❌ NG: クリック後に待機 → ダウンロードを取りこぼす
await page.click(clickTarget);
const download = await page.waitForEvent('download');

// ✅ OK: Promise.all で同時登録 → クリック前にリスナーが有効になる
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click(clickTarget)
]);
```

このパターンは `support/steps_file.js` の `downloadAndReadCsv()` カスタムステップに実装済み。
テストや Page Object から直接 `Promise.all` を書く必要はなく、このステップを呼べばよい。

### ファイル種別による検証方法の違い

ダウンロードされるファイルの種類によって検証方法が変わる。
**実際のファイルを一度ダウンロードして確認してから検証ロジックを書くこと。**

| ファイル種別 | 見分け方 | 読み方 | 検証アプローチ |
|---|---|---|---|
| 固定長（改行なし） | 改行が0個 & サイズが N の倍数 | `fs.readFileSync(path)` → Buffer | サイズ % N === 0、区分コードで構造確認 |
| 通常 CSV（カンマ区切り） | 改行あり、カンマ区切り | `readFileSync(path, 'utf-8')` or `cp932` | split('\n') で行数・列数確認 |

> **shimamura のファイルはほぼ Shift-JIS（cp932）**。utf-8 で読むと日本語ヘッダーが文字化けする。
> ただし行数カウントや固定長スライスはエンコードに依存しないため、Buffer 読みが安全。

---

## 前提知識：参照すべきファイル

| 目的 | 参照先 |
|---|---|
| ダウンロードカスタムステップ | `support/steps_file.js`（`downloadAndReadCsv`） |
| sideMenus.js の定義パターン | `pages/shimamura/_common/sideMenus.js` |
| ナビゲーション実装 | `pages/shimamura/screens/IchiranPage.js`（`_navigateViaMenu`） |
| サイドバー HTML | `scripts/html/shimamura/nav__leftcol.html` |
| 既存のダウンロードテスト雛形 | `tests/shimamura/page/validity_data_output_test.js` |
| GUIダウンロードパネル（ファイル種別判定） | `run/run_gui.py`（`_analyze_download_file`） |

---

## ワークフロー

### Step 0: 対象画面の URL とボタンセレクタを確認する

1. **URL を確認する**（`scripts/html/shimamura/` のリンク JSON or 実機で確認）
2. **ボタンのセレクタを確認する**（`/shimamura-html-fetch` スキルで HTML を取得）

   ボタンは `input[type="submit"]` や `input[type="button"]` が多いが、
   `value` 属性で指定する場合と `name` 属性で指定する場合がある。

   ```html
   <!-- value で指定するパターン -->
   <input type="button" value="有効性データ出力">
   → セレクタ: input[value="有効性データ出力"]

   <!-- name で指定するパターン（value に全角スペースが混入するケースがある） -->
   <input type="button" name="output_btn" value="　出力　">
   → セレクタ: input[name="output_btn"]
   ```

3. **ダウンロードされるファイルを実際にダウンロードして確認する**
   - 改行の有無、ファイルサイズ、エンコードを確認する
   - 固定長ファイルなら1レコードの長さを確認する（バイナリエディタや PowerShell で）

   ```powershell
   # ファイル確認（PowerShell）
   $bytes = [System.IO.File]::ReadAllBytes("path\to\file.csv")
   Write-Host "総バイト数: $($bytes.Length)"
   Write-Host "120で割った余り: $($bytes.Length % 120)"
   $enc = [System.Text.Encoding]::GetEncoding("shift_jis")
   Write-Host "先頭120バイト: $($enc.GetString($bytes, 0, 120))"
   Write-Host "末尾120バイト: $($enc.GetString($bytes, $bytes.Length - 120, 120))"
   ```

---

### Step 1: sideMenus.js に追記する

`pages/shimamura/_common/sideMenus.js` にメニュー定義を追加する。

#### 4 フィールドの使い分け

| フィールド | 役割 | 必須か |
|---|---|---|
| `directUrl` | 直接遷移 URL（SHIMAMURA_NAV 未設定時に使用） | 原則必須 |
| `moduleUrl` | サイドバーのモジュール TOP URL | sidebar モード時に必須 |
| `collapseToggle` | 折りたたみグループを開く定義（アコーディオンがある場合のみ） | 任意 |
| `shortcut` | サイドバーリンクのテキスト | sidebar モード時に必須 |

#### パターン A: 直接遷移のみ（サイドバーなし）

```javascript
screenName: {
  directUrl: '/index.php?module=X&action=Y',
},
```

#### パターン B: サイドバー（折りたたみなし）

```javascript
screenName: {
  directUrl: '/index.php?module=X&action=Y&top_menu=1',
  moduleUrl: '/index.php?module=X&action=index&top_menu=1',
  shortcut:  'リンクテキスト',
},
```

#### パターン C: サイドバー（折りたたみあり）← 今回の有効性データ出力はこれ

```javascript
screenName: {
  directUrl:      '/index.php?module=X&action=Y',
  moduleUrl:      '/index.php?module=X&action=index&top_menu=1',
  collapseToggle: { icon_id: 'submenu__xxx_sub', menuname: 'グループ名' },
  shortcut:       'リンクテキスト',
},
```

#### `icon_id` の探し方

`scripts/html/shimamura/nav__leftcol.html` を開いて、対象グループの TR 要素の `id` を確認する。

```html
<!-- nav__leftcol.html の例 -->
<tr id="submenu__validity_data_sub" style="display:none">
  <!-- このグループが折りたたまれている状態 -->
</tr>
```

→ `icon_id: 'submenu__validity_data_sub'`

`menuname` は同じグループを開く `span` のテキストをそのまま使う。

```html
<span onclick="toggleMenu('validity_data')">有効性データ</span>
```

→ `menuname: '有効性データ'`

---

### Step 2: IchiranPage.js にメソッドを追記する

`pages/shimamura/screens/IchiranPage.js` の末尾に追記する。

```javascript
// ----------------------------------------------------------------
//  {画面名} ({menu_key})
// ----------------------------------------------------------------

async navigateTo{ScreenName}Page() {
  I.say('【{画面名}】画面へ遷移');
  await this._navigateViaMenu(menus.{menu_key});
  // ↓ ダウンロードボタンが存在することを確認（セレクタは実際のHTMLから確認すること）
  I.waitForElement('input[value="{ボタンのvalue}"]', 10);
},

async download{ScreenName}File(savePath) {
  I.say('【{画面名}】出力ボタンをクリックしてファイルをダウンロード');
  return await I.downloadAndReadCsv('input[value="{ボタンのvalue}"]', savePath);
},
```

> **`downloadAndReadCsv` の戻り値について**
> このカスタムステップはファイルを `savePath` に保存しつつ、中身を utf-8 文字列として返す。
> 固定長ファイルの場合は utf-8 で読むと文字化けするが、**テスト側で `fs.readFileSync(savePath)` を
> Buffer として読み直せばよい**。`savePath` にファイルは確実に保存されている。

---

### Step 3: テストファイルを作成する

`tests/shimamura/page/{prefix}_test.js` を作成する。

#### パターン A: 通常 CSV（カンマ区切り・改行あり）

```javascript
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const repoRoot = require('../../../support/repoRoot');

const csvData = withScenarioLabel(
  loadCsvWithProfile('{prefix}_data', 'shimamura'),
  (row) => row.scenario
);

Feature('{画面名}');
Before(beforeShimamura);

Data(csvData).Scenario('{画面名}をCSV出力できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  const savePath = path.join(repoRoot, 'output', 'downloads', `{prefix}_${Date.now()}.csv`);

  await ichiranPageShimamura.navigateTo{ScreenName}Page();
  I.saveScreenshotWithTimestamp('{prefix}_before.png');

  await ichiranPageShimamura.download{ScreenName}File(savePath);
  I.saveScreenshotWithTimestamp('{prefix}_after.png');

  // Shift-JIS ファイルは cp932 で読む（utf-8 で読むと日本語が文字化けする）
  const buf = fs.readFileSync(savePath);
  const content = buf.toString('binary'); // 行数カウントのみなら binary で十分
  const lines = content.split('\n').filter(l => l.trim() !== '');

  assert.ok(lines.length > 1, 'ヘッダー行 + データ行が1行以上存在すること');
  I.say(`✅ CSV: ${lines.length} 行を確認`);
});
```

#### パターン B: 固定長ファイル（改行なし・N バイト/レコード）

```javascript
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadCsvWithProfile, withScenarioLabel } = require('../../../support/utils');
const { beforeShimamura } = require('../../../support/shimamura/hooks');
const repoRoot = require('../../../support/repoRoot');

const csvData = withScenarioLabel(
  loadCsvWithProfile('{prefix}_data', 'shimamura'),
  (row) => row.scenario
);

Feature('{画面名}');
Before(beforeShimamura);

Data(csvData).Scenario('{画面名}をファイル出力できる @dev', async ({ I, ichiranPageShimamura, current }) => {
  const savePath = path.join(repoRoot, 'output', 'downloads', `{prefix}_${Date.now()}.csv`);

  await ichiranPageShimamura.navigateTo{ScreenName}Page();
  I.saveScreenshotWithTimestamp('{prefix}_before.png');

  await ichiranPageShimamura.download{ScreenName}File(savePath);
  I.saveScreenshotWithTimestamp('{prefix}_after.png');

  // 固定長ファイル検証: 改行なし・{N}バイト/レコード
  // 区分コード: 1=ヘッダー  2=データ  8=トレーラー  9=エンドレコード
  const RECORD_LEN = {N}; // ← 実際のレコード長に変更すること
  const buf = fs.readFileSync(savePath);

  assert.strictEqual(buf.length % RECORD_LEN, 0, `ファイルサイズが${RECORD_LEN}の倍数であること`);
  const totalRecords = buf.length / RECORD_LEN;
  assert.ok(totalRecords >= 4, 'ヘッダー・データ・トレーラー・エンドの最低4レコードが存在すること');

  // 先頭バイトで区分を確認（ASCII 1文字）
  assert.strictEqual(String.fromCharCode(buf[0]), '1', '第1レコードがヘッダー区分（1）であること');
  assert.strictEqual(String.fromCharCode(buf[(totalRecords - 2) * RECORD_LEN]), '8', '末尾から2番目がトレーラー区分（8）であること');
  assert.strictEqual(String.fromCharCode(buf[(totalRecords - 1) * RECORD_LEN]), '9', '最終レコードがエンドレコード区分（9）であること');

  const dataCount = totalRecords - 3; // ヘッダー1 + トレーラー1 + エンド1 を除く
  assert.ok(dataCount > 0, 'データレコードが1件以上存在すること');

  // トレーラーのバイト1〜7（7桁）= データ件数と照合
  // ※ トレーラーのフィールド位置は仕様書で確認すること（下記は有効性データ出力の例）
  const trailerStart = (totalRecords - 2) * RECORD_LEN;
  const trailerCount = parseInt(buf.slice(trailerStart + 1, trailerStart + 8).toString('ascii').trim(), 10);
  assert.strictEqual(trailerCount, dataCount, `トレーラー件数(${trailerCount})とデータレコード数(${dataCount})が一致すること`);

  I.say(`✅ 固定長ファイル: ${totalRecords} レコード（データ ${dataCount} 件）を確認`);
});
```

> **区分コードが 1/2/8/9 でない場合は実物を確認すること**
>
> ```powershell
> $bytes = [System.IO.File]::ReadAllBytes("path\to\file")
> $enc = [System.Text.Encoding]::GetEncoding("shift_jis")
> # 先頭レコード
> Write-Host "先頭: $($enc.GetString($bytes, 0, 120))"
> # 末尾-1レコード（トレーラー候補）
> $n = $bytes.Length / 120
> Write-Host "末尾-1: $($enc.GetString($bytes, ($n - 2) * 120, 120))"
> # 末尾レコード（エンド候補）
> Write-Host "末尾: $($enc.GetString($bytes, ($n - 1) * 120, 120))"
> ```

---

### Step 4: テストデータ CSV を作成する

`data/shimamura/{prefix}_data.csv`

```csv
scenario
{画面名}_正常系
```

ダウンロード検証テストは通常、検索条件を絞り込まず全件出力するため、
シナリオ列だけの最小 CSV で十分。

---

### Step 5: test_descriptions.json に追加する

`run/test_descriptions.json` の `"shimamura"` セクションに追記する。

```json
"page/{prefix}_test.js": "{画面名}からファイルをダウンロードし、{検証内容}を検証",
```

---

### Step 6: テスト実行と確認

```bash
npx codeceptjs run ./tests/shimamura/page/{prefix}_test.js --profile shimamura.testgcp
```

実行後に `output/downloads/` にファイルが保存されること、
GUI ランチャーのダウンロードパネルに件数と形式が表示されることを確認する。

---

## GUIランチャーのダウンロードパネルについて

`run/run_gui.py` の `_analyze_download_file()` が自動でファイル種別を判定する。
新しいファイル種別を追加しても、以下の条件に当てはまれば自動対応される。

| 条件 | 表示 |
|---|---|
| 改行なし かつ サイズが 120 の倍数 | `N レコード / 固定長-120` |
| それ以外（通常テキスト） | `N 行 / Shift-JIS` または `UTF-8` |

固定長レコード長が 120 以外の場合は `_analyze_download_file()` に条件を追加すること。

```python
# run/run_gui.py の _analyze_download_file 内
if raw.count(b'\n') == 0 and size % 120 == 0:
    return size // 120, 'レコード', '固定長-120'
# ↓ 別のレコード長を追加する場合
if raw.count(b'\n') == 0 and size % {N} == 0:
    return size // {N}, 'レコード', f'固定長-{N}'
```

---

## トラブルシューティング

| エラー | 原因 | 対処 |
|---|---|---|
| ダウンロードが開始されない | ボタンセレクタが間違っている | HTML を確認して `input[value="..."]` or `input[name="..."]` を使い分ける |
| `download.saveAs` でタイムアウト | ダウンロードダイアログが出る / ネットワーク遅延 | `page.waitForEvent('download', { timeout: 30000 })` でタイムアウトを延長する |
| ファイルが保存されない | `savePath` の親ディレクトリが存在しない | `downloadAndReadCsv` は `mkdirSync` で自動生成するが、パスが正しいか確認する |
| 固定長ファイルで `buf.length % N !== 0` | 末尾に改行コード（`\r\n`）が付いている | サイズを確認。2 バイト差なら `buf.slice(0, buf.length - 2)` で除去できる |
| 区分コードが一致しない | 仕様書と実ファイルが異なる | PowerShell で実ファイルの先頭/末尾レコードを確認する（上記手順参照） |
| トレーラーの件数フィールド位置が違う | 仕様書のバイト位置を確認する | `buf.slice(trailerStart + {offset}, trailerStart + {offset+len})` で調整する |
| GUIパネルで「1 行」と表示される | 固定長ファイルが 120 の倍数でない or 改行が混入 | `_analyze_download_file` の判定条件を確認・修正する |
