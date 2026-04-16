# GreenSwitch HK 完善版

这是一个更落地可行的 GreenSwitch HK 完整解决方案，包含独立的后端 API 服务和增强的前端功能。

## 项目结构

```
GreenSwitch-HK-Enhanced/
├── backend/              # Node.js + Express 后端
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   │   ├── ai.js     # AI 分析接口
│   │   │   ├── auth.js   # 用户认证
│   │   │   ├── applications.js  # 申报记录管理
│   │   │   └── upload.js # 文件上传
│   │   ├── middleware/   # 中间件
│   │   ├── utils/        # 工具函数
│   │   └── index.js      # 入口文件
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/             # React 前端 (基于原项目)
│   └── src/
│       └── services/
│           └── api.js    # API 服务封装
├── docker-compose.yml    # Docker 编排
└── README.md
```

## 主要改进

### 1. 后端服务 (backend/)
- **AI 分析 API**: 将 Gemini API 调用移到后端，保护 API Key
- **用户认证**: Firebase Auth 集成，JWT 验证
- **申报记录管理**: 完整的 CRUD 操作，数据持久化到 Firestore
- **文件上传**: 支持图片上传和存储
- **缓存机制**: AI 识别结果缓存，减少 API 调用成本
- **限流保护**: 防止 API 滥用

### 2. 前端增强 (frontend/)
- **API 服务层**: 统一封装所有后端调用
- **错误处理**: 完善的错误提示和重试机制
- **加载状态**: 全局加载状态管理

### 3. 部署配置
- **Docker 容器化**: 前后端均可容器化部署
- **环境变量管理**: 敏感信息通过环境变量注入
- **健康检查**: 服务健康状态监控

## 快速开始

### 1. 克隆项目并进入目录

```bash
cd GreenSwitch-HK-Enhanced
```

### 2. 配置环境变量

#### 后端配置
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入以下信息：
# - FIREBASE_SERVICE_ACCOUNT_BASE64: Firebase 服务账号的 base64 编码
# - GEMINI_API_KEY: Google Gemini API 密钥
```

#### 前端配置
```bash
cd ../frontend
cp .env.example .env.local
# 编辑 .env.local 文件：
# VITE_API_URL=http://localhost:3001/api
```

### 3. 使用 Docker Compose 启动 (推荐)

```bash
# 在项目根目录
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 4. 或手动启动

#### 启动后端
```bash
cd backend
npm install
npm run dev
```

#### 启动前端
```bash
cd frontend
npm install
npm run dev
```

## API 文档

### AI 分析
- `POST /api/ai/analyze` - 分析图片，识别设备参数
- `POST /api/ai/calculate` - 计算节能效益

### 用户认证
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/me` - 更新用户信息
- `DELETE /api/auth/me` - 删除账户

### 申报记录
- `GET /api/applications` - 获取所有申报记录
- `GET /api/applications/:id` - 获取单个记录
- `POST /api/applications` - 创建新记录
- `PUT /api/applications/:id` - 更新记录
- `DELETE /api/applications/:id` - 删除记录
- `POST /api/applications/:id/clone` - 复制记录

### 文件上传
- `GET /api/upload` - 获取文件列表
- `POST /api/upload` - 上传文件
- `GET /api/upload/:id` - 获取文件
- `DELETE /api/upload/:id` - 删除文件

## 数据库设计

### Firestore Collections

#### users
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  companyName: string,
  phone: string,
  address: string,
  applicationCount: number,
  totalSavedEnergy: number,
  totalSubsidy: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### applications
```javascript
{
  id: string,
  userId: string,
  utility: 'CLP' | 'HEC',
  installationType: 'replacement' | 'new',
  industry: string,
  operatingHours: number,
  items: array,
  calculations: object,
  status: 'draft' | 'submitted' | 'approved' | 'rejected',
  createdAt: timestamp,
  updatedAt: timestamp,
  submittedAt: timestamp
}
```

#### ai_cache
```javascript
{
  result: object,
  createdAt: timestamp
}
```

#### files
```javascript
{
  id: string,
  userId: string,
  applicationId: string,
  type: string,
  originalName: string,
  mimeType: string,
  size: number,
  data: string, // base64
  createdAt: timestamp
}
```

## 部署到生产环境

### 1. 构建镜像

```bash
docker-compose -f docker-compose.yml build
```

### 2. 推送到镜像仓库

```bash
docker tag greenswitch-backend:latest your-registry/greenswitch-backend:latest
docker push your-registry/greenswitch-backend:latest

docker tag greenswitch-frontend:latest your-registry/greenswitch-frontend:latest
docker push your-registry/greenswitch-frontend:latest
```

### 3. 在服务器上部署

```bash
# 复制 docker-compose.yml 和 .env 到服务器
scp docker-compose.yml user@server:/app/
scp .env user@server:/app/

# SSH 到服务器并启动
ssh user@server
cd /app
docker-compose up -d
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT
