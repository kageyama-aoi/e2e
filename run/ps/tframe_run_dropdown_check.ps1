$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "=============================="
Write-Host " T-Frame Dropdown Check"
Write-Host "=============================="
Write-Host ""

# ---- Scan tframe profiles from env/ ----
$profiles = Get-ChildItem -Path (Join-Path $repoRoot "env") -Filter ".env.tframe.*" -ErrorAction SilentlyContinue |
    ForEach-Object { $_.Name -replace '^\.env\.', '' }

if ($profiles.Count -eq 0) {
    Write-Host "[NOTICE] env\.env.tframe.* が見つかりません。"
    Write-Host "  env\ フォルダに .env.tframe.xxx ファイルを作成してください。"
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
& npx codeceptjs run ./tests/tframe/check/dropdown_check_test.js --profile $profileName --steps

Read-Host "Press Enter to exit"
