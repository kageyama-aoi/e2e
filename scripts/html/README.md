# scripts/html/ — 画面 HTML の取得と抜き出し

Page Object やテストを作る前に、画面のフォーム項目（`name` / `id`）やリンクを調べるための置き場です。
**人も AI も、画面を調べるときはまずここを読んでください。**

## フォルダの中身

```
scripts/html/
├── README.md              ← このファイル
├── fetch_*.js             ← 実機にログインして HTML を取ってくる道具
├── extract_*.{py,js}      ← 手元の HTML から必要な部分を抜き出す道具
├── shimamura_route.js     ← URL を「画面を区別する route 文字列」にする部品
├── snapshots/             ← 取ってきた画面 HTML（ある時点の写し）
│   └── tframe/            ← tframe の画面（git 管理）
└── inputs/                ← 人が手で貼る入力（git 管理）
```

ここに置かないもの（git に入らない生成物は `output/` へ）:

| もの | 置き場 |
|---|---|
| shimamura の取ってきた画面 HTML・リンク JSON | `output/html/shimamura/` |
| tframe の取得時のスクリーンショット・リンク JSON | `output/html/tframe/` |
| 抜き出しの結果 | `output/html/extract/`・`output/probe/<名前>/` |

## 画面の HTML を探すとき

| 製品 | 場所 | git | ファイル名 |
|---|---|---|---|
| tframe | `snapshots/tframe/` | 管理 | `<画面>_list.html`＝一覧（35 件）、`<画面>_touroku.html`＝登録（19 件）、`chosekin_person_popup.html` |
| shimamura | `output/html/shimamura/` | 対象外（手元にだけある） | `<名前>.html`（名前は `fetch_shimamura_screens.js` の TARGETS） |

- `<画面>` は tframe の URL の `r=` の値（例 `index.php?r=staff%2Flist` → `staff_list.html`）
- **snapshot は「取った時点」の写しです。** 画面が変わっていることがあるので、いつ取ったかを `git log -1 --format=%ad -- scripts/html/snapshots/tframe/<ファイル>` で確かめてから使う。古い・項目が見つからないときは取り直す
- shimamura は git に入れていない（ログイン中の CSRF トークン入り・サイズが大きい）。ほかの PC や消えた後は `fetch_shimamura_screens.js` で取り直す

### 項目を調べる例

```bash
# tframe 登録画面の入力欄の id
grep -oE 'id="[^"]+"' scripts/html/snapshots/tframe/branch_touroku.html | sort -u

# shimamura 画面の name 属性
grep -oE 'name="[^"]+"' output/html/shimamura/<名前>.html | sort -u

# どの snapshot にその項目があるか
grep -l 'name="school_branch_id"' scripts/html/snapshots/tframe/*.html
```

## 取り直す・新しい画面を足すとき

| やりたいこと | コマンド |
|---|---|
| tframe の画面を取る（対象は中の `TARGETS`） | `node scripts/html/fetch_tframe_forms.js tframe.culture_beta` |
| shimamura の画面を取る（対象は中の `TARGETS`） | `node scripts/html/fetch_shimamura_screens.js shimamura.testgcp` |
| shimamura のメニュー構成（menuSnapshot JSON）を取り直す | `node scripts/html/fetch_shimamura_menus.js` |

新しい画面は、それぞれの道具の `TARGETS` に 1 行足してから実行します（手順はスキル `/tframe-html-fetch`・`/shimamura-html-fetch`）。

## 手で貼る入力（inputs/）

| ファイル | 使う道具 | 中身 |
|---|---|---|
| `tframe_form.html` | `extract_tframe_form_fields.js`（既定の入力） | ブラウザの DevTools でコピーした登録画面の `#rootWidget`。実行するとテストデータの雛形と PO の fill メソッドが `output/html/extract/` に出る |
| `tframe_teacher_sample.html` | 同上（試すとき） | 講師登録画面のサンプル |
| `shimamura_side_menu.html` | `extract_shimamura_side_menu_groups.py`（既定の入力） | サイドメニューの HTML |

道具ごとの詳しい使い方は [scripts/README.md](../README.md) にあります。
