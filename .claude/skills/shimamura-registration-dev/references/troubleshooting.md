# shimamura 登録・処理フロー トラブルシューティング

テスト実行時のエラー・ハマりどころの対処一覧。
**新しい落とし穴を見つけたら SKILL.md 本体ではなくこのファイルに追記すること**（本体の肥大化を防ぐため）。

| エラー | 原因 | 対処 |
|---|---|---|
| 画面が表示されない | URL の module / action が違う | `scripts/html/shimamura/` の links.json で確認、または実機で URL を取得 |
| `#top_err_info_msg_div` が見つからない | エラーが出ていない / 違うコンテナ | 実際のエラー表示先を実機で確認する |
| 別タブが開かない | クリック対象が wrong / タイムアウト | `I.wait(TIMEOUTS.TAB_SWITCH)` を増やす・セレクタを確認する |
| `switchToNextTab()` 後に要素が見つからない | タブ数がずれている | タブが何番目かを確認（`I.grabCurrentUrl()` でログ取得） |
| サブメニューが開かない | `icon_id` が wrong | 実際の DOM で `submenu__*_sub` の ID を確認する |
| `toggleGroupmenu` が wrong | メニューが既に開いている | すでに開いている場合はスキップされる（問題なし）|
| チェックボックスがクリックできない | DOM 構造が特殊 | `clickCheckboxByLabelOrName` の `labelText` / `inputName` / `inputId` を全て指定する |
| `SHIMAMURA_TANTOUSYA` エラー | 環境変数が未設定 | `env/.env.{profile}` に `SHIMAMURA_TANTOUSYA=番号` を追加 |
| `BASE_URL` の末尾スラッシュなし | URL が `testgcpindex.php...` になる | `I.amOnPage(BASE_URL + '/index.php?...')` と `/` を明示する |
| 保存ボタンが見つからない / クリックできない | value に全角スペース（`"　保存　"`）が混入 | `I.click('input[name="save_button"]')` と name 属性で指定する |
| `expectedErrors` の検証でテストが失敗する | エラー文言が実際のメッセージと不一致 | CSV を空欄にして先に実行し、スクリーンショットでエラー文言を確認してから更新する |
| ポップアップ後に `Target page, context or browser has been closed` エラー | 別タブが自動クローズ後も閉じたタブを参照し続けている | ポップアップ内で選択後 `I.wait(TIMEOUTS.TAB_SWITCH)` → `I.switchToNextTab()` を追加して元タブへ戻る |
| 保存成功後に `Element "#top_err_info_msg_div" was not found` エラー | 成功時にページ遷移する画面で `grabTextFrom` を使用している | `I.executeScript(() => { const el = document.querySelector('#top_err_info_msg_div'); return el ? el.textContent.trim() : ''; })` に切替え（references/patterns.md「保存後の結果確認」参照） |
| 「開始日は当月以降で入力してください。」等の日付バリデーションエラー | CSVに固定日付（例: `2026-06-05`）を書いており月をまたいで過去日になった | `support/shimamura/utils.js` の `resolveDynamicDateIfPast(I, dateStr, fieldLabel, { graceMonths })` で当日日付に自動補正する。画面ごとに許容範囲が異なる（契約日/開始日は当月以降のみ=`graceMonths: 0`、退会処理は先月まで許容=`graceMonths: 1`）ため実機で確認すること |
| 退会処理で「指定の退会日は選択できません。」エラー | 退会処理は「先月まで許容・先々月以前はNG」というルールを持つ（契約日/開始日の「当月以降のみ」とは別ルール） | 上記 `resolveDynamicDateIfPast` を `graceMonths: 1` で使う |
| 退会処理で「退会する対象が選択されていません。」エラー | 対象受講生に有効なクラス・コースが存在しない（既に退会済み等） | テストデータ側の問題。別の受講生を使うか、テスト用受講生を新規作成する |
| 経理カルテビュー等で「経理処理が完了してないデータがあります」の警告が出て後続操作（退会処理等）がブロックされる | 対象受講生に確定していない料金レコードが残っている | `SyokaiFlowPage.js` の `resolveUnfinishedKeiriDataIfPresent(I)` を呼ぶ（「未完了情報確認」→「確認完了（経理ビューへ）」を自動でクリックする）。解消後は経理ビューAに遷移するため、元のタブ状態に依存する後続処理がある場合は再遷移が必要（`taikai_test.js` の `navigateToTaikaiScreen` を参照） |
| 月謝一括作成バッチ（`LWMonthlyFeeCreation_AN`）が何も作成しない | 収納業者のうち1つでも対象月の口座振替スケジュール（`module=ShimaSchedule&action=LWAccountTransferScheduleRegistration_AN`）が未登録だと、その収納業者だけでなく処理対象全体が作成されない | `support/shimamura/accountTransferSchedule.js` の `ensureAccountTransferSchedules` を実行前に呼ぶ（`GessyaIkkatuFlowPage.js` の `runMonthlyFeeCreation` は既に内蔵済み） |
