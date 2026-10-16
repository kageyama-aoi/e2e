# docs/ の案内

テストを書く・読むときの資料置き場。久々に戻ったときは [`project/orientation.md`](project/orientation.md) から読む。
ファイル名と archive/ の決まりの正は `AGENTS.md`「docs/ のファイル名と archive/」（ここはその要約と中身の地図）。

## 何がどこにあるか

```
docs/
├── README.md              ← このファイル
├── project/               全体の設計・入口
│   ├── orientation.md            久々に戻ったときの入口
│   ├── project_architecture_guide.md  フォルダの役割と設計ルール
│   ├── onboarding_new_site.md    新しいサイトを足す手順
│   ├── test_catalog.md           全テストの一覧【自動生成】
│   ├── jsdoc_home.md             JSDoc のトップページの原稿
│   └── archive/
├── common/                製品をまたぐガイド
│   ├── codeceptjs_api_reference.md   CodeceptJS の関数と使用例
│   ├── codeceptjs_design_patterns.md 設計思想・用語集（データ駆動・エラー注入）
│   ├── allure_guide.md               Allure レポートの仕組みと操作
│   ├── vscode_debug_guide.md         VS Code でブレークポイントを置いて動かす
│   ├── claude_code_settings_guide.md Claude Code の settings.json の読み方
│   └── archive/
├── shimamura/             しまむら
│   ├── coding_guidelines.md        shimamura 固有の書き方
│   ├── syokai_flow_page_guide.md   SyokaiFlowPage.js の学習ガイド
│   ├── screen_navigation_diagram.md 画面遷移図（Mermaid）
│   ├── menu_coverage.md            メニュー × PO × テストの対応表【一部自動生成】
│   ├── screen_expansion_plan_2026-09.md 未開発画面の下地拡充 計画（#251）
│   ├── concepts/                   業務の概念・仕様（日本語の業務名）
│   ├── flow/                       テストの流れ解説（日本語の業務名）
│   └── archive/
├── tframe/                T-Frame
│   ├── architecture.md             構成とファイルのつながり
│   ├── glossary.md                 用語集
│   ├── menu_coverage.md            メニュー × PO × テストの対応表【一部自動生成】
│   ├── page_object_naming_plan_2026-09.md Page Object 命名の計画（#221）
│   └── archive/
├── digest/                Qiita ダイジェスト【claude.ai の定期実行が書く。手で編集しない】
└── generated/             JSDoc の HTML【npm run docs:jsdoc が作る。git 管理外】
```

## 置かないもの

| もの | 置き場 |
|---|---|
| 残作業・保留の理由・次の一手 | GitHub Issue（AGENTS.md「作業状況の置き場所」） |
| ログ・テスト結果などの生成物 | `output/` |
| 道具の使い方 | 道具の隣の README（`scripts/README.md`・`run/README.md`） |

## ファイル名

- ガイド・解説は英語の snake_case（`allure_guide.md`）
- 計画は `<話題>_plan_YYYY-MM.md`、冒頭に `状態: 進行中 / 完了 / 廃止` を書く
- shimamura の `concepts/` と `flow/` は日本語の業務名（`月謝一括作成の概念.md`・`月謝一括作成テストの流れ.md`）
- 自動生成のファイルは生成スクリプトが決めた名前のまま、手で直さない

## archive/

終わった計画・役目を終えた資料の置き場。各ファイルの冒頭に「状態: 完了 / 廃止」と後継の資料を書いてある。
当時のまま残す記録なので中のパスは直さない（`npm run docs:check-refs` も対象外）。

## 探し方

```bash
git grep -n "月謝一括" -- docs              # 言葉で探す（archive も含む）
git grep -n "月謝一括" -- docs ':!docs/**/archive/**'   # 今の資料だけ
grep -n "^状態:" docs/*/*_plan_*.md          # 計画の状態の一覧
```
