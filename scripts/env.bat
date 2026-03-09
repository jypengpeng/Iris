@echo off
REM ==========================================
REM  IrisClaw 公共环境变量
REM  被其他脚本通过 call 调用，设置共用常量
REM ==========================================

REM Node.js 版本
set "NODE_VERSION=22.14.0"

REM 项目根目录（scripts/ 的上一级）
set "PROJECT_ROOT=%~dp0.."

REM Node.js 便携版存放路径
set "NODE_DIR=%PROJECT_ROOT%\node"

REM Node.js 下载地址
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip"

REM 将 Node.js 便携版加入 PATH（优先于系统安装的 Node）
set "PATH=%NODE_DIR%;%PATH%"
