# tframe Page Object 命名統一計画（案A: アプリ語彙への全面統一）

状態: 計画中（2026-09 開始・未着手。実行は本計画のレビュー後に別途着手）

関連 Issue: #221（初回のリネーム着手を取り消して本計画に切替） / #222（`sideMenus.js` 環境混在バグ・Phase 1 の検証に影響）

---

## 0. 結論（先に読む）

- **Page Object の命名規則と、テスト・CSV の命名規則は分けて考える。**
  - Page Object = 「画面・アイコンとの連想性」が価値。対象は少数（アイコン10個弱＋サブ画面）。
    → **アプリ自身が持つ語彙**（アイコンの英語ラベル / URL ルートのモジュール名）に揃える。
  - テスト・CSV = 「具体的な業務シナリオの特定」が価値。対象は百件規模で増え続ける。
    → **チームが日常で使う業務用語（ローマ字）**のまま。無理に英訳しない。**今回リネームしない。**
- 実は codecept の外側の3層（`xxxIconEn` ロケーター / `sideMenus.js` のキー / `MenuNavigationMixin` のキー）は
  既に `student` / `teacher` / `accounting` / `master` … という**アプリの英語語彙で統一済み**。
  ズレているのは Page Object の**ファイル名・注入名・アイコン操作メソッド名**の層だけ。
  本計画はその1層を残りの3層に合わせる作業。
- 対象 23 PO のうち **リネーム 11 件・据え置き 12 件**。参照数は JS だけで約 220 箇所 / 約 40 ファイル。
  3フェーズに分け、各フェーズを「振る舞いを変えないリネームだけのコミット」にする。

---

## 1. 現状の棚卸し（2026-09-15 時点）

### 1.1 アイコンの語彙は既に3層で英語に揃っている

| アイコン（画面表示 ja / en） | `xxxIconEn` ロケーター | `sideMenus.js` キー | `MenuNavigationMixin` キー | **PO ファイル名（ズレている層）** |
|---|---|---|---|---|
| 受講生 / Student | `studentIconEn` | `student` | `tframe_student` | `JukuseiPage.js` ← ローマ字 |
| 講師 / Teacher | `teacherIconEn` | `teacher` | `tframe_teacher` | `KoshiPage.js` ← ローマ字 |
| 経理 / Accounting | `accountingIconEn` | `accounting` | `tframe_accounting` | `KeiryoMasterPage.js` ← 誤読＋無関係な Master |
| マスター / Master | `masterIconEn` | `master` | `tframe_master` | `MasterMenuPage.js` ✓ |
| コース / Course | `courseIconEn` | `course` | `tframe_course` | `CoursePage.js` ✓ |
| カレンダー / Calendar | `calendarIconEn` | `calendar` | `tframe_calendar` | `CalendarPage.js` ✓ |
| Eメール / Email | `emailIconEn` | `email` | `tframe_email` | `EmailPage.js` △（一覧/登録POと接頭辞衝突） |
| レポート / Report | `reportIconEn` | `report` | `tframe_report` | `ReportPage.js` △（一覧POと接頭辞衝突） |
| ヘルプ / Help | `helpIconEn` | `help` | `tframe_help` | `HelpPage.js` ✓ |
| ホーム / Home | `homeIconEn` | （なし） | `tframe_home` | `HomePage.js` ✓ |

### 1.2 Page Object 全23件と注入名の利用状況

参照数 = `tests/ pages/ support/` 配下 `*.js` での注入名の出現回数 / 利用ファイル数（2026-09-15 集計）。

| 現ファイル名 | 注入名 | 役割 | 対象ルート（モジュール） | 参照数 / ファイル数 |
|---|---|---|---|---|
| `JukuseiPage.js` | `jukuseiPage` | 受講生アイコン一式（登録・一覧・複合一覧・取込） | `student` | 62 / 12 |
| `KoshiPage.js` | `koshiPage` | 講師アイコン一式（登録・一覧・複合一覧） | `teacher` | 25 / 6 |
| `CoursePage.js` | `coursePage` | コースアイコン一式 | `course`, `attendance` | 42 / 9 |
| `CalendarPage.js` | `calendarPage` | カレンダー menu-nav ＋ 入退記録 | `calendar`, `entranceLog` | 20 / 5 |
| `EmailPage.js` | `emailPage` | Eメール menu-nav のみ | — | 9 / 3 |
| `EmailIchiranPage.js` | `emailIchiranPage` | Eメールアイコン配下の一覧7画面 | `email`, `emailTemplate`, `emailTemplateCategory`, `prospectList`, `announcement`, `poll`, `contact` | 42 / 7 |
| `EmailTourokuPage.js` | `emailTourokuPage` | Eメールアイコン配下の登録4画面 | `prospectList`, `announcement`, `emailTemplateCategory`, `emailTemplate` | 16 / 4 |
| `ReportPage.js` | `reportPage` | レポート menu-nav のみ | — | 9 / 3 |
| `ReportIchiranPage.js` | `reportIchiranPage` | レポート4画面 | `report` | 24 / 4 |
| `HelpPage.js` | `helpPage` | ヘルプ menu-nav のみ | — | 9 / 3 |
| `HomePage.js` | `homePage` | ホーム menu-nav のみ | — | 5 / 2 |
| `MasterMenuPage.js` | `masterMenuPage` | マスター menu-nav のみ | — | 9 / 3 |
| `StaffPage.js` | `staffPage` | スタッフ登録・一覧 | `staff` | 10 / 2 |
| `BranchPage.js` | `branchPage` | 校舎登録・一覧 | `branch` | 10 / 2 |
| `ClassroomPage.js` | `classroomPage` | 教室登録・一覧 | `classroom` | 10 / 2 |
| `AccountPage.js` | `accountPage` | 法人・団体登録・一覧 | `account` | 10 / 2 |
| `InfoHistoryPage.js` | `infoHistoryPage` | 対応履歴（受講生/講師共通） | `infoHistory`, `infoHistoryTemplate` | 16 / 3 |
| `KeiryoMasterPage.js` | `keiryoMasterPage` | 経理 menu-nav のみ | — | 3 / 1 |
| `KeiriIchiranPage.js` | `keiriIchiranPage` | 経理配下の一覧・帳票・一括処理・取込（複数ルート） | `smsFee`, `smsContract`, `smsPayment`, `smsTransaction`, `bankActionsHistory`, `shareiTotal`, `bankTransfer` | 65 / 13 |
| `ChosekinPage.js` | `chosekinPage` | 調整金登録・講師謝礼一覧・講師謝礼計算 | `shareiDetail` | 17 / 4 |
| `ShohinPage.js` | `shohinPage` | 商品登録・一覧（culture） | `product` | 10 / 2 |
| `RyokinMasterPage.js` | `ryokinMasterPage` | 料金マスタ作成・一覧（juku） | `smsFeeMaster` | 10 / 2 |
| `RyokinPackagePage.js` | `ryokinPackagePage` | 料金パッケージ作成・一覧（juku） | `smsFeeMasterPackage` | 10 / 2 |

`pages/tframe/flow/JukuseiCourseFlowPage.js`（15 参照）は flow 層。`auth/` `api/` の PO はアイコンに紐づかないため**本計画の対象外**。

### 1.3 現状の命名方針の混在（問題の正体）

1. **ローマ字 vs 英語の混在**: `Jukusei`/`Koshi`/`Chosekin`/`Ryokin`/`Shohin` はローマ字、`Course`/`Email`/`Report`/`Calendar`/`Help` は英語。
   アプリ自身は全アイコンに英語ラベルを持っている（1.1）ので、ローマ字を選ぶ必然性が無い。
2. **同一アイコン内の接頭辞衝突**: `EmailPage`/`EmailIchiranPage`/`EmailTourokuPage`、`ReportPage`/`ReportIchiranPage`、
   `KeiryoMasterPage`/`KeiriIchiranPage` は同じ語で始まる別ファイルが並び、grep・補完で紛らわしい。
   一方 `MasterMenuPage`＋`StaffPage`/`BranchPage`/… は「menu-nav は `XxxMenuPage`、サブ画面は概念名」で衝突しない。
3. **単発の誤り**: `KeiryoMasterPage` は「経理（けいり）」を「計量（けいりょう）」と誤読したローマ字＋
   `MasterMenuPage.js` を雛形にした際の「Master」語が残ったもの（`run/test_descriptions.json` の旧説明
   「経理・計量マスター画面」がその痕跡）。

---

## 2. 命名規則（案A・提案）

### 2.1 Page Object 層（`pages/tframe/screens/`, `pages/tframe/flow/`）

> **原則: Page Object の名前はアプリ自身の語彙に揃える。**（開発者が画面を見てそのままファイルを引ける状態にする）

| 種別 | 規則 | 例 |
|---|---|---|
| A. アイコンの menu-nav 専用 PO | `{アイコン英語ラベル}MenuPage.js`。英語ラベルは `xxxIconEn` ロケーターの文字列を正とする | `MasterMenuPage`（既存）, `AccountingMenuPage`, `EmailMenuPage`, `ReportMenuPage` |
| B. アイコン一式を1ファイルで扱う PO（menu-nav＋登録＋一覧が同居） | `{アイコン英語ラベル}Page.js` | `CoursePage`（既存）, `CalendarPage`（既存）, `StudentPage`, `TeacherPage` |
| C. 単一ルートのサブ画面 PO | `{ルートモジュール名をPascalCase}Page.js`。ルート名がアプリ都合のローマ字（`shareiDetail`）でもそのまま使う | `StaffPage`, `BranchPage`, `ClassroomPage`, `AccountPage`, `InfoHistoryPage`（既存）, `ProductPage`, `FeeMasterPage`, `FeeMasterPackagePage`, `ShareiDetailPage` |
| D. 同一アイコン配下の複数ルートを役割でまとめた PO | `{アイコン英語ラベル}{役割}Page.js`。役割語は既存の `Ichiran` / `Touroku` を**当面維持**（決定事項 3 参照） | `EmailIchiranPage`（既存）, `EmailTourokuPage`（既存）, `ReportIchiranPage`（既存）, `AccountingIchiranPage` |
| E. flow 層 | `{英語語彙の機能名}FlowPage.js` | `StudentCourseFlowPage` |
| 注入名（`codecept.conf.js`） | ファイル名の lowerCamelCase | `accountingMenuPage`, `studentPage`, `teacherPage` |
| アイコン操作メソッド | `click{アイコン英語ラベル}Icon()`（ロケーター名 `xxxIconEn` と揃える） | `clickStudentIcon()`, `clickTeacherIcon()`, `clickAccountingIcon()` |

補足:
- `smsFeeMaster` → `FeeMasterPage` のように、ルート名の `sms` 接頭辞（製品名由来）は落とす。
  `smsFee`/`smsContract`/`smsPayment`/`smsTransaction` を個別 PO に分けていないため、現時点でこの規則が効くのは `smsFeeMaster` / `smsFeeMasterPackage` のみ。
- 種別 B と種別 A の違いは「その PO がアイコン配下の画面操作も持つか」。将来 `HelpPage`/`HomePage` に画面操作を足すことは無いので、
  種別 A 相当だが衝突するファイルが無い `HelpPage`/`HomePage`/`CalendarPage` は据え置く（決定事項 2）。

### 2.2 テスト・CSV 層（`tests/tframe/`, `data/tframe/`）

> **原則: テストの名前はチームがその業務シナリオを呼ぶときの言葉（ローマ字の業務用語）で付ける。Page Object の改名に追随させない。**

- `jukusei_touroku_test.js` / `koshi_ichiran_test.js` / `chosekin_touroku_test.js` / `ryokin_master_*` / `shohin_*` 等は**すべて現状維持**。
  英訳（謝礼→reward? honorarium?）は語の選択自体が曖昧で、かえって特定しづらくなる。
- `_ichiran_` / `_touroku_` の役割語も現状維持（`/tframe-ichiran-dev` `/tframe-registration-dev` スキルの前提語彙）。
- テスト↔PO の対応は AGENTS.md「画面名 ↔ ファイル名 対照表」と `menu_coverage.md` の自動生成表が担う（規則を分けても迷子にならない仕組みは既にある）。
- 例外は**誤字の修正のみ**: `keiryo_master_test.js` → `keiri_menu_test.js`（内容は経理メニュー巡回。「計量」「マスター」はどちらも誤り）。

### 2.3 AGENTS.md への規約追記（Phase 0 で実施）

現行の「コーディング規約・命名」には次の一文がある:

> 新規ファイル・識別子のローマ字表記はヘボン式を基本とする。既存ファイルで…慣用表記が定着している場合は、無理に一括リネームせず現状を尊重する。

これは**テスト・CSV・業務識別子**には引き続き妥当だが、Page Object にはそのまま当てはめない。以下を追記する:

- 「tframe の Page Object（`pages/tframe/screens/` `pages/tframe/flow/`）のファイル名・注入名・アイコン操作メソッド名は、
  アプリ自身の語彙（`xxxIconEn` の英語ラベル / URL ルートのモジュール名）に揃える。テスト・CSV の命名（ローマ字の業務用語）とは独立した規則とする。」
- 2.1 の表を AGENTS.md に転記（または本計画へのリンク）。
- 「画面名 ↔ ファイル名 対照表」の Page Object 列を新名に更新（Phase 完了ごとに）。

---

## 3. リネーム対象と据え置き

### 3.1 リネーム（11 件）

| # | 現在 | 変更後 | 注入名 | 種別 | メソッド改名 | 参照数 / ファイル数 |
|---|---|---|---|---|---|---|
| 1 | `KeiryoMasterPage.js` | `AccountingMenuPage.js` | `keiryoMasterPage`→`accountingMenuPage` | A | `clickKeiryoIcon`→`clickAccountingIcon` | 3 / 1 |
| 2 | `EmailPage.js` | `EmailMenuPage.js` | `emailPage`→`emailMenuPage` | A | （`clickEmailIcon` は既に一致） | 9 / 3 |
| 3 | `ReportPage.js` | `ReportMenuPage.js` | `reportPage`→`reportMenuPage` | A | （`clickReportIcon` は既に一致） | 9 / 3 |
| 4 | `KeiriIchiranPage.js` | `AccountingIchiranPage.js` | `keiriIchiranPage`→`accountingIchiranPage` | D | — | 65 / 13 |
| 5 | `ShohinPage.js` | `ProductPage.js` | `shohinPage`→`productPage` | C | — | 10 / 2 |
| 6 | `RyokinMasterPage.js` | `FeeMasterPage.js` | `ryokinMasterPage`→`feeMasterPage` | C | — | 10 / 2 |
| 7 | `RyokinPackagePage.js` | `FeeMasterPackagePage.js` | `ryokinPackagePage`→`feeMasterPackagePage` | C | — | 10 / 2 |
| 8 | `ChosekinPage.js` | `ShareiDetailPage.js` | `chosekinPage`→`shareiDetailPage` | C | — | 17 / 4 |
| 9 | `JukuseiPage.js` | `StudentPage.js` | `jukuseiPage`→`studentPage` | B | `clickJukuseiIcon`→`clickStudentIcon` | 62 / 12 |
| 10 | `KoshiPage.js` | `TeacherPage.js` | `koshiPage`→`teacherPage` | B | `clickKoshiIcon`→`clickTeacherIcon` | 25 / 6 |
| 11 | `flow/JukuseiCourseFlowPage.js` | `flow/StudentCourseFlowPage.js` | （テストから `require` 直参照。注入無し） | E | — | 15 / 2 |

### 3.2 据え置き（12 件）

`CoursePage` `CalendarPage` `HelpPage` `HomePage` `MasterMenuPage` `StaffPage` `BranchPage` `ClassroomPage` `AccountPage`
`InfoHistoryPage` `EmailIchiranPage` `EmailTourokuPage` `ReportIchiranPage`（既に規則 2.1 に適合）。

### 3.3 テスト側の変更（1 件のみ）

- `tests/tframe/page/keiryo_master_test.js` → `keiri_menu_test.js`（＋ `run/test_descriptions.json` のキーと説明文）。

---

## 4. 影響範囲（リネーム時に必ず触るもの）

各リネームで機械的に追随が必要な場所。**旧名の grep が 0 件になるまで**が完了条件（`/local-safe-move` の手順）。

| 場所 | 内容 |
|---|---|
| `codecept.conf.js` | `include:` の注入名とパス |
| `tests/tframe/**/*_test.js` | `Scenario(async ({ …, jukuseiPage }) =>` の分割代入と呼び出し。`lang_check_test.js` / `dropdown_check_test.js` は全アイコン PO を列挙しているため全フェーズで触る |
| `pages/tframe/flow/*.js` | `@param {object} jukuseiPage` 等の JSDoc とメソッド呼び出し |
| `pages/tframe/screens/*.js` の JSDoc・コメント | 「`EmailPage.js` はメニューナビ専用のため…」等の相互参照（`EmailIchiranPage` `EmailTourokuPage` `ReportIchiranPage` に有り） |
| `scripts/docs/gen_tframe_menu_coverage.js` | `MENU_NAV_PO_BY_ICON`（`email: 'EmailPage'`, `smsFee: 'KeiryoMasterPage'`, `report: 'ReportPage'`） |
| `.claude/skills/tframe-*/SKILL.md` | 雛形の指名: `KoshiPage.js`（registration-dev / ichiran-dev の主雛形）, `JukuseiPage.js` `CoursePage.js`（flow-dev）, `ChosekinPage.js`（ピッカー例）, `KeiriIchiranPage.js` `EmailIchiranPage.js`（セッション記憶対策の雛形）, `AccountPage.js` `StaffPage.js`（据え置き） |
| `AGENTS.md` | 「画面名 ↔ ファイル名 対照表」の Page Object 列、「tframe 登録テストの共通パターン」の雛形指名（`KoshiPage.js`）、命名規約（2.3） |
| `docs/tframe/menu_coverage.md` | 凡例の menu-nav PO 列挙、差分サマリ表、バケット表の実装済み注記（自動生成区間は `npm run docs:menu-coverage` で追随） |
| `docs/project/project_architecture_guide.md` / `docs/common/codeceptjs_design_patterns.md` / `docs/project/onboarding_new_site.md` | `KoshiPage.js` を例示に使っている箇所 |
| `data/tframe/README.md` | `sideMenus.js` キー→参照テスト表（`keiryo_master_test.js`）、各 CSV 説明文中の PO 名 |
| `run/test_descriptions.json` | `keiryo_master_test.js` のキー |
| `README.md` / `docs/project/test_catalog.md` | 自動生成（pre-commit で追随）。手で触らない |
| メモリ（`project_tframe_progress.md`） | 旧名での記述が多数。フェーズ完了時に「旧名→新名」の対応を1行追記して読み替え可能にする |

触らないもの: `docs/generated/`（gitignore）, `.agent/handoff/*` `.agent/memory/*` `docs/common/learning/*`（時点記録）,
`docs/tframe/architecture.md` `refactoring_*.md` `code_relationships.md`（既に #203 でドリフト追跡中の旧資料）。

---

## 5. フェーズ分割と実行順

各フェーズ = 1 Issue = 「振る舞いを変えないリネームのみ」のコミット。`git mv` で履歴を保ち、`git diff -M --stat` でリネーム検出を確認する。

| Phase | 内容 | 主なリスク | 検証 |
|---|---|---|---|
| **0. 規約整備** | AGENTS.md に 2.1〜2.3 を追記。（任意）#222 の `sideMenus.js` 環境タグ化を先に片付ける | 無し | `npm run docs:check-refs` |
| **1. menu-nav 3件**（#1〜#3） | `AccountingMenuPage` / `EmailMenuPage` / `ReportMenuPage` ＋ `keiri_menu_test.js` | 最小。ただし `keiri_menu_test.js` は #222 により両環境で失敗中 → アイコンクリックまで進むことで改名の正しさを確認する（または #222 を先に解消） | `email_test.js` `report_test.js` `keiri_menu_test.js` `lang_check_test.js` `dropdown_check_test.js` |
| **2. 経理配下 5件**（#4〜#8） | `AccountingIchiranPage` / `ProductPage` / `FeeMasterPage` / `FeeMasterPackagePage` / `ShareiDetailPage` | `AccountingIchiranPage` が 13 テストから参照される。スキルの雛形指名（`KeiriIchiranPage` `ChosekinPage`）を同時更新 | 経理配下の全 `*_test.js`（バケットA/C/D/E の実装分を含む）。culture_beta / juku_beta 両方 |
| **3. 中核 3件**（#9〜#11） | `StudentPage` / `TeacherPage` / `StudentCourseFlowPage` ＋ アイコン操作メソッド改名 | 最大（`jukuseiPage` 62 参照 / 12 ファイル）。`KoshiPage.js` は2スキルの主雛形＋AGENTS.md の雛形指名 → スキル・AGENTS.md・architecture_guide・design_patterns を同時更新 | 受講生/講師系の全 `*_test.js`、`jukusei_course_link_flow_test.js`、`lang_check` / `dropdown_check` |

フェーズ間は独立（どこで止めても整合が取れる）。Phase 3 だけは「スキルの雛形ファイル名変更」を伴うため、
`feedback_skill_drift`（コード規約を直したら SKILL.md も同時に直す）を必ず適用する。

---

## 6. 決定事項（レビューで確定させたい点）

1. **`ChosekinPage` → `ShareiDetailPage` で良いか。** 現ファイルは調整金登録・講師謝礼一覧・講師謝礼計算の3画面を持ち、
   ルートは3つとも `shareiDetail`。規則 C に従うと `ShareiDetailPage`（アプリ都合のローマ字）。
   代替: `TeacherRewardPage`（英訳・ただしアプリ語彙ではない）。
2. **`HelpPage` / `HomePage` / `CalendarPage` を `XxxMenuPage` に揃えるか。** 衝突するファイルが無いため本計画では据え置き。
   完全統一を優先するなら Phase 1 に追加（各 3〜5 ファイル）。
3. **`Ichiran` / `Touroku` の役割語を英語（`List` / `Register`）にするか。** テスト名・スキル名（`/tframe-ichiran-dev`）と共有している語彙なので本計画では維持。
   変えるなら本計画とは別サイクルで、テスト層のルールと合わせて検討する。
4. **テスト名 `keiryo_master_test.js` の改名先。** テスト層の規則（ローマ字業務用語）に従い `keiri_menu_test.js`。
   PO は `AccountingMenuPage`、テストは `keiri_menu` と語が食い違うが、それが「規則を分ける」ことの帰結として許容するか。
5. **#222（`sideMenus.js` の culture/juku 混在）を Phase 1 の前に直すか。** 直さない場合 `keiri_menu_test.js` の完全な green は得られない。

---

## 7. 完了の定義

- 3.1 の 11 件がすべて新名になり、旧名の grep（`*.js` `*.json` `*.md` `*.yaml`、4章の「触らないもの」を除く）が 0 件。
- `npm run docs:jsdoc` エラー無し、`npm run docs:menu-coverage --check` / `docs:catalog --check` / `docs:check-refs` に本件由来の新規ドリフト無し。
- 影響テストが culture_beta / juku_beta で改名前と同じ結果（#222 等の既知失敗は同一理由で失敗すること）。
- AGENTS.md・スキル・`menu_coverage.md`・メモリの旧名→新名対応が更新済み。
- 本ファイルの `状態:` を `完了（YYYY-MM）` に更新。
