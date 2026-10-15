"""
cleanup_output_logs.py

output/<profile>/<timestamp_rundir>/ と logs/<name>_<timestamp>.log を
N日以上古いものを zip アーカイブして削除します。
output/ の実行フォルダの判定は scripts/cleanup/run_dir_cleanup.py の cleanup_run_dirs() に任せ、
プロファイルごとに最新 K 件（既定3件）は日数に関係なく残す（#321）。
ランチャー起動時・テスト後フックは run_dir_cleanup.cleanup_all() で 10日超を zip せず削除している。

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

  # output/ でプロファイルごとに残す最新件数を変える（0 なら日数だけで判定）
  python scripts/cleanup/cleanup_output_logs.py --target output --keep-latest 5
"""

import argparse
import re
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from run_dir_cleanup import DEFAULT_KEEP_LATEST, REPO_ROOT, cleanup_run_dirs  # noqa: E402

OUTPUT_DIR   = REPO_ROOT / "output"
LOGS_DIR     = REPO_ROOT / "logs"

# タイムスタンプ形式
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
    parser.add_argument(
        "--keep-latest", type=int, default=DEFAULT_KEEP_LATEST,
        help=f"output/ でプロファイルごとに日数に関係なく残す最新件数（デフォルト: {DEFAULT_KEEP_LATEST}）",
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


def zip_file(src: Path, dest_zip: Path) -> None:
    dest_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(src, src.name)


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
        lines = cleanup_run_dirs(
            OUTPUT_DIR, args.days, args.keep_latest,
            archive=not args.no_archive, dry_run=args.dry_run,
        )
        if not lines:
            print(f"output/: {args.days}日以上古い実行結果はありません。")
        else:
            print(f"output/: 対象 {len(lines)} 件"
                  f"（{args.days}日以上古いもの・各プロファイル最新{args.keep_latest}件は除く）")
            for line in lines:
                print(line)
            total_archived += sum(1 for line in lines if line.lstrip().startswith("archived:"))
            total_deleted += sum(1 for line in lines if line.lstrip().startswith(("archived:", "deleted:")))

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
