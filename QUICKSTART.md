# GreenSwitch HK - 快速启动指南

## 🚀 快速开始 (推荐方式)

### 方式一：Docker Compose (最简单)

```bash
# 1. 进入项目目录
cd ~/Desktop/GreenSwitch-HK-Enhanced

# 2. 配置环境变量
# 编辑 backend/.env 文件，填入你的 Firebase 和 Gemini 配置

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
# 前端: http://localhost
# 后端 API: http://localhost:3001/api
```

### 方式二：手动启动 (开发模式)

**启动后端：**
```bash
cd ~/Desktop/GreenSwitch-HK-Enhanced/backend
npm install
npm run dev
```

**启动前端 (新终端)：**
```bash
cd ~/Desktop/GreenSwitch-HK-Enhanced/frontend
npm install
npm run dev
```

**访问：**
- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api

---

## ⚙️ 环境变量配置

### 后端配置 (backend/.env)

```bash
# 服务器
PORT=3001
LOG_LEVEL=info

# 前端地址 (CORS)
FRONTEND_URL=http://localhost:5173

# Firebase Admin 服务账号 (Base64 编码)
# 获取方式: cat serviceAccountKey.json | base64
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_here

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

### 前端配置 (frontend/.env.local)

```bash
# API 地址
VITE_API_URL=http://localhost:3001/api

# Firebase 配置 (从 Firebase Console 获取)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🔧 Firebase 设置步骤

### 1. 创建 Firebase 项目
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击 "Create a project"
3. 输入项目名称 (如: greenswitch-hk)
4. 启用 Google Analytics (可选)
5. 创建项目

### 2. 启用服务
1. **Firestore Database**
   - 左侧菜单 > Build > Firestore Database
   - 点击 "Create database"
   - 选择 "Start in production mode"
   - 选择数据库位置 (asia-east2 香港)

2. **Authentication**
   - 左侧菜单 > Build > Authentication
   - 点击 "Get started"
   - 启用 "Email/Password" 登录方式

### 3. 获取配置

**前端配置：**
1. 项目设置 (齿轮图标) > General
2. 在 "Your apps" 部分点击 "</>" (Web)
3. 复制 firebaseConfig 对象中的值

**后端配置：**
1. 项目设置 > Service accounts
2. 点击 "Generate new private key"
3. 下载 JSON 文件
4. 转换为 base64:
   ```bash
   cat downloaded-file.json | base64
   ```

### 4. 设置 Firestore 规则

在 Firebase Console > Firestore Database > Rules 中粘贴：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /applications/{applicationId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /ai_cache/{hash} {
      allow read: if true;
      allow write: if false;
    }
    match /files/{fileId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 🔑 获取 Gemini API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 登录 Google 账号
3. 点击左侧菜单 "Get API key"
4. 点击 "Create API key"
5. 复制生成的 API key

---

## 🐛 故障排除

### 问题：前端无法连接后端

**检查：**
1. 后端是否已启动 (`docker-compose ps` 或查看进程)
2. `VITE_API_URL` 是否配置正确
3. 防火墙是否阻止了端口

**解决：**
```bash
# 查看后端日志
docker-compose logs backend

# 或手动测试后端
curl http://localhost:3001/api/health
```

### 问题：AI 分析失败

**检查：**
1. `GEMINI_API_KEY` 是否有效
2. 后端日志中的错误信息
3. 图片格式和大小 (最大 10MB)

**解决：**
```bash
# 查看后端详细日志
docker-compose logs -f backend
```

### 问题：认证失败

**检查：**
1. Firebase 配置是否正确
2. 服务账号密钥是否正确
3. Firestore 规则是否已应用

**解决：**
```bash
# 重新生成服务账号密钥
# 确保 base64 编码正确
echo "your-base64-string" | base64 -d > test.json
# 检查 test.json 是否有效
```

### 问题：Docker 构建失败

**解决：**
```bash
# 清理并重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 常用命令

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看运行状态
docker-compose ps

# 进入容器调试
docker-compose exec backend sh
docker-compose exec frontend sh
```

---

## 🌐 访问地址

启动后可以通过以下地址访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost | 主应用界面 |
| 后端 API | http://localhost:3001/api | API 接口 |
| 健康检查 | http://localhost:3001/api/health | 服务状态 |

---

## ✅ 验证安装

启动后，运行以下命令验证：

```bash
# 1. 检查后端健康状态
curl http://localhost:3001/api/health
# 应返回: {"status":"ok",...}

# 2. 检查前端
curl -I http://localhost
# 应返回 HTTP 200
```

---

## 🆘 获取帮助

如果遇到问题：

1. 查看详细日志: `docker-compose logs -f`
2. 检查环境变量是否正确设置
3. 参考 `DEPLOYMENT.md` 详细部署指南
4. 检查 `INTEGRATION.md` 整合说明

---

**现在你可以开始使用了！** 🎉
