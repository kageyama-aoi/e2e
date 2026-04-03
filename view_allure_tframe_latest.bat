@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "PROFILE=tframe.juku_admin"
if not "%~1"=="" set "PROFILE=%~1"

set "TAKE_COUNT=10"
if not "%~2"=="" set "TAKE_COUNT=%~2"

set "RESULT_ROOT=%CD%\allure-results\%PROFILE%"
set "REPORT_DIR=%CD%\allure-report\latest_%PROFILE%"

echo ========================================
echo Allure latest report
echo Profile   : %PROFILE%
echo Take count: %TAKE_COUNT%
echo Source    : %RESULT_ROOT%
echo Output    : %REPORT_DIR%
echo ========================================

if not exist "%RESULT_ROOT%" (
  echo [ERROR] Result directory not found: %RESULT_ROOT%
  exit /b 1
)

set "DIR_ARGS="
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "Get-ChildItem -Directory '%RESULT_ROOT%' | Sort-Object Name -Descending | Select-Object -First %TAKE_COUNT% -ExpandProperty FullName"`) do (
  if defined DIR_ARGS (
    set "DIR_ARGS=!DIR_ARGS! \"%%D\""
  ) else (
    set "DIR_ARGS=\"%%D\""
  )
)

if not defined DIR_ARGS (
  echo [ERROR] No run directories found under: %RESULT_ROOT%
  exit /b 1
)

echo.
echo [INFO] Generating report...
call npx allure generate %DIR_ARGS% --clean -o "%REPORT_DIR%"
if errorlevel 1 (
  echo [ERROR] Failed to generate report.
  exit /b 1
)

echo [INFO] Opening report...
call npx allure open "%REPORT_DIR%"
exit /b %errorlevel%

