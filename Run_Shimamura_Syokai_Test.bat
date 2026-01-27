@echo off
set /p PROFILE_NAME="Enter profile name (e.g., shimamura.testgcp2): "
if "%PROFILE_NAME%"=="" set PROFILE_NAME=shimamura
echo Running test with profile: %PROFILE_NAME%
set PROFILE=%PROFILE_NAME%
call npx codeceptjs run ./tests/shimamura/syokai_touroku_test.js --profile %PROFILE_NAME%
pause
