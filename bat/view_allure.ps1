$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$resultsRoot = Join-Path $repoRoot "allure-results"
$takeCount = 10

Write-Host "========================================"
Write-Host " Allure Report Viewer"
Write-Host "========================================"
Write-Host ""

# ---- Scan available profiles ----
$profiles = @()
if (Test-Path $resultsRoot) {
    $profiles = Get-ChildItem -Directory $resultsRoot |
        Where-Object { $_.Name -ne 'archive' } |
        Select-Object -ExpandProperty Name
}

if ($profiles.Count -eq 0) {
    Write-Host "[NOTICE] テスト結果プロファイルが見つかりません。"
    Write-Host ""
    Write-Host "  確認先: $resultsRoot"
    Write-Host ""
    Write-Host "  allure-results\ が空か存在しません。"
    Write-Host "  期待する構造:"
    Write-Host ""
    Write-Host "    allure-results\"
    Write-Host "      tframe.juku_test\"
    Write-Host "        20260417_103045_login_test\    <-- 実行結果"
    Write-Host "      shimamura.testgcp\"
    Write-Host "        20260417_120000_syokai_test\"
    Write-Host ""
    Write-Host "  先にテストを実行してください:"
    Write-Host "    bat\tframe_run_login.bat"
    Write-Host "    bat\tframe_run_icons.bat"
    Write-Host "    bat\shimamura_run_syokai.bat"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

# ---- Show profile list ----
Write-Host "[Profile]"
for ($i = 0; $i -lt $profiles.Count; $i++) {
    Write-Host ("  {0}. {1}" -f ($i + 1), $profiles[$i])
}
Write-Host "  (other: type profile name directly)"
Write-Host ""
$choice = Read-Host "Select profile number or name"

$profileName = $null
for ($i = 0; $i -lt $profiles.Count; $i++) {
    if ($choice -eq ($i + 1).ToString()) {
        $profileName = $profiles[$i]
        break
    }
}
if (-not $profileName) { $profileName = $choice }

if (-not $profileName) {
    Write-Host "[NOTICE] プロファイルが選択されませんでした。終了します。"
    Read-Host "Press Enter"
    exit 0
}

$resultRoot = Join-Path $resultsRoot $profileName
$reportDir  = Join-Path $repoRoot "allure-report" "latest_$profileName"

Write-Host ""
Write-Host "Profile : $profileName"
Write-Host "Source  : $resultRoot"
Write-Host "Output  : $reportDir"
Write-Host ""

# ---- Check profile directory ----
if (-not (Test-Path $resultRoot)) {
    Write-Host "[NOTICE] プロファイルディレクトリが見つかりません: $resultRoot"
    Write-Host ""
    Write-Host "  プロファイル `"$profileName`" の結果フォルダがまだありません。"
    Write-Host "  対応するテスト bat を先に実行してください。"
    Write-Host ""
    Read-Host "Press Enter"
    exit 0
}

# ---- Collect run directories (newest first) ----
$runDirs = Get-ChildItem -Directory $resultRoot -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First $takeCount -ExpandProperty FullName

if ($runDirs.Count -eq 0) {
    Write-Host "[NOTICE] 実行結果ディレクトリが見つかりません: $resultRoot"
    Write-Host ""
    Write-Host "  フォルダは存在しますがテスト結果がありません。"
    Write-Host "  対応するテスト bat を先に実行してください。"
    Write-Host ""
    Write-Host "  allure:archive を実行済みの場合、結果は以下に移動済みです:"
    Write-Host "    allure-results\archive\$profileName\"
    Write-Host ""
    Read-Host "Press Enter"
    exit 0
}

# ---- Generate and open report ----
Write-Host "[INFO] $($runDirs.Count) 件の実行結果からレポートを生成中..."
& npx allure generate @runDirs --clean -o $reportDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] レポート生成に失敗しました。"
    Read-Host "Press Enter"
    exit 1
}

Write-Host "[INFO] レポートを開いています..."
& npx allure open $reportDir
exit $LASTEXITCODE
