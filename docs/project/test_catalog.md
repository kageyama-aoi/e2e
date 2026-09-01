# テストカタログ
> このファイルは自動生成です。直接編集しないでください。
> 再生成: `npm run docs:catalog`（テスト追加・説明変更時は commit 時にも自動更新）
> 最終更新: 2026-09-01 16:01 (JST)

**合計 81 テスト**（shimamura 30 / tframe 49 / taskreport 1 / smoke 1）

## shimamura（30件）

### auth/（1件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `shimamura_login_test.js` | — | しまむらシステムへのログイン動作を確認 |

### check/（2件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `bank_payment_type_check_test.js` | — | 請求方法（1〜4）ごとに姓名のみで保存し、必須フィールドエラーをスクショ・ログに記録する探索テスト |
| `shimamura_class_existence_check_test.js` | 1100_4_1 | 指定クラスが存在するか一括チェック |

### flow/（15件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `contact_register_test.js` | — | 候補生詳細（詳細タブ）フォームへの入力・保存の正常系とバリデーションエラーを確認 |
| `course_class_setup_test.js` | — | コース・クラス新規作成＋紐づけPage Objectのドライラン（運営管理費テスト用） |
| `gessya_ikkatu_setup_test.js` | — | 月謝一括作成 準備（受講生請求方法設定） |
| `gessya_ikkatu_test.js` | — | 月謝一括作成 実行 |
| `happyoukai_setup_test.js` | — | 発表会 準備（クラス・コース作成／候補生の受講生登録／名簿リスト経由でのクラス追加） |
| `happyoukai_touroku_test.js` | — | 発表会 参加者更新の実行と画面反映の検証 |
| `keiri_hennkin_syori_test.js` | 1600_17_1 | 経理の返金処理フローを確認 |
| `koushi_sharei_manual_test.js` | 1600_19_1 | 講師謝礼の手動入力登録フローを確認 |
| `koushi_sharei_tsuika_test.js` | 1600_19_1 | 講師謝礼のCSVファイル一括取込フローを確認 |
| `shimamura_class_member_registration_test.js` | 1100_15_1 | クラスへのメンバー登録フローを確認 |
| `smbc_state_import_test.js` | 4000_3_1 | 債権買取状態読込（買取保留/解除ファイル読込）の正常系・異常系フローを確認 |
| `student_saikenkai_test.js` | — | SMBC債権買取顧客情報の入力・保存後、受講生の請求方法を債権買取へ変更するフローを確認 |
| `syokai_touroku_test.js` | — | 受講生の新規登録および経理処理フローの正常系・バリデーションエラーを確認 |
| `taikai_test.js` | 1000_2_2 | 退会処理フローを確認 |
| `teacher_keiri_setup_test.js` | — | 講師謝礼テスト用の講師バリエーション登録・経理タブ設定を準備 |

### page/（12件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `attendance_today_ichiran_test.js` | 1001_5_1 | 本日の出席表一覧のデフォルト日付・日付範囲指定で表示が正常に完了することを確認 |
| `class_list_ichiran_test.js` | 1100_4_1 | クラス一覧の空検索・クラス名絞り込みで結果が表示されることを確認 |
| `contact_list_ichiran_test.js` | 1000_8_1 | 問合せ一覧（候補生）の空検索・姓絞り込みで結果が表示されることを確認 |
| `contact_module_list_ichiran_test.js` | 1001_3_2 | コンタクト一覧の空検索で結果が表示されることを確認 |
| `course_by_student_ichiran_test.js` | 1000_6_1 | コース別受講生一覧の空検索・コース名絞り込みで結果が表示されることを確認 |
| `course_ichiran_test.js` | 1100_3_1 | コース一覧（管理）の空検索・コース名絞り込みで結果が表示されることを確認 |
| `keiri_invoices_ichiran_test.js` | 1001_4_2 | 受注・売上（経理）の現在月・前月指定で表示が正常に完了することを確認 |
| `mishukin_list_ichiran_test.js` | 1600_2_1 | 未収金一覧の今日基準・全期間検索で結果テーブルが表示されることを確認 |
| `student_search_ichiran_test.js` | 1000_5_1 | 受講生検索の空検索・姓絞り込みで結果が表示されることを確認 |
| `teacher_list_ichiran_test.js` | 1200_3_1 | 講師一覧の空検索で結果が表示されることを確認 |
| `transaction_ichiran_test.js` | 1600_9_1 | 入出金一覧の空検索と姓での絞り込み検索を確認 |
| `validity_data_output_test.js` | 2000_2_1 | 有効性データ出力画面からCSVをダウンロードし、ヘッダ行・明細行の存在を検証 |

## tframe（49件）

### api/（1件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `get_personal_info_api_test.js` | — | APIトークンを使った講師個人情報の取得動作を確認 |

### auth/（2件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `login_test.js` | — | 管理者アカウントでのログイン動作を確認 |
| `mypage_login_test.js` | — | 講師・スタッフ用マイページへのログインを確認 |

### check/（3件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `dropdown_check_test.js` | — | 各画面のドロップダウン選択肢を一括スキャン |
| `lang_check_test.js` | — | 日本語/英語切替時の表示整合性を確認 |
| `token_usage_test.js` | — | APIトークン認証を使ったログイン動作を確認 |

### flow/（4件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `96-60_teacher_payment_report_test.js` | — | 講師への支払調書データ取得APIの動作確認 |
| `jukusei_course_link_flow_test.js` | — | コース新規登録→受講生新規登録→受講生詳細のコースタブでのコース紐付けを確認 |
| `navigation_after_login_student_test.js` | — | 受講生アカウントでログイン後の画面遷移を確認 |
| `navigation_after_login_test.js` | — | 管理者ログイン後にメニュー各画面へ遷移できるか確認 |

### page/（39件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `account_ichiran_test.js` | — | アカウント一覧の空検索と法人名での絞り込み検索を確認 |
| `account_touroku_test.js` | — | 法人・団体の新規登録フォームへの入力・保存を確認 |
| `branch_ichiran_test.js` | — | 校舎一覧の空検索と校舎名での絞り込み検索を確認 |
| `branch_touroku_test.js` | — | 校舎の新規登録フォームへの入力・保存を確認 |
| `calendar_test.js` | — | カレンダー画面の表示・基本操作を確認 |
| `chosekin_ichiran_test.js` | — | 調整金一覧の空検索と年度での絞り込み検索を確認 |
| `chosekin_touroku_test.js` | — | 経理タブの調整金新規登録フォームへの入力・保存を確認 |
| `courseBySt_ichiran_test.js` | — | 受講生別コース一覧の空検索と受講生姓での絞り込み検索を確認 |
| `course_ichiran_test.js` | — | コース一覧の空検索とコース名での絞り込み検索を確認 |
| `course_test.js` | — | コース一覧・詳細画面の表示を確認 |
| `course_touroku_test.js` | — | コースの新規登録フォームへの入力・保存を確認 |
| `email_test.js` | — | メール送信画面の表示・操作を確認 |
| `help_test.js` | — | ヘルプページの表示を確認 |
| `home_test.js` | — | ログイン後のホーム画面の表示を確認 |
| `infoHistoryTemplate_ichiran_test.js` | — | 対応履歴テンプレート一覧の空検索とテンプレート名での絞り込みを確認 |
| `infoHistoryTemplate_touroku_test.js` | — | 対応履歴テンプレートの登録フォーム入力と保存を確認 |
| `infoHistory_ichiran_test.js` | — | 対応履歴一覧の空検索と件名での絞り込みを受講生・講師の両メニューで確認 |
| `jukusei_ichiran_test.js` | — | 受講生一覧の空検索と姓での絞り込み検索を確認 |
| `jukusei_test.js` | — | 受講生一覧・管理画面の表示・操作を確認 |
| `jukusei_touroku_test.js` | — | 受講生の新規登録フォームへの入力・保存を確認 |
| `keiryo_master_test.js` | — | 経理・計量マスター画面の表示・操作を確認 |
| `koshi_ichiran_test.js` | — | 講師一覧の空検索と姓での絞り込み検索を確認 |
| `koshi_test.js` | — | 講師一覧・管理画面の表示・操作を確認 |
| `koshi_touroku_test.js` | — | 講師の新規登録フォームへの入力・保存・バリデーションを確認 |
| `kyoshitsu_ichiran_test.js` | — | 教室一覧の空検索と教室名での絞り込み検索を確認 |
| `kyoshitsu_touroku_test.js` | — | 教室の新規登録フォームへの入力・保存を確認 |
| `master_menu_test.js` | — | マスター設定メニューの各項目への遷移を確認 |
| `proByCourse_ichiran_test.js` | — | コース別商品一覧の空検索と商品名での絞り込み検索を確認（culture_beta のみ） |
| `report_test.js` | — | レポート画面の表示・出力操作を確認 |
| `ryokin_master_ichiran_test.js` | — | 料金マスタ一覧の空検索と名前での絞り込み検索を確認（juku_test のみ） |
| `ryokin_master_touroku_test.js` | — | 料金マスタの新規作成フォームへの入力・保存を確認（juku_test のみ） |
| `ryokin_package_ichiran_test.js` | — | 料金パッケージ一覧の空検索と名前での絞り込み検索を確認（juku_test のみ） |
| `ryokin_package_touroku_test.js` | — | 料金パッケージの新規作成フォームへの入力・保存を確認（juku_test のみ） |
| `shohin_ichiran_test.js` | — | 商品一覧の空検索と商品名での絞り込み検索を確認 |
| `shohin_touroku_test.js` | — | 経理タブの商品新規登録フォームへの入力・保存を確認 |
| `stByCourse_ichiran_test.js` | — | コース別受講生一覧の空検索とコース名での絞り込み検索を確認 |
| `staff_ichiran_test.js` | — | スタッフ一覧の空検索と姓での絞り込み検索を確認 |
| `staff_touroku_test.js` | — | スタッフの新規登録フォームへの入力・保存・バリデーションを確認 |
| `teByStudent_ichiran_test.js` | — | 講師別受講生一覧の空検索と講師姓での絞り込み検索を確認 |

## taskreport（1件）

### (直下)（1件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `taskreport_sample_test.js` | — | Taskreport 機能のサンプルテスト |

## smoke（1件）

### (直下)（1件）

| テストファイル | 機能No | 説明 |
|---|---|---|
| `smoke_test.js` | — | システム全体の基本動作確認（スモークテスト） |

## メンテナンス状況

✅ ドリフトなし（全テストに説明あり／不要な説明エントリなし）
