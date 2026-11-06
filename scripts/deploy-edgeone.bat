@echo off
REM ============================================================
REM  RepoFlow Hub → EdgeOne Pages (Makers) 部署脚本
REM  用法:
REM    deploy-edgeone.bat                 交互式登录部署（自动打开浏览器）
REM    deploy-edgeone.bat myname preview  指定项目名 / 环境
REM    deploy-edgeone.bat myname prod overseas  指定项目名 / 环境 / 区域(overseas|global)
REM  未备案域名必须用 overseas（中国大陆以外区域），不要选 global。
REM  非交互(CI): 设置环境变量 EDGEONE_API_TOKEN 后运行本脚本
REM ============================================================
setlocal enabledelayedexpansion
set "PROJECT=%~1"
if "%PROJECT%"=="" set "PROJECT=repoflow-hub"
set "ENV=%~2"
if "%ENV%"=="" set "ENV=production"
set "AREA=%~3"
if "%AREA%"=="" set "AREA=overseas"

echo [1/3] 构建 web 版本 (python scripts/build.py --target=web) ...
python scripts/build.py --target=web
if errorlevel 1 ( echo 构建失败 & exit /b 1 )

echo [2/3] 部署 ./web 到 EdgeOne Makers (项目=%PROJECT% 环境=%ENV% 区域=%AREA%) ...
if defined EDGEONE_API_TOKEN (
  echo 检测到 EDGEONE_API_TOKEN，使用非交互部署模式。
  npx edgeone makers deploy ./web -n "%PROJECT%" -e "%ENV%" -a "%AREA%" -t "%EDGEONE_API_TOKEN%"
) else (
  echo 未设置 EDGEONE_API_TOKEN，使用交互式登录部署（会自动打开浏览器）。
  npx edgeone makers deploy ./web -n "%PROJECT%" -e "%ENV%" -a "%AREA%"
)
if errorlevel 1 ( echo 部署失败 & exit /b 1 )

echo [3/3] 部署完成。控制台会输出访问域名；如需绑定自定义域名请在 EdgeOne 控制台操作。
endlocal
