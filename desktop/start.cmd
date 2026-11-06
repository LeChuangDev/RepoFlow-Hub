@echo off
setlocal
set "APPDIR=%~dp0app"
set "APPFILE=%APPDIR%\index.html"
set "PROFILE=%~dp0profile"
set "BROWSER="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER (
  echo [RepoFlow Hub] Edge or Chrome was not found.
  echo Please open app\index.html with your browser manually.
  pause
  exit /b 1
)
if not exist "%APPFILE%" (
  echo [RepoFlow Hub] app\index.html is missing.
  pause
  exit /b 1
)
set "APPURL=file:///%APPFILE:\=/%"
start "" "%BROWSER%" --app="%APPURL%" --user-data-dir="%PROFILE%" --no-first-run --no-default-browser-check --disable-background-networking --disable-sync --window-size=1440,900
endlocal
