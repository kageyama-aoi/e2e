"""
run_dir_cleanup.py

実行ごとの出力フォルダ（output/allure-results/ と output/）の古いものを削除する、掃除の判定の本体。
ランチャー（run/run_gui.py の起動時）と Claude Code のフック（.claude/hooks/archive_allure.py）が
cleanup_all() を呼び、手動用の archive_allure_results.py / cleanup_output_logs.py も
実行フォルダの判定はここの cleanup_run_dirs() を使う（#321）。

ディレクトリ構造（対象）:
  output/allure-results/ と output/
  ├── shimamura.testgcp/
  │   ├── 20261015_133933_student_saikenkai_test/   ← 実行フォルダ（日時で始まる名前だけが対象）
  │   └── ...
  ├── archive/                                     ← 対象外
  ├── allure-results/ allure-report/ logs/         ← output/ の下にあるがプロファイルではないので対象外（#334）
  └── session/ probe/ work/ html/                 ← 種類別の置き場（#339）なので対象外

規則:
  days 日以上古い実行フォルダを削除する。ただしプロファイルごとに最新 keep_latest 件は日数に関係なく残す
  （しばらく使っていない環境で Open Allure や直近の失敗スクショが見られなくなるのを防ぐ）。

IN:  <base_dir>/<profile>/<YYYYMMDD_HHMMSS_*>/
OUT: archive=True のとき <base_dir>/archive/<profile>/<rundir>.zip
     戻り値: "  deleted: [profile] rundir (N日前)" 形式の行のリスト

使い方:
  # output/allure-results/ と output/ を既定の規則（10日・最新3件）で削除
  python run/cleanup/run_dir_cleanup.py

  # 確認だけ（何も消さない）
  python run/cleanup/run_dir_cleanup.py --dry-run

  # output/ だけ、5日より古いもの
  python run/cleanup/run_dir_cleanup.py --target output --days 5
"""

import argparse
import re
import shutil
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# 生成物の置き場所（#334 で allure-results・allure-report・logs を output/ の下にまとめた）。
# 掃除系のスクリプト（cleanup_output_logs.py・archive_allure_results.py）もここから import する
OUTPUT_DIR = REPO_ROOT / "output"
ALLURE_RESULTS_DIR = OUTPUT_DIR / "allure-results"
ALLURE_REPORT_DIR = OUTPUT_DIR / "allure-report"
LOGS_DIR = OUTPUT_DIR / "logs"

# <base_dir> 直下にあってもプロファイルではないフォルダ。実行フォルダを探すときに中へ入らない。
# output/ の下に allure-results などを置いたので、プロファイルと取り違えないよう明示する
# session/ probe/ work/ html/ は #339 で分けた種類別の置き場（中は日時フォルダではないが、念のため明示する）
NON_PROFILE_DIRS = {"archive", ALLURE_RESULTS_DIR.name, ALLURE_REPORT_DIR.name, LOGS_DIR.name, "session", "probe", "work", "html"}

# 自動削除（ランチャー起動時・テスト後フック）の既定値
DEFAULT_DAYS = 10
DEFAULT_KEEP_LATEST = 3

# 掃除する出力フォルダ（名前 → REPO_ROOT からの相対パス）
TARGET_DIRS = {
    "allure": ALLURE_RESULTS_DIR.relative_to(REPO_ROOT).as_posix(),
    "output": OUTPUT_DIR.relative_to(REPO_ROOT).as_posix(),
}

# 実行フォルダ名: YYYYMMDD_HHMMSS または YYYYMMDD_HHMMSS_testname
TIMESTAMP_RE = re.compile(r"^(\d{8}_\d{6})")


def parse_run_timestamp(dirname: str) -> datetime | None:
    """フォルダ名の先頭の日時を返す。日時で始まらなければ None。"""
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


def collect_run_dirs(base_dir: Path) -> list[tuple[Path, str, datetime]]:
    """
    <base_dir>/<profile>/<timestamp_rundir>/ を集める（NON_PROFILE_DIRS と日時で始まらないものは除く）。

    OUT: [(rundir_path, profile_name, run_datetime), ...]
    """
    entries = []
    if not base_dir.is_dir():
        return entries
    for profile_dir in sorted(base_dir.iterdir()):
        if profile_dir.name in NON_PROFILE_DIRS or not profile_dir.is_dir():
            continue
        for run_dir in sorted(profile_dir.iterdir()):
            if not run_dir.is_dir():
                continue
            run_dt = parse_run_timestamp(run_dir.name)
            if run_dt is not None:
                entries.append((run_dir, profile_dir.name, run_dt))
    return entries


def select_targets(
    run_dirs: list[tuple[Path, str, datetime]],
    threshold: datetime,
    keep_latest: int,
) -> list[tuple[Path, str, datetime]]:
    """
    削除対象を選ぶ。threshold より古く、かつプロファイル内で新しい順に keep_latest 件目より後ろのもの。

    OUT: 削除対象（プロファイル名・日時の順）
    """
    by_profile: dict[str, list[tuple[Path, str, datetime]]] = {}
    for entry in run_dirs:
        by_profile.setdefault(entry[1], []).append(entry)

    targets = []
    for entries in by_profile.values():
        newest_first = sorted(entries, key=lambda e: e[2], reverse=True)
        targets += [e for e in newest_first[max(keep_latest, 0):] if e[2] < threshold]
    return sorted(targets, key=lambda e: (e[1], e[2]))


def cleanup_run_dirs(
    base_dir: Path,
    days: int = DEFAULT_DAYS,
    keep_latest: int = DEFAULT_KEEP_LATEST,
    *,
    archive: bool = False,
    dry_run: bool = False,
) -> list[str]:
    """
    base_dir 配下の古い実行フォルダを（archive=True なら zip にしてから）削除し、結果の行を返す。print はしない。
    """
    threshold = datetime.now() - timedelta(days=days)
    targets = select_targets(collect_run_dirs(base_dir), threshold, keep_latest)

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
                zip_directory(run_dir, base_dir / "archive" / profile / f"{run_dir.name}.zip")
            shutil.rmtree(run_dir)
            lines.append(f"  {'archived' if archive else 'deleted'}: {label}")
        except Exception as exc:
            lines.append(f"  error: {label} -> {exc}")
    return lines


def cleanup_all(
    days: int = DEFAULT_DAYS,
    keep_latest: int = DEFAULT_KEEP_LATEST,
    *,
    targets: tuple[str, ...] = tuple(TARGET_DIRS),
    dry_run: bool = False,
    repo_root: Path = REPO_ROOT,
) -> dict[str, list[str]]:
    """
    TARGET_DIRS の各フォルダを zip せずに掃除する（ランチャー・フック用）。

    OUT: {"output/allure-results": [行, ...], "output": [行, ...]}（対象なしのフォルダも空リストで入る）
    """
    return {
        TARGET_DIRS[name]: cleanup_run_dirs(
            repo_root / TARGET_DIRS[name], days, keep_latest, archive=False, dry_run=dry_run
        )
        for name in targets
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="output/allure-results/ と output/ の古い実行フォルダを削除します（zip しない）。"
    )
    parser.add_argument("--target", choices=[*TARGET_DIRS, "both"], default="both",
                        help="対象（既定: both）")
    parser.add_argument("--days", type=int, default=DEFAULT_DAYS,
                        help=f"何日以上古いものを対象にするか（既定: {DEFAULT_DAYS}）")
    parser.add_argument("--keep-latest", type=int, default=DEFAULT_KEEP_LATEST,
                        help=f"プロファイルごとに残す最新件数（既定: {DEFAULT_KEEP_LATEST}）")
    parser.add_argument("--dry-run", action="store_true", help="確認だけ（何も消さない）")
    args = parser.parse_args()

    names = tuple(TARGET_DIRS) if args.target == "both" else (args.target,)
    results = cleanup_all(args.days, args.keep_latest, targets=names, dry_run=args.dry_run)
    for dirname, lines in results.items():
        print(f"{dirname}/: 対象 {len(lines)} 件"
              f"（{args.days}日以上古いもの・各プロファイル最新{args.keep_latest}件は除く）")
        for line in lines:
            print(line)


if __name__ == "__main__":
    main()
