# pages/shimamura/_common/menuSnapshot/

shimamura の上部アイコン × 左サイドバーを **実機で採取したスナップショット**（env 別）。

`docs/shimamura/menu_coverage.md` のサマリ・アイコン別表を自動生成する
`scripts/docs/gen_shimamura_menu_coverage.js` はこの JSON を入力にする（#251）。

## ファイル

| ファイル | 採取プロファイル |
|---|---|
| `testgcp.json` | `shimamura.testgcp` |

各ファイル冒頭の `capturedAt` が採取日。

## 構造

```jsonc
{
  "capturedAt": "YYYY-MM-DD",
  "profile": "shimamura.testgcp", "product": "shimamura", "baseUrl": "...",
  "topMenu": [ { "label": "受講生", "route": "Student/index" }, ... ],
  "sideMenu": {
    "<module>": {
      "iconLabel": "受講生", "iconRoute": "Student/index",
      "groups": [
        { "name": "ショートカット", "items": [ { "label": "受講生検索", "route": "Student/index" }, ... ] },
        { "name": "問合せ", "toggleId": "submenu__application_sub", "items": [ ... ] }
      ]
    }
  }
}
```

- `route` は `module/action` ＋ 画面を区別するパラメータ。正規化規則は `scripts/html/shimamura_route.js`
  （校舎 ID・当日日付・UUID など採取のたびに変わる値は落とす／伏せる）。
- `toggleId` は折りたたみグループの展開対象 ID（`sideMenus.js` の `collapseToggle.icon_id` に対応）。
- 「ショートカット」はグループ見出しより前にある常時表示の項目。
- 管理（右上リンク）は左サイドバーが無いため `groups` は空。

## 更新方法（メニュー改定時）

```bash
node scripts/html/fetch_shimamura_menus.js shimamura.testgcp   # ログインしてサイドバーを読むだけ（データ変更なし）
npm run docs:menu-coverage:shimamura
```
