@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "PROFILE=tframe.juku_admin"
if not "%~1"=="" set "PROFILE=%~1"
set "BASE_CMD=npx codeceptjs run"
set "OUTPUT_ROOT=%CD%\output\%PROFILE%"

set "FAILED=0"
set "FAILED_LIST="
set "RUN_OUTPUTS="

for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH:mm:ss"') do set "START_AT=%%I"

echo ========================================
echo TFRAME icon tests (profile: %PROFILE%)
echo Start: %START_AT%
echo Output root: %OUTPUT_ROOT%
echo ========================================

for %%T in (
  jukusei_test.js
  course_test.js
  koshi_test.js
  master_menu_test.js
  calendar_test.js
  email_test.js
  report_test.js
  home_test.js
  help_test.js
) do (
  echo.
  echo [RUN] %%T
  %BASE_CMD% "./tests/tframe/%%T" --profile %PROFILE% --steps
  if errorlevel 1 (
    set /a FAILED+=1
    if defined FAILED_LIST (
      set "FAILED_LIST=!FAILED_LIST!, %%T"
    ) else (
      set "FAILED_LIST=%%T"
    )
    echo [FAIL] %%T
  ) else (
    echo [PASS] %%T
  )

  set "LAST_DIR="
  for /f "delims=" %%D in ('powershell -NoProfile -Command "$p = '%OUTPUT_ROOT%'; $n = '%%~nT'; if (Test-Path $p) { Get-ChildItem -Directory $p -Filter ('*_' + $n) | Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName }"') do set "LAST_DIR=%%D"
  if defined LAST_DIR (
    echo [OUT] !LAST_DIR!
    if defined RUN_OUTPUTS (
      set "RUN_OUTPUTS=!RUN_OUTPUTS!;!LAST_DIR!"
    ) else (
      set "RUN_OUTPUTS=!LAST_DIR!"
    )
  )
)

for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH:mm:ss"') do set "END_AT=%%I"

echo.
echo ========================================
if %FAILED% gtr 0 (
  echo End: %END_AT%
  echo Completed with failures: %FAILED%
  echo Failed tests: %FAILED_LIST%
  if defined RUN_OUTPUTS echo Output dirs: %RUN_OUTPUTS%
  echo ========================================
  exit /b 1
) else (
  echo End: %END_AT%
  echo All tests passed.
  if defined RUN_OUTPUTS echo Output dirs: %RUN_OUTPUTS%
  echo ========================================
  exit /b 0
)
