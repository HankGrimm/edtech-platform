@echo off
echo 🤖 EdTech AI服务诊断脚本
echo ==========================

echo 📋 1. 检查环境配置...
if exist ".env" (
    echo ✅ .env文件存在
    findstr /C:"AI_API_KEY=sk-" .env >nul
    if %errorlevel%==0 (
        echo ✅ AI_API_KEY已配置
    ) else (
        echo ❌ AI_API_KEY未配置或格式错误
        echo 请在.env文件中设置: AI_API_KEY=sk-your-actual-key
        pause
        exit /b 1
    )
) else (
    echo ❌ .env文件不存在
    echo 请复制.env.example为.env并配置API密钥
    pause
    exit /b 1
)

echo.
echo 🔍 2. 检查服务状态...
curl -s http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ 后端服务运行正常
) else (
    echo ❌ 后端服务未启动
    echo 请运行: docker-compose up -d --build
    pause
    exit /b 1
)

echo.
echo 🧪 3. 测试AI服务连接...
curl -s http://localhost:8080/api/ai/test/connection
echo.

echo.
echo 🧮 4. 测试数学题目生成...
curl -s http://localhost:8080/api/ai/test/simple-math
echo.

echo.
echo 🌐 5. 检查前端页面...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ 前端页面可访问
    echo 请访问: http://localhost:5173/practice
) else (
    echo ❌ 前端页面不可访问
    echo 请在edtech-frontend目录运行: npm run dev
)

echo.
echo 🎯 诊断完成！
echo 如果所有检查都通过，AI动态出题功能应该正常工作。
echo 如果有问题，请根据上述提示进行修复。
pause