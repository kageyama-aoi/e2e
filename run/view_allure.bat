@echo off
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0ps\view_allure.ps1" %*
