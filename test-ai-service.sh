#!/bin/bash

echo "🤖 EdTech AI服务诊断脚本"
echo "=========================="

# 检查.env文件
echo "📋 1. 检查环境配置..."
if [ -f ".env" ]; then
    echo "✅ .env文件存在"
    if grep -q "AI_API_KEY=sk-" .env; then
        echo "✅ AI_API_KEY已配置"
    else
        echo "❌ AI_API_KEY未配置或格式错误"
        echo "请在.env文件中设置: AI_API_KEY=sk-your-actual-key"
        exit 1
    fi
else
    echo "❌ .env文件不存在"
    echo "请复制.env.example为.env并配置API密钥"
    exit 1
fi

# 检查服务状态
echo ""
echo "🔍 2. 检查服务状态..."
if curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务未启动"
    echo "请运行: docker-compose up -d --build"
    exit 1
fi

# 测试AI连接
echo ""
echo "🧪 3. 测试AI服务连接..."
response=$(curl -s http://localhost:8080/api/ai/test/connection)
echo "响应: $response"

if echo "$response" | grep -q '"status":"SUCCESS"'; then
    echo "✅ AI服务连接成功"
else
    echo "❌ AI服务连接失败"
    echo "请检查API密钥配置和网络连接"
fi

# 测试简单数学题目生成
echo ""
echo "🧮 4. 测试数学题目生成..."
math_response=$(curl -s http://localhost:8080/api/ai/test/simple-math)
echo "数学题目响应: $math_response"

if echo "$math_response" | grep -q '"status":"SUCCESS"'; then
    echo "✅ 数学题目生成成功"
else
    echo "❌ 数学题目生成失败"
fi

# 测试前端页面
echo ""
echo "🌐 5. 检查前端页面..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ 前端页面可访问"
    echo "请访问: http://localhost:5173/practice"
else
    echo "❌ 前端页面不可访问"
    echo "请在edtech-frontend目录运行: npm run dev"
fi

echo ""
echo "🎯 诊断完成！"
echo "如果所有检查都通过，AI动态出题功能应该正常工作。"
echo "如果有问题，请根据上述提示进行修复。"