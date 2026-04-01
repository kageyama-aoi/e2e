"""
extract_side_menu_groups.py

HTMLソースからサイドメニューのグループと子項目を抽出し、
JSON / CSV（UTF-8）で出力します。

想定構造:
- グループ: <li class="dropdown" id="..._wrap"> の親リンク
- 子項目: グループ配下の <ul> 内にある <li><a ...>...</a></li>

README
======

概要:
- サイドメニューHTMLを「グループ」と「子メニュー」に分解して出力する補助ツール。
- テストコードや補助スクリプトから読みやすいように、構造化JSONを優先している。

主な用途:
- 画面メニュー構造の可視化
- セレクタ定義やメニュー定義の元データ作成
- グループ名と子項目名だけを別JSONとして管理

入力:
- HTMLファイル1件
- 既定入力ファイル: `scripts/input/side_menu_extract/source.html`
- 文字コードは `utf-8` を優先し、失敗時は `cp932` を試行

既定の出力先:
- 出力先ディレクトリ: `scripts/output/side_menu_extract/<先頭の日本語>/`
- JSON: `<先頭の日本語>_<timestamp>_side_menu_groups.json`
- JSON(日本語のみ): `<先頭の日本語>_<timestamp>_side_menu_groups_ja.json`
- CSV: `<先頭の日本語>_<timestamp>_side_menu_groups.csv`

使い方:
  python scripts/extract_side_menu_groups.py
  # 既定入力: scripts/input/side_menu_extract/source.html

  python scripts/extract_side_menu_groups.py "./scripts/input/side_menu_extract/source.html"

日本語だけの軽量JSON:
  python scripts/extract_side_menu_groups.py "./scripts/input/side_menu_extract/source.html" --jp-only

CSV出力:
  python scripts/extract_side_menu_groups.py "./scripts/input/side_menu_extract/source.html" --format csv

通常JSONの構造:
{
  "group_count": 5,
  "groups": [
    {
      "id": "email_email_main_wrap",
      "name": "Eメール",
      "toggle_target": "email_email_main",
      "items": [
        {
          "id": "email_email_main_email_list",
          "name": "Eメール一覧",
          "title": "Eメール一覧",
          "href": "/test/index.php?r=email%2Fsw%2F_default",
          "selected": true
        }
      ]
    }
  ]
}

日本語のみJSONの構造:
{
  "group_count": 5,
  "groups": [
    {
      "name": "Eメール",
      "items": ["Eメール一覧", "Eメールテンプレート登録"]
    }
  ]
}

判定ルール:
- `li.dropdown` をグループとして扱う
- グループ直下の親リンク文字列をグループ名として扱う
- 親リンクの `href="#..."` から展開先 `ul` を特定する
- その `ul` 配下の `li > a` を子項目として扱う
- `onclick="tf.misc.onClickSideMenuItem('...')"` があれば項目IDとして保持する
- `class="side-menu-item-selected"` を持つリンクは `selected: true`

注意:
- HTML構造が大きく変わると抽出条件の見直しが必要
- 「日本語のみJSON」は表示名だけを残すため、リンクやIDは保持しない
- 既定ファイル名は、抽出結果の先頭に出た日本語とタイムスタンプから自動生成する
- 入力HTMLを手で貼り付ける運用を想定しているため、`scripts/input/side_menu_extract/source.html` を編集すればそのまま実行できる
"""

import argparse
import csv
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional

DEFAULT_INPUT = os.path.join(".", "scripts", "input", "side_menu_extract", "source.html")
DEFAULT_OUTPUT_DIR = os.path.join(".", "scripts", "output", "side_menu_extract")
CSV_HEADERS = [
    "group_id",
    "group_name",
    "toggle_target",
    "item_id",
    "item_name",
    "href",
    "selected",
]


@dataclass
class MenuItem:
    """子メニュー1件分の保持構造。"""

    id: str = ""
    name: str = ""
    title: str = ""
    href: str = ""
    selected: bool = False


@dataclass
class MenuGroup:
    """グループメニュー1件分の保持構造。"""

    id: str = ""
    name: str = ""
    toggle_target: str = ""
    items: List[MenuItem] = field(default_factory=list)


class SideMenuGroupExtractor(HTMLParser):
    """サイドメニューのグループと子項目を抽出する。"""

    def __init__(self) -> None:
        super().__init__()
        self.groups: List[MenuGroup] = []
        self.current_group: Optional[MenuGroup] = None
        self.current_item: Optional[MenuItem] = None
        self.in_group_anchor = False
        self.in_item_anchor = False
        self.group_ul_depth = 0
        self.item_li_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs = dict(attrs)

        if tag == "li" and self._is_group_li(attrs):
            self.current_group = MenuGroup(id=attrs.get("id", ""))
            self.current_item = None
            self.group_ul_depth = 0
            self.item_li_depth = 0
            return

        if not self.current_group:
            return

        if tag == "a" and self.group_ul_depth == 0:
            self._start_group_anchor(attrs)
            return

        if tag == "ul" and self._is_target_group_list(attrs):
            self.group_ul_depth = 1
            return

        if self.group_ul_depth > 0:
            if tag == "ul":
                self.group_ul_depth += 1
                return

            if tag == "li":
                self.item_li_depth += 1
                if self.item_li_depth == 1:
                    self.current_item = MenuItem()
                return

            if tag == "a" and self.item_li_depth > 0 and self.current_item is not None:
                self._start_item_anchor(attrs)

    def handle_data(self, data: str) -> None:
        text = self._normalize_text(data)
        if not text:
            return

        if self.in_group_anchor and self.current_group is not None:
            self.current_group.name = f"{self.current_group.name} {text}".strip()
            return

        if self.in_item_anchor and self.current_item is not None:
            self.current_item.name = f"{self.current_item.name} {text}".strip()

    def handle_endtag(self, tag: str) -> None:
        if self.in_group_anchor and tag == "a":
            self.in_group_anchor = False
            return

        if self.in_item_anchor and tag == "a":
            self.in_item_anchor = False
            return

        if self.group_ul_depth > 0:
            if tag == "li" and self.item_li_depth > 0:
                self.item_li_depth -= 1
                if self.item_li_depth == 0 and self.current_group and self.current_item:
                    if self.current_item.name or self.current_item.href:
                        self.current_group.items.append(self.current_item)
                    self.current_item = None
                return

            if tag == "ul":
                self.group_ul_depth -= 1
                return

        if tag == "li" and self.current_group is not None:
            self._finalize_current_group()
            self.groups.append(self.current_group)
            self.current_group = None

    def as_dicts(self) -> List[Dict[str, Any]]:
        """出力用に dataclass を辞書化する。"""
        return [asdict(group) for group in self.groups]

    def _start_group_anchor(self, attrs: Dict[str, str]) -> None:
        """グループ名アンカーの読み取りを開始する。"""
        self.in_group_anchor = True
        self.current_group.toggle_target = self._normalize_toggle_target(attrs.get("href", ""))

    def _start_item_anchor(self, attrs: Dict[str, str]) -> None:
        """子項目アンカーの読み取りを開始する。"""
        self.in_item_anchor = True
        self.current_item.href = attrs.get("href", "")
        self.current_item.title = attrs.get("title", "")
        self.current_item.id = self._extract_onclick_item_id(attrs.get("onclick", ""))
        self.current_item.selected = "side-menu-item-selected" in attrs.get("class", "")

    def _is_target_group_list(self, attrs: Dict[str, str]) -> bool:
        """現在のグループが展開する ul かを判定する。"""
        return bool(self.current_group and self.current_group.toggle_target) and (
            attrs.get("id") == self.current_group.toggle_target
        )

    def _finalize_current_group(self) -> None:
        """グループ・子項目のテキストを正規化する。"""
        self.current_group.name = self._normalize_text(self.current_group.name)
        for item in self.current_group.items:
            item.name = self._normalize_text(item.name)
            item.title = self._normalize_text(item.title)

    @staticmethod
    def _is_group_li(attrs: Dict[str, str]) -> bool:
        class_names = attrs.get("class", "")
        return "dropdown" in class_names.split()

    @staticmethod
    def _normalize_text(value: str) -> str:
        return re.sub(r"\s+", " ", value).strip()

    @staticmethod
    def _normalize_toggle_target(href: str) -> str:
        return href[1:] if href.startswith("#") else href

    @staticmethod
    def _extract_onclick_item_id(onclick: str) -> str:
        match = re.search(r"onClickSideMenuItem\('([^']+)'\)", onclick)
        return match.group(1) if match else ""


def parse_args() -> argparse.Namespace:
    """CLI引数を解析する。"""
    parser = argparse.ArgumentParser(
        description="Extract side menu groups and items from HTML."
    )
    parser.add_argument("input", nargs="?", help="Input HTML file")
    parser.add_argument(
        "--encoding",
        default="auto",
        help="Input file encoding (default: auto; try utf-8 then cp932)",
    )
    parser.add_argument(
        "--errors",
        default="strict",
        choices=["strict", "replace", "ignore"],
        help="Encoding error handling (default: strict)",
    )
    parser.add_argument(
        "--output",
        help="Output file path (UTF-8). If omitted, prints to stdout.",
    )
    parser.add_argument(
        "--format",
        choices=["json", "csv"],
        default="json",
        help="Output format (default: json)",
    )
    parser.add_argument(
        "--jp-only",
        action="store_true",
        help="JSON only: output Japanese-only compact structure",
    )
    return parser.parse_args()


def detect_and_read_input(path: str, encoding: str, errors: str) -> str:
    """入力HTMLを文字コード判定付きで読み込む。"""
    if encoding != "auto":
        with open(path, "r", encoding=encoding, errors=errors) as file:
            return file.read()

    try:
        with open(path, "r", encoding="utf-8", errors="strict") as file:
            html = file.read()
        print("[info] input encoding detected: utf-8", file=sys.stderr)
        return html
    except UnicodeDecodeError:
        try:
            with open(path, "r", encoding="cp932", errors="strict") as file:
                html = file.read()
            print("[info] input encoding detected: cp932 (Shift-JIS)", file=sys.stderr)
            return html
        except UnicodeDecodeError:
            with open(path, "r", encoding="utf-8", errors="replace") as file:
                html = file.read()
            print("[warn] input encoding unclear; decoded with utf-8 (replace)", file=sys.stderr)
            return html


def to_output_payload(groups: List[Dict[str, Any]]) -> Dict[str, Any]:
    """出力用のコンパクトな構造に整形する。"""
    return {
        "group_count": len(groups),
        "groups": groups,
    }


def to_output_payload_ja(groups: List[Dict[str, Any]]) -> Dict[str, Any]:
    """日本語だけの軽量な出力構造に整形する。"""
    return {
        "group_count": len(groups),
        "groups": [
            {
                "name": group["name"],
                "items": [item["name"] for item in group["items"]],
            }
            for group in groups
        ],
    }


def write_json(payload: Dict[str, Any], output: Optional[str]) -> None:
    """JSON出力（UTF-8）。"""
    content = json.dumps(payload, ensure_ascii=False, indent=2)
    if output:
        with open(output, "w", encoding="utf-8", newline="") as file:
            file.write(content)
    else:
        print(content)


def write_output_csv(groups: List[Dict[str, Any]], output: Optional[str]) -> None:
    """CSV出力（UTF-8）。"""
    rows = []
    for group in groups:
        if not group["items"]:
            rows.append([group["id"], group["name"], group["toggle_target"], "", "", "", False])
            continue
        for item in group["items"]:
            rows.append(
                [
                    group["id"],
                    group["name"],
                    group["toggle_target"],
                    item["id"],
                    item["name"],
                    item["href"],
                    item["selected"],
                ]
            )

    if output:
        with open(output, "w", encoding="utf-8", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(CSV_HEADERS)
            writer.writerows(rows)
    else:
        writer = csv.writer(sys.stdout)
        writer.writerow(CSV_HEADERS)
        writer.writerows(rows)


def find_first_japanese_label(groups: List[Dict[str, Any]]) -> str:
    """抽出結果から先頭の日本語ラベルを返す。"""
    for group in groups:
        name = group.get("name", "")
        if contains_japanese(name):
            return name
        for item in group.get("items", []):
            item_name = item.get("name", "")
            if contains_japanese(item_name):
                return item_name
    return "menu"


def contains_japanese(value: str) -> bool:
    """文字列に日本語が含まれるかを判定する。"""
    return bool(re.search(r"[ぁ-んァ-ン一-龥々ー]", value))


def sanitize_filename(value: str) -> str:
    """Windows で安全なファイル名に整形する。"""
    sanitized = re.sub(r'[\\/:*?"<>|]', "_", value).strip()
    sanitized = re.sub(r"\s+", "_", sanitized)
    return sanitized or "menu"


def build_default_output_paths(groups: List[Dict[str, Any]]) -> Dict[str, str]:
    """抽出内容から既定出力パス群を生成する。"""
    label = sanitize_filename(find_first_japanese_label(groups))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = os.path.join(DEFAULT_OUTPUT_DIR, label)
    stem = f"{label}_{timestamp}_side_menu_groups"
    return {
        "dir": output_dir,
        "json": os.path.join(output_dir, f"{stem}.json"),
        "json_ja": os.path.join(output_dir, f"{stem}_ja.json"),
        "csv": os.path.join(output_dir, f"{stem}.csv"),
    }


def main() -> None:
    """エントリーポイント。"""
    args = parse_args()
    if args.input is None:
        args.input = DEFAULT_INPUT

    html = detect_and_read_input(args.input, args.encoding, args.errors)

    parser = SideMenuGroupExtractor()
    parser.feed(html)
    groups = parser.as_dicts()
    default_paths = build_default_output_paths(groups)

    if args.output is None:
        if args.format == "json":
            args.output = default_paths["json_ja"] if args.jp_only else default_paths["json"]
        else:
            args.output = default_paths["csv"]

    if args.output:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)

    if args.format == "json":
        payload = to_output_payload_ja(groups) if args.jp_only else to_output_payload(groups)
        write_json(payload, args.output)
        if not args.jp_only and os.path.normpath(args.output) == os.path.normpath(default_paths["json"]):
            os.makedirs(default_paths["dir"], exist_ok=True)
            write_json(to_output_payload_ja(groups), default_paths["json_ja"])
        return

    write_output_csv(groups, args.output)


if __name__ == "__main__":
    main()
