'use strict';

/**
 * 料金明細 編集画面（入金入力モード）のデシジョンテーブル定義（#287）。
 *
 * **この1ファイルが正**。仕様書 docs/shimamura/concepts/料金明細入金チェックの仕様.md の
 * 条件・動作の一覧、DT 表、テストケース一覧は `npm run docs:decision-tables` でここから生成する（手で直さない）。
 * テスト tests/shimamura/flow/sales_group_transfer_check_test.js も同じ定義を読み、期待結果は
 * support/shimamura/salesGroupTransferModel.js がこの表の decide で決める。
 *
 * 記法は社内「デシジョンテーブル記法ガイド」（https://claude.ai/artifact/D7A86P23kkpLM2eMiYQrvr）に従う。
 * C・A・S・DT・TC は文書全体の通し番号。根拠: 🟢 確認 / 🔵 コード / 🟡 資料（未確認）。
 */

const conditions = [
  { id: 'C1', table: 'DT-01', label: '締日より前に入金済みで編集できない行の下に、編集できる行がある', basis: '🔵' },
  { id: 'C2', table: 'DT-01', label: '入力欄の行に、入金日の形式が不正なものがある（空欄は除く）', basis: '🔵🟢' },
  { id: 'C3', table: 'DT-01', label: '入力欄の行に、入金額 > 0 なのに入金日が空のものがある', basis: '🔵🟢' },
  { id: 'C4', table: 'DT-02', label: 'POS 送信済みの行（pos_status=1 かつ access_token あり）がある', basis: '🟡' },
  { id: 'C5', table: 'DT-02', label: 'DT-03 で A8〜A10 のどれかになる行がある', basis: '🟡🟢' },
  { id: 'C6', table: 'DT-03', label: 'DB 上で入金済み（入金額≠0 または入金日あり または支払方法あり）', basis: '🟡' },
  { id: 'C7', table: 'DT-03', label: '比較6項目（入金予定額・締切日・入金日・入金額・手数料・支払方法）に、送る値と DB の値の差分がある', basis: '🟡' },
  { id: 'C8', table: 'DT-03', label: '送る入金日が空', basis: '🟡' },
  { id: 'C9', table: 'DT-03', label: '送る入金日か入金額（0 以外）に値がある', basis: '🟡（入金額 0 を「値あり」とみなすかは未確認）' },
  { id: 'C10', table: 'DT-03', label: '送る支払方法が空', basis: '🟡' },
  { id: 'C11', table: 'DT-04', label: '締日より前に入金済みで編集できない行（入金日 < 締日）', basis: '🔵🟢' },
  { id: 'C12', table: 'DT-04', label: 'DB の支払方法が画面の選択肢（現金・空）にある', basis: '🔵' },
  { id: 'C13', table: 'DT-05', label: 'その行の入金日が空', basis: '🔵' },
  { id: 'C14', table: 'DT-05', label: 'その行のバランスがマイナス（過入金）', basis: '🔵' },
  { id: 'C15', table: 'DT-05', label: '最後の行', basis: '🔵' },
  { id: 'C16', table: 'DT-05', label: '全行に配っても余りが出る（上段の入金額 > 未入金の合計）', basis: '🔵' },
];

/**
 * 動作。`message` はテストが画面で確かめる文言（{fee} は料金名）。
 */
const actions = [
  { id: 'A1', table: 'DT-01', label: 'alert「入金日の入力形式が不正です。」で止まる', basis: '🔵🟢', alert: '入金日の入力形式が不正です。' },
  { id: 'A2', table: 'DT-01', label: 'alert「入金日を入力してください。」で止まる', basis: '🔵🟢', alert: '入金日を入力してください。' },
  { id: 'A3', table: 'DT-01', label: '送る内容（hidden `sales_details`）を作って送信する', basis: '🔵🟢' },
  { id: 'A4', table: 'DT-01', label: '送る内容を作らずに送信する（入金日チェックが存在しない入力欄を読んで例外 → onclick が途中で終わり、送信だけが進む）', basis: '🔵' },
  { id: 'S1', table: 'DT-01', label: '→ DT-02 明細全体のサーバーチェック' },
  { id: 'A5', table: 'DT-02', label: 'pos_error「このデータはPOS売上データ送信済みのため、更新ができません。入金結果が反映されるまでお待ちください。」', basis: '🟡' },
  { id: 'A6', table: 'DT-02', label: 'エラーを行ごとに（料金名付きで）並べて編集画面に戻す。保存しない', basis: '🟡🟢' },
  { id: 'A7', table: 'DT-02', label: 'DB を更新して料金明細の詳細画面へ移る', basis: '🟢' },
  { id: 'S2', table: 'DT-02', label: '→ DT-03 1行分のサーバーチェック（全行に当てる）' },
  { id: 'A8', table: 'DT-03', label: 'Check2「既に入金済みのため、入金処理は不可です(料金名:xxx)」', basis: '🟡🟢', message: '既に入金済みのため、入金処理は不可です(料金名:{fee})' },
  { id: 'A9', table: 'DT-03', label: 'Check3「入金時には、支払方法を設定してください(料金名:xxx)」', basis: '🟡🟢', message: '入金時には、支払方法を設定してください(料金名:{fee})' },
  { id: 'A10', table: 'DT-03', label: 'Check5「入金日は必須項目です(料金名:xxx)」', basis: '🟡🟢', message: '入金日は必須項目です(料金名:{fee})' },
  { id: 'A11', table: 'DT-03', label: 'この行はチェックを通る', basis: '🟡🟢' },
  { id: 'A12', table: 'DT-04', label: 'DB の値をそのまま送る', basis: '🔵🟢' },
  { id: 'A13', table: 'DT-04', label: '先頭の選択肢「現金」を送る（画面にも「現金」と表示される）', basis: '🔵🟢' },
  { id: 'A14', table: 'DT-04', label: '空を送る', basis: '🔵🟢' },
  { id: 'A15', table: 'DT-05', label: '未入金分を配る（入金日・支払方法を上段の値にする）', basis: '🔵🟢' },
  { id: 'A16', table: 'DT-05', label: '入金額を入金予定額に戻し、入金日・支払方法を上段の値で上書きする', basis: '🔵' },
  { id: 'A17', table: 'DT-05', label: '余りを入金額に足す（入金日・支払方法は変えない）', basis: '🔵🟢' },
  { id: 'A18', table: 'DT-05', label: '何も変えない', basis: '🔵🟢' },
];

const tables = [
  {
    id: 'DT-01', title: '保存ボタン押下時の画面側チェック', basis: '🔵',
    entry: '保存ボタン（`OnClickSave()`）',
    conditions: ['C1', 'C2', 'C3'], actions: ['A1', 'A2', 'A3', 'A4', 'S1'],
    decide: (c) => {
      if (c.C1) return ['A4', 'S1'];
      const a = [];
      if (c.C2) a.push('A1');
      if (c.C3) a.push('A2');
      return a.length ? a : ['A3', 'S1'];
    },
    notes: [
      'R2 の alert は「入金日を入力してください。」→「入金日の入力形式が不正です。」の順に2つ出る 🔵。',
      'C2・C3 は入力欄の行だけを見る。入金日チェックのループは「最後の入力欄の行の番号」まで回るので、編集できない行が最後にあるときは C1=N 🟢。',
      'R1 で POST された内容（`sales_details` が空）をサーバーがどう扱うかは未確認 🟡。',
    ],
  },
  {
    id: 'DT-02', title: '明細全体のサーバーチェック', basis: '🟡',
    entry: 'DT-01 R1・R5 から呼ばれる（POST が届いたとき）',
    conditions: ['C4', 'C5'], actions: ['A5', 'A6', 'A7', 'S2'],
    decide: (c) => (c.C4 ? ['A5'] : c.C5 ? ['A6', 'S2'] : ['A7', 'S2']),
    notes: [
      'R1 で行ごとのチェック（S2）も評価されるかは未確認 🟡。',
      'どれか1行でも A8〜A10 になれば、明細全体が保存されない 🟢。',
    ],
  },
  {
    id: 'DT-03', title: '1行分のサーバーチェック', basis: '🟡',
    entry: 'DT-02 R2・R3 から、明細の各行について呼ばれる。各行は独立に判定し、1行に複数のエラーが出ることもある',
    conditions: ['C6', 'C7', 'C8', 'C9', 'C10'], actions: ['A8', 'A9', 'A10', 'A11'],
    decide: (c) => {
      const a = [];
      if (c.C6 && c.C7) a.push('A8');
      if (c.C9 && c.C10) a.push('A9');
      if (c.C8 && c.C7) a.push('A10');
      return a.length ? a : ['A11'];
    },
    na: (c) => {
      if (!c.C8 && !c.C9) return '入金日に値があれば C9 は必ず Y になる';
      if (!c.C6 && !c.C7 && !(c.C8 && !c.C9 && c.C10)) {
        return 'DB で未入金（入金日・入金額・支払方法がすべて空）の値と差分が無いなら、送る値も入金日空・入金額 0・支払方法空になる';
      }
      if (c.C6 && !c.C7 && c.C8 && !c.C9 && c.C10) {
        return 'DB で入金済み（入金日・入金額・支払方法のどれかに値がある）の値と差分が無いなら、送る値も3つ全部は空にならない';
      }
      return null;
    },
    notes: ['管理行の「N/A:」は、DC の範囲に含めた N/A のルール（ガイド STEP 7 と同じ扱い）。'],
  },
  {
    id: 'DT-04', title: '支払方法の送る値（1行分）', basis: '🔵',
    entry: '画面を開いたとき、各行について（`addSale()`）。この表の結果が DT-03 の C7・C10 の値になる',
    conditions: ['C11', 'C12'], actions: ['A12', 'A13', 'A14'],
    decide: (c) => (c.C11 ? ['A14'] : c.C12 ? ['A12'] : ['A13']),
    notes: [
      'R3 が問い合わせの原因。画面にも「現金」と表示されるので、見た目では気づけない。',
      '支払方法以外の項目は、入力欄の行なら DB の値が入力欄に入り、そのまま送られる（触らなければ差分は出ない）🔵。',
    ],
  },
  {
    id: 'DT-05', title: '入金分配での1行の扱い', basis: '🔵',
    entry: '「入金分配」（`DivideTransfer()`）を押したとき、上段の入金額 > 0 の場合に各行について。この表の結果が DT-03 の C7 の値になる',
    conditions: ['C13', 'C14', 'C15', 'C16'], actions: ['A15', 'A16', 'A17', 'A18'],
    decide: (c) => {
      const a = [];
      if (c.C14) a.push('A16'); else if (c.C13) a.push('A15');
      if (c.C15 && c.C16) a.push('A17');
      return a.length ? a : ['A18'];
    },
    notes: [
      'A16 は、締切日が同じ行のまとまりに入る時点で配る残りがあるときだけ起きる（コードの簡略化した表現）🔵。',
      'A15 は配る残りがある限り。上から順に配るので、残りが尽きた後の行には配られない 🔵。',
      '入金済み（入金日あり）でバランス 0 の行は、最後の行に余りが足されるとき（A17）以外は変わらない 🔵🟢。',
    ],
  },
];

/**
 * テストで使う明細の初期状態。シンプルなもの（1行）から複雑なもの（4行・入金済みと未入金が混在）へ並べる。
 * - rowCount: 1 なら、経理ビューA の料金タブで余分な料金を削除して1行の明細にする。省略時はクラス適用でできた4行のまま
 * - firstRowPayment: 1行目を入金済みにするときの支払方法（cash / card）。null なら入金しない
 * 値は記号: t（入金日）= TODAY / ''、a（入金額）= FULL（入金予定額と同じ）/ '0'、p（支払方法）= cash / card / ''、due = DUE。
 * 実データは tests/shimamura/flow/sales_group_transfer_check_test.js が SalesGroupTransferFlowPage で作る。
 */
const paidRow = (p) => ({ t: 'TODAY', a: 'FULL', p, due: 'DUE' });
const unpaidRow = { t: '', a: '0', p: '', due: 'DUE' };
const fixtures = {
  unpaid1: { label: '1行・未入金', rowCount: 1, firstRowPayment: null, rows: [unpaidRow] },
  paid1Cash: { label: '1行・現金で入金済み', rowCount: 1, firstRowPayment: 'cash', rows: [paidRow('cash')] },
  paidCash: { label: '4行・1行目だけ現金で入金済み', firstRowPayment: 'cash', rows: [paidRow('cash'), unpaidRow, unpaidRow, unpaidRow] },
  paidCard: { label: '4行・1行目だけカードで入金済み', firstRowPayment: 'card', rows: [paidRow('card'), unpaidRow, unpaidRow, unpaidRow] },
};

/**
 * テストケース。期待結果は書かない（モデルが表から決める）。
 * - fixture: 初期状態。`mutates: true` は保存が成功してデータが変わるケース（新しい明細を作る）
 * - edit: 行番号 → 変える値（記号: t=TODAY/OTHER/INVALID/''、a=FULL/'0'、p=cash/''、due=OTHER）
 * - mode: 'save'（保存して結果を見る）/ 'observe'（保存せず送る内容を見る）
 * - simulateShimebi: 締日を模擬する（observe のときだけ）
 *
 * **並び順＝実行順**。シンプルなデータから複雑なデータへ（段1 → 段2 → 段3）。
 * 同じ段の中は、チェックされる順（開いただけ → 画面の alert（DT-01）→ サーバーのエラー（DT-03 の Check2 → 3 → 5）→ 保存成功）。
 * 番号: 01〜 は普段の画面で起きるケース。**100番台は本番・testgcp では起きない異質なケース**で、配列の最後に置き最後に実行する。
 */
const testCases = [
  // ---- 段1: 1行・未入金 ----
  { id: 'TC-01', title: '入金日の形式が不正', fixture: 'unpaid1', mode: 'save', edit: { 0: { t: 'INVALID', a: 'FULL', p: 'cash' } } },
  { id: 'TC-02', title: '入金額と支払方法を入れ、入金日が空', fixture: 'unpaid1', mode: 'save', edit: { 0: { t: '', a: 'FULL', p: 'cash' } } },
  { id: 'TC-03', title: '入金額だけ入れ、入金日・支払方法が空', fixture: 'unpaid1', mode: 'save', edit: { 0: { a: 'FULL' } } },
  { id: 'TC-04', title: '入金日・入金額を入れ、支払方法が空', fixture: 'unpaid1', mode: 'save', edit: { 0: { t: 'TODAY', a: 'FULL', p: '' } } },
  { id: 'TC-05', title: '支払方法だけ「現金」にする', fixture: 'unpaid1', mode: 'save', edit: { 0: { p: 'cash' } } },
  { id: 'TC-06', title: '締切日だけ変える', fixture: 'unpaid1', mode: 'save', edit: { 0: { due: 'OTHER' } } },
  { id: 'TC-07', title: '普通に入金して保存', fixture: 'unpaid1', mode: 'save', mutates: true, edit: { 0: { t: 'TODAY', a: 'FULL', p: 'cash' } } },
  // ---- 段2: 1行・現金で入金済み ----
  { id: 'TC-08', title: '開くと、DB の支払方法（現金）がそのまま送られる', fixture: 'paid1Cash', mode: 'observe', edit: {} },
  { id: 'TC-09', title: '入金日と支払方法を消す（入金額は残す）', fixture: 'paid1Cash', mode: 'save', edit: { 0: { t: '', p: '' } } },
  { id: 'TC-10', title: '入金日を別の日に変える', fixture: 'paid1Cash', mode: 'save', edit: { 0: { t: 'OTHER' } } },
  { id: 'TC-11', title: '支払方法だけ空にする', fixture: 'paid1Cash', mode: 'save', edit: { 0: { p: '' } } },
  { id: 'TC-12', title: '入金日を消し、入金額を 0 にする（支払方法は残す）', fixture: 'paid1Cash', mode: 'save', edit: { 0: { t: '', a: '0' } } },
  { id: 'TC-13', title: '入金日・入金額・支払方法をすべて空にする', fixture: 'paid1Cash', mode: 'save', edit: { 0: { t: '', a: '0', p: '' } } },
  // ---- 段3: 4行・入金済みと未入金が混在 ----
  { id: 'TC-14', title: '入金日の形式不正の行と、入金額ありで入金日空の行が両方ある', fixture: 'paidCash', mode: 'save',
    edit: { 1: { t: 'INVALID', a: 'FULL', p: 'cash' }, 2: { t: '', a: 'FULL', p: 'cash' } } },
  { id: 'TC-15', title: '未入金の行の支払方法だけ「現金」にする（ほかの行にエラーが出ない）', fixture: 'paidCash', mode: 'save', edit: { 1: { p: 'cash' } } },
  { id: 'TC-16', title: '未入金の行を普通に入金して保存（現金で入金済みの行があっても保存できる）', fixture: 'paidCash', mode: 'save', mutates: true,
    edit: { 1: { t: 'TODAY', a: 'FULL', p: 'cash' } } },
  { id: 'TC-17', title: '問い合わせ: 1行目がカード入金済み → 未入金の行を入金して保存', fixture: 'paidCard', mode: 'save',
    edit: { 1: { t: 'TODAY', a: 'FULL', p: 'cash' } }, tags: ['@known-bug'],
    note: '問い合わせの不具合（カード入金の行が「現金」で送られる）。今の動きを期待値にしている。直ったらこのケースが落ちる' },
  // ---- 100番台: 本番・testgcp では起きない異質なケース（締日を画面の中だけで書き換えて観察する）----
  { id: 'TC-101', title: '締日より前に入金済みの行は編集できず、支払方法が空で送られる（締日を模擬）', fixture: 'paidCash', mode: 'observe', simulateShimebi: true, edit: {},
    note: '異質なケース。締日は testgcp・本番とも 2001-01-01（実質なし）で、この行は普段の画面に出ない。画面の中だけ締日を書き換えて観察する（保存しない）' },
];

/**
 * テストしないルールと理由（生成する表の「テスト」行に出す）。when は表の条件の値（DC は書かない）。
 */
const exclusions = [
  { table: 'DT-01', when: { C1: true }, reason: '締日が実質なし（2001-01-01）で、この行は普段の画面に出ない（TC-101 で画面の中だけ締日を書き換えて観察）' },
  { table: 'DT-02', when: { C4: true }, reason: 'POS 送信済みの行を作る手段が無い' },
  { table: 'DT-03', when: { C6: true, C7: false, C8: true, C9: true, C10: true }, reason: '支払方法が空の入金済みの行を DB に作る手段が無い（入金日も空なら画面からも DT-01 R4 で止まる）' },
  { table: 'DT-03', when: { C6: false, C7: true, C8: true, C9: true, C10: true }, reason: '画面からは DT-01 R4 で止まる（TC-03 で止まることを確認）' },
  { table: 'DT-03', when: { C6: true, C7: true, C8: true, C9: true, C10: true }, reason: '画面からは DT-01 R4 で止まる（TC-09 で止まることを確認）' },
  { table: 'DT-05', when: null, reason: '入金分配は次の段階' },
];

/** テストケースを評価するモデル（リポジトリルートからのパス。生成スクリプトが読む） */
const model = 'codecept/support/shimamura/salesGroupTransferModel.js';

module.exports = { conditions, actions, tables, fixtures, testCases, exclusions, model };
