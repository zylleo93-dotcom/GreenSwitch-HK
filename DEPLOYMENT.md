# GreenSwitch HK 部署指南

## 前置要求

- Docker 和 Docker Compose
- Firebase 项目
- Google Gemini API Key
- Node.js 18+ (本地开发)

## 1. Firebase 设置

### 1.1 创建 Firebase 项目
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目
3. 启用 Firestore Database 和 Authentication

### 1.2 获取服务账号密钥
1. 项目设置 > 服务账号
2. 点击 "生成新的私钥"
3. 下载 JSON 文件
4. 转换为 base64:
   ```bash
   cat serviceAccountKey.json | base64
   ```

### 1.3 配置 Firestore 规则
在 Firebase Console 中设置规则，或使用 CLI:
```bash
firebase deploy --only firestore:rules
```

## 2. 环境变量配置

### 2.1 后端 (.env)
```bash
cd backend
cp .env.example .env
```

编辑 `.env`:
```
PORT=3001
FRONTEND_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_here
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.0-flash
```

### 2.2 前端 (.env.local)
```bash
cd frontend
cp .env.example .env.local
```

编辑 `.env.local`:
```
VITE_API_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 3. 本地开发

### 3.1 启动后端
```bash
cd backend
npm install
npm run dev
```

### 3.2 启动前端 (新终端)
```bash
cd frontend
npm install
npm run dev
```

### 3.3 访问
- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api
- API 文档: http://localhost:3001/api/health

## 4. 生产部署

### 4.1 使用 Docker Compose (推荐)
```bash
# 确保环境变量已设置
export FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64
export GEMINI_API_KEY=your_key

# 部署
docker-compose up -d
```

### 4.2 使用部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

### 4.3 部署到云平台

#### Google Cloud Run
```bash
# 构建并推送镜像
gcloud builds submit --tag gcr.io/your-project/greenswitch-backend

# 部署
gcloud run deploy greenswitch-backend \
  --image gcr.io/your-project/greenswitch-backend \
  --platform managed \
  --set-env-vars FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64,GEMINI_API_KEY=your_key
```

#### AWS ECS / Azure Container Apps / 阿里云容器服务
参考各平台的容器部署文档，主要步骤:
1. 构建 Docker 镜像
2. 推送到镜像仓库
3. 配置环境变量
4. 部署容器服务

## 5. 监控和维护

### 5.1 查看日志
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 5.2 更新部署
```bash
# 拉取最新代码
git pull

# 重新构建
docker-compose build

# 重启服务
docker-compose up -d
```

### 5.3 备份数据
Firestore 数据会自动备份，如需手动导出:
```bash
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

## 6. 故障排除

### 6.1 后端无法启动
- 检查环境变量是否正确设置
- 查看日志: `docker-compose logs backend`
- 检查端口 3001 是否被占用

### 6.2 AI 分析失败
- 检查 GEMINI_API_KEY 是否有效
- 查看后端日志中的错误信息
- 确认图片格式和大小符合要求

### 6.3 前端无法连接后端
- 检查 VITE_API_URL 是否正确
- 确认 CORS 配置正确
- 检查网络连接

## 7. 安全建议

1. **API Key 保护**: 永远不要将 Gemini API Key 暴露在前端
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **限流**: 已配置 API 限流，可根据需要调整
4. **数据加密**: 敏感数据在传输和存储时加密
5. **定期更新**: 定期更新依赖包以修复安全漏洞

## 8. 扩展功能

### 8.1 添加邮件通知
集成 SendGrid 或 AWS SES，在申报状态变更时发送邮件。

### 8.2 添加支付功能
集成 Stripe 或 PayPal，实现付费功能。

### 8.3 添加分析统计
集成 Google Analytics 或自建统计，追踪用户行为。

### 8.4 多语言支持
添加英文界面，支持更多用户群体。
