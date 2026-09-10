# TODO - タスクリスト

## 優先度：中（Phase 3 — 整理・判断もの）
- [ ] #h ナビ重複統合（経理ビュー遷移・候補生検索・候補生昇格を Gessya 版に寄せる／#206 サイドバー展開もここで）— 実機確認必須・最後

## 派生バグ（別 Issue で追跡）
- #203 tframe 側ドキュメントの参照ドリフト 30 件
- #206 koushi_sharei_manual がサイドバー経路で「講師謝礼」グループ未展開のため全件失敗（既存）
- #207 koushi_sharei_tsuika の「謝礼項目なし」「報酬額なし」が期待エラー文言不一致で失敗（既存）
- #99 講師謝礼一括取込の正常系テストデータ未整備（既存）
- #209 course_by_student_ichiran の「サロン」絞り込みが結果0件（testgcp データ・既存）

## 完了済み
- [x] 診断（2026-09-10）— artifact bcca3599
- [x] .spec/ 新サイクル開始（旧サイクルは *-2026-09-10.md にアーカイブ）— dd71498
- [x] #a AGENTS.md / doc-sync にカテゴリF・共通ユーティリティ節・@wip・planステータス規約 — #201 / f707691
- [x] #b check_doc_refs.py + pre-commit + npm run docs:check-refs — #202 / a4efac5
- [x] #c docs/shimamura 4本 + スキル3ファイル + codeceptjs_api_reference.md を現行に追従 — #204 / f74786b（スクリプトのディレクトリ対応 1fddf35）
- [x] #d extractRecordId / BASE_URL / waitForSaveResult / buildTestName を support/shimamura に集約 — #205 / 8540c21
- [x] #e IchiranPage.js を STANDARD_SCREENS ファクトリ化（438→292行、8標準画面）+ shimamura-ichiran-dev スキル追従 — 実機 18/19 pass（1件は #209 の既存データ不整合）
- [x] #f デッドコード削除・命名整理（ClassMemberPage の searchClass/selectClassFromSearchResult + 推測セレクタ6件削除、LoginPage の locators_2/messages_2/promt をリネーム統合、shimamura_login_test を async/await 化、verifyNavigationByUrlChange の引数名修正）— 実機 login + class_existence_check pass
- [x] #g ひな形テスト @wip 化（keiri_hennkin_syori / class_member_registration を Feature @wip、test_descriptions を [WIP]）+ npm scripts と run_gui に @wip 既定除外（test_wip で実行可）+ class_existence_check を IchiranPage 経由に置換（112→47行）— 実機 @wip 除外/class_existence 各 pass
