@echo off
title Vestuario Studio - Servidor local
cd /d "%~dp0"
echo.
echo   Iniciando Vestuario Studio...
echo.
python server\server.py
pause