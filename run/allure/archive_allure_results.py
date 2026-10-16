"""
archive_allure_results.py

output/allure-results/<profile>/<timestamp_rundir>/ 単位で古い実行結果をzipアーカイブし、
N日以上古いものを削除します。プロファイルごとに最新 K 件は日数に関係なく残します。
（npm run allure:archive 用の手動 CLI。判定は run/cleanup/run_dir_cleanup.py の
cleanup_run_dirs() に任せている #321）

ランチャー（run/run_gui.py）とテスト後フックは run_dir_cleanup.cleanup_all() を直接呼び、
10日より古いものを zip せずに削除している（最新3件は残す）。

ディレクトリ構造（対象）:
  output/allure-results/
  ├── tframe.juku_test/
  │   ├── 20260403_143600_course_test/   ← 各実行結果ディレクトリ
  │   └── 20260407_130307_lang_check_test/
  ├── shimamura.testgcp/
  │   └── ...
  └── default/
      └── ...

IN:  output/allure-results/<profile>/<timestamp_rundir>/ の各ディレクトリ
OUT: output/allure-results/archive/<profile>/<timestamp_rundir>.zip（--no-archive 指定時は作らない）
     削除: N日以上古いディレクトリ（デフォルト30日）。ただしプロファイルごとの最新 K 件（デフォルト3件）は残す

使い方:
  # 30日より古い実行結果をアーカイブ＋削除（既定）
  python run/allure/archive_allure_results.py

  # 7日より古いものを対象にする
  python run/allure/archive_allure_results.py --days 7

  # 確認だけ（実際には何もしない）
  python run/allure/archive_allure_results.py --dry-run

  # アーカイブせず削除のみ
  python run/allure/archive_allure_results.py --no-archive

  # プロファイルごとに最新5件は残す（0 で全件を日数だけで判定）
  python run/allure/archive_allure_results.py --keep-latest 5
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "cleanup"))
from run_dir_cleanup import ALLURE_RESULTS_DIR, DEFAULT_KEEP_LATEST, cleanup_run_dirs  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="output/allure-results の古い実行結果をアーカイブ・削除します。"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="何日以上古いものを対象にするか（デフォルト: 30）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="実際には何もせず、対象ディレクトリだけ表示する",
    )
    parser.add_argument(
        "--no-archive",
        action="store_true",
        help="アーカイブ（zip）を作成せず削除のみ行う",
    )
    parser.add_argument(
        "--keep-latest",
        type=int,
        default=DEFAULT_KEEP_LATEST,
        help=f"プロファイルごとに日数に関係なく残す最新件数（デフォルト: {DEFAULT_KEEP_LATEST}）",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    lines = cleanup_run_dirs(
        ALLURE_RESULTS_DIR,
        args.days,
        args.keep_latest,
        archive=not args.no_archive,
        dry_run=args.dry_run,
    )
    if not lines:
        print(f"{args.days}日以上古い実行結果はありません（各プロファイル最新{args.keep_latest}件は対象外）。")
        return

    print(f"対象: {len(lines)} 件（{args.days}日以上古いもの・各プロファイル最新{args.keep_latest}件は除く）")
    for line in lines:
        print(line)


if __name__ == "__main__":
    main()
