$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "=============================="
Write-Host " Shimamura Syokai Test"
Write-Host "=============================="
Write-Host ""

# ---- Scan shimamura profiles from env/ (excluding template) ----
$profiles = Get-ChildItem -Path (Join-Path $repoRoot "env") -Filter ".env.shimamura.*" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch 'template' } |
    ForEach-Object { $_.Name -replace '^\.env\.', '' }

if ($profiles.Count -eq 0) {
    Write-Host "[NOTICE] env\.env.shimamura.* が見つかりません。"
    Write-Host "  env\ フォルダに .env.shimamura.xxx ファイルを作成してください。"
    Read-Host "Press Enter"
    exit 0
}

Write-Host "[Profile]"
for ($i = 0; $i -lt $profiles.Count; $i++) {
    Write-Host ("  {0}. {1}" -f ($i + 1), $profiles[$i])
}
Write-Host "  (other: type profile name directly)"
Write-Host ""
$choice = Read-Host "Select profile (default: 1)"
if (-not $choice) { $choice = "1" }

$profileName = $null
for ($i = 0; $i -lt $profiles.Count; $i++) {
    if ($choice -eq ($i + 1).ToString()) { $profileName = $profiles[$i]; break }
}
if (-not $profileName) { $profileName = $choice }

Write-Host ""
Write-Host "Profile : $profileName"
Write-Host ""

Set-Location $repoRoot
& npx codeceptjs run ./tests/shimamura/syokai_touroku_test.js --profile $profileName

Read-Host "Press Enter to exit"
