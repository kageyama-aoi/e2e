# SPEC - shimamura ドリフト防止と整理

状態: 進行中（2026-09-10 開始）

## 概要

shimamura 系の E2E コードで、コードとそれを教えるスキル・ガイドとの「ドリフト」が
繰り返し発生している。修正より先に再発防止の仕組みを入れ、その上で既存のズレを解消し、
最後にコードを集約する。tframe 系ファイルには一切触れない。

---

## 根本原因（診断 2026-09-10）

| # | 原因 | 症状 |
|---|---|---|
| R1 | スキル・ガイドがコードのコピーを持っている | `ShouldBeOn*` 全廃後もガイドが旧名。SKILL.md が旧構成の追記手順 |
| R2 | AGENTS.md の shimamura 節に共通ユーティリティ一覧がない（tframe 節にはある） | `extractRecordId` / `BASE_URL` / `waitForSaveResult` を6ファイルで再実装 |
| R3 | 連動ルール表に「共通パターン変更 → スキル/ガイド更新」の行がない | #178/#183 でコードを直しても /doc-sync が更新対象なしと判定 |
| R4 | 機械的なドリフト検知がない | 存在しない関数名 `ShouldBeOnTaikai` がドキュメントに残存 |
| R5 | 未完成テストに印がない | 「ひな形」がコメント内にしかなく GUI では完成品に見える |
| R6 | 完了した計画資料にステータスがない | `skill_plan.md` が「これから始める」体のまま |

---

## 仕組み（M1〜M6）

| # | 仕組み | 対応原因 | 変更対象 |
|---|---|---|---|
| M1 | 雛形は実ファイルを指す（SKILL.md のテンプレ最小化・tframe 節と同形式） | R1 | SKILL.md ×2, AGENTS.md |
| M2 | AGENTS.md shimamura 節に共通ユーティリティ一覧 | R2 | AGENTS.md |
| M3 | 連動ルール表にカテゴリ F（共通パターン変更 → SKILL.md / docs ガイド / AGENTS 一覧） | R3 | AGENTS.md, doc-sync SKILL.md |
| M4 | `scripts/docs/check_doc_refs.py`（docs/ と .claude/skills/ の参照パス・関数名の存在確認）+ pre-commit 組込 | R4 | 新規スクリプト, .githooks/pre-commit, package.json |
| M5 | `@wip` タグ運用（既定 grep と GUI から除外、test_descriptions は「[WIP]」始まり） | R5 | AGENTS.md, package.json, run_gui.py（要確認） |
| M6 | `docs/**/*_plan.md` は冒頭にステータス必須 | R6 | AGENTS.md |

### M4 の仕様

- 対象: `docs/**/*.md`, `.claude/skills/**/*.md`, `AGENTS.md`
- チェック①: バッククォート内のパス（`pages/…`, `tests/…`, `support/…`, `scripts/…`, `data/…`, `run/…`, `docs/…`）が実在するか。
  行番号付き（`file.js:123`）はファイル部分のみ確認
- チェック②: `xxxPage.funcName(` / `funcName(I,` 形式の識別子が `pages/` `support/` のソースに存在するか
- 除外: `{...}` を含むプレースホルダ、`〇〇` `○○` を含むもの、コードフェンス内の `// 例:` 行
- 出力: `path:line: 参照 'X' が見つかりません`。`--check` で終了コード 1、既定は警告のみ（終了コード 0）
- pre-commit: `docs/`, `.claude/skills/`, `pages/`, `support/`, `AGENTS.md` のいずれかが staged なら警告モードで実行
- npm script: `docs:check-refs` = `python scripts/docs/check_doc_refs.py --check`
- **決定: 開始時は警告のみ。安定後に `--check` へ昇格**

### M5 の仕様

- 未完成テストの Scenario 名に `@wip` を付与
- `npm run test_s` の既定 grep に `--grep "@wip" --invert` 相当を追加（既存 grep との併用可否を実装時に確認）
- `run/test_descriptions.json` の説明を `[WIP] ` で始める
- **決定: keiri_hennkin_syori_test / shimamura_class_member_registration_test は @wip 隔離。削除も実装もしない**

---

## 実行順

### Phase 0 — 仕組み（コード変更なし）
- #a AGENTS.md + /doc-sync: カテゴリ F、shimamura 共通ユーティリティ節、@wip 規約、plan ステータス規約（M2 M3 M5 M6）
- #b check_doc_refs.py 新設 + pre-commit 組込（警告モード）+ npm script（M4）

### Phase 1 — 既存ドリフト解消
- #c docs/shimamura 4本（syokai_flow_page_guide / coding_guidelines / screen_navigation_diagram / skill_plan）
     + shimamura-ichiran-dev / shimamura-registration-dev SKILL.md を現行コードに追従・雛形を実ファイル参照に（M1）

### Phase 2 — コード集約
- #d utils 集約: extractRecordId / BASE_URL / waitForSaveResult / buildTestName（6ファイルのインライン置換）+ AGENTS 一覧更新
- #e IchiranPage.js の Mixin 化（9画面 → ファクトリ、未収金・受注売上・出席表は例外）+ SKILL.md 追従

### Phase 3 — 整理・判断もの
- #f デッドコード削除・命名整理（ClassMemberPage.searchClass 等 / LoginPage の locators_2, promt / login_test の引数ずれ）
- #g ひな形テスト @wip 化（keiri_hennkin_syori / class_member_registration）+ class_existence_check の総当たりを IchiranPage に置換
- #h ナビ重複統合（経理ビュー遷移・候補生検索・候補生昇格を Gessya 版に寄せる）— 実機確認必須

---

## 制約

- tframe 系ファイル（`pages/tframe`, `tests/tframe`, `data/tframe`, `support/tframe`, `.claude/skills/tframe-*`）は触らない
- `support/utils.js`（共通）も原則触らない。必要なら `support/shimamura/` 側で完結させる
- 各 Issue の仕上げで `/doc-sync`（カテゴリ F 含む）を実施
- コミットは Conventional Commits、1 Issue = 1〜数コミット

---

## 診断の一次情報

artifact: https://claude.ai/code/artifact/bcca3599-2c81-4444-8920-c464c9772258（付録 A〜E にファイル:行番号）
