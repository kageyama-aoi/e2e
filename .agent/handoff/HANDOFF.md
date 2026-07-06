# HANDOFF - 2026-07-06 14:30

## 使用ツール
Claude Code（Fable 5）

## 現在のタスクと進捗

### 1. スキル棚卸しレビュー（全クラスタ完了・クローズ）
- [x] クラスタ4：トリガー最適化（Issue #174、e2e コミット `ea8881b`）
  - tframe-registration-dev の description から「一覧」を除外し修正対象を登録・編集系に限定、/tframe-ichiran-dev への誘導注記を追加
  - tframe-ichiran-dev に対象ファイルパターン（tests/tframe/ の *_ichiran_test.js、koshi_/jukusei_ 等プレフィックス=tframe）を明記
  - shimamura-ichiran-dev / shimamura-registration-dev に /shimamura-download-verify への誘導注記を追加
  - 計測: 誤発動しやすい8クエリを `claude -p`（Haiku判定）で実測 → 修正後 8/8 正解
- [x] 旧 make_project コピー削除（ユーザー承認済み、業務フロー側コミット `dcde17f`、346行削除）

### 2. e2e 全体リファクタリング計画の作成（本セッションの主タスク・完了）
- [x] リポジトリ全体を調査し、下位モデルでも実行できる自己完結の指示書 `_temp_refactoring_e2e_20260706.md`（リポジトリ直下・git未追跡）を作成
- [x] T1〜T8 を Issue #175〜#182 として一括登録
  - #175 taskreport の __dirname / I.wait(3)（最後の規約違反）
  - #176 support/tframe/constants.js の TIMEOUTS 新設（#177 の前提）
  - #177 エリア→校舎 AJAX 3行パターンの共通化（7ファイル12箇所、ID体系2種）
  - #178 テスト内ページ操作関数の PO 移動（3ファイル、smbc はパターンB設計で対象外）
  - #179 TFRAME_VIEWPORT_* → 汎用名（後方互換付き）
  - #180 autoLogin の shimamura 固定配線（実装前にユーザーへ3案提示が必須）
  - #181 新サイト追加手順書 docs/project/onboarding_new_site.md
  - #182 旧レビューメモ2ファイル削除（全タスク完了後の最後）
- [ ] #175〜#182 の実行（未着手。下位モデルへの委譲を想定）

## 試したこと・結果

- 成功：description 最適化の計測に skill-creator の評価ループを軽量化した方式を採用。8クエリを `claude -p --model claude-haiku-4-5-20251001` に「スキル一覧+依頼文→どのスキルを選ぶか」で判定させた（弱いモデル=厳しい条件）。フル評価ループ（20クエリ×3回×5イテレーション）より大幅に安く、十分な裏取りになった
- 成功：リファクタリング調査で、過去2メモ（_temp_refactoring_shimamura.md 候補A〜F / _temp_review_汎用性.md ①〜⑪）の指摘を全件グレップで裏取り → **大半が対応済み**と判明。突き合わせ表を指示書冒頭に載せ、二重作業を防止
- 失敗→回避：eval スクリプトで jq が未インストール（Git Bash）、Windows Python が /c/... パスを解釈できない → python での JSON→TSV 変換 + `cygpath -w` で解決
- 注意：業務フロー配下の `git rm` は権限クラシファイアに一度ブロックされた（ユーザー明示承認前の削除のため）。承認取得後に実行して解決

## 次のセッションで最初にやること

1. ユーザーに #175〜#182 のどれから着手するか確認（推奨順: #175 → #176 → #177 → #178 → #179 → #180 → #181 → #182）
2. 実行時は必ず `_temp_refactoring_e2e_20260706.md` の「この文書の使い方」を読ませてから着手（1タスク1Issue1コミット・ついで修正禁止・git add . 禁止・dry-run 検証）
3. メモリ `project_refactoring_plan_2026-07.md` に全経緯あり（調査の再実施は不要）

## 注意点・ブロッカー

- **旧メモ2ファイル（_temp_refactoring_shimamura.md / _temp_review_汎用性.md）の指摘は大半対応済み**。「未対応」と誤読して再修正しないこと（削除は #182 で全タスク完了後に実施）
- #180（autoLogin）だけは設計判断タスク。実装前にユーザーへ3案（現状維持+明文化 / プロファイル分岐 / 見送り）の提示が必須
- #176 → #177 の順序依存あり（TIMEOUTS が前提）。#182 は必ず最後
- e2e の作業ツリーにはスキル・指示書以外の未コミット変更が多数残っている（今回の作業とは無関係。`git add .` は使わないこと）
- スキル棚卸しレビュー（2026-07）は全項目クローズ済み。再調査不要
