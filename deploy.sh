#!/bin/bash

# GreenSwitch HK 部署脚本

set -e

echo "🚀 开始部署 GreenSwitch HK..."

# 检查环境变量
if [ -z "$FIREBASE_SERVICE_ACCOUNT_BASE64" ]; then
    echo "❌ 错误: FIREBASE_SERVICE_ACCOUNT_BASE64 未设置"
    exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ 错误: GEMINI_API_KEY 未设置"
    exit 1
fi

# 构建后端
echo "📦 构建后端..."
cd backend
docker build -t greenswitch-backend:latest .
cd ..

# 构建前端
echo "📦 构建前端..."
cd frontend
npm install
npm run build
docker build -t greenswitch-frontend:latest .
cd ..

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 健康检查
echo "🏥 健康检查..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务启动失败"
    docker-compose logs backend
    exit 1
fi

echo "✅ 部署完成!"
echo ""
echo "📍 访问地址:"
echo "   前端: http://localhost"
echo "   后端 API: http://localhost:3001/api"
echo ""
echo "📋 常用命令:"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
