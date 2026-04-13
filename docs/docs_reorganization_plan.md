# docs/ 整理案

作成日: 2026-04-13

---

## 現状の問題点

| 問題 | 該当ファイル |
|------|------------|
| 内容がほぼ同じで重複 | `technical_overview.md`（21行）と `project_architecture_guide.md` |
| タイトルから区別しにくい | `codeceptjs_e2e_tech_explanation.md`（設計思想・用語集）と `codeceptjs_learning_guide.md`（APIリファレンス） |
| READMEのツリーと重複 | `tree.md`（2026-01-17時点の古いスナップショット） |
| スクリプトなのにdocs/に置かれている | `generate_prompt_index.py` |
| 永続ドキュメントではない一時作業ログ | `tframe_refactor_resume_2026-04-03.md` |
| HTMLがdocs/ルートに混在 | `read_allure.html`、`index_promt.html` |
| tframe関連がdocs/ルートに散在 | `tframe_architecture.md`、`tframe_glossary.md` |
| READMEからのリンクがない | `tframe_architecture.md`、`tframe_glossary.md`、`mermaid_code_relationships.md` |
| 日付ファイルが乱立 | `prompts/0128_*`、`prompts/0129_*` |

---

## 提案する新しい構造

```
docs/
├── guides/                              # 長期参照するガイド・規約
│   ├── project_architecture_guide.md    # 現状維持（technical_overviewを統合）
│   ├── shimamura_coding_guidelines.md   # 移動
│   └── codeceptjs_api_reference.md      # codeceptjs_learning_guide.md をリネーム
│
├── tframe/                              # tframe専用
│   ├── architecture.md                  # tframe_architecture.md を移動
│   └── glossary.md                      # tframe_glossary.md を移動
│
├── design/                              # 設計・構造の図解
│   ├── codeceptjs_design_patterns.md    # codeceptjs_e2e_tech_explanation.md をリネーム
│   └── mermaid_code_relationships.md    # 移動のみ
│
├── tools/                               # ブラウザで開くHTMLツール
│   ├── read_allure.html                 # 移動
│   └── index_prompt.html               # index_promt.html を移動（typo修正）
│
├── prompts/                             # 現状維持（整理のみ）
│   ├── archive/                         # 日付付き古いメモをここへ
│   │   ├── 0128_指示文.md
│   │   ├── 0129_指示文.md
│   │   ├── 0129_指示文 2.md
│   │   └── 0129_対応案.md
│   ├── （作成済み）gui_test_runner_proposal.md
│   ├── prompt_プロジェクト構造そのものを引き出す.md
│   └── prompt_言語に依存しない汎用的なコード構成.md
│
└── generated/                           # 現状維持（自動生成物）
    └── html/
```

---

## 削除・移動するもの

| 対象ファイル | 処置 | 理由 |
|------------|------|------|
| `docs/tree.md` | 削除 | READMEに最新ツリーが自動更新されており完全重複 |
| `docs/technical_overview.md` | `guides/project_architecture_guide.md` の末尾セクションに統合後削除 | 21行のみで内容が薄く、アーキテクチャガイドと役割が重なる |
| `docs/generate_prompt_index.py` | `scripts/` へ移動 | スクリプトは `scripts/` に統一（AGENTS.md・project_architecture_guide.mdの方針に沿う） |
| `docs/tframe_refactor_resume_2026-04-03.md` | `.agent/` 等の作業ログ専用場所へ移動 | セッション再開メモはdocsに置くものではない |

---

## READMEの「学習リソース」セクション更新案

現在リンクされていない重要ドキュメントが3つあります。追加推奨：

```markdown
## 学習リソース

### 共通
- [プロジェクト設計・アーキテクチャガイド](./docs/guides/project_architecture_guide.md)
- [CodeceptJS APIリファレンス](./docs/guides/codeceptjs_api_reference.md)
- [CodeceptJS 設計パターン・用語集](./docs/design/codeceptjs_design_patterns.md)
- [モジュール依存関係図](./docs/design/mermaid_code_relationships.md)

### プロダクト別
- [しまむら コーディング規約](./docs/guides/shimamura_coding_guidelines.md)
- [T-Frame 構成とファイルのつながり](./docs/tframe/architecture.md)
- [T-Frame 用語集](./docs/tframe/glossary.md)
```

---

## 変更が必要なリンクの一覧

移動に伴い修正が必要な既存リンク：

| ファイル | 現在のリンク | 変更後 |
|---------|------------|--------|
| `README.md` | `./docs/codeceptjs_learning_guide.md` | `./docs/guides/codeceptjs_api_reference.md` |
| `README.md` | `./docs/shimamura_coding_guidelines.md` | `./docs/guides/shimamura_coding_guidelines.md` |
| `README.md` | `./docs/technical_overview.md` | `./docs/guides/project_architecture_guide.md` |
| `README.md` | `docs/project_architecture_guide.md` | `docs/guides/project_architecture_guide.md` |
| `docs/tframe/glossary.md` 内 | `./tframe_architecture.md` | `./architecture.md` |

---

## 整理の優先順位

### すぐやるべき（壊れリンクや無駄なもの）
1. `tree.md` 削除
2. `generate_prompt_index.py` を `scripts/` へ移動
3. `tframe_refactor_resume_2026-04-03.md` を作業ログ専用場所（`.agent/` など）へ移動

### 次にやるべき（サブディレクトリ整備）
4. `docs/tframe/` を作成し `tframe_*.md` を移動 → glossary.md のリンクを更新
5. READMEの「学習リソース」に未リンクの3ファイルを追加

### 余裕があれば（コンテンツ統合）
6. `technical_overview.md` の内容を `project_architecture_guide.md` に統合後削除
7. `codeceptjs_*` 2ファイルのタイトルを用途が明確な名前にリネーム
8. `prompts/0128_*`、`0129_*` を `prompts/archive/` に移動
