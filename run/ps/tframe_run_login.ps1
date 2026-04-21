$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "=============================="
Write-Host " T-Frame Login Test Runner"
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

# ---- Scenario selection ----
Write-Host "[Scenario]"
Write-Host "  1. All scenarios"
Write-Host "  2. Admin only   (@admin)"
Write-Host "  3. Student only (@student)"
Write-Host ""
$scenario = Read-Host "Select scenario (default: 1)"
if (-not $scenario) { $scenario = "1" }

Write-Host ""
Write-Host "Profile  : $profileName"

Set-Location $repoRoot
switch ($scenario) {
    "1" {
        Write-Host "Scenario : All"
        Write-Host ""
        & npx codeceptjs run ./tests/tframe/auth/login_test.js --profile $profileName --steps
    }
    "2" {
        Write-Host "Scenario : Admin only"
        Write-Host ""
        & npx codeceptjs run ./tests/tframe/auth/login_test.js --profile $profileName --grep "@admin" --steps
    }
    "3" {
        Write-Host "Scenario : Student only"
        Write-Host ""
        & npx codeceptjs run ./tests/tframe/auth/login_test.js --profile $profileName --grep "@student" --steps
    }
    default {
        Write-Host "Scenario : All"
        Write-Host ""
        & npx codeceptjs run ./tests/tframe/auth/login_test.js --profile $profileName --steps
    }
}

Read-Host "Press Enter to exit"
