# pages/tframe/_common/menuSnapshot/

tframe の左サイドメニューを **実機で採取したスナップショット**（env 別）。

`sideMenus.js` は環境非依存（culture 限定 / juku 限定を表現できない）ため、
`docs/tframe/menu_coverage.md` のアイコン別マッピング表を自動生成する
`scripts/docs/gen_tframe_menu_coverage.js` はこの JSON を入力にする。

## ファイル

| ファイル | 採取プロファイル | 接続先 |
|---|---|---|
| `culture_beta.json` | `tframe.culture_beta` | `https://newculture.e-school.jp/beta/` |
| `juku_beta.json` | `tframe.juku_beta` | `https://newsms.e-school.jp/beta/`（ログイン時に日本語を選択） |

各ファイル冒頭の `capturedAt` が採取日。

## 構造

```jsonc
{
  "capturedAt": "YYYY-MM-DD",
  "profile": "...", "product": "culture|juku", "baseUrl": "...",
  "topMenu": [ { "label": "受講生", "route": "student/sw/_default" }, ... ],
  "sideMenu": {
    "<iconKey>": {
      "iconLabel": "受講生",
      "groups": [
        { "name": "受講生", "items": [ { "label": "受講生登録", "route": "student/ew/_default" }, ... ] }
      ]
    }
  }
}
```

- `route` は `index.php?r=` の値（デコード済み）。`?menuModule=student` / `?calRowType=course` のような
  分岐パラメータは route 末尾に付けている。
- `items` が空のグループ = メニュー枠だけ存在し項目0件（その env では機能が無効）。

## 更新方法（メニュー改定時 / 定期）

現状は手動採取。管理者アカウントで各 env にログインし、左メニュー全アイコンを展開して
`#sideBar li.dropdown` を走査 → この形式で書き出す。
将来 `scripts/html/fetch_tframe_menus.js` で自動化予定（menu_coverage.md フェーズ2）。

更新したら `npm run docs:menu-coverage` で `menu_coverage.md` を再生成すること。
