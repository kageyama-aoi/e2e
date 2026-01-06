# E2Eテスト

## 1. メンテナンス対象のファイル

このプロジェクトでメンテナンスの主な対象となるのは、以下のファイルです。

*   `tests/shimamura/` 配下のテストスクリプトおよび**CSVデータファイル**
*   `tests/tframe/` 配下のテストスクリプト
*   `pages/` 配下のページオブジェクトファイル
*   `codecept.conf.js` （CodeceptJSの設定ファイル）
*   `.env.*` （環境設定ファイル）
*   `package.json` （特に`scripts`セクション）

## 2. プログラムの実行方法

### 初回登録テスト（しまむら環境）の実行

#### 方法A: バッチファイルで実行（推奨・最も簡単）

プロジェクトルートにある `run_syokai_shimamura.bat` をダブルクリックして実行します。
コンソールが表示されたら、実行したいプロファイル名を入力してください。

例:
- `shimamura.testgcp`
- `shimamura.traininggcp`
- `shimamura.testgcp2`

#### 方法B: npmコマンドで実行

```bash
# プロファイルを指定して実行
npm run test:shimamura:syokai -- --profile shimamura.testgcp
```

### その他のテスト実行

**しまむら (`shimamura`) の全テスト:**
```bash
npm run test_s
```

**t-frame (`tframe`) の全テスト:**
```bash
npm run test_t
```

## 3. 環境設定とテストデータ

本プロジェクトでは、実行時の `--profile` オプションによって接続先環境とテストデータを自動的に切り替える仕組みを導入しています。

### 環境設定ファイル (.env)
ルートディレクトリにある `.env.[profile]` ファイルが読み込まれます。
新しい環境を追加する場合は、既存のファイルをコピーして作成してください。

*   `.env.shimamura.testgcp`
*   `.env.shimamura.traininggcp`
*   `.env.shimamura.testgcp2`
*   （テンプレート: `.env.shimamura.template`）

設定項目:
- `BASE_URL`: 接続先URL
- `SHIMAMURA_USER`: ログインユーザー名
- `SHIMAMURA_PASSWORD`: ログインパスワード
- `SHIMAMURA_TANTOUSYA`: 担当者番号

### テストデータファイル (CSV)
`tests/shimamura/` 配下の CSV ファイルが読み込まれます。
ファイル名はプロファイル名と一致させる必要があります。

*   規則: `syokai_touroku_data_[profile].csv`
*   例: `syokai_touroku_data_shimamura.testgcp.csv`

もし該当するプロファイル用のCSVが存在しない場合、デフォルトの `syokai_touroku_data.csv` が読み込まれます。

**CSVフォーマット:**
```csv
lastName,className,keiyakuDate,kaishiDate,taikaiYear,taikaiMonth
退会_TestGCP,ドラム-水-19:00-テスト太郎,2026-02-01,2026-02-02,2026,03
```
このCSVに行を追加することで、一度の実行で複数のデータパターンを連続してテストできます（データ駆動テスト）。

## 4. ファイル構成（抜粋）

```
C:\Users\kageyama\Tools\testcode\e2e\
├───.env.shimamura.template      # 環境設定テンプレート
├───.env.shimamura.testgcp       # 環境設定（testgcp用）
├───.env.shimamura.traininggcp   # 環境設定（traininggcp用）
├───run_syokai_shimamura.bat     # 実行用バッチファイル
├───codecept.conf.js
├───package.json
├───doc\
│   └───README.md                # 本ファイル
└───tests\
    ├───shimamura\
    │   ├───syokai_touroku.js    # テストスクリプト本体
    │   ├───syokai_touroku_data.csv # デフォルトデータ
    │   ├───syokai_touroku_data_shimamura.testgcp.csv
    │   └───...
    └───...
```

## 5. 最近の改善点 (2026/01/06)

*   **環境切り替えの自動化**: コードを修正することなく、設定ファイルとプロファイル指定だけで接続先やログイン情報を切り替えられるようにしました。
*   **データ駆動テスト**: テストデータをCSVに分離し、複数件の連続実行を可能にしました。
*   **実行の簡易化**: バッチファイルを作成し、コマンド入力の手間を省きました。
