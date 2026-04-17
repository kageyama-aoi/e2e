@echo off
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0ps\tframe_run_dropdown_check.ps1" %*
