# Allure レポート ガイド

最終更新: 2026-05-08

---

## 1. Allure とは

Allure は **テスト結果を HTML レポートとして可視化するフレームワーク**です。

テストを実行すると「生データ（JSON + スクリーンショット）」が出力されます。
それを `allure serve` コマンドが処理してブラウザで見られる HTML レポートに変換します。

```
テスト実行
  ↓
allure-results/ に JSON + 添付ファイルが溜まる（生データ）
  ↓
allure serve <dir> でブラウザレポートを生成・表示
```

---

## 2. allure-results/ のデータはいつ生成されるか

`allure-results/` 配下のファイルは **CodeceptJS でテストを実行したとき**に生成されます。
`allure-codeceptjs` プラグインが有効になっているため、実行中にリアルタイムで書き込まれます。

### ファイル種別ごとの生成タイミング

| ファイル | 生成タイミング | 内容 |
|---|---|---|
| `environment.properties` | テスト開始直前（`bootstrap()`） | Profile / BaseURL / Browser など |
| `xxxxxxxx-xxxx.json` | 各テストケースが完了するたびに1ファイル | テスト名・ステップ・成否・実行時間 |
| `xxxxxxxx-attachment.png` | `saveScreenshot` / `saveScreenshotWithTimestamp` が呼ばれた瞬間 | スクリーンショット |

```
npx codeceptjs run ./tests/... --profile tframe.culture_beta
  ↓ テスト開始
  ↓ bootstrap() が走る → environment.properties を書き出す
  ↓ 各テストステップが進むたびに JSON が追記される
  ↓ スクリーンショットが撮られるたびに PNG が保存される
  ↓ テスト終了
allure-results/tframe.culture_beta/20260508_144900_login_test/ が完成
```

---

## 3. このプロジェクトの Allure 構成

### 3-1. 生データの保存先

#### 標準の Allure との違い

**標準の Allure** は `allure-results/` フラットに保存し、実行のたびに**上書き**します。

```
# 標準（上書き）
allure-results/
  xxxxxxxx.json   ← 毎回上書き
  yyyyyyyy.json
```

**このプロジェクト（カスタム）** は `codecept.conf.js` で `outputDir` を毎回変えることで、
**プロファイル × タイムスタンプ** の2階層に実行履歴が積み上がります。

```
allure-results/
├── tframe.culture_beta/
│   ├── 20260508_144900_login_test/    ← 実行のたびに新しいフォルダが増える
│   └── 20260507_165600_koshi_test/
├── tframe.juku_test/
│   └── 20260423_132700_all/
└── archive/
    └── tframe.culture_beta/
        └── 20260401_100000_login_test.zip  ← 古い結果を zip 圧縮して保管
```

**なぜこの構造にしているか:**
- プロファイル（環境）ごとに結果が混在しない
- 実行するたびに上書きされず、過去の結果も残る
- `Open Allure` ボタンが「最新の実行結果」を自動で選べる

この保存先は `codecept.conf.js` の以下の行で決まります：

```javascript
const runProfile    = sanitizePathSegment(process.env.PROFILE || 'default');
const runTimestamp  = buildRunTimestamp();          // 20260508_144900
const runTarget     = detectRunTargetFromArgs(...); // login_test
const runDirName    = `${runTimestamp}_${runTarget}`;

const runtimeAllureResultsDir = `./allure-results/${runProfile}/${runDirName}`;

// プラグインにこのパスを渡す（毎回違うパスにするのがポイント）
plugins: {
  allure: {
    outputDir: runtimeAllureResultsDir,
  }
}
```

---

### 3-2. Environment（環境情報）の自動記録

Allure レポートの **"Environment" タブ** に実行環境が表示されます。

```
Profile    = tframe.culture_beta
BaseURL    = https://newculture.e-school.jp/beta/
Browser    = chromium
Viewport   = 1600x1200
```

#### 標準の Allure との違い

| | 標準 Allure | このプロジェクト |
|---|---|---|
| `environment.properties` を Environment タブに表示する機能 | **公式仕様**（ファイルがあれば自動で読む） | 同じ |
| ファイルの書き出し | 自分で用意する必要あり（自動では書かない） | `bootstrap()` で自動生成（カスタム） |

つまり **「ファイル名と表示の仕組みは Allure の標準仕様」**、
**「テスト実行時に自動で書き出すコードはこのプロジェクトのカスタム」** です。

`codecept.conf.js` の `bootstrap` 関数がテスト開始直前に自動で実行されます：

```javascript
bootstrap: function() {
  const envData = `Profile=${process.env.PROFILE}
BaseURL=${process.env.BASE_URL}
Browser=${process.env.BROWSER}
Viewport=${windowSize}
`;
  fs.writeFileSync(
    path.join(allureResultsDir, 'environment.properties'),
    envData
  );
}
```

---

### 3-3. Open Allure ボタン（GUI）

`run/run_gui.py` の **「Open Allure」ボタン** を押すと：

1. 選択中の Profile を取得（例: `tframe.culture_beta`）
2. `allure-results/<profile>/` が存在するか確認
3. `node scripts/allure/serve_latest.js <profile>` を実行

```python
# run/run_gui.py: _on_open_allure
cmd = ['node', 'scripts/allure/serve_latest.js', profile]
threading.Thread(target=self._run_allure_process, args=(cmd,)).start()
```

---

### 3-4. serve_latest.js（最新結果の自動選択）

`scripts/allure/serve_latest.js` は **「最後に変更されたフォルダ」を自動で探して**
`npx allure serve <dir>` を実行するスクリプトです。

標準の `allure serve` はフルパスを指定する必要がありますが、
このスクリプトがプロファイル内の最新フォルダを自動で選んでくれます。

```javascript
function getLatestDir(baseDir) {
  return fs.readdirSync(baseDir)
    .filter(e => e.isDirectory())
    .sort((a, b) => b.mtime - a.mtime)  // ← 最終更新日時の降順
    [0];
}

// 例: allure-results/tframe.culture_beta/ の中で一番新しいフォルダを選ぶ
const latest = getLatestDir(path.join(root, profileArg));
spawn('npx', ['allure', 'serve', latest], ...);
```

手動でも使えます：
```bash
# プロファイル指定
node scripts/allure/serve_latest.js tframe.culture_beta

# 全プロファイル中の最新を自動選択
node scripts/allure/serve_latest.js
# または
npm run allure:latest
```

---

### 3-5. 自動アーカイブ（フック連携）

テストを実行するたびに古い結果が溜まっていくため、
**Claude Code のフック** と **archive スクリプト** で自動整理しています。

#### フロー

```
Claude Code が Bash ツールで codeceptjs run を実行
  ↓
PostToolUse フックが起動 (scripts/hooks/archive_allure.py)
  ↓
コマンド文字列に "codeceptjs run" が含まれているかチェック
  ↓
含まれていれば npm run allure:archive を自動実行
  ↓
30日以上古い allure-results を zip 圧縮して allure-results/archive/ へ移動
```

#### フック本体 (`scripts/hooks/archive_allure.py`)

```python
# Claude Code の PostToolUse(Bash) イベントで自動実行
# stdin で tool_input.command を受け取る

TEST_PATTERNS = [r'codeceptjs\s+run', r'npx\s+codeceptjs', ...]

def is_test_command(command):
    return any(re.search(p, command) for p in TEST_PATTERNS)

# → テストコマンドを検知したら npm run allure:archive を呼ぶ
```

#### アーカイブ本体 (`scripts/allure/archive_allure_results.py`)

```python
# allure-results/<profile>/<timestamp_rundir>/ を走査
# 30日以上古いものを zip → archive/ に保存 → 元ディレクトリを削除

python scripts/allure/archive_allure_results.py           # 30日以上古い
python scripts/allure/archive_allure_results.py --days 7  # 7日以上古い
python scripts/allure/archive_allure_results.py --dry-run # 確認だけ
```

---

## 4. npm scripts 一覧

| コマンド | 動作 |
|---|---|
| `npm run allure:latest` | 最新の実行結果をブラウザで開く（serve_latest.js） |
| `npm run allure:serve` | `allure-results/` を全部まとめてサーブ（生データが混在する） |
| `npm run allure:report` | `allure-report/` に静的HTMLを生成（ファイルとして保存） |
| `npm run allure:open` | 生成済みの `allure-report/` をブラウザで開く |
| `npm run allure:archive` | 30日以上古い結果を zip アーカイブして削除 |
| `npm run allure:clean` | 実行結果を全消去（クリーンアップ） |

---

## 5. よくある操作

### テスト後にレポートを見たい

1. `run/run_gui.bat` を起動
2. Profile を選択
3. **「Open Allure」ボタン**を押す → ブラウザが開く

または CLI で：
```bash
npm run allure:latest
```

### 特定プロファイルの最新結果を見たい

```bash
node scripts/allure/serve_latest.js tframe.culture_beta
```

### 古い結果を手動で片付けたい

```bash
npm run allure:archive        # 30日以上古いものを zip 化して削除
npm run allure:clean          # 全削除（スッキリさせたいとき）
```

---

## 6. 仕組みの全体図

```
codecept.conf.js
  ├── runtimeAllureResultsDir  → 保存先を決める（プロファイル×タイムスタンプ）★カスタム
  ├── bootstrap()              → environment.properties を書く ★カスタム（読む側は Allure 標準）
  └── plugins.allure           → allure-codeceptjs プラグインを有効化

テスト実行中（リアルタイムで書き込まれる）
  └── allure-results/<profile>/<timestamp_target>/
        ├── environment.properties  ← bootstrap() で書き出し（テスト開始直前）
        ├── xxxxxxxx.json           ← 各テストケース完了時に1ファイル
        └── xxxxxxxx-attachment.png ← saveScreenshot が呼ばれた瞬間

Open Allure ボタン（GUI）
  └── scripts/allure/serve_latest.js <profile>  ★カスタム
        └── npx allure serve <最新ディレクトリ>
              └── ブラウザで HTML レポートを表示

Claude Code フック（自動）★カスタム
  └── scripts/hooks/archive_allure.py
        └── npm run allure:archive
              └── scripts/allure/archive_allure_results.py
                    └── 古い結果を allure-results/archive/ に zip 圧縮
```

---

## 7. 標準 vs カスタム まとめ

| 機能 | 標準 / カスタム | 補足 |
|---|---|---|
| JSON・PNG を allure-results/ に書き出す | **標準**（allure-codeceptjs プラグイン） | プラグインを有効にするだけで動く |
| `environment.properties` を Environment タブに表示 | **標準**（Allure の公式仕様） | ファイルを置くだけで自動で読む |
| `environment.properties` をテスト前に自動生成 | **カスタム**（`bootstrap()` に自作コード） | 標準では自分で用意する必要がある |
| 保存先をプロファイル×タイムスタンプの2階層にする | **カスタム**（`outputDir` を毎回変える） | 標準は `allure-results/` フラットで上書き |
| 最新フォルダを自動選択してサーブ（serve_latest.js） | **カスタム** | 標準はフルパスの手動指定が必要 |
| テスト後に自動アーカイブ（フック連携） | **カスタム** | 標準は手動で整理する |
| GUI の「Open Allure」ボタン | **カスタム** | 標準は CLI コマンドのみ |
