# CodeceptJS 関数リファレンス

このプロジェクトでは、E2E（End-to-End）テストを実行するために、CodeceptJSの `I` オブジェクトが持つ様々なメソッドを利用しています。このドキュメントは、プロジェクト内で主に使用されているメソッドの概要と、公式ドキュメントへのリンクをまとめたものです。

より詳細な情報については、[CodeceptJS Playwright Helper Documentation](https://codecept.io/helpers/Playwright/) を参照してください。

| メソッド | 概要 | 用例 | ドキュメント |
|:---|:---|:---:|:---|
| `amOnPage()` | 指定されたURLに移動します。 | [見る](#amonpage) | [Link](https://codecept.io/helpers/Playwright/#amonpage) |
| `click()` | リンク、ボタン、またはチェックボックスなどの要素をクリックします。 | [見る](#click) | [Link](https://codecept.io/helpers/Playwright/#click) |
| `fail()` | テストを手動で失敗させます。 | [Link](https://codecept.io/helpers/Playwright/#fail) |
| `fillField()` | テキストフィールドやテキストエリアに値を入力します。 | [見る](#fillfield) | [Link](https://codecept.io/helpers/Playwright/#fillfield) |
| `grabCssPropertyFrom()` | 要素から指定されたCSSプロパティの値を取得します。 | [Link](https://codecept.io/helpers/Playwright/#grabcsspropertyfrom) |
| `grabCurrentUrl()` | 現在のページのURLを取得します。 | [Link](https://codecept.io/helpers/Playwright/#grabcurrenturl) |
| `grabNumberOfVisibleElements()` | 指定されたセレクタに一致する表示されている要素の数を取得します。 | [Link](https://codecept.io/helpers/Playwright/#grabnumberofvisibleelements) |
| `grabTextFrom()` | 要素からテキストコンテンツを取得します。 | [見る](#grabtextfrom) | [Link](https://codecept.io/helpers/Playwright/#grabtextfrom) |
| `grabTextFromAll()` | 指定されたセレクタに一致するすべての要素からテキストコンテンツを配列として取得します。 | [Link](https://codecept.io/helpers/Playwright/#grabtextfromall) |
| `retry()` | 失敗した場合に特定のアクションを再試行します。 | [Link](https://codecept.io/helpers/Playwright/#retry) |
| `saveLogToFile()` | カスタムログメッセージをファイルに保存します。 (カスタムメソッド) | [Link](# (custom-method)) |
| `saveScreenshot()` | 現在のページのスクリーンショットを撮影します。 | [Link](https://codecept.io/helpers/Playwright/#savescreenshot) |
| `saveScreenshotWithTimestamp()` | タイムスタンプ付きでスクリーンショットを保存します。 (カスタムメソッド) | [Link](# (custom-method)) |
| `say()` | テストの実行中にコンソールにメッセージを出力します。 | [見る](#say) | [Link](https://codecept.io/helpers/Playwright/#say) |
| `scrollIntoView()` | 指定された要素がビューポートに表示されるまでスクロールします。 | [Link](https://codecept.io/helpers/Playwright/#scrollintoview) |
| `see()` | ページ上に指定されたテキストが表示されていることを確認します。 | [見る](#see) | [Link](https://codecept.io/helpers/Playwright/#see) |
| `seeElement()` | ページ上に指定された要素が存在することを確認します。 | [見る](#see) | [Link](https://codecept.io/helpers/Playwright/#seeelement) |
| `selectOption()` | ドロップダウンリストやリストボックスからオプションを選択します。 | [見る](#selectoption) | [Link](https://codecept.io/helpers/Playwright/#selectoption) |
| `switchToNextTab()` | 次のブラウザタブに切り替えます。 | [見る](#switchtonexttab) | [Link](https://codecept.io/helpers/Playwright/#switchtonexttab) |
| `wait()` | 指定された秒数だけ実行を一時停止します。 | [Link](https://codecept.io/helpers/Playwright/#wait) |
| `waitForElement()` | 指定された要素がDOMに表示されるまで待ちます。 | [見る](#waitforelement) | [Link](https://codecept.io/helpers/Playwright/#waitforelement) |
| `waitForEnabled()` | 指定された要素が有効化（enabled）されるまで待ちます。 | [Link](https://codecept.io/helpers/Playwright/#waitforenabled) |

---

## 用例 (Usage Examples)

ここでは、プロジェクト内で実際に使われているコードを例に、各メソッドの具体的な利用シーンを解説します。

### `amOnPage()` <a name='amonpage'></a>

**目的:** テストを開始するページや、特定のURLへ遷移するために使用します。

**コード例:**
```javascript
// from: tests/Taskreport/taskreport_sample_test.js
Scenario('サンプルテスト: ログイン画面を開く', async ({ I, taskReportLoginPage }) => {
  // .env.taskreport ファイルに定義したURLへ遷移します
  I.amOnPage(process.env.BASE_URL);
  
  // ページオブジェクトのメソッドを呼び出します
  taskReportLoginPage.visit();
// ...
```

**解説:**
`Scenario`の最初に`I.amOnPage()`を呼び出し、`.env`ファイルで定義されたベースURLにアクセスしています。これは多くのテストシナリオの起点となります。

---

### `fillField()` <a name='fillfield'></a>

**目的:** フォームの入力フィールド（`<input>`や`<textarea>`）にテキストを入力します。

**コード例 1: IDと文字列で指定**
```javascript
// from: tests/shimamura/taikai.js
async function ShouldBeOnTaikai(I, finalYear, finalMonth) {
  // ...
  I.fillField(S.fields.finalYear, finalYear);
  I.fillField(S.fields.finalMonth, finalMonth);
  // ...
}
```
**解説:**
退会処理の画面で、最終在籍年と月を入力するために使用しています。`S.fields.finalYear`は`#final_enrollment_year`のようなCSSセレクタ（ID）を保持する変数です。

**コード例 2: Page Objectとsecret()の利用**
```javascript
// from: pages/tframe/LoginMyPage.js
// ...
  login(username, password) {
    I.amOnPage(process.env.LOGIN_MYPAGE_URL);
    I.fillField(this.locators.usernameField, username);
    I.fillField(this.locators.passwordField, secret(password));
    I.click(this.locators.loginButton);
  }
// ...
```
**解説:**
Page Objectパターンの中で、ログイン処理を実装しています。`this.locators`で定義されたセレクタ（例: `usernameField: '#login_id'`）を使い、コードの可読性とメンテナンス性を高めています。
また、パスワードの入力には`secret()`関数を使い、ログにパスワードが平文で表示されないように配慮しています。

---

### `click()` <a name='click'></a>

**目的:** ボタンやリンクなど、クリック可能な要素を操作します。

**コード例 1: テキストでボタンを指定**
```javascript
// from: tests/shimamura/shimamura_class_member_registration_test.js
// ...
    I.selectOption('course_category','発表会');
    I.click('検索');
    I.say("Search Result Page URL: " + await I.grabCurrentUrl());
// ...
```
**解説:**
クラス一覧画面で、フォームに値を入力した後、「検索」というテキストを持つボタンをクリックして検索を実行しています。

**コード例 2: 複雑なセレクタで要素を指定**
```javascript
// from: tests/shimamura/shimamura_class_member_registration_test.js
// ...
    const course_name = await I.grabTextFrom('a.listViewTdLinkS1');
    I.say(`リンクラベル: ${course_name}`);
    I.click(locate('.listViewTdLinkS1').at(2));
    I.say("Course Detail Page URL: " + await I.grabCurrentUrl());
// ...
```
**解説:**
`locate()`ヘルパーを使い、CSSクラスが`.listViewTdLinkS1`である要素（リンク）の中から2番目のものをクリックしています。これにより、検索結果の中から特定の行を選択する操作を実現しています。

---

### `see()` / `seeElement()` <a name='see'></a>

**目的:** ページ上に特定のテキストや要素が表示されているか（存在するか）を検証します。テストが期待通りに進んでいるかを確認するアサーション（表明）の役割を担います。

**コード例 1: 特定の領域にテキストが表示されているか確認**
```javascript
// from: tests/tframe/96-60_teacher_payment_report_test.js
// ...
    I.say('Step 5: レスポンス検証（現状はサーバーエラーを期待）');
    I.see('Internal Server Error', jsonInputPage.locators.responseArea);
// ...
```
**解説:**
APIのレスポンスを表示する特定の領域（`jsonInputPage.locators.responseArea`）内に、"Internal Server Error"という文字列が表示されていることを確認しています。これにより、意図したエラーハンドリングが行われているかをテストしています。

**コード例 2: 要素の状態を確認**
```javascript
// from: tests/shimamura/shimamura_class_member_registration_test.js
// ...
    I.waitForElement('#tab_link_student_tab', 10);
    I.click('#tab_link_student_tab');
    I.say("Student Tab Page URL: " + await I.grabCurrentUrl());
    I.seeElement('#tab_li_student_tab.active');   
// ...
```
**解説:**
`I.click()`でタブをクリックした後、そのタブがアクティブ状態になった（CSSクラス`.active`が付与された）ことを`I.seeElement()`で確認しています。これにより、UIが正しく反応したことを検証しています。
---

### `selectOption()` <a name='selectoption'></a>

**目的:** ドロップダウンリスト（`<select>`要素）から特定のオプションを選択します。

**コード例:**
```javascript
// from: tests/shimamura/shimamura_class_member_registration_test.js
async function ClassViewOperate() {
  I.fillField('name', '鈴木');
  I.selectOption('display_hyouji','すべて');
  I.selectOption('contact_status','下記の項目のすべて');
  I.selectOption('area_id','すべて');
  I.selectOption('school_id','すべて');
  I.selectOption('course_category','発表会');
  I.click('検索');
  // ...
}
```

**解説:**
クラス一覧画面の検索フォームで、複数のドロップダウンリスト（表示、連絡状況、エリア、店舗、コースカテゴリ）の値を設定するために連続して使用されています。第一引数に`<select>`要素の`name`属性やID、第二引数に選択したいオプションの表示テキストや`value`属性を指定します。

---

### `grabTextFrom()` <a name='grabtextfrom'></a>

**目的:** ページ上の特定の要素からテキストコンテンツを取得し、変数に格納して後続の処理で利用します。

**コード例:**
```javascript
// from: tests/shimamura/shimamura_class_member_registration_test.js
async function ClassViewOperate() {
  // ...
  I.waitForElement('.listViewTdLinkS1',10);
  const course_name = await I.grabTextFrom('a.listViewTdLinkS1');
  I.say(`リンクラベル: ${course_name}`);
  I.click(locate('.listViewTdLinkS1').at(2));
  // ...
  return course_name;
}
```

**解説:**
検索結果一覧の最初の行からコース名（`<a>`タグのテキスト）を取得し、`course_name`という変数に保存しています。取得した値は`I.say`でログに出力されたり、後のアサーションや別の操作で利用されたりします。非同期処理であるため`await`が必要です。

---

### `waitForElement()` <a name='waitforelement'></a>

**目的:** ページが読み込まれたり、JavaScriptが実行されたりした後に、特定の要素がDOM上に表示されるまで処理を待機させます。非同期なUIのテストを安定させるために不可欠です。

**コード例:**
```javascript
// from: tests/shimamura/shimamura_class_member_registration_test.js
async function ClassViewOperate() {
  // ...
  I.click('検索');
  I.say("Search Result Page URL: " + await I.grabCurrentUrl());
  I.waitForElement('.listViewTdLinkS1',10);
  const course_name = await I.grabTextFrom('a.listViewTdLinkS1');
  // ...
}
```

**解説:**
「検索」ボタンをクリックした後、検索結果（`.listViewTdLinkS1`というCSSクラスを持つ要素）が表示されるまで最大10秒間待機します。これにより、検索処理が完了して結果が表示される前に次の`I.grabTextFrom`が実行されてテストが失敗する、といった競合状態を防ぎます。

---

### `say()` <a name='say'></a>

**目的:** テストの実行ログに任意のメッセージを出力します。テストがどのステップを実行しているのか、どのような値が変数に格納されているのかをリアルタイムで確認できるため、デバッグやメンテナンスに非常に役立ちます。

**コード例:**
```javascript
// from: tests/shimamura/shimamura_class_member_registration_test.js
async function ClassOperate(){
  I.waitForElement('#tab_link_student_tab', 10);
  I.click('#tab_link_student_tab');
  I.say("Student Tab Page URL: " + await I.grabCurrentUrl());
  I.seeElement('#tab_li_student_tab.active');   
  I.selectOption('#cs_course_seletion_pulldown', course_name); 
  I.click('発表会選択');
  I.say("Presentation Selection Page URL: " + await I.grabCurrentUrl());
}
```

**解説:**
ページのURLが変わるような重要な操作の後、`I.grabCurrentUrl()`で現在のURLを取得し、`I.say()`でログに出力しています。これにより、テスト実行がどの画面で、どのURLで行われているかを正確に追跡できます。

---

### `switchToNextTab()` <a name='switchtonexttab'></a>

**目的:** リンクやボタンをクリックした結果、新しいブラウザタブが開かれた場合に、操作の対象をその新しいタブに切り替えます。

**コード例:**
```javascript
// from: tests/shimamura/syokai_touroku.js
async function ShouldBeOnKeirisyoriScreenB(I, { class_name01, keiyaku_date, kaishi_date }) {
  // ...
  I.click(S.button.class_select);
  await ShouldBoOnClassSelectPopup(I, S, class_name01);

  I.switchToNextTab();
  I.waitForElement(locate('body').withText(S.screen.name), 5);
  // ...
}
```

**解説:**
`syokai_touroku.js`のテストでは、「クラス選択」ボタン（`S.button.class_select`）を押すと、クラスを検索するためのポップアップが新しいタブで開かれます。`I.switchToNextTab()`を呼び出すことで、CodeceptJSの操作対象がその新しいタブに移り、新しいタブ内での要素の検索や操作（`fillField`や`click`など）が可能になります。操作が終わったら、元のタブに戻るために`I.switchToPreviousTab()`を使うこともあります。
