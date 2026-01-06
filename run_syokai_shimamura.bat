@echo off
set /p PROFILE_NAME="Enter profile name (e.g., shimamura.testgcp2): "
if "%PROFILE_NAME%"=="" set PROFILE_NAME=shimamura
echo Running test with profile: %PROFILE_NAME%
set PROFILE=%PROFILE_NAME%
npm run test:shimamura:syokai -- --profile %PROFILE_NAME%
pause
