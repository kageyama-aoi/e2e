@echo off
cd /d "%~dp0.."
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
set "COUNT=0"
for /f "usebackq delims=" %%D in (`dir /b /ad /o-n "%RESULT_ROOT%"`) do (
  if !COUNT! lss %TAKE_COUNT% (
    if defined DIR_ARGS (
      set "DIR_ARGS=!DIR_ARGS! "%RESULT_ROOT%\%%D""
    ) else (
      set "DIR_ARGS="%RESULT_ROOT%\%%D""
    )
    set /a COUNT+=1
  )
)

if not defined DIR_ARGS (
  echo [ERROR] No run directories found under: %RESULT_ROOT%
  exit /b 1
)

echo.
echo [INFO] Generating report from %COUNT% directories...
call npx allure generate %DIR_ARGS% --clean -o "%REPORT_DIR%"
if errorlevel 1 (
  echo [ERROR] Failed to generate report.
  exit /b 1
)

echo [INFO] Opening report...
call npx allure open "%REPORT_DIR%"
exit /b %errorlevel%
