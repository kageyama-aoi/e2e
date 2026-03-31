@echo off
echo ==============================
echo  T-Frame ログインテスト実行
echo ==============================
echo.
echo プロファイルを選択してください:
echo   1. tframe.culture_beta
echo   2. tframe.juku_test
echo   （その他: 直接入力）
echo.
set /p CHOICE="番号またはプロファイル名を入力 (デフォルト: tframe.culture_beta): "

if "%CHOICE%"==""  set PROFILE_NAME=tframe.culture_beta
if "%CHOICE%"=="1" set PROFILE_NAME=tframe.culture_beta
if "%CHOICE%"=="2" set PROFILE_NAME=tframe.juku_test

if not defined PROFILE_NAME set PROFILE_NAME=%CHOICE%

echo.
echo 実行プロファイル: %PROFILE_NAME%
echo.
call npx codeceptjs run ./tests/tframe/login_test.js --profile %PROFILE_NAME% --steps
pause
