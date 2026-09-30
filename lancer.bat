@echo off
REM Lance l application en local sur http://localhost:8765 (necessite Python 3)
cd /d "%~dp0"
start "" http://localhost:8765
python -m http.server 8765 --bind 127.0.0.1
