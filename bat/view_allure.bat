@echo off
cd /d "%~dp0.."
setlocal EnableExtensions EnableDelayedExpansion

set "RESULTS_ROOT=%CD%\allure-results"
set "TAKE_COUNT=10"

echo ========================================
echo  Allure Report Viewer
echo ========================================
echo.

:: ---- Scan available profiles ----
set "IDX=0"
for /f "usebackq delims=" %%D in (`dir /b /ad "%RESULTS_ROOT%" 2^>nul`) do (
  if /i not "%%D"=="archive" (
    set /a IDX+=1
    set "PROFILE_!IDX!=%%D"
  )
)

if %IDX%==0 (
  echo [NOTICE] No test result profiles found.
  echo.
  echo   Checked location: %RESULTS_ROOT%
  echo.
  echo   allure-results\ is empty or does not exist.
  echo   Expected structure:
  echo.
  echo     allure-results\
  echo       tframe.juku_test\
  echo         20260417_103045_login_test\    ^<-- one run
  echo         20260417_140000_course_test\
  echo       shimamura.testgcp\
  echo         20260417_120000_syokai_test\
  echo.
  echo   Please run a test first using one of the bat files:
  echo     bat\tframe_run_login.bat
  echo     bat\tframe_run_icons.bat
  echo     bat\shimamura_run_syokai.bat
  echo.
  pause
  exit /b 0
)

:: ---- Show profile list ----
echo [Profile]
for /l %%I in (1,1,%IDX%) do (
  echo   %%I. !PROFILE_%%I!
)
echo   (other: type profile name directly)
echo.
set /p CHOICE="Select profile number or name: "

:: resolve number to name
set "PROFILE_NAME="
for /l %%I in (1,1,%IDX%) do (
  if "%CHOICE%"=="%%I" set "PROFILE_NAME=!PROFILE_%%I!"
)
if not defined PROFILE_NAME set "PROFILE_NAME=%CHOICE%"

if "%PROFILE_NAME%"=="" (
  echo [NOTICE] No profile selected. Exiting.
  pause
  exit /b 0
)

set "RESULT_ROOT=%RESULTS_ROOT%\%PROFILE_NAME%"
set "REPORT_DIR=%CD%\allure-report\latest_%PROFILE_NAME%"

echo.
echo Profile : %PROFILE_NAME%
echo Source  : %RESULT_ROOT%
echo Output  : %REPORT_DIR%
echo.

:: ---- Check profile directory ----
if not exist "%RESULT_ROOT%" (
  echo [NOTICE] Profile directory not found: %RESULT_ROOT%
  echo.
  echo   The profile "%PROFILE_NAME%" does not have a results folder yet.
  echo   Please run the corresponding test bat first.
  echo.
  pause
  exit /b 0
)

:: ---- Collect run directories ----
set "DIR_ARGS="
set "COUNT=0"
for /f "usebackq delims=" %%D in (`dir /b /ad /o-n "%RESULT_ROOT%" 2^>nul`) do (
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
  echo [NOTICE] No test run directories found for profile: %PROFILE_NAME%
  echo.
  echo   Checked location: %RESULT_ROOT%
  echo.
  echo   The folder exists but contains no test results.
  echo   Please run the corresponding test bat first.
  echo.
  echo   If you recently ran allure:archive, results may have been
  echo   moved to: allure-results\archive\%PROFILE_NAME%\
  echo.
  pause
  exit /b 0
)

:: ---- Generate and open report ----
echo [INFO] Generating report from %COUNT% run(s)...
call npx allure generate %DIR_ARGS% --clean -o "%REPORT_DIR%"
if errorlevel 1 (
  echo [ERROR] Failed to generate report.
  pause
  exit /b 1
)

echo [INFO] Opening report...
call npx allure open "%REPORT_DIR%"
exit /b %errorlevel%
