@echo off
chcp 65001 >nul
echo.
echo ============================================
echo       企业办公系统 - 一键部署助手
echo ============================================
echo.

echo 第一步：检查必要工具是否安装
echo.

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装
    echo.
    echo 请访问 https://nodejs.org/ 下载并安装Node.js
    echo 建议选择 LTS 版本
    echo.
    pause
    start https://nodejs.org/
    exit /b 1
) else (
    node --version
    echo ✅ Node.js 已安装
)

:: 检查Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git 未安装
    echo.
    echo 请访问 https://git-scm.com/ 下载并安装Git
    echo 安装时选择 "Use Git from the Windows Command Prompt"
    echo.
    pause
    start https://git-scm.com/
    exit /b 1
) else (
    git --version
    echo ✅ Git 已安装
)

echo.
echo 第二步：安装项目依赖
echo.

:: 检查是否在项目目录
if not exist "apps\web\package.json" (
    echo ❌ 请确保在项目根目录运行此脚本
    echo 当前目录：%cd%
    echo.
    pause
    exit /b 1
)

:: 安装依赖
echo 正在安装项目依赖，这可能需要几分钟...
npm install

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    echo.
    echo 请尝试以下方法：
    echo 1. 检查网络连接
    echo 2. 以管理员身份运行此脚本
    echo 3. 手动运行：npm install
    echo.
    pause
    exit /b 1
) else (
    echo ✅ 依赖安装成功
)

echo.
echo 第三步：本地测试（可选）
echo.
set /p test="是否要本地测试系统？(y/n): "
if /i "%test%"=="y" (
    echo.
    echo 正在启动本地开发环境...
    echo 前端：http://localhost:3000
    echo 后端：http://localhost:3001
    echo.
    echo 按 Ctrl+C 停止服务
    echo.
    start cmd /k "npm run dev"
    timeout /t 10 >nul
    start http://localhost:3000
    echo 本地测试说明：
    echo 1. 浏览器会自动打开 http://localhost:3000
    echo 2. 使用 admin/admin123 登录
    echo 3. 测试各项功能是否正常
    echo 4. 测试完成后关闭终端窗口
    echo.
    pause
)

echo.
echo 第四步：部署到线上
echo.
echo ============================================
echo 重要提示：部署需要以下账号
echo 1. GitHub 账号（免费）
echo 2. Vercel 账号（免费）
echo 3. Supabase 账号（免费）
echo 4. Railway 账号（免费）
echo ============================================
echo.

set /p ready="是否已准备好所有账号？(y/n): "
if /i not "%ready%"=="y" (
    echo.
    echo 请先注册以下账号：
    echo 1. GitHub: https://github.com
    echo 2. Vercel: https://vercel.com
    echo 3. Supabase: https://supabase.com
    echo 4. Railway: https://railway.app
    echo.
    echo 建议使用GitHub账号登录其他服务
    echo.
    pause
    exit /b 0
)

echo.
echo 第五步：生成部署配置文件
echo.

:: 创建部署配置
echo 正在生成部署配置文件...

:: 创建vercel.json
echo { > vercel.json
echo   "rewrites": [{ >> vercel.json
echo     "source": "/(.*)", >> vercel.json
echo     "destination": "/index.html" >> vercel.json
echo   }] >> vercel.json
echo } >> vercel.json

:: 创建railway.json
echo { > railway.json
echo   "\$schema": "https://railway.app/railway.schema.json", >> railway.json
echo   "build": { >> railway.json
echo     "builder": "NIXPACKS", >> railway.json
echo     "buildCommand": "npm install && npm run build" >> railway.json
echo   }, >> railway.json
echo   "deploy": { >> railway.json
echo     "startCommand": "npm start", >> railway.json
echo     "healthcheckPath": "/api/health", >> railway.json
echo     "healthcheckTimeout": 60 >> railway.json
echo   } >> railway.json
echo } >> railway.json

echo ✅ 部署配置文件生成成功

echo.
echo 第六步：打开详细部署指南
echo.
echo 详细部署步骤已保存到 docs\部署指南.md
echo 请按照文档一步步操作
echo.
echo 主要步骤：
echo 1. 推送代码到GitHub
echo 2. 部署前端到Vercel
echo 3. 部署数据库到Supabase
echo 4. 部署后端到Railway
echo 5. 配置环境变量
echo 6. 测试系统
echo.

start docs\部署指南.md

echo.
echo 第七步：获取技术支持
echo.
echo 如果遇到问题：
echo 1. 查看部署指南中的常见问题解决
echo 2. 在GitHub仓库中提交问题
echo 3. 联系技术社区获取帮助
echo.
echo 技术社区推荐：
echo - 稀土掘金：https://juejin.cn
echo - CSDN：https://www.csdn.net
echo - Stack Overflow：https://stackoverflow.com
echo.

echo 第八步：完成部署后的操作
echo.
echo 部署完成后：
echo 1. 测试系统所有功能
echo 2. 修改默认管理员密码
echo 3. 添加公司员工账号
echo 4. 配置审批流程
echo 5. 设置系统名称和Logo
echo.

echo ============================================
echo 部署过程可能需要 30-60 分钟
echo 请耐心按照步骤操作
echo 如有问题可随时暂停并寻求帮助
echo ============================================
echo.

pause