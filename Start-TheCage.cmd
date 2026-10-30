@echo off
cd /d "%~dp0"
set CAGE_OPEN_BROWSER=1
node tools/serve.mjs
pause
