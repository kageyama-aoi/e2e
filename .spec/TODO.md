# TODO - タスクリスト

## 優先度：中（Phase 3 — 整理・判断もの）

### #h ナビ重複統合 — コミットA 完了（2026-09-11）／コミットB 未着手

方針: 2コミットに分割（ユーザー承認済み）。
- **コミットA（安全）** = 系統1 + 系統2 + 系統4(#206) — ✅ 完了・push・#206 クローズ
  - #206 サイドバー「講師謝礼」グループ展開: testgcp で確認（koushi_sharei_manual 3/4 pass、以前 0/4）
  - 系統1/2（GessyaIkkatu の navigateToStudentGroup / navigateToKeirisyoriView 抽出）: 静的検証で確定
    （抽出3行は元と同一 / KEIRI_SUBMENU 定数は元のインライン値と完全一致 / require・循環参照OK）
  - 残 1 件 `正常登録_講師報酬` は講師選択ポップアップ段階の別問題 → **#210 で追跡**
- **コミットB（要注意）** = 系統3（候補生昇格の堅牢版寄せ）— syokai_touroku_test を変更前後で実機実行して回帰確認

#### いまの状態（コミット前・working tree に3ファイル未コミット）
```
M pages/shimamura/flow/SyokaiFlowPage.js       … navigateToStudentGroup / navigateToKeirisyoriView を export に追加
M pages/shimamura/flow/GessyaIkkatuFlowPage.js … 上記2つを ./SyokaiFlowPage から import。
                                                  navigateToKouhosei 内の候補生グループ遷移3行 → navigateToStudentGroup 呼び出しに置換。
                                                  verifyMonthlyFees 内の経理ビュー遷移2行 → navigateToKeirisyoriView 呼び出しに置換。
                                                  未使用になった toggleGroupmenu の import を削除。
M pages/shimamura/flow/KoushiShareiFlowPage.js … #206修正。NAV.sidebar に
                                                  collapseToggle:{ icon_id:'submenu__sharei_koshi_sub', menuname:'講師謝礼' } を追加。
                                                  navigateToTsuikaScreen のサイドバー分岐でリンククリック前に
                                                  toggleGroupmenu(I, NAV.sidebar.collapseToggle) を実行。toggleGroupmenu を import 追加。
```
実施済み検証: node --check ×3 OK / require・循環参照 OK（Gessya→Syokai の一方向、循環なし）/
             Gessya から toggleGroupmenu import 除去済み確認 OK。
**未実施**: KoushiShareiFlowPage の require ロード確認、`npm run docs:check-refs`、実機テスト。

#### 調査済みの重要情報（#206）
謝礼一覧サイドバーの「講師謝礼」グループ:
- トグル対象 id = `submenu__sharei_koshi_sub`（display:none で開始）
- 見出し = `<span class="subMenuSepText">講師謝礼</span>`、onclick は親 tr の `HandleSubmenuDisplay('submenu__sharei_koshi')`
- 配下リンク: 講師謝礼計算 / **講師謝礼追加** / 講師謝礼一覧 / 当月報酬明細 / …
- 調査に使った一時スクリプトは scratchpad（`fetch_sharei_sidebar.js`）— repo には未追加、破棄可

#### コミットA — 完了（2026-09-11、commit は git log 参照）
1. ✅ require・循環参照確認（KoushiSharei / Gessya / Syokai すべて OK）
2. ✅ `check_doc_refs.py`（shimamura スコープ）クリーン
3. ✅ AGENTS.md ナビゲーション節 / registration スキルに共有ヘルパー記載追加
4. ✅ 実機 koushi_sharei_manual（testgcp・sidebar）: 3/4 pass（以前 0/4）。残 1 は #210
5. ✅ 系統1/2 は静的検証で確定（ユーザー判断）
6. ✅ doc-sync → コミット → push → #206 クローズ

#### コミットB（系統3・別途）
- `navigateToKouhosei`（GessyaIkkatuFlowPage、会員番号重複検知＋複数候補リトライの堅牢版）を
  `runRegistrationFlow`（SyokaiFlowPage、現状は簡易版 searchAndSelectKouhosei + promoteKouhoseiToStudent）に適用
- 置き場所判断: navigateToKouhosei を Syokai へ移す or support/shimamura/kouhosei.js へ切り出す（Happyoukai も import 元）
- **必須**: `syokai_touroku_test.js` を変更**前**に1回・変更**後**に1回実機実行して候補生昇格〜経理処理が同じく通ること
- 通らなければ系統3は見送り（両実装を残し、なぜ分かれているかコメント）

## 派生バグ（別 Issue で追跡）
- #203 tframe 側ドキュメントの参照ドリフト 30 件
- ~~#206 koushi_sharei_manual がサイドバー経路で「講師謝礼」グループ未展開のため全件失敗~~ → コミットA で修正・クローズ（2026-09-11）
- #210 koushi_sharei_manual の「正常登録_講師報酬」が講師選択ポップアップ（`#teacher_id_popup_button` → `switchToNextTab`）で失敗（既存・#206 とは別原因）
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
