@echo off
cd /d "%~dp0.."

echo ==============================
echo  T-Frame Dropdown Check
echo ==============================
echo.

:: ---- Profile Selection ----
echo [Profile]
echo   1. tframe.juku_test
echo   2. tframe.culture_beta
echo   (other: type directly)
echo.
set /p CHOICE="Select profile (default: tframe.juku_test): "

if "%CHOICE%"==""  set PROFILE_NAME=tframe.juku_test
if "%CHOICE%"=="1" set PROFILE_NAME=tframe.juku_test
if "%CHOICE%"=="2" set PROFILE_NAME=tframe.culture_beta
if not defined PROFILE_NAME set PROFILE_NAME=%CHOICE%

echo.
echo Profile : %PROFILE_NAME%
echo.
call npx codeceptjs run ./tests/tframe/dropdown_check_test.js --profile %PROFILE_NAME% --steps

pause
