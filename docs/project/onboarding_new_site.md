# 新サイト追加手順書

新しい対象サイト（例: `newsite`）向けに E2E テストを追加する際に、何をどこに作ればよいかをまとめる。
最終更新: 2026-07-06

対象読者: `shimamura` / `tframe` / `taskreport` 以外の新しいサイトを追加する担当者。

---

## 1. 最小構成で必要なもの

新サイトを追加する場合、最低限以下の4種類を用意する。

### 1-1. `env/.env.<site>.template`

- `support/envLoader.js` はサイト名をハードコードしていない。`PROFILE` 環境変数または `--profile <name>` 引数から
  プロファイル名を受け取り、`env/.env.<profile>` が存在すれば読み込むだけの汎用実装になっている
  （`support/envLoader.js` の `getProfileFromArgs` / `loadEnv` を参照）。
- そのため **コード変更なしで新サイトの `.env` が自動的に認識される**。プロファイル名は `<site>` 単独でも
  `<site>.<環境名>`（例: `shimamura.testgcp`）でもよい。
- `.template` サフィックスのファイルは実行時に読み込まれない（`envLoader.js` は `.env.<profile>` を直接探すため、
  `.env.<site>.template` は誰も参照しない）。`run/run_gui.py` の `find_all_profiles` も `.template` を除外している。
  実際に使うプロファイルは `.template` をコピーして `env/.env.<site>.<環境名>` として作成すること
  （例: `env/.env.shimamura.template` → `env/.env.shimamura.testgcp`）。
- テンプレートには最低限 `BASE_URL` と、サイト固有のログイン情報（ユーザー名・パスワード等）を記載する。
  `env/.env.shimamura.template` / `env/.env.tframe.template` を雛形にすること。

### 1-2. `pages/<site>/`

既存2サイトはどちらも以下の4分類のサブディレクトリを使っている（全部が必須ではなく、使うものだけ作る）。

| サブディレクトリ | 役割 | 参考実装 |
|---|---|---|
| `auth/` | ログイン画面の Page Object | `pages/shimamura/auth/LoginPage.js`, `pages/tframe/auth/LoginKannrisyaPage.js` |
| `screens/` | 画面単体の Page Object（1画面完結） | `pages/shimamura/screens/IchiranPage.js`, `pages/tframe/screens/KoshiPage.js` |
| `flow/` | 複数画面をまたぐ処理フローの Page Object | `pages/shimamura/flow/SyokaiFlowPage.js` |
| `_common/` | 複数の Page Object から共有される定義・ユーティリティ（メニュー定義・複数画面で使うクラス等） | `pages/shimamura/_common/sideMenus.js`, `pages/shimamura/_common/ClassMemberPage.js` |

Page Object は `const { I } = inject();` で `I` を取得し、メソッドは `I` を引数に取らない
（AGENTS.md「コーディング規約・命名」参照）。

### 1-3. `tests/<site>/`

- `tests/` 配下はテストシナリオ（`*_test.js`）専用。Page Object・データを直書きしない。
- サブフォルダの切り方はサイトの性質に合わせて決める（後述の「4. 参考実装の選び方」参照）。
- `codecept.conf.js` の `suites.<site>` に `files: './tests/<site>/**/*_test.js'` を追加すること（後述）。

### 1-4. `data/<site>/`

- テスト入力データ（CSV / パラメータJS）を置く。
- CSV 命名は `{baseName}.csv`（共通）または `{baseName}_{profile}.csv`（プロファイル別上書き。
  `loadCsvWithProfile` がプロファイル別ファイルの存在を優先する）。
- 対応表ドキュメントが必要な場合（tframe のように画面数が多い場合）は `data/<site>/README.md` を作り、
  ドキュメント連動ルール（AGENTS.md）に追記する。

---

## 2. 追記が必要な既存ファイル

新規ファイルを作るだけでなく、以下の**共有設定ファイル**への追記が必須。

### 2-1. `codecept.conf.js`

- **`suites`**（L103〜）に新サイトのテストグロブを追加する：
  ```js
  suites: {
    // ...既存...
    newsite: {
      files: './tests/newsite/**/*_test.js'
    }
  },
  ```
- **`include`**（L152〜）に新サイトの Page Object を追加する。命名は `{役割}Page{サイト名}` または
  `{役割}Page`（tframe は既存 Page が多いためサフィックスなし、shimamura は `〜Shimamura` サフィックス。
  新サイトはどちらの慣習でもよいが、同一サイト内では統一すること）：
  ```js
  include: {
    // ...既存...
    loginPageNewsite: './pages/newsite/auth/LoginPage.js',
  },
  ```
- `autoLogin` プラグイン（L204〜）は**現状 shimamura 専用**（`users.shimamuraUser` に固定配線されている）。
  新サイトで autoLogin を使いたい場合は `users` に新しいロールキーを追加すること
  （既存の `shimamura のUser` の配線は変更しない。詳細は Issue #180 の経緯を参照）。

### 2-2. `run/test_descriptions.json`

- 新サイトのキー（`tests/<site>/` のトップレベル名と一致させる）を追加し、各テストファイルの日本語説明を書く：
  ```json
  "newsite": {
    "page/foo_test.js": "〇〇画面の表示・操作を確認"
  }
  ```
- **これを忘れると `run/run_gui.py`（GUI）の TestFile 欄で日本語説明が表示されない。**
- プロファイルの表示順を固定したい場合は `_profile_order` にも追記する（shimamura の例を参照）。

### 2-3. `package.json`（任意）

- `test_s`（shimamura）/ `test_t`（tframe）/ `test_taskreport` のように、サイト単位で一発実行できる
  npm script は自動生成されない。必要であれば追加する：
  ```json
  "test_newsite": "npx codeceptjs run ./tests/newsite/**/*_test.js --profile newsite.<環境名>"
  ```
- `pretest_s`（`scripts/check_pause.js` で `tests/shimamura/` 配下の残存 `pause()` を検出）のような
  pre-test ガードスクリプトも、必要なら同様の仕組みを追加する（必須ではない）。

### 2-4. `AGENTS.md`

- 「ディレクトリ配置ルール」表・「利用可能なスキル一覧」は新サイト固有の配置ルールを追加した場合のみ更新。
- tframe 専用の「画面名 ↔ ファイル名 対照表」のような、サイト固有の対応表が必要になった場合は
  同様のセクションを追加する（必須ではなく、画面数が多く検索性が必要になった場合の任意対応）。

---

## 3. そのまま再利用できる共通機構

以下はサイト名に依存しない汎用実装のため、新サイト追加時にコード変更は不要。

| 機構 | 場所 | 役割 |
|---|---|---|
| `loadCsvWithProfile(baseName, dataDir)` | `support/utils.js` | プロファイル別CSVの自動切替読み込み |
| `withScenarioLabel(data, labelResolver)` | `support/utils.js` | データ駆動テストのシナリオ表示名付与 |
| `repoRoot` | `support/repoRoot.js` | リポジトリルート絶対パス（`__dirname` 手動カウント禁止の代替） |
| `support/envLoader.js` | 同上 | プロファイル自動解決・`.env` 読み込み（サイト名ハードコードなし） |
| `run/run_gui.py` | 同上 | `tests/` と `env/` を動的スキャンするため、新サイト追加時も無修正でGUIに表示される |
| `parseEnvBoolean(envKey)` | `support/utils.js` | 環境変数のbooleanパース |

サイト固有の定数（待機時間・URL・セレクタ）は `support/<site>/constants.js` に定数化する
（`support/shimamura/constants.js` / `support/tframe/constants.js` を参照。マジックナンバー直書き禁止）。

---

## 4. 参考実装の選び方

新サイトの画面構造に応じて、どちらのサイトを手本にするか決める。

| サイトの特徴 | 手本 | 理由 |
|---|---|---|
| 業務フロー（複数画面をまたいだ登録・処理）が中心 | **shimamura**（`pages/shimamura/flow/`） | `FlowPage` パターンが確立しており、複数画面の操作をひとつのオブジェクトに集約する設計が参考になる |
| 画面単体の登録・一覧確認が中心（CRUD的な画面が多数） | **tframe**（`pages/tframe/screens/`） | 画面ごとに独立した Page Object を作り、`createIchiranMixin` 等のファクトリで一覧検索の共通処理を横展開するパターンが参考になる |
| ダウンロードボタンでファイルを取得・検証するテストが多い | **shimamura**（`/shimamura-download-verify` スキル） | CSV・固定長ファイル双方のダウンロード検証パターンが確立済み |

判断に迷う場合は、対象画面の一覧を洗い出し「1画面完結の登録・検索」が多いか「複数画面をまたぐフロー」が
多いかで決めること。両方混在する場合は、shimamura のように `screens/` と `flow/` を併用してよい。

---

## 5. 手順書作成後の確認

新サイトの `pages/` にファイルを追加したら、必ず以下を実行してディレクトリツリーを最新化する。

```bash
npm run docs:update-readme-map
```

`README.md` のディレクトリツリーが自動更新される。`docs/project/project_architecture_guide.md` は
手動更新が必要なため、新サイトの構成をツリー図に追記する。
