@echo off

echo ==============================
echo  T-Frame Login Test Runner
echo ==============================
echo.

:: ---- Profile Selection ----
echo [Profile]
echo   1. tframe.culture_beta
echo   2. tframe.juku_test
echo   (other: type directly)
echo.
set /p CHOICE="Select profile (default: tframe.culture_beta): "

if "%CHOICE%"==""  set PROFILE_NAME=tframe.culture_beta
if "%CHOICE%"=="1" set PROFILE_NAME=tframe.culture_beta
if "%CHOICE%"=="2" set PROFILE_NAME=tframe.juku_test
if not defined PROFILE_NAME set PROFILE_NAME=%CHOICE%

echo.

:: ---- Scenario Selection ----
echo [Scenario]
echo   1. All scenarios
echo   2. Admin only   (@admin)
echo   3. Student only (@student)
echo.
set /p SCENARIO="Select scenario (default: 1): "

if "%SCENARIO%"=="" set SCENARIO=1

echo.
echo Profile  : %PROFILE_NAME%

if "%SCENARIO%"=="1" (
  echo Scenario : All
  echo.
  call npx codeceptjs run ./tests/tframe/login_test.js --profile %PROFILE_NAME% --steps
)
if "%SCENARIO%"=="2" (
  echo Scenario : Admin only
  echo.
  call npx codeceptjs run ./tests/tframe/login_test.js --profile %PROFILE_NAME% --grep @admin --steps
)
if "%SCENARIO%"=="3" (
  echo Scenario : Student only
  echo.
  call npx codeceptjs run ./tests/tframe/login_test.js --profile %PROFILE_NAME% --grep @student --steps
)

pause
