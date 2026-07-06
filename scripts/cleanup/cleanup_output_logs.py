"""
cleanup_output_logs.py

output/<profile>/<timestamp_rundir>/ と logs/<name>_<timestamp>.log を
N日以上古いものを zip アーカイブして削除します。

ディレクトリ構造（対象）:
  output/
  ├── tframe.juku_admin/
  │   └── 20260403_143600_login_test/    ← 各実行結果ディレクトリ
  ├── shimamura.testgcp/
  │   └── 20260417_150000_syokai_touroku_test/
  logs/
  ├── syokai_20260417_150025.log         ← GUIランナーのログ
  └── syokai_20260417_163223.log

IN:  output/<profile>/<timestamp_rundir>/  と  logs/<name>_<timestamp>.log
OUT: output/archive/<profile>/<rundir>.zip（N日より新しい場合はアーカイブ）
     logs/archive/<filename>.zip
     削除: N日以上古いもの（元ファイル・元ディレクトリ）

使い方:
  # 14日より古いものをアーカイブ＋削除（既定）
  python scripts/cleanup/cleanup_output_logs.py

  # 7日より古いものを対象にする
  python scripts/cleanup/cleanup_output_logs.py --days 7

  # 確認のみ（実際には何もしない）
  python scripts/cleanup/cleanup_output_logs.py --dry-run

  # アーカイブせず削除のみ
  python scripts/cleanup/cleanup_output_logs.py --no-archive

  # output/ のみ対象
  python scripts/cleanup/cleanup_output_logs.py --target output

  # logs/ のみ対象
  python scripts/cleanup/cleanup_output_logs.py --target logs
"""

import argparse
import re
import shutil
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

REPO_ROOT    = Path(__file__).parent.parent.parent
OUTPUT_DIR   = REPO_ROOT / "output"
LOGS_DIR     = REPO_ROOT / "logs"

# タイムスタンプ形式
# output ディレクトリ: 20260417_150000_testname
TIMESTAMP_RE_DIR = re.compile(r"^(\d{8}_\d{6})")
# logs ファイル: syokai_20260417_150025.log
TIMESTAMP_RE_LOG = re.compile(r"_(\d{8}_\d{6})\.log$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="output/ と logs/ の古い実行結果をアーカイブ・削除します。"
    )
    parser.add_argument(
        "--days", type=int, default=14,
        help="何日以上古いものを対象にするか（デフォルト: 14）",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="実際には何もせず、対象だけ表示する",
    )
    parser.add_argument(
        "--no-archive", action="store_true",
        help="アーカイブ（zip）を作成せず削除のみ行う",
    )
    parser.add_argument(
        "--target", choices=["output", "logs", "both"], default="both",
        help="対象を選択: output / logs / both（デフォルト: both）",
    )
    return parser.parse_args()


def parse_timestamp(value: str, pattern: re.Pattern) -> datetime | None:
    match = pattern.search(value)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1), "%Y%m%d_%H%M%S")
    except ValueError:
        return None


def zip_directory(src: Path, dest_zip: Path) -> None:
    dest_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in src.rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(src.parent))


def zip_file(src: Path, dest_zip: Path) -> None:
    dest_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(src, src.name)


def collect_output_targets(threshold: datetime) -> list[tuple[Path, str, datetime]]:
    """
    IN:  output/<profile>/<timestamp_rundir>/ を再帰スキャン
    OUT: [(rundir_path, profile_name, run_datetime), ...]  threshold より古いもの
    """
    targets = []
    if not OUTPUT_DIR.exists():
        return targets

    for profile_dir in sorted(OUTPUT_DIR.iterdir()):
        if profile_dir.name == "archive" or not profile_dir.is_dir():
            continue
        for run_dir in sorted(profile_dir.iterdir()):
            if not run_dir.is_dir():
                continue
            dt = parse_timestamp(run_dir.name, TIMESTAMP_RE_DIR)
            if dt and dt < threshold:
                targets.append((run_dir, profile_dir.name, dt))

    return targets


def collect_log_targets(threshold: datetime) -> list[tuple[Path, datetime]]:
    """
    IN:  logs/<name>_<YYYYMMDD_HHMMSS>.log をスキャン
    OUT: [(log_path, log_datetime), ...]  threshold より古いもの
    """
    targets = []
    if not LOGS_DIR.exists():
        return targets

    for log_file in sorted(LOGS_DIR.iterdir()):
        if not log_file.is_file() or log_file.suffix != ".log":
            continue
        dt = parse_timestamp(log_file.name, TIMESTAMP_RE_LOG)
        if dt and dt < threshold:
            targets.append((log_file, dt))

    return targets


def process_output_targets(
    targets: list[tuple[Path, str, datetime]],
    dry_run: bool,
    no_archive: bool,
) -> tuple[int, int]:
    """
    PROCESS: output の各 rundir を zip → 削除
    OUT: (archived件数, deleted件数)
    """
    archived = deleted = 0

    for run_dir, profile, run_dt in targets:
        age_days = (datetime.now() - run_dt).days
        label = f"  [output/{profile}] {run_dir.name}  ({age_days}日前)"

        if dry_run:
            action = "archive + delete" if not no_archive else "delete"
            print(f"[dry-run] {action}: {label}")
            continue

        if not no_archive:
            dest_zip = OUTPUT_DIR / "archive" / profile / f"{run_dir.name}.zip"
            try:
                zip_directory(run_dir, dest_zip)
                print(f"[archived] {label}")
                print(f"           -> {dest_zip.relative_to(REPO_ROOT)}")
                archived += 1
            except Exception as exc:
                print(f"[error] アーカイブ失敗: {label}\n  {exc}", file=sys.stderr)
                continue

        shutil.rmtree(run_dir)
        print(f"[deleted]  {label}")
        deleted += 1

    return archived, deleted


def process_log_targets(
    targets: list[tuple[Path, datetime]],
    dry_run: bool,
    no_archive: bool,
) -> tuple[int, int]:
    """
    PROCESS: logs の各ファイルを zip → 削除
    OUT: (archived件数, deleted件数)
    """
    archived = deleted = 0

    for log_file, log_dt in targets:
        age_days = (datetime.now() - log_dt).days
        label = f"  [logs] {log_file.name}  ({age_days}日前)"

        if dry_run:
            action = "archive + delete" if not no_archive else "delete"
            print(f"[dry-run] {action}: {label}")
            continue

        if not no_archive:
            dest_zip = LOGS_DIR / "archive" / f"{log_file.name}.zip"
            try:
                zip_file(log_file, dest_zip)
                print(f"[archived] {label}")
                print(f"           -> {dest_zip.relative_to(REPO_ROOT)}")
                archived += 1
            except Exception as exc:
                print(f"[error] アーカイブ失敗: {label}\n  {exc}", file=sys.stderr)
                continue

        log_file.unlink()
        print(f"[deleted]  {label}")
        deleted += 1

    return archived, deleted


def main() -> None:
    args = parse_args()
    threshold = datetime.now() - timedelta(days=args.days)

    total_archived = total_deleted = 0

    # IN: output/<profile>/<rundir>/ をスキャン
    if args.target in ("output", "both"):
        output_targets = collect_output_targets(threshold)
        if not output_targets:
            print(f"output/: {args.days}日以上古い実行結果はありません。")
        else:
            print(f"output/: 対象 {len(output_targets)} 件（{args.days}日以上古いもの）")
            a, d = process_output_targets(output_targets, args.dry_run, args.no_archive)
            total_archived += a
            total_deleted += d

    # IN: logs/<name>_<timestamp>.log をスキャン
    if args.target in ("logs", "both"):
        log_targets = collect_log_targets(threshold)
        if not log_targets:
            print(f"logs/: {args.days}日以上古いログはありません。")
        else:
            print(f"logs/: 対象 {len(log_targets)} 件（{args.days}日以上古いもの）")
            a, d = process_log_targets(log_targets, args.dry_run, args.no_archive)
            total_archived += a
            total_deleted += d

    if not args.dry_run and (total_archived + total_deleted) > 0:
        # OUT: archive/ 配下に zip 保存、元を削除
        print(f"\n完了: アーカイブ {total_archived} 件 / 削除 {total_deleted} 件")


if __name__ == "__main__":
    main()
