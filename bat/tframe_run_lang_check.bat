@echo off
cd /d "%~dp0.."
setlocal EnableExtensions EnableDelayedExpansion

echo ==============================
echo  T-Frame Language Check
echo ==============================
echo.

:: ---- Scan tframe profiles from env/ ----
set "IDX=0"
for /f "usebackq delims=" %%F in (`dir /b "%CD%\env\.env.tframe.*" 2^>nul`) do (
  set "NAME=%%F"
  set "NAME=!NAME:.env.=!"
  set /a IDX+=1
  set "PROFILE_!IDX!=!NAME!"
)

if %IDX%==0 (
  echo [NOTICE] env\.env.tframe.* が見つかりません。
  echo   env\ フォルダに .env.tframe.xxx ファイルを作成してください。
  pause
  exit /b 0
)

echo [Profile]
for /l %%I in (1,1,%IDX%) do (
  echo   %%I. !PROFILE_%%I!
)
echo   (other: type profile name directly)
echo.
set /p CHOICE="Select profile (default: 1): "

if "%CHOICE%"=="" set CHOICE=1

set "PROFILE_NAME="
for /l %%I in (1,1,%IDX%) do (
  if "%CHOICE%"=="%%I" set "PROFILE_NAME=!PROFILE_%%I!"
)
if not defined PROFILE_NAME set "PROFILE_NAME=%CHOICE%"

echo.
echo Profile : %PROFILE_NAME%
echo.
call npx codeceptjs run ./tests/tframe/lang_check_test.js --profile %PROFILE_NAME% --steps

pause
