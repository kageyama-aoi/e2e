@echo off
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0ps\tframe_run_nav_all.ps1" %*
