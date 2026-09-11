# TODO - タスクリスト

## 優先度：中（Phase 3 — 整理・判断もの）

### #h ナビ重複統合 — コミットA 完了（2026-09-11）／コミットB 見送り（#211 待ち）

方針: 2コミットに分割（ユーザー承認済み）。

#### コミットA（系統1 + 系統2 + 系統4(#206)） — ✅ 完了・push・#206 クローズ（commit `d0c813e`）
- #206 サイドバー「講師謝礼」グループ展開: testgcp で確認（koushi_sharei_manual 3/4 pass、以前 0/4）
- 系統1/2（GessyaIkkatu の navigateToStudentGroup / navigateToKeirisyoriView 抽出）: 静的検証で確定
  （抽出3行は元と同一 / KEIRI_SUBMENU 定数は元のインライン値と完全一致 / require・循環参照OK）
- 残 1 件 `正常登録_講師報酬` は講師選択ポップアップ段階の別問題 → **#210 で追跡**
- 調査メモ（#206）: 講師謝礼グループ id = `submenu__sharei_koshi_sub`（display:none 開始・onclick は親 tr の `HandleSubmenuDisplay('submenu__sharei_koshi')`）

#### コミットB（系統3＝候補生昇格の堅牢版寄せ） — 見送り（2026-09-11・ユーザー判断）
- やりたかったこと: `GessyaIkkatuFlowPage.navigateToKouhosei`（会員番号重複検知＋複数候補リトライ）を
  `SyokaiFlowPage.runRegistrationFlow` の簡易版（`searchAndSelectKouhosei` + `promoteKouhoseiToStudent`）に統合。
  置き場所は `SyokaiFlowPage` or `support/shimamura/kouhosei.js`（Gessya / Happyoukai も import 元）。
- 見送り理由: 回帰比較の必須条件「変更前後で `syokai_touroku_test` が同じく通る」が満たせない。
  **変更前ベースライン（testgcp・2026-09-11）= 一括 0/3**。単独実行では `@error 開始日が過去日` のみ緑、
  他2本は**経理ビューB のフォーム未活性**（`売上計上する` / `#contract_dateclass_operation` が not enabled）で失敗。
  候補生昇格自体は動作しており失敗は全て後段 → **#211 で追跡**。
- 再開条件: #211（経理ビューB）が緑に戻ったら、`開始日が過去日` を回帰アンカーに統合を実施。
  現状はコード側に両実装が残り、`SyokaiFlowPage.searchAndSelectKouhosei` 冒頭コメントで理由を明記済み。

## 派生バグ（別 Issue で追跡）
- #203 tframe 側ドキュメントの参照ドリフト 30 件
- ~~#206 koushi_sharei_manual がサイドバー経路で「講師謝礼」グループ未展開のため全件失敗~~ → コミットA で修正・クローズ（2026-09-11）
- #210 koushi_sharei_manual の「正常登録_講師報酬」が講師選択ポップアップ（`#teacher_id_popup_button` → `switchToNextTab`）で失敗（既存・#206 とは別原因）
- #211 syokai_touroku_test が経理ビューB のフィールド未活性で失敗（+ #h コミットB＝候補生昇格の堅牢版統合がこれ待ちで保留）
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
