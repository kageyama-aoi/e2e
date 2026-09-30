# VS Codeでこのリポジトリのコードを動かしながらデバッグする

このリポジトリのテストコード・Page Object・ヘルパー関数を、VS Codeでブレークポイントを置いて
1行ずつ動かしながら確認する方法をまとめる。`.vscode/launch.json` にすでに設定を用意済みなので、
基本は「ブレークポイントを置く → デバッグ設定を選ぶ → F5」だけで動く。

対象読者：`support/`・`pages/` 配下の関数が「実際どう動くのか」を、資料を読むだけでなく手元で
動かして確認したい人。

## 2つのやり方を使い分ける

| やり方 | 向いている場面 | ブラウザ | 速さ |
|---|---|---|---|
| [方法1: 関数を単体デバッグ](#方法1-関数を単体デバッグブラウザ不要一番手軽) | 純粋な関数（`prepareInput`・`buildExecutionPlan`など）の中身を確認したい | 不要 | 速い（数秒） |
| [方法2: E2Eフロー全体をデバッグ実行](#方法2-実際のe2eフロー全体をブラウザ込みでデバッグ実行) | 画面操作を含めた実際の流れを、ブラウザを見ながら1行ずつ追いたい | 必要（Playwright） | 遅い（画面起動あり） |

まず方法1で関数の挙動を理解し、画面操作を含めて確認したくなったら方法2に進むのがおすすめ。

---

## 方法1: 関数を単体デバッグ（ブラウザ不要・一番手軽）

`support/shimamura/syokai_helpers.js` の `prepareInput` / `buildExecutionPlan` のように、
CSVもブラウザも使わない**純粋な関数**は、requireして直接呼び出すだけで確認できる。

### 用意されているファイル

- `output/debug_syokai.js` — `syokai_helpers.js` を直接requireして、実データ
  （`data/shimamura/syokai_touroku_validation_errors.csv` の2行目・3行目相当）で呼び出す
  使い捨てスクリプト。`output/` は`.gitignore`済みなのでコミットされない。
- `.vscode/launch.json` — 下記の手順で使うVS Codeのデバッグ設定。

### 手順

1. `support/shimamura/syokai_helpers.js` を開き、`buildExecutionPlan` の中
   （例: `return { plan: steps.filter(...) };` の行）の**行番号の左**をクリックする。
   赤丸（ブレークポイント）が付く。
2. 左サイドバーの「実行とデバッグ」アイコン（虫に▷が乗ったアイコン）を開く。
3. 上部のドロップダウンで **「Debug: syokai_helpers 単体」** を選び、緑の▷（または`F5`）を押す。
4. 置いたブレークポイントで処理が止まる。止まった状態で：
   - 変数名にマウスホバー → 値がポップアップ表示される
   - 下の「デバッグコンソール」タブに `skipSteps` や `breakSpec.value` などと打つと、
     その場で式を評価できる
   - `F10` = 1行ずつ進む（ステップオーバー）
   - `F11` = 呼んでいる関数の中に入る（ステップイン）
   - `F5`  = 次のブレークポイントまで進める（続行）

### 動作確認済みの例

`output/debug_syokai.js` を素のNodeで実行すると、以下のように「実行しないステップは配列に
存在しない」ことが実際に確認できる（`docs/common/codeceptjs_design_patterns.md` の図3で
説明している内容と一致）。

```
$ node output/debug_syokai.js

--- buildExecutionPlan(rowCourseSetSkip) ---
{
  plan: [
    { step: 'class_select' },
    { step: 'switch_to_detail' },
    { step: 'class_apply' },
    { step: 'fill_dates' },
    { step: 'log_after_popup_close' },
    { step: 'verify_errors', expect: 'validation_error' }
  ]
}
```

`breakTarget: 'course_set', breakValue: 'SKIP'` を渡すと、`course_set` と `transaction` の
2ステップが `plan` から本当に消えていることが分かる。

---

## 方法2: 実際のE2Eフロー全体をブラウザ込みでデバッグ実行

`.vscode/launch.json` には、実際にPlaywrightでブラウザを起動して
`tests/shimamura/flow/syokai_touroku_test.js` を実行する設定も用意している。

| 設定名 | 内容 |
|---|---|
| Debug: shimamura 経理バリデーションエラー flow | `--grep "経理日付バリデーションエラー"` で異常系シナリオだけに絞って実行 |
| Debug: shimamura 新規受講生登録（正常系フル） | `--grep "@normal"` で正常系フルフローを実行 |

### 手順

1. `pages/shimamura/flow/SyokaiFlowPage.js`（`fillKeirisyoriScreenB` や `actions` の中）や
   `support/shimamura/syokai_helpers.js` に、方法1と同じようにブレークポイントを置く。
2. 「実行とデバッグ」パネルのドロップダウンで上記いずれかの設定を選び、`F5`。
3. `codecept.conf.js` の Playwright設定で `show: process.env.HEADLESS !== 'true'` となっているため、
   `HEADLESS` を設定していなければブラウザが実際に開いた状態でコードもステップ実行できる。

### 前提条件

- 環境変数 `SHIMAMURA_TANTOUSYA` が設定されていること（`env/.env.shimamura.testgcp` に設定済み）。
- 実行プロファイル `--profile shimamura.testgcp` に対応する `env/.env.shimamura.testgcp` が存在すること。

### VS Codeなしでコマンドラインだけで動かす場合

同じテストはコマンドラインだけでも実行できる（デバッグはできないが、動作確認だけなら十分）。

```bash
npx codeceptjs run ./tests/shimamura/flow/syokai_touroku_test.js --profile shimamura.testgcp --grep "経理日付バリデーションエラー"
```

---

## 補足：launch.jsonの中身

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug: syokai_helpers 単体",
      "program": "${workspaceFolder}/output/debug_syokai.js",
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug: shimamura 経理バリデーションエラー flow",
      "program": "${workspaceFolder}/node_modules/codeceptjs/bin/codecept.js",
      "args": [
        "run",
        "./tests/shimamura/flow/syokai_touroku_test.js",
        "--profile", "shimamura.testgcp",
        "--grep", "経理日付バリデーションエラー"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug: shimamura 新規受講生登録（正常系フル）",
      "program": "${workspaceFolder}/node_modules/codeceptjs/bin/codecept.js",
      "args": [
        "run",
        "./tests/shimamura/flow/syokai_touroku_test.js",
        "--profile", "shimamura.testgcp",
        "--grep", "@normal"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

`program` に直接 `node_modules/codeceptjs/bin/codecept.js` を指定しているのは、
Windows環境で `npx`（`npx.cmd`）をVS Codeの`runtimeExecutable`から呼ぶ際の解決トラブルを
避けるため。`codeceptjs` パッケージの実体エントリポイントを直接指定する方が確実。

## 他のプロダクト・他のテストで応用する場合

- `program` の `args` にあるテストファイルパス・`--profile`・`--grep` を、対象のテストに
  合わせて書き換えるだけで同じ仕組みが使える（tframe や taskreport でも同様）。
- 純粋な関数（ブラウザ操作を含まないヘルパー）を単体デバッグしたい場合は、方法1のように
  `output/` 配下に使い捨てスクリプトを作り、`launch.json` に設定を1つ追加すればよい。
