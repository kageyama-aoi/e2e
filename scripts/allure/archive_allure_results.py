"""
archive_allure_results.py

allure-results/<profile>/<timestamp_rundir>/ 単位で古い実行結果をzipアーカイブし、
N日以上古いものを削除します。プロファイルごとに最新 K 件は日数に関係なく残します。

ランチャー（run/run_gui.py）も起動時に cleanup_allure_results() を呼び、
10日より古いものを zip せずに削除している（最新3件は残す）。

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
OUT: allure-results/archive/<profile>/<timestamp_rundir>.zip（--no-archive 指定時は作らない）
     削除: N日以上古いディレクトリ（デフォルト30日）。ただしプロファイルごとの最新 K 件（デフォルト3件）は残す

使い方:
  # 30日より古い実行結果をアーカイブ＋削除（既定）
  python scripts/allure/archive_allure_results.py

  # 7日より古いものを対象にする
  python scripts/allure/archive_allure_results.py --days 7

  # 確認だけ（実際には何もしない）
  python scripts/allure/archive_allure_results.py --dry-run

  # アーカイブせず削除のみ
  python scripts/allure/archive_allure_results.py --no-archive

  # プロファイルごとに最新5件は残す（0 で全件を日数だけで判定）
  python scripts/allure/archive_allure_results.py --keep-latest 5
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

# プロファイルごとに残す最新件数の既定値（Open Allure が「結果なし」にならないように）
DEFAULT_KEEP_LATEST = 3


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
    parser.add_argument(
        "--keep-latest",
        type=int,
        default=DEFAULT_KEEP_LATEST,
        help=f"プロファイルごとに日数に関係なく残す最新件数（デフォルト: {DEFAULT_KEEP_LATEST}）",
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


def select_targets(
    run_dirs: list[tuple[Path, str, datetime]],
    threshold: datetime,
    keep_latest: int,
) -> list[tuple[Path, str, datetime]]:
    """
    削除対象を選ぶ。threshold より古く、かつプロファイル内で新しい順に keep_latest 件目より後ろのもの。

    IN:  collect_run_dirs() の結果
    OUT: 削除対象 [(rundir_path, profile_name, run_datetime), ...]（古い順）
    """
    by_profile: dict[str, list[tuple[Path, str, datetime]]] = {}
    for entry in run_dirs:
        by_profile.setdefault(entry[1], []).append(entry)

    targets = []
    for entries in by_profile.values():
        newest_first = sorted(entries, key=lambda e: e[2], reverse=True)
        targets += [e for e in newest_first[max(keep_latest, 0):] if e[2] < threshold]
    return sorted(targets, key=lambda e: (e[1], e[2]))


def cleanup_allure_results(
    days: int,
    keep_latest: int = DEFAULT_KEEP_LATEST,
    *,
    archive: bool = True,
    dry_run: bool = False,
    allure_results: Path = ALLURE_RESULTS_DIR,
) -> list[str]:
    """
    古い実行結果を（必要なら zip にしてから）削除し、結果の行を返す。print はしない。

    IN:  allure-results/<profile>/<timestamp_rundir>/
    OUT: archive=True のとき allure-results/archive/<profile>/<timestamp_rundir>.zip
         戻り値: "  deleted: [profile] rundir (N日前)" 形式の行のリスト（対象なしなら空）
    """
    if not allure_results.is_dir():
        return []
    threshold = datetime.now() - timedelta(days=days)
    targets = select_targets(collect_run_dirs(allure_results), threshold, keep_latest)

    archive_dir = allure_results / "archive"
    lines = []
    for run_dir, profile, run_dt in targets:
        age_days = (datetime.now() - run_dt).days
        label = f"[{profile}] {run_dir.name} ({age_days}日前)"
        if dry_run:
            action = "archive + delete" if archive else "delete"
            lines.append(f"  [dry-run] {action}: {label}")
            continue
        try:
            if archive:
                zip_directory(run_dir, archive_dir / profile / f"{run_dir.name}.zip")
            shutil.rmtree(run_dir)
            lines.append(f"  {'archived' if archive else 'deleted'}: {label}")
        except Exception as exc:
            lines.append(f"  error: {label} -> {exc}")
    return lines


def main() -> None:
    args = parse_args()
    lines = cleanup_allure_results(
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
