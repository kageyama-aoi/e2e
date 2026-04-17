param(
    [string]$Profile = "tframe.juku_admin"
)
$ErrorActionPreference = 'Stop'
$repoRoot  = Split-Path $PSScriptRoot -Parent
$outputRoot = Join-Path $repoRoot "output" $Profile

$failed    = 0
$failedList = @()
$runOutputs = @()

$startAt = Get-Date -Format "yyyy-MM-dd_HH:mm:ss"

Write-Host "========================================"
Write-Host "TFRAME icon tests (profile: $Profile)"
Write-Host "Start: $startAt"
Write-Host "Output root: $outputRoot"
Write-Host "========================================"

$tests = @(
    "jukusei_test.js"
    "course_test.js"
    "koshi_test.js"
    "master_menu_test.js"
    "calendar_test.js"
    "email_test.js"
    "report_test.js"
    "home_test.js"
    "help_test.js"
)

Set-Location $repoRoot
foreach ($test in $tests) {
    Write-Host ""
    Write-Host "[RUN] $test"
    & npx codeceptjs run "./tests/tframe/$test" --profile $Profile --steps
    if ($LASTEXITCODE -ne 0) {
        $failed++
        $failedList += $test
        Write-Host "[FAIL] $test"
    } else {
        Write-Host "[PASS] $test"
    }

    # Find the most recent output directory for this test
    $testName = [System.IO.Path]::GetFileNameWithoutExtension($test)
    $lastDir = Get-ChildItem -Directory $outputRoot -Filter "*_$testName" -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        Select-Object -First 1
    if ($lastDir) {
        Write-Host "[OUT] $($lastDir.FullName)"
        $runOutputs += $lastDir.FullName
    }
}

$endAt = Get-Date -Format "yyyy-MM-dd_HH:mm:ss"

Write-Host ""
Write-Host "========================================"
Write-Host "End: $endAt"
if ($failed -gt 0) {
    Write-Host "Completed with failures: $failed"
    Write-Host "Failed tests: $($failedList -join ', ')"
    if ($runOutputs.Count -gt 0) { Write-Host "Output dirs: $($runOutputs -join ';')" }
    Write-Host "========================================"
    exit 1
} else {
    Write-Host "All tests passed."
    if ($runOutputs.Count -gt 0) { Write-Host "Output dirs: $($runOutputs -join ';')" }
    Write-Host "========================================"
    exit 0
}
