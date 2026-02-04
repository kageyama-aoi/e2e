"""
extract_body_only_fields.py

HTMLソースの <td id="body_only_td"> 内にあるフォーム要素を抽出し、
JSON / CSV（UTF-8）で出力します。

対象要素:
- input / select / textarea / button
  - select の option は select に内包して出力

実行例（PowerShell）:
  python extract_body_only_fields.py
  # 形式選択後に既定パスへ出力:
  #   .\\output\\body_only_extract\\body_only_fields.json
  #   .\\output\\body_only_extract\\body_only_fields.csv
  #   .\\output\\body_only_extract\\body_only_fields_flat.csv
"""

import argparse
import csv
import json
import os
import re
import sys
from html.parser import HTMLParser
from typing import Any, Dict, Iterable, List, Optional, Tuple


class BodyOnlyFieldExtractor(HTMLParser):
    """
    <td id="body_only_td"> 内のフォーム要素を抽出するパーサ。

    収集内容:
    - type: input/select/textarea/button
    - id, name, value, text, attrs
    - select は options を内包
    """

    def __init__(self) -> None:
        super().__init__()
        self.in_body_only = False
        self.body_td_depth = 0
        self.in_select = False
        self.in_script_style = False
        self.current_select: Optional[Dict[str, Any]] = None
        self.current_text_parts: List[str] = []
        self.current_text_owner: Optional[str] = None
        self.pending_label_parts: List[str] = []
        self.fields: List[Dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs_dict = dict(attrs)
        if tag == "td" and attrs_dict.get("id") == "body_only_td":
            self.in_body_only = True
            self.body_td_depth = 1
            return
        if self.in_body_only and tag == "td":
            self.body_td_depth += 1

        if tag in ("script", "style") and self.in_body_only:
            self.in_script_style = True
            return

        if not self.in_body_only:
            return

        if tag == "select":
            self.in_select = True
            self.current_select = {
                "type": "select",
                "id": attrs_dict.get("id", ""),
                "name": attrs_dict.get("name", ""),
                "value": "",
                "text": "",
                "label": self._consume_pending_label(),
                "attrs": attrs_dict,
                "options": [],
            }
            self.current_text_parts = []
            return

        if tag == "option" and self.in_select and self.current_select is not None:
            option = {
                "value": attrs_dict.get("value", ""),
                "text": "",
            }
            self.current_select["options"].append(option)
            self.current_text_parts = []
            return

        if tag in ("input", "textarea", "button") and not self.in_select:
            field = {
                "type": tag,
                "id": attrs_dict.get("id", ""),
                "name": attrs_dict.get("name", ""),
                "value": attrs_dict.get("value", ""),
                "text": "",
                "label": self._consume_pending_label(),
                "attrs": attrs_dict,
            }
            self.fields.append(field)
            self.current_text_parts = []
            if tag in ("textarea", "button"):
                self.current_text_owner = tag

    def handle_data(self, data: str) -> None:
        if not self.in_body_only:
            return
        if self.in_script_style:
            return
        text = data.strip()
        if not text:
            return
        self.current_text_parts.append(text)
        if self.in_select and self.current_select is not None:
            if self.current_select["options"]:
                self.current_select["options"][-1]["text"] += text
            else:
                self.current_select["text"] += text
            return
        if self.current_text_owner in ("textarea", "button") and self.fields:
            self.fields[-1]["text"] += text
            return

        self.pending_label_parts.append(text)

    def handle_endtag(self, tag: str) -> None:
        if tag == "td" and self.in_body_only:
            self.body_td_depth -= 1
            if self.body_td_depth <= 0:
                self.in_body_only = False
                self.body_td_depth = 0
            return
        if not self.in_body_only:
            return
        if tag in ("script", "style"):
            self.in_script_style = False
            return

        if tag == "option" and self.in_select and self.current_select is not None:
            if self.current_select["options"]:
                text = " ".join(self.current_text_parts)
                text = re.sub(r"\s+", " ", text).strip()
                self.current_select["options"][-1]["text"] = text
            self.current_text_parts = []
            return

        if tag == "select" and self.in_select and self.current_select is not None:
            text = " ".join(self.current_text_parts)
            text = re.sub(r"\s+", " ", text).strip()
            self.current_select["text"] = text
            self.fields.append(self.current_select)
            self.current_select = None
            self.in_select = False
            self.current_text_parts = []
            return

        if tag in ("textarea", "button") and self.fields:
            text = " ".join(self.current_text_parts)
            text = re.sub(r"\s+", " ", text).strip()
            self.fields[-1]["text"] = text
            self.current_text_parts = []
            self.current_text_owner = None

    def _consume_pending_label(self) -> str:
        """直前テキストをラベルとしてまとめ、取り出す。"""
        if not self.pending_label_parts:
            return ""
        label = " ".join(self.pending_label_parts)
        label = re.sub(r"\s+", " ", label).strip()
        self.pending_label_parts = []
        return label


def parse_args() -> argparse.Namespace:
    """CLI引数を解析する。"""
    parser = argparse.ArgumentParser(
        description="Extract form fields inside <td id='body_only_td'>."
    )
    parser.add_argument("input", nargs="?", help="Input HTML file (e.g., source.txt)")
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
        "--flat",
        action="store_true",
        help="CSV only: one row per option or field (select expanded).",
    )
    return parser.parse_args()


def detect_and_read_input(path: str, encoding: str, errors: str) -> str:
    """
    入力HTMLを文字コード判定付きで読み込む。

    encoding が "auto" の場合:
    - utf-8 → cp932 の順に試行
    - どちらも失敗したら utf-8 + replace で読み込む
    """
    if encoding != "auto":
        with open(path, "r", encoding=encoding, errors=errors) as f:
            return f.read()

    try:
        with open(path, "r", encoding="utf-8", errors="strict") as f:
            html = f.read()
        print("[info] input encoding detected: utf-8", file=sys.stderr)
        return html
    except UnicodeDecodeError:
        try:
            with open(path, "r", encoding="cp932", errors="strict") as f:
                html = f.read()
            print("[info] input encoding detected: cp932 (Shift-JIS)", file=sys.stderr)
            return html
        except UnicodeDecodeError:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                html = f.read()
            print("[warn] input encoding unclear; decoded with utf-8 (replace)", file=sys.stderr)
            return html


def iter_flat_rows(fields: Iterable[Dict[str, Any]]) -> Iterable[Tuple[str, str, str, str, str, str, str]]:
    """CSVのフラット形式（selectのoptionを展開）を生成する。"""
    for item in fields:
        if item["type"] == "select":
            options = item.get("options", [])
            if not options:
                yield (item["type"], item["id"], item["name"], item["value"], item["text"], item.get("label", ""), "")
                continue
            for opt in options:
                option_text = opt.get("text", "")
                option_value = opt.get("value", "")
                compact = f"{option_value}:{option_text}" if option_value or option_text else ""
                yield (item["type"], item["id"], item["name"], compact, "", item.get("label", ""), "option")
            continue
        yield (item["type"], item["id"], item["name"], item["value"], item.get("text", ""), item.get("label", ""), "")


def iter_compact_rows(fields: Iterable[Dict[str, Any]]) -> Iterable[Tuple[str, str, str, str, str, str, str]]:
    """CSVのコンパクト形式（options_compact）を生成する。"""
    for item in fields:
        options_compact = []
        if item["type"] == "select":
            for opt in item.get("options", []):
                option_text = opt.get("text", "")
                option_value = opt.get("value", "")
                if option_value or option_text:
                    options_compact.append(f"{option_value}:{option_text}")
        options_json = json.dumps(options_compact, ensure_ascii=False)
        yield (
            item["type"],
            item.get("id", ""),
            item.get("name", ""),
            item.get("value", ""),
            item.get("text", ""),
            item.get("label", ""),
            options_json,
        )


def write_output_json(fields: List[Dict[str, Any]], output: Optional[str]) -> None:
    """JSON出力（UTF-8）。"""
    compact_fields = []
    for item in fields:
        if item.get("type") == "select":
            options_compact = []
            for opt in item.get("options", []):
                option_text = opt.get("text", "")
                option_value = opt.get("value", "")
                if option_value or option_text:
                    options_compact.append(f"{option_value}:{option_text}")
            compact_item = dict(item)
            compact_item["options"] = options_compact
            compact_item.pop("attrs", None)
            compact_fields.append(compact_item)
        else:
            compact_item = dict(item)
            compact_item.pop("attrs", None)
            compact_fields.append(compact_item)
    content = json.dumps(compact_fields, ensure_ascii=False, indent=2)
    if output:
        with open(output, "w", encoding="utf-8", newline="") as out:
            out.write(content)
    else:
        print(content)


def write_output_csv(fields: List[Dict[str, Any]], output: Optional[str], flat: bool) -> None:
    """CSV出力（UTF-8）。"""
    if output:
        with open(output, "w", encoding="utf-8", newline="") as out:
            writer = csv.writer(out)
            if flat:
                writer.writerow(["type", "id", "name", "value", "text", "label", "row_kind"])
                for row in iter_flat_rows(fields):
                    writer.writerow(row)
            else:
                writer.writerow(["type", "id", "name", "value", "text", "label", "options_json"])
                for row in iter_compact_rows(fields):
                    writer.writerow(row)
    else:
        writer = csv.writer(sys.stdout)
        if flat:
            writer.writerow(["type", "id", "name", "value", "text", "label", "row_kind"])
            for row in iter_flat_rows(fields):
                writer.writerow(row)
        else:
            writer.writerow(["type", "id", "name", "value", "text", "label", "options_json"])
            for row in iter_compact_rows(fields):
                writer.writerow(row)


def main() -> None:
    """エントリーポイント。"""
    default_input = os.path.join("..", "source.txt")
    default_output_dir = os.path.join(".", "output", "body_only_extract")
    default_output_json = os.path.join(default_output_dir, "body_only_fields.json")
    default_output_csv = os.path.join(default_output_dir, "body_only_fields.csv")
    default_output_csv_flat = os.path.join(default_output_dir, "body_only_fields_flat.csv")

    args = parse_args()
    if args.input is None:
        args.input = default_input
    if args.output is None and args.format is not None:
        if args.format == "json":
            args.output = default_output_json
        elif args.format == "csv" and args.flat:
            args.output = default_output_csv_flat
        elif args.format == "csv":
            args.output = default_output_csv

    if sys.stdin.isatty() and len(sys.argv) == 1:
        print("出力形式を選んでください: 1) json  2) csv  3) csv(flat)")
        choice = input("選択 (1/2/3) > ").strip()
        if choice == "2":
            args.format = "csv"
            args.flat = False
            args.output = default_output_csv
        elif choice == "3":
            args.format = "csv"
            args.flat = True
            args.output = default_output_csv_flat
        else:
            args.format = "json"
            args.flat = False
            args.output = default_output_json

    if args.output:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)

    html = detect_and_read_input(args.input, args.encoding, args.errors)

    parser = BodyOnlyFieldExtractor()
    parser.feed(html)

    if args.format == "json":
        write_output_json(parser.fields, args.output)
        return

    write_output_csv(parser.fields, args.output, args.flat)


if __name__ == "__main__":
    main()
