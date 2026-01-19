"""
ディレクトリ構造可視化ツール (Directory Tree Generator)

このスクリプトは、プロジェクトのディレクトリ構成を走査し、Markdown形式のツリー図を生成します。
Python標準ライブラリのみで動作するため、`pip install` は不要です。このファイルをコピーするだけで、
あらゆるPythonプロジェクトで即座に利用可能です。

【特徴】
1.  **外部依存ゼロ**: Pythonがインストールされていればどこでも動きます。
2.  **高い汎用性**: `AppConfig` クラスの設定を変更するだけで、除外ルールや出力をカスタマイズできます。
3.  **ドキュメント連携**: `README.md` 内のマーカー (`<!-- TREE_START -->` 等) を自動検出し、
    構成図を埋め込む機能を持っています。CI/CDパイプラインに組み込むのにも最適です。

【主な機能】
- ディレクトリ構造のテキストツリー化
- 特定のディレクトリ（.git, node_modules 等）の除外
- 隠しファイルの表示/非表示
- README.md の自動更新モード
- タイムスタンプの自動挿入

【使い方】
    # README.md を自動更新する場合
    python tree_generator.py -u

    # 新規に tree.md を作成する場合
    python tree_generator.py -o tree.md

    # ヘルプを表示
    python tree_generator.py --help

作成日: 2026-01-17
"""

from __future__ import annotations

import argparse
import datetime
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable
from zoneinfo import ZoneInfo


@dataclass
class AppConfig:
    """ディレクトリツリー生成ツールの設定。

    Attributes:
        DEFAULT_ROOT (str): スキャンを開始するデフォルトのルートディレクトリ。
        DEFAULT_OUTPUT (str): デフォルトの出力先Markdownファイルパス。
        DEFAULT_TITLE (str): Markdownドキュメントのデフォルトタイトル。
        DEFAULT_MAX_DEPTH (int | None): デフォルトの最大再帰深度。
        DEFAULT_INCLUDE_HIDDEN (bool): デフォルトで隠しファイルを含めるかどうか。
        DEFAULT_ONLY_DIRS (bool): デフォルトでディレクトリのみを表示するかどうか。
        DEFAULT_EXCLUDE_DIRS (set[str]): 除外するディレクトリ名のセット。
        MARKER_START (str): README埋め込み開始マーカー。
        MARKER_END (str): README埋め込み終了マーカー。
    """
    DEFAULT_ROOT: str = "."
    DEFAULT_OUTPUT: str = "tree.md"
    DEFAULT_TITLE: str = "File Tree"
    DEFAULT_MAX_DEPTH: int | None = None
    DEFAULT_INCLUDE_HIDDEN: bool = True
    DEFAULT_ONLY_DIRS: bool = False

    DEFAULT_EXCLUDE_DIRS: set[str] = field(default_factory=lambda: {
        ".git",
        "node_modules",
        "__pycache__",
        ".venv",
        "venv",
        "allure-report",
        "allure-results",
        ".mypy_cache",
        ".pytest_cache",
        ".idea",
        ".vscode",
        "dist",
        "output",
        "logs",
        "doc",
        "docs",
        "build",
        ".DS_Store",
    })

    MARKER_START: str = "<!-- TREE_START -->"
    MARKER_END: str = "<!-- TREE_END -->"


def is_hidden(path: Path) -> bool:
    """ファイルまたはディレクトリが隠し属性かどうかを判定します。

    Args:
        path (Path): 判定するパス。

    Returns:
        bool: パスが '.' で始まる場合は True、そうでない場合は False。
    """
    # Windowsの隠し属性までは見ない（クロスプラットフォーム簡易版）
    return path.name.startswith(".")


def should_skip(path: Path, include_hidden: bool, exclude_dirs: set[str]) -> bool:
    """フィルタリングルールに基づいて、パスをスキップすべきか判定します。

    Args:
        path (Path): 判定するパス。
        include_hidden (bool): 隠しファイル/ディレクトリを含めるかどうか。
        exclude_dirs (set[str]): 除外するディレクトリ名のセット。

    Returns:
        bool: スキップすべき場合は True、そうでない場合は False。
    """
    if not include_hidden and is_hidden(path):
        return True
    if path.is_dir() and path.name in exclude_dirs:
        return True
    return False


def iter_children_sorted(dir_path: Path) -> list[Path]:
    """ディレクトリの子要素を、種類（ディレクトリ/ファイル）と名前でソートして返します。

    ディレクトリが先にリストされ、その後にファイルが続きます。各グループ内では
    アルファベット順（大文字小文字を区別しない）でソートされます。

    Args:
        dir_path (Path): 対象のディレクトリパス。

    Returns:
        list[Path]: ソートされた子要素のパスリスト。
    """
    children = list(dir_path.iterdir())
    children.sort(key=lambda p: (not p.is_dir(), p.name.lower()))
    return children


def build_tree_lines(
    root: Path,
    *,
    max_depth: int | None,
    include_hidden: bool,
    exclude_dirs: set[str],
    only_dirs: bool,
) -> list[str]:
    """ディレクトリ構造を表す文字列のリストを生成します。

    Args:
        root (Path): 開始ルートディレクトリ。
        max_depth (int | None): 探索する最大深度。無制限の場合は None。
        include_hidden (bool): 隠しファイル/ディレクトリを含めるかどうか。
        exclude_dirs (set[str]): 除外するディレクトリ名。
        only_dirs (bool): True の場合、ディレクトリのみを表示しファイルを無視します。

    Returns:
        list[str]: ツリー図の各行を表す文字列のリスト。
    """
    root = root.resolve()

    lines: list[str] = [f"{root.name}/" ]

    def walk(current: Path, prefix: str, depth: int) -> None:
        if max_depth is not None and depth >= max_depth:
            return

        children = [
            c for c in iter_children_sorted(current)
            if not should_skip(c, include_hidden, exclude_dirs)
        ]
        if only_dirs:
            children = [c for c in children if c.is_dir()]

        for i, child in enumerate(children):
            is_last = (i == len(children) - 1)
            branch = "└── " if is_last else "├── "
            next_prefix = prefix + ("    " if is_last else "│   ")

            if child.is_dir():
                lines.append(f"{prefix}{branch}{child.name}/ ")
                walk(child, next_prefix, depth + 1)
            else:
                lines.append(f"{prefix}{branch}{child.name}")

    walk(root, "", 0)
    return lines


def format_tree_for_markdown(tree_lines: Iterable[str]) -> str:
    """ツリー行のリストをMarkdownのコードブロック形式の文字列に変換します。

    Args:
        tree_lines (Iterable[str]): ツリー図の行データ。

    Returns:
        str: コードブロックで囲まれた文字列。
    """
    return "```text\n" + "\n".join(tree_lines) + "\n```"

def get_timestamp_str() -> str:
    """現在のタイムスタンプ文字列を返します（JST）。"""
    now = datetime.datetime.now(ZoneInfo("Asia/Tokyo"))
    return f"Last updated: {now.strftime('%Y-%m-%d %H:%M:%S')}"

def write_markdown(out_path: Path, title: str, tree_lines: Iterable[str]) -> None:
    """ディレクトリツリーをMarkdownファイルに書き込みます（新規作成・上書き）。

    Args:
        out_path (Path): 出力先のMarkdownファイルパス。
        title (str): Markdown内のセクションタイトル。
        tree_lines (Iterable[str]): ツリー図の行データ。
    """
    md = []
    md.append(f"# {title}\n")
    md.append(f"{get_timestamp_str()}\n")
    md.append("\n")
    md.append(format_tree_for_markdown(tree_lines))
    md.append("\n")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("".join(md), encoding="utf-8")
    print(f"書き込み完了: {out_path.resolve()}")


def update_readme(target_path: Path, tree_lines: Iterable[str], config: AppConfig) -> None:
    """既存のMarkdownファイルのマーカー間を更新します。

    Args:
        target_path (Path): 更新対象のファイルパス。
        tree_lines (Iterable[str]): 挿入するツリー図の行データ。
        config (AppConfig): 設定オブジェクト（マーカー定義など）。
    """
    if not target_path.exists():
        print(f"エラー: 更新対象ファイルが見つかりません: {target_path}")
        return

    content = target_path.read_text(encoding="utf-8")
    
    start_marker = config.MARKER_START
    end_marker = config.MARKER_END
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx == -1 or end_idx == -1 or start_idx >= end_idx:
        print(f"警告: マーカーが見つからないか、順序が不正です。ファイルを更新していません。\n" 
              f"対象ファイル: {target_path}\n" 
              f"必要なマーカー: {start_marker} ... {end_marker}")
        return

    # 新しいコンテンツを作成
    # start_marker の後ろから end_marker の前までを置き換える
    pre_content = content[:start_idx + len(start_marker)]
    post_content = content[end_idx:]
    
    # マーカーの直後にタイムスタンプとツリーを配置
    new_tree_content = f"\n{get_timestamp_str()}\n\n" + format_tree_for_markdown(tree_lines) + "\n"
    
    new_content = pre_content + new_tree_content + post_content
    
    target_path.write_text(new_content, encoding="utf-8")
    print(f"README 内の構成図セクションを最新の状態に更新しました: {target_path.resolve()}")


def parse_args() -> argparse.Namespace:
    """コマンドライン引数を解析します。

    Returns:
        argparse.Namespace: 解析された引数。
    """
    config = AppConfig()
    
    p = argparse.ArgumentParser(
        description="ディレクトリツリーをMarkdownファイルに出力、または既存ファイルのマーカー箇所を更新します。"
    )
    p.add_argument(
        "root", 
        nargs="?", 
        default=config.DEFAULT_ROOT, 
        help=f"ルートディレクトリ (デフォルト: {config.DEFAULT_ROOT})"
    )
    p.add_argument(
        "-o", "--out", 
        default=config.DEFAULT_OUTPUT, 
        help=f"出力Markdownパス (新規作成モード用, デフォルト: {config.DEFAULT_OUTPUT})"
    )
    p.add_argument(
        "-u", "--update",
        nargs="?",
        const="README.md",
        help="指定したファイルのマーカー間を更新します (デフォルト: README.md)。このオプションを指定すると -o は無視されます。"
    )
    p.add_argument(
        "--title", 
        default=config.DEFAULT_TITLE, 
        help=f"Markdownのタイトル (新規作成モード用, デフォルト: {config.DEFAULT_TITLE})"
    )
    p.add_argument(
        "--max-depth", 
        type=int, 
        default=config.DEFAULT_MAX_DEPTH, 
        help="最大深度 (デフォルト: 無制限)"
    )
    p.add_argument(
        "--include-hidden", 
        action="store_true", 
        default=config.DEFAULT_INCLUDE_HIDDEN,
        help="隠しファイル/ディレクトリを含める"
    )
    p.add_argument(
        "--only-dirs", 
        action="store_true", 
        default=config.DEFAULT_ONLY_DIRS,
        help="ディレクトリのみ表示"
    )
    p.add_argument(
        "--exclude-dirs",
        default=",".join(sorted(config.DEFAULT_EXCLUDE_DIRS)),
        help="除外するディレクトリ名をカンマ区切りで指定",
    )
    return p.parse_args()


def main() -> None:
    """メイン実行関数。"""
    args = parse_args()
    config = AppConfig() # 設定オブジェクトのインスタンス化

    root = Path(args.root)
    if not root.exists():
        raise SystemExit(f"ルートパスが見つかりません: {root}")

    # コマンドライン引数から除外ディレクトリリストを生成
    exclude_dirs = {x.strip() for x in str(args.exclude_dirs).split(",") if x.strip()}

    tree_lines = build_tree_lines(
        root,
        max_depth=args.max_depth,
        include_hidden=bool(args.include_hidden),
        exclude_dirs=exclude_dirs,
        only_dirs=bool(args.only_dirs),
    )

    if args.update:
        # 更新モード (-u / --update)
        target_path = Path(args.update)
        update_readme(target_path, tree_lines, config)
    else:
        # 新規作成モード (-o / --out)
        out_path = Path(args.out)
        write_markdown(out_path, args.title, tree_lines)


if __name__ == "__main__":
    main()