@echo off
chcp 65001 >nul 2>&1
title Iris Update
setlocal

echo ============================================
echo          Iris Update
echo ============================================
echo.
echo 当前 Windows 发行包采用二进制解压即用模式。
echo 请重新下载最新的 GitHub Release，或使用 npm update -g irises。
echo.
echo Release 页面：
echo https://github.com/Lianues/Iris/releases/latest
echo.
start https://github.com/Lianues/Iris/releases/latest
pause
exit /b 0
