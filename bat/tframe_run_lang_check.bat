@echo off
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0ps\tframe_run_lang_check.ps1" %*
