# shimamura 画面遷移図

> 生成日: 2026-07-02
> 生成方法: E2Eテストコード（`pages/shimamura/`, `tests/shimamura/flow/`）を解析して作成
> **範囲の注意**: この図は **一般ユーザーが実際に操作する画面遷移** のみを表しています。
> テストコード内では `SHIMAMURA_NAV` 環境変数に応じて「サイドバー経由」と「URL直遷移」を切り替えられますが、
> この図は常に **トップ画面 → アイコン → （必要なら折りたたみ展開）→ 左サイドバーのショートカット → 画面** という、
> 実際にユーザーがクリックして辿る経路（`pages/shimamura/_common/sideMenus.js` の `moduleUrl` / `collapseToggle` / `shortcut` に対応）で描いています。
> URL直遷移（`directUrl`）はテストの都合上の近道であり、この図には含めていません。

---

## 画面遷移図

```mermaid
flowchart TD
    Login["ログイン画面"] --> Tantousya{"担当者番号入力\n（表示される場合のみ）"}
    Tantousya --> MainMenu["トップ画面（メインメニュー）"]

    MainMenu -->|"アイコン：受講生"| StudentModuleTop["受講生機能一覧"]
    MainMenu -->|"アイコン：コース"| CourseModuleTop["コース機能一覧"]
    MainMenu -->|"アイコン：講師"| TeacherModuleTop["講師機能一覧"]
    MainMenu -->|"アイコン：経理"| KeiriModuleTop["経理機能一覧"]
    MainMenu -->|"アイコン：顧客"| ContactsModuleTop["顧客機能一覧"]

    subgraph IconStudent["受講生アイコン配下（左サイドバー）"]
        StudentModuleTop
        StudentSearch["受講生検索"]
        CourseByStudent["コース別受講生一覧"]
        KouhoseiSearch["候補生検索"]
        ContactListSC["問合せ一覧"]
        ContactRegisterForm["問合せ登録フォーム（？）"]
        ValidityDataOutput["有効性データ出力"]
    end
    StudentModuleTop -->|"ショートカット"| StudentSearch
    StudentModuleTop -->|"ショートカット"| CourseByStudent
    StudentModuleTop -->|"「候補生」展開→ショートカット"| KouhoseiSearch
    StudentModuleTop -->|"「問合せ」展開→ショートカット"| ContactListSC
    StudentModuleTop -.->|"「問合せ」展開→？（要確認）"| ContactRegisterForm
    StudentModuleTop -->|"「有効性データ」展開→ショートカット"| ValidityDataOutput

    subgraph IconCourse["コースアイコン配下（左サイドバー）"]
        CourseModuleTop
        ClassList["クラス一覧"]
        AttendanceToday["本日の出席表一覧"]
        CourseIchiran["コース一覧（管理）"]
    end
    CourseModuleTop -->|"ショートカット"| ClassList
    CourseModuleTop -->|"ショートカット"| AttendanceToday
    CourseModuleTop -.->|"経路未確認"| CourseIchiran

    subgraph IconTeacher["講師アイコン配下（左サイドバー）"]
        TeacherModuleTop
        TeacherSearch["講師検索"]
        ShareiTsuika["講師謝礼追加画面"]
    end
    TeacherModuleTop -->|"ショートカット"| TeacherSearch
    TeacherModuleTop -.->|"「講師謝礼一覧」経由？（要確認）"| ShareiTsuika

    subgraph IconKeiri["経理アイコン配下（左サイドバー）"]
        KeiriModuleTop
        KeiriInvoices["受注＆売上"]
        MishukinList["未収金一覧"]
        MonthlyFeeCreation["月謝一括作成"]
        TransactionList["入出金一覧"]
        RefundList["返金一覧（ひな形）"]
    end
    KeiriModuleTop -->|"ショートカット"| KeiriInvoices
    KeiriModuleTop -->|"ショートカット"| MishukinList
    KeiriModuleTop -->|"ショートカット"| MonthlyFeeCreation
    KeiriModuleTop -->|"「入出金」展開→ショートカット"| TransactionList
    KeiriModuleTop -->|"「入出金」展開→ショートカット"| RefundList

    subgraph IconContacts["顧客アイコン配下（左サイドバー）"]
        ContactsModuleTop
        ContactModuleList["顧客一覧"]
    end
    ContactsModuleTop -->|"ショートカット"| ContactModuleList

    %% ── ここから先は個別画面内の操作で移動する範囲 ──

    KouhoseiSearch -->|"検索実行"| KouhoseiList["候補生一覧"]
    KouhoseiList -->|"結果クリック"| KouhoseiDetail["候補生詳細"]
    KouhoseiDetail -->|"受講生へ移動"| StudentDetail["受講生詳細"]

    StudentSearch -->|"検索結果クリック"| StudentDetail

    StudentDetail -->|"編集"| StudentEdit["受講生編集"]
    StudentEdit -->|"保存"| StudentDetail

    StudentDetail -->|"閲覧/登録・経理ビュー"| KeiriPersonalView["受講生登録・経理ビュー（個人）"]
    KeiriPersonalView -->|"クラス追加/更新する"| KeiriViewA["経理ビューA"]
    KeiriViewA -->|"クラス選択"| ClassSelectPopup["クラス選択ポップアップ"]
    ClassSelectPopup --> KeiriViewB["経理ビューB（日付入力・売上計上）"]
    KeiriViewB --> KeiriViewE["経理ビューE（確認完了）"]
    KeiriViewE -->|"戻る"| KeiriViewA

    StudentDetail -->|"閲覧/登録・経理ビュー→個人情報１"| KojinInfo1["個人情報１"]
    KojinInfo1 -->|"退会処理"| TaikaiInput["退会処理入力"]
    TaikaiInput -->|"更新"| TaikaiDone["退会完了"]
    TaikaiDone -->|"経理ビューへ"| KeiriPersonalView

    StudentDetail -->|"債権買取顧客情報登録ボタン"| SmbcForm["債権買取顧客情報登録フォーム"]
    SmbcForm -->|"申込情報登録"| StudentDetail

    ClassList -->|"検索結果クリック"| ClassDetail["クラス詳細"]
    ClassDetail -->|"受講生タブ"| StudentTabInClass["受講生タブ（コース選択）"]
    StudentTabInClass -->|"発表会選択"| PresentationSelection["発表会選択後"]

    TeacherSearch -->|"検索結果クリック（既存講師）"| TeacherDetail["講師詳細"]
    TeacherSearch -->|"未登録の場合：新規登録"| TeacherCreateForm["講師新規登録フォーム"]
    TeacherCreateForm -->|"保存"| TeacherDetail
    TeacherDetail -->|"経理タブへ切替（画面内タブ）"| TeacherAccountingEdit["経理タブ編集"]

    ShareiTsuika -->|"講師選択ポップアップ"| TeacherPopup["講師選択ポップアップ"]
    TeacherPopup -->|"選択して戻る"| ShareiTsuika
    ShareiTsuika -->|"保存"| ShareiDone["登録完了"]
    ShareiTsuika -->|"ファイル取込"| ShareiImportResult["取込結果"]
```

**この図の読み方**
- 実線＝ユーザー操作（クリック・保存など）で確定している遷移。点線＝コード上は直URL遷移で確認されていて、実際のアイコン／サイドバー経路が未確認のもの。
- 各「〇〇アイコン配下」の枠は、トップ画面のアイコンをクリックした先の機能一覧画面と、その左サイドバーから直接／折りたたみ展開後に見える画面をまとめたもの。
- 枠の外に出た画面（受講生詳細、経理ビューA/B/Eなど）は、サイドバーではなく画面内のボタン・リンクからさらに移動する範囲。

---

## 要確認（点線部分）

以下は該当機能が **どのアイコン／どのサイドバー項目から辿れるか** をテストコードから断定できなかった箇所です。実際の画面をご存知でしたら教えてください（わかり次第、実線に修正します）。

1. **問合せ登録フォーム** — 「問合せ一覧」と同じ「問合せ」グループの中にショートカットがありますか？
2. **コース一覧（管理・ShimaCourse）** — コースアイコンのサイドバーのどこにありますか？（テストコードは常にURL直遷移で開いているため経路が追えませんでした）
3. **講師謝礼追加画面** — 「講師」アイコン配下ですか、それとも別アイコンですか？
4. **債権買取状態読込画面** — 経理アイコン配下だと思いますが、どのグループ（入出金など）に入っていますか？

---

## 参照元ファイル

| フロー | テストファイル | Page Object |
|---|---|---|
| 受講生登録（新規契約） | `tests/shimamura/flow/syokai_touroku_test.js` | `pages/shimamura/flow/SyokaiFlowPage.js` |
| 退会処理 | `tests/shimamura/flow/taikai_test.js` | `pages/shimamura/flow/SyokaiFlowPage.js`（`ShouldBeOnTaikai`） |
| 月謝一括作成 | `gessya_ikkatu_setup_test.js` / `gessya_ikkatu_test.js` | `pages/shimamura/flow/GessyaIkkatuFlowPage.js` |
| 債権買取顧客情報登録 | `student_saikenkai_test.js` | `pages/shimamura/flow/StudentSaikenkaiFlowPage.js` |
| 講師経理設定 | `teacher_keiri_setup_test.js` | `pages/shimamura/flow/TeacherKeiriFlowPage.js` |
| 講師謝礼追加 | `koushi_sharei_manual_test.js` / `koushi_sharei_tsuika_test.js` | `pages/shimamura/flow/KoushiShareiFlowPage.js` |
| クラス受講生登録 | `shimamura_class_member_registration_test.js` | なし（テスト内に直書き） |
| 問合せ登録 | `contact_register_test.js` | なし（Pattern B・1画面完結） |
| 債権買取状態読込 | `smbc_state_import_test.js` | なし（Pattern B・1画面完結） |
| 経理返金処理 | `keiri_hennkin_syori_test.js` | なし（ひな形・未実装） |
| 画面カタログ（アイコン/サイドバー定義） | — | `pages/shimamura/_common/sideMenus.js` |

## 制約・今後の拡張

- 「要確認」の4項目が判明したら実線に更新する。
- テストが存在しない画面・遷移（管理画面の全機能）はこの図に含まれない。新しいE2Eテストを追加したら、このドキュメントも合わせて更新することを推奨する。
- 経理返金処理（`keiri_hennkin_syori_test.js`）は実装が固まり次第、他フローと同じ粒度に描き直すこと。
