# shimamura スキル体制 導入計画

作成日: 2026-05-11  
調査担当: explorer agent

---

## 1. shimamura 現状サマリ

### 1-1. ファイル構成

```
pages/shimamura/
  auth/
    LoginPage.js              ... ログイン・担当者番号入力の Page Object
  screens/
    ClassMemberPage.js        ... 管理メニュー遷移・クラス検索・サブメニューリンク
    IchiranPage.js            ... 汎用一覧画面ベース（検索・件数確認）
  flow/
    SyokaiFlowPage.js         ... 新規受講生登録フロー（候補生検索〜経理処理）
    KoushiShareiFlowPage.js   ... 講師謝礼フロー
    StudentSaikenkaiFlowPage.js ... 受講生再検開フロー
  _common/
    sideMenus.js              ... サイドメニュー定数

tests/shimamura/
  auth/
    shimamura_login_test.js               ... ログイン動作確認
  check/
    shimamura_class_existence_check_test.js  ... クラス存在事前確認
    bank_payment_type_check_test.js          ... 支払方法区分確認
  flow/
    syokai_touroku_test.js                ... 新規受講生登録＋経理処理（Data Driven）
    keiri_hennkin_syori_test.js           ... 経理 返金処理
    taikai_test.js                        ... 退会処理（CSV 駆動）
    shimamura_class_member_registration_test.js  ... クラス受講生登録
    koushi_sharei_tsuika_test.js          ... 講師謝礼追加
    koushi_sharei_manual_test.js          ... 講師謝礼手動登録
    student_saikenkai_test.js             ... 受講生再検開
    contact_register_test.js              ... 連絡先登録
    smbc_state_import_test.js             ... SMBC 明細取込
  page/
    student_search_ichiran_test.js        ... 受講生検索一覧
    class_list_ichiran_test.js            ... クラス一覧
    course_ichiran_test.js                ... コース一覧
    course_by_student_ichiran_test.js     ... 受講生別コース一覧
    keiri_invoices_ichiran_test.js        ... 経理請求一覧
    attendance_today_ichiran_test.js      ... 本日出席一覧
    teacher_list_ichiran_test.js          ... 講師一覧
    contact_list_ichiran_test.js          ... 連絡先一覧
    contact_module_list_ichiran_test.js   ... 連絡先モジュール一覧
    transaction_ichiran_test.js           ... 取引一覧
    mishukin_list_ichiran_test.js         ... 未集金一覧

data/shimamura/
  syokai_touroku_data.csv               ... 受講生登録（正常系）
  syokai_touroku_data_shimamura.testgcp.csv
  syokai_touroku_data_shimamura.testgcp2.csv
  syokai_touroku_data_shimamura.traininggcp.csv
  syokai_touroku_validation_errors.csv  ... バリデーションエラー検証用
  keiri_hennkin_syori_data.csv
  keiri_hennkin_syori_validation_errors.csv
  taikai_testdata.csv

support/shimamura/
  constants.js          ... TIMEOUTS 定数（SCREEN/ELEMENT/RESULT/ENABLED/TAB_SWITCH）
  utils.js              ... shimamura 固有ユーティリティ（toggleGroupmenu / verifyNavigationByUrlChange /
                            clickCheckboxByLabelOrName / verifyCheckboxCheckedByLabelOrName /
                            verifyValidationErrors / validateShimamuraEnv）
  syokai_helpers.js     ... 経理処理の実行計画ビルダー（prepareInput / buildExecutionPlan）
```

### 1-2. テスト一覧と状態

| ファイル | フォルダ | 状態 | Data Driven |
|---|---|---|---|
| shimamura_login_test.js | auth/ | 完成・稼働中 | なし |
| shimamura_class_existence_check_test.js | check/ | 完成・稼働中 | CSV（syokai_touroku_data）|
| bank_payment_type_check_test.js | check/ | 完成・稼働中 | なし |
| syokai_touroku_test.js | flow/ | 完成・稼働中 | CSV（syokai_touroku_data / validation_errors）|
| keiri_hennkin_syori_test.js | flow/ | 完成・稼働中 | CSV（keiri_hennkin_syori_data）|
| taikai_test.js | flow/ | 完成・稼働中 | CSV（taikai_testdata）|
| shimamura_class_member_registration_test.js | flow/ | 完成・稼働中 | なし |
| koushi_sharei_tsuika_test.js | flow/ | 完成・稼働中 | CSV |
| koushi_sharei_manual_test.js | flow/ | 完成・稼働中 | CSV |
| student_saikenkai_test.js | flow/ | 完成・稼働中 | CSV |
| contact_register_test.js | flow/ | 完成・稼働中 | CSV |
| smbc_state_import_test.js | flow/ | 完成・稼働中 | CSV |
| student_search_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| class_list_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| course_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| course_by_student_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| keiri_invoices_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| attendance_today_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| teacher_list_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| contact_list_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| contact_module_list_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| transaction_ichiran_test.js | page/ | 完成・稼働中 | CSV |
| mishukin_list_ichiran_test.js | page/ | 完成・稼働中 | CSV |

---

## 2. tframe スキル体制の要約

### 2-1. スキル構成

| スキル | 役割 | 主なワークフロー |
|---|---|---|
| `/tframe-html-fetch` | HTML 取得 + フォームフィールド ID 抽出 | TARGETS 追記 → fetch_tframe_forms.js 実行 → tframe_extract_form_fields.js で ID 整理 |
| `/tframe-registration-dev` | 登録・編集テスト新規作成 | HTML 取得 → フィールド解析 → Page Object → CSV → テストファイル → 実行確認 |
| `/tframe-ichiran-dev` | 一覧検索テスト新規作成・追記 | 検索フォーム確認 → Page Object にメソッド追記 → CSV → テストファイル → 実行確認 |

### 2-2. スキルが前提とする tframe 固有インフラ

1. **URL パターン**: `index.php?r={module}%2Few%2F_default`（登録）/ `%2Fsw%2F_default`（一覧）が全画面に共通
2. **共通検索ボタン**: `#swSearchButton` / 検索結果エリア: `.tf-group-body-search-result tr` が全画面に共通
3. **共通保存ボタン**: `#ewSaveButton` が全画面に共通
4. **エラー表示**: `#tf-message-summary` が共通
5. **フォーム構造**: `<form id="editForm">` / `<form id="searchForm">` が共通
6. **support/utils.js の共通関数**: `fillTextFields` / `loadCsvWithProfile`（tframe 固有の `submitTframeFormAndVerify` / `isEnglish` は `support/tframe/utils.js` に分離済み）
7. **HTMLフェッチスクリプト**: `scripts/html/fetch_tframe_forms.js` + `scripts/html/tframe_extract_form_fields.js` がログイン済み HTML を自動取得

---

## 3. HTML / Page Object パターン比較表

### 3-1. ファイル構成・命名規則

| 項目 | tframe | shimamura |
|---|---|---|
| Page Object の置き場 | `pages/tframe/screens/` (画面単位) | `pages/shimamura/{auth,screens,flow}/` (役割別) |
| サブディレクトリ | `screens/` `auth/` `api/` `_common/` の 4 分類 | `auth/` `screens/` `flow/` `_common/` の 4 分類 |
| ログイン PO | `auth/LoginKannrisyaPage.js` | `auth/LoginPage.js` |
| 画面 PO | `screens/KoshiPage.js` など | `_common/ClassMemberPage.js`（共通ナビ） / `screens/IchiranPage.js`（一覧ベース） |
| フロー関数 | テストファイル内 or Page Object メソッド | `flow/SyokaiFlowPage.js` など（フロー専用ファイル） |

shimamura の `SyokaiFlowPage.js` は tframe の Page Object と異なり、画面単位ではなく業務フロー単位の関数集。これは shimamura の画面遷移が複数タブ・ポップアップをまたぐ複雑なフローのため。

### 3-2. 共通ユーティリティの使用状況

| ユーティリティ | tframe | shimamura |
|---|---|---|
| `fillTextFields(I, fieldMap)` | 全 Page Object で使用（FORM_FILL_FAST 対応） | 未使用（未導入） |
| `submitTframeFormAndVerify(I, text)` | 全登録 Page Object で使用 | 未使用（tframe 専用） |
| `loadCsvWithProfile(baseName, dataDir)` | `data/tframe/` を参照（第 2 引数で明示） | `data/shimamura/` を参照（全呼び出しで `'shimamura'` を第 2 引数に明示） |
| `withScenarioLabel(data, fn)` | テストファイルで使用 | syokai_touroku_test.js / keiri で使用 |
| `parseExpectedErrors(str)` | テストファイルで使用 | syokai_touroku_test.js で使用 |
| `isEnglish()` | juku プロファイルで USE | 未使用（shimamura は日本語のみ） |
| shimamura 固有: `validateShimamuraEnv()` | なし | 全テストの Before で使用 |
| shimamura 固有: `toggleGroupmenu(I, opts)` | なし | SyokaiFlowPage / taikai_test / keiri で使用 |
| shimamura 固有: `clickCheckboxByLabelOrName()` | なし | SyokaiFlowPage で使用（月途中チェックボックス）|

### 3-3. セレクタ体系の違い

| 要素 | tframe | shimamura |
|---|---|---|
| 姓フィールド | `#lastName` | `input[name="last_name"]` または `last_name` |
| 検索ボタン | `#swSearchButton`（全画面共通） | `input[type="button"][value="検索"]` または `'検索'` テキスト |
| 検索結果リンク | `.tf-group-body-search-result tr` | `.listViewTdLinkS1` / `a.listViewTdLinkS1` |
| エラーコンテナ | `#tf-message-summary` | `#top_err_info_msg_div` |
| エリアドロップダウン | `#branchId_area_id`（全画面命名統一） | `#AN_1_area_id`（画面ごとに名称が変わる可能性） |
| 校舎ドロップダウン | `#branchId_branch_id` | `#school_id` |

shimamura は tframe の `#swSearchButton` に相当する共通検索 ID がない。検索ボタンは画面ごとにラベルテキスト「検索」または `input[type="button"][value="検索"]` で押す。

### 3-4. ナビゲーション構造の違い

| 項目 | tframe | shimamura |
|---|---|---|
| 画面 URL 直遷移 | `I.amOnPage(BASE_URL + 'index.php?r=...')` で直接遷移可能 | URL 直遷移は確認されておらず、ナビゲーションから辿る必要あり |
| メニュー構造 | サイドバーリンク（href 属性で判別） | `管理 → タブ → サブメニュー` の 3 段階ナビ |
| サブメニュー開閉 | 不要（常時表示） | `toggleGroupmenu()` でアコーディオン開閉が必要 |
| ポップアップ | `popup-picker-button` クラスのモーダル | 別タブで開く（`I.switchToNextTab()` が必要） |
| 多重タブ | 基本なし（モーダル） | クラス選択時に別タブが開く（タブ切り替え必須） |

### 3-5. 登録フォーム構造の違い

| 項目 | tframe | shimamura |
|---|---|---|
| フォーム ID | `#editForm`（全画面共通） | 画面ごとに異なる（HTMLスクリプト未調査） |
| field ID 命名 | `#lastName` / `#firstName` 等（lowerCamelCase） | `last_name` / `school_id` 等（snake_case が多い） |
| 保存ボタン | `#ewSaveButton`（全画面共通） | 画面ごとに異なるラベル（「更新」「確定」等） |
| AJAX 連動 | エリア→校舎（`I.wait(1)`）/ 銀行コード補完 | エリア→テナント選択（経理画面 B のクラス選択フォーム） |
| チェックボックス | 通常の `I.click('#id')` で可 | カスタム実装が必要（`clickCheckboxByLabelOrName` を要す） |

---

## 4. 実現性評価とギャップ分析

### 4-1. 総合評価

**「大幅なカスタマイズが必要」** — tframe スキルをそのままは使えない。

理由：

1. tframe スキルの中核である「URL パターンの共通性」「`#swSearchButton` の共通 ID」「`#ewSaveButton` の共通 ID」「`fillTextFields` の共通化」が shimamura には存在しない
2. shimamura の Page Object は画面単位ではなく「業務フロー単位」の設計になっており、スキルの想定する「Page Object に一覧メソッドを追記」パターンが適合しない
3. HTML フェッチ用スクリプト（`fetch_tframe_forms.js`）は tframe 専用ログイン処理に依存しており、shimamura では使えない

### 4-2. shimamura 固有の難しさ

| 課題 | 詳細 |
|---|---|
| 多段階ナビゲーション | 画面への直 URL 遷移が確立されておらず、「管理 → タブ → アコーディオン開閉 → サブメニューリンク」の 4 段階が必要 |
| 多重タブ | クラス選択でポップアップが別タブで開く。`I.switchToNextTab()` と戻りタブの管理が必要 |
| チェックボックスの特殊実装 | 「月途中」チェックボックスは DOM 構造が標準的でなく、`clickCheckboxByLabelOrName` という独自の JS executeScript が必要 |
| セレクタの非統一性 | フィールドの ID/name が画面ごとに `#xxx` だったり `name="xxx"` だったり混在 |
| URL 直遷移の未確立 | URL ベースの直接遷移が機能するかどうか調査できていない（shimamura はセッション状態に依存する可能性） |
| フローの複雑さ | 受講生登録は「候補生検索 → 詳細 → 経理ビュー A → 別タブでクラス選択 → 経理ビュー B → 確認完了 → 退会処理」と 7 ステップ以上のフロー |
| HTML 取得スクリプトの不在 | `fetch_tframe_forms.js` に相当する shimamura 版が存在しない。HTML を手動で貼り付けるか、新規スクリプトを作成する必要がある |
| `loadCsvWithProfile` の dataDir 指定 | 全テストで `'shimamura'` を第 2 引数に明示済み。`support/utils.js` のデフォルト値も削除済みのため誤動作リスクは解消 |

### 4-3. スキル別ギャップ分析

#### `/tframe-html-fetch` → `shimamura-html-fetch` 相当の作業

| tframe | shimamura でのギャップ |
|---|---|
| `fetch_tframe_forms.js` に TARGETS 追記して実行 | shimamura 用の fetch スクリプトが存在しない。`fetch_shimamura_screens.js` を新規作成する必要がある |
| tframe のログイン（`loginKannrisyaPage`）を自動使用 | shimamura のログイン（`LoginPage.login()` + 担当者番号入力）は 2 ステップあり、スクリプト化が複雑 |
| `tframe_extract_form_fields.js` で ID を抽出 | 抽出スクリプトは HTML パーサーであり再利用可能 |

ギャップ評価: 中程度。fetch スクリプトの新規作成が必要だが、抽出スクリプトは流用可能。

#### `/tframe-registration-dev` → `shimamura-registration-dev` 相当の作業

| tframe | shimamura でのギャップ |
|---|---|
| `fillTextFields(I, fieldMap)` で一括入力 | `fillTextFields` は tframe 固有の仮定（`#id` セレクタ）に依存。shimamura は `name=` 属性が多いため、`fillTextFields` の拡張 or 別関数が必要 |
| `#ewSaveButton` で統一保存 | 保存ボタンがない。画面ごとに「更新」「確定」等のテキストボタン |
| `submitTframeFormAndVerify(I, text)` で保存確認 | tframe 専用。shimamura 版の保存確認ユーティリティが未存在 |
| Page Object を画面単位に作成 | shimamura の既存 PO はフロー単位で設計されており、画面単位への設計変更が必要 |
| URL 直遷移で登録画面へ | URL 直遷移の可否が未確認 |

ギャップ評価: 大きい。命名規則の違い・保存ボタンの非統一・URL 直遷移の未確立が主な障壁。

#### `/tframe-ichiran-dev` → `shimamura-ichiran-dev` 相当の作業

| tframe | shimamura でのギャップ |
|---|---|
| `#swSearchButton` で統一実行 | 統一 ID がない。`input[type="button"][value="検索"]` または `'検索'` テキストで代替が必要 |
| `.tf-group-body-search-result tr` で結果確認 | shimamura は `.listViewTdLinkS1` で結果を確認 |
| `navigateToListPage()` で URL 直遷移 | URL 直遷移の可否が未確認 |
| 一覧画面ごとに Page Object メソッドを追記 | ClassMemberPage.js に全画面のメソッドを追記していく方針 or 画面ごとに PO を分割する方針を決定する必要がある |

ギャップ評価: 中程度。セレクタの読み替えルールを定義すれば、スキルの骨格は流用可能。

---

## 5. 推奨導入ステップ（フェーズ分け）

### Phase 0: 前提整備（対象: 調査・設計）

1. **shimamura 画面の URL パターン調査**  
   実際のテスト実行時に URL を `I.grabCurrentUrl()` でログに取得し、URL 直遷移が可能かどうかを確認する。  
   可能であれば一覧・登録のスキル化が大きく簡略化できる。

2. **Page Object 設計方針の決定**  
   現状の「フロー単位」設計（SyokaiFlowPage）を維持するか、tframe と同様の「画面単位」に移行するか判断する。  
   - 維持する場合: スキルも「フロー単位」で作る（受講生登録スキル / 退会スキル / 経理スキル）
   - 移行する場合: 既存 PO を画面単位にリファクタリングしてからスキル化

3. **`loadCsvWithProfile` の dataDir 引数の明示**  
   既存テストで `loadCsvWithProfile('syokai_touroku_data')` が `data/shimamura/` を正しく参照できているか確認し、必要に応じて `loadCsvWithProfile('syokai_touroku_data', 'shimamura')` に統一する。

### Phase 1: HTML フェッチ基盤（優先度: 高）

shimamura 画面の HTML を取得するスクリプトを作成する。

作成対象:
- `scripts/html/fetch_shimamura_screens.js`  
  - Playwright でログイン → 担当者番号入力 → 各画面へ遷移 → HTML 保存
  - 引数: `--profile shimamura.testgcp` 等

調査対象画面の例:
- 受講生一覧（`#idnumber` 検索フォーム）
- クラス一覧（`name` / `course_name` 等の検索フォーム）
- 候補生検索
- 受講生詳細（サブメニュー・アコーディオン構造）

### Phase 2: shimamura-html-fetch スキル（優先度: 高）

`C:\Users\kageyama\.claude\skills\shimamura-html-fetch\SKILL.md` を作成。

内容:
- `fetch_shimamura_screens.js` の TARGETS に追記して実行するワークフロー
- shimamura 固有の「ログイン 2 ステップ（username/password + 担当者番号）」の注意点
- `tframe_extract_form_fields.js` の再利用（フィールド ID 抽出は共通）
- アコーディオン・多重タブを含む画面の識別方法

### Phase 3: shimamura-ichiran-dev スキル（優先度: 中）

一覧検索テストの作成スキル。tframe 版との主な差分:

| 項目 | shimamura 版での変更点 |
|---|---|
| 検索ボタン | `'検索'`（テキストクリック）を標準とする |
| 検索結果 | `.listViewTdLinkS1` を標準セレクタとする |
| URL 遷移 | URL 直遷移 or `navigateToAdminTab` + `clickSubMenuLink` の 2 パターン対応 |
| Page Object | ClassMemberPage.js に検索メソッドを追記するか、新規ページ PO を作成するか選択 |

依存: Phase 1（HTML フェッチ）の完了が望ましいが、既存 HTML ファイルが手元にある場合は先行可能。

### Phase 4: shimamura-registration-dev スキル（優先度: 低〜中）

登録テストの作成スキル。難易度が最も高い。

前提条件:
- Phase 0 の URL パターン調査完了
- Phase 0 の PO 設計方針決定
- Phase 1 の HTML フェッチスクリプト完成

主な設計決定事項:
- `fillTextFields` を shimamura でも使えるよう拡張するか、別の入力ユーティリティを作るか
- shimamura 版の「保存確認」共通関数（`submitTframeFormAndVerify` 相当）を作るか
- チェックボックスは `clickCheckboxByLabelOrName` を共通化して再利用する（既に `support/shimamura/utils.js` にあり）

### フェーズのまとめ

| フェーズ | 作業内容 | 前提 | 難易度 |
|---|---|---|---|
| Phase 0 | URL 調査・PO 設計方針決定・CSV 修正 | なし | 低 |
| Phase 1 | fetch_shimamura_screens.js 作成 | Phase 0 | 中 |
| Phase 2 | shimamura-html-fetch スキル作成 | Phase 1 | 低 |
| Phase 3 | shimamura-ichiran-dev スキル作成 | Phase 1 | 中 |
| Phase 4 | shimamura-registration-dev スキル作成 | Phase 0〜1 | 高 |

---

## 6. Phase 0 調査結果（2026-05-11 実施）

### 6-1. URL 直遷移の可否

**結論: 直遷移可能（`index.php?module=X&action=Y` 形式）**

実テスト実行中に `grabCurrentUrl()` でログを取得し、URL 構造を確認した（2026-05-11）。

| 画面 | URL |
|---|---|
| ログイン完了後（メインメニュー） | `index.php?action=index&module=Main` |
| コース一覧（管理タブ「コース」） | `index.php?module=Course&action=index&top_menu=1` |
| クラス一覧 | `index.php?module=Course&action=ListView&course_list=true&query=true&initial_state` |

URL パターンは `index.php?module=<Module>&action=<Action>` 形式で統一されており、tframe の `index.php?r=<module>/<action>` に相当する。各画面へ `I.amOnPage(BASE_URL + 'index.php?module=...')` で直遷移できる可能性が高い。

- **この発見により Phase 3/4 の実装が大幅に簡略化できる**
- 他の画面（受講生一覧・講師一覧等）の URL パターンはテスト実行時に順次取得して補完する

### 6-2. PO 設計方針

**結論: フロー単位 PO を維持する（現状の設計を尊重）**

理由:
- URL 直遷移が未確立のため、tframe 型「画面単位 PO ＋ `navigateTo()` で直遷移」パターンが使えない可能性が高い。
- `ClassMemberPage.js` は共通ナビゲーター（管理タブ遷移・サブメニュークリック）として全テストから利用されており設計が整合している。
- `SyokaiFlowPage.js` は 12 関数（export 4 + private 8）で1フロー全体をカプセル化しており、テスト側は3呼び出しで完結する優れた構造。

方針:
- **同規模のフロー（退会・経理・新画面）** → 新規ファイル（例: `TaikaiFlowPage.js`）を作成
- **共通ナビゲーションの拡張** → `ClassMemberPage.js` に追記
- `ClassMemberPage.js` の未使用メソッド（`searchClass` / `selectClassFromSearchResult`）は削除または統合を検討

### 6-3. loadCsvWithProfile の dataDir

**結論: 対応済み。デフォルト値削除＋全呼び出しに明示引数を追加**

- `support/utils.js` の `dataDir = 'shimamura'` デフォルト値を削除済み。
- shimamura テスト全呼び出しに `loadCsvWithProfile(baseName, 'shimamura')` を明示済み。
- tframe テストも同様に `'tframe'` を明示済み。
- **今後の運用**: 新規テスト追加時は必ず第 2 引数（`'shimamura'` / `'tframe'` 等）を明示すること（デフォルト値がないためコンパイルエラーにはならないが、省略すると `undefined` フォルダを参照して実行時エラーになる）。

### 6-4. Phase 0 完了後の次アクション

| 項目 | 状態 | 次のアクション |
|---|---|---|
| URL 直遷移の可否 | **確認済: 直遷移可能**（`index.php?module=X&action=Y`） | Phase 3/4 で `navigateTo` 系メソッドに活用 |
| PO 設計方針 | **決定: フロー単位維持** | Phase 1 に進める |
| loadCsvWithProfile dataDir | **対応済み: 全呼び出しに明示引数、デフォルト削除** | 新規テスト追加時は必ず第 2 引数を明示 |

---

## 調査上の補足

- `scripts/html/shimamura/` は存在しなかった。shimamura 用の HTML サンプルはどこにも保存されていない（tframe は `scripts/html/input/` に多数の HTML が存在）。
- `scripts/html/input/input.html` は tframe 専用の一時貼り付け先として使われており、shimamura には流用できない。
- `SyokaiFlowPage.js` は `pages/shimamura/flow/` に置かれているが、実態はフロー関数の集合（Page Object ではない）。tframe でいう `support/shimamura/syokai_helpers.js` に近い性質を持つが、`inject()` を使わず I を引数で受け取っているため `pages/flow/` 配置は妥当。同様に `KoushiShareiFlowPage.js` / `StudentSaikenkaiFlowPage.js` も `flow/` に配置。
