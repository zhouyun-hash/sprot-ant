@echo off
chcp 65001 >nul
cd /d "%~dp0.."
if "%~1"=="" goto usage
if /i "%~1"=="infra" docker compose up -d & echo MySQL+Redis 已启动 & goto :eof
if /i "%~1"=="backend" call npm run dev:backend & goto :eof
if /i "%~1"=="h5" call npm run dev:h5 & goto :eof
if /i "%~1"=="pc" call npm run dev:pc & goto :eof
if /i "%~1"=="stack" call npm run dev:stack & goto :eof
if /i "%~1"=="all" call npm run dev:all & goto :eof
:usage
echo 用法: %~nx0 infra ^| backend ^| h5 ^| pc ^| stack ^| all
echo 首次请在仓库根目录执行: npm install
exit /b 1
