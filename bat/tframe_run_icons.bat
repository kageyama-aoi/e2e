@echo off
cd /d "%~dp0.."
setlocal EnableExtensions EnableDelayedExpansion

set "PROFILE=tframe.juku_admin"
if not "%~1"=="" set "PROFILE=%~1"
set "BASE_CMD=npx codeceptjs run"
set "OUTPUT_ROOT=%CD%\output\%PROFILE%"

set "FAILED=0"
set "FAILED_LIST="
set "RUN_OUTPUTS="

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "START_AT=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%:%DT:~10,2%:%DT:~12,2%"

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
  for /f "usebackq delims=" %%D in (`dir /b /ad /o-n "%OUTPUT_ROOT%\*_%%~nT" 2^>nul`) do (
    if not defined LAST_DIR set "LAST_DIR=%OUTPUT_ROOT%\%%D"
  )
  if defined LAST_DIR (
    echo [OUT] !LAST_DIR!
    if defined RUN_OUTPUTS (
      set "RUN_OUTPUTS=!RUN_OUTPUTS!;!LAST_DIR!"
    ) else (
      set "RUN_OUTPUTS=!LAST_DIR!"
    )
  )
)

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
set "END_AT=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%:%DT:~10,2%:%DT:~12,2%"

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
