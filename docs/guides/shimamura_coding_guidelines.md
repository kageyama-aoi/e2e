# しまむらテスト コーディング規約（案）

## 目的
- UI変更に強いテスト設計を維持する
- しまむら系テストの可読性・再利用性を高める
- 役割分担を明確にして修正コストを下げる

## ディレクトリ責務
- `tests/`: シナリオ本体（What/意図）を記述する層
- `pages/`: 画面操作・セレクタを集約する層（Page Object）
- `support/`: テスト横断の共通処理
- `support/shimamura/`: しまむら固有の共通処理

## 依存ルール
- `tests/` → `pages/`・`support/` にのみ依存
- `pages/` → `support/` には依存してよい（ユーティリティ共通化）
- `support/` → `tests/`・`pages/` に依存しない

## 命名規則
- 関数: `verbNoun`（例: `openStudentTab`, `searchCandidate`）
- 画面遷移: `navigateTo...` / `open...` / `goTo...`
- 既存の `ShouldBeOn...` は残すが、新規追加は `open...` を推奨

## セレクタ管理
- セレクタは `S` オブジェクトに集約
  - `S.fields`, `S.buttons`, `S.tabs`, `S.results` などで分類
- 文字列直書きは最小限（ハードコードは `S` 内へ）

## ログ方針
- `I.say` は画面遷移や重要アクションの節目のみ
- 連続操作の都度ログは避ける

## 待機方針
- `I.wait(秒)` の多用は禁止
- 原則は `I.waitForElement` / `I.waitForVisible` / URL監視
- 例外的に `I.wait` を使う場合はコメントで理由を書く

## CSV/データ
- CSV 読み込みは `support/utils.js` の `readCsv` に統一
- 独自パーサは作らない

## エラーハンドリング
- 必須環境変数の未設定は `throw new Error` で即時停止
- エラーメッセージは「何が不足か」を明示

## テスト構成
- 1 Scenario = 1 フロー
- Arrange → Act → Assert を意識した順序
- 画面遷移やUI操作の詳細は Page Object / Utils へ寄せる

## 推奨パターン例
```js
// tests/xxx_test.js
Scenario('〜', async ({ I, somePage }) => {
  const input = { ... };
  await somePage.navigateTo(...);
  await doSomething(I, input);
  I.saveScreenshotWithTimestamp('...');
});
```

```js
// pages/SomePage.js
const { I } = inject();
const S = { ... };

module.exports = {
  navigateTo() { ... },
  clickSomething() { ... },
};
```

```js
// support/shimamura/utils.js
async function toggleGroupmenu(I, { icon_id, menuname }) { ... }
```

## 運用ルール
- Page Object の修正は「画面仕様変更時のみ」
- テスト変更時にセレクタが出てきたら `pages/` へ移動する
- 共通化できる処理は `support/shimamura/` へ集約
