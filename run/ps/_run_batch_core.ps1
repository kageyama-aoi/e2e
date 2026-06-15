param(
    [string]$Product,
    [string]$Profile,
    [string[]]$Tests
)
$ErrorActionPreference = 'Stop'
$repoRoot   = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$outputRoot = Join-Path $repoRoot "output" $Profile

$failed     = 0
$failedList = @()
$runOutputs = @()

$startAt = Get-Date -Format "yyyy-MM-dd_HH:mm:ss"

Write-Host "========================================"
Write-Host "$Product batch tests (profile: $Profile)"
Write-Host "Start: $startAt"
Write-Host "Output root: $outputRoot"
Write-Host "========================================"

Set-Location $repoRoot
foreach ($test in $Tests) {
    Write-Host ""
    Write-Host "[RUN] $test"
    & npx codeceptjs run "./tests/$Product/$test" --profile $Profile --steps
    if ($LASTEXITCODE -ne 0) {
        $failed++
        $failedList += $test
        Write-Host "[FAIL] $test"
    } else {
        Write-Host "[PASS] $test"
    }

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
