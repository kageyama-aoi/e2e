"""
archive_allure_results.py

allure-results/<profile>/<timestamp_rundir>/ 単位で古い実行結果をzipアーカイブし、
N日以上古いものを削除します。

ディレクトリ構造（対象）:
  allure-results/
  ├── tframe.juku_test/
  │   ├── 20260403_143600_course_test/   ← 各実行結果ディレクトリ
  │   └── 20260407_130307_lang_check_test/
  ├── shimamura.testgcp/
  │   └── ...
  └── default/
      └── ...

IN:  allure-results/<profile>/<timestamp_rundir>/ の各ディレクトリ
OUT: allure-results/archive/<profile>/<timestamp_rundir>.zip（N日より新しい）
     削除: N日以上古いディレクトリ（デフォルト30日）

使い方:
  # 30日より古い実行結果をアーカイブ＋削除（既定）
  python scripts/archive_allure_results.py

  # 7日より古いものを対象にする
  python scripts/archive_allure_results.py --days 7

  # 確認だけ（実際には何もしない）
  python scripts/archive_allure_results.py --dry-run

  # アーカイブせず削除のみ
  python scripts/archive_allure_results.py --no-archive
"""

import argparse
import os
import re
import shutil
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

ALLURE_RESULTS_DIR = Path(__file__).parent.parent.parent / "allure-results"
ARCHIVE_DIR = ALLURE_RESULTS_DIR / "archive"

# タイムスタンプ形式: YYYYMMDD_HHMMSS or YYYYMMDD_HHMMSS_testname
TIMESTAMP_RE = re.compile(r"^(\d{8}_\d{6})")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="allure-results の古い実行結果をアーカイブ・削除します。"
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
    return parser.parse_args()


def parse_run_timestamp(dirname: str) -> datetime | None:
    """ディレクトリ名からタイムスタンプを取得する。"""
    match = TIMESTAMP_RE.match(dirname)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1), "%Y%m%d_%H%M%S")
    except ValueError:
        return None


def zip_directory(src: Path, dest_zip: Path) -> None:
    """src ディレクトリを dest_zip に圧縮する。"""
    dest_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in src.rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(src.parent))


def collect_run_dirs(allure_results: Path) -> list[tuple[Path, str, datetime]]:
    """
    allure-results/<profile>/<timestamp_rundir>/ を収集して返す。

    IN:  allure-results/ ディレクトリ
    OUT: [(rundir_path, profile_name, run_datetime), ...]
    """
    entries = []
    for profile_dir in sorted(allure_results.iterdir()):
        # archive/ 自体はスキップ
        if profile_dir.name == "archive":
            continue
        if not profile_dir.is_dir():
            continue

        for run_dir in sorted(profile_dir.iterdir()):
            if not run_dir.is_dir():
                continue
            run_dt = parse_run_timestamp(run_dir.name)
            if run_dt is None:
                continue
            entries.append((run_dir, profile_dir.name, run_dt))

    return entries


def main() -> None:
    args = parse_args()
    threshold = datetime.now() - timedelta(days=args.days)

    # IN: allure-results/<profile>/<timestamp_rundir>/
    run_dirs = collect_run_dirs(ALLURE_RESULTS_DIR)

    if not run_dirs:
        print("対象の実行結果ディレクトリが見つかりませんでした。")
        return

    targets = [(d, p, dt) for d, p, dt in run_dirs if dt < threshold]

    if not targets:
        print(f"{args.days}日以上古い実行結果はありません。")
        return

    print(f"対象: {len(targets)} 件（{args.days}日以上古いもの）")

    archived = 0
    deleted = 0

    for run_dir, profile, run_dt in targets:
        age_days = (datetime.now() - run_dt).days
        label = f"  [{profile}] {run_dir.name}  ({age_days}日前)"

        if args.dry_run:
            action = "archive + delete" if not args.no_archive else "delete"
            print(f"[dry-run] {action}: {label}")
            continue

        # PROCESS: zip圧縮 → 元ディレクトリ削除
        if not args.no_archive:
            dest_zip = ARCHIVE_DIR / profile / f"{run_dir.name}.zip"
            try:
                zip_directory(run_dir, dest_zip)
                print(f"[archived] {label}")
                print(f"           -> {dest_zip.relative_to(ALLURE_RESULTS_DIR.parent)}")
                archived += 1
            except Exception as exc:
                print(f"[error] アーカイブ失敗: {label}\n  {exc}", file=sys.stderr)
                continue

        shutil.rmtree(run_dir)
        print(f"[deleted]  {label}")
        deleted += 1

    if not args.dry_run:
        # OUT: アーカイブzipを archive/<profile>/ 配下に保存、元ディレクトリを削除
        print(f"\n完了: アーカイブ {archived} 件 / 削除 {deleted} 件")


if __name__ == "__main__":
    main()
