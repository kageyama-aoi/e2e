@echo off
echo ==============================
echo  T-Frame ログインテスト実行
echo ==============================
echo.

:: ---- プロファイル選択 ----
echo [プロファイル選択]
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

:: ---- シナリオ選択 ----
echo [シナリオ選択]
echo   1. 全シナリオ実行
echo   2. admin のみ
echo   3. student のみ
echo.
set /p SCENARIO="番号を入力 (デフォルト: 1): "

if "%SCENARIO%"==""  set GREP_OPT=
if "%SCENARIO%"=="1" set GREP_OPT=
if "%SCENARIO%"=="2" set GREP_OPT=--grep "正しい認証情報"
if "%SCENARIO%"=="3" set GREP_OPT=--grep "TEST_USER_STUDENT"

echo.
echo 実行プロファイル : %PROFILE_NAME%
if "%GREP_OPT%"=="" (
  echo シナリオ         : 全件
) else (
  echo シナリオ         : %GREP_OPT%
)
echo.

call npx codeceptjs run ./tests/tframe/login_test.js --profile %PROFILE_NAME% %GREP_OPT% --steps
pause
