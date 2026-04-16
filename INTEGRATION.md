# GreenSwitch HK 整合指南

## 概述

本指南说明如何将现有的 GreenSwitch HK 前端代码与新创建的后端服务整合，实现前后端打通。

## 项目结构

```
GreenSwitch-HK-Enhanced/
├── backend/              # 新增：Node.js 后端 API
├── frontend/             # 原项目前端代码 + API 集成
└── docker-compose.yml    # 服务编排
```

## 整合步骤

### 第一步：复制原项目代码

将原项目的 `src` 目录复制到 `frontend/` 目录下：

```bash
# 假设原项目在桌面
cp -r ~/Desktop/GreenSwitch-HK-main/GreenSwitch-HK-main/src ~/Desktop/GreenSwitch-HK-Enhanced/frontend/
```

### 第二步：安装 API 服务层

将 `frontend/src/services/api.js` 复制到整合后的项目中：

```bash
cp ~/Desktop/GreenSwitch-HK-Enhanced/frontend/src/services/api.js \
   ~/Desktop/GreenSwitch-HK-main/GreenSwitch-HK-main/src/services/
```

### 第三步：修改 AI 服务调用

编辑 `src/utils/aiService.js`，将直接调用 Gemini 改为调用后端 API：

```javascript
// 原代码 (直接调用 Gemini)
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 新代码 (调用后端 API)
import { aiApi } from '../services/api.js';

export const analyzeImages = async (files, utility, installationType) => {
  // 转换文件为 base64
  const fileToBase64 = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        data: reader.result.split(',')[1],
        mimeType: file.type
      });
      reader.readAsDataURL(file);
    });
  };

  const [electricityBillImages, efficiencyLabelImages, oldEfficiencyLabelImages, financialImages] = await Promise.all([
    Promise.all((files.electricity || []).map(fileToBase64)),
    Promise.all((files.efficiency || []).map(fileToBase64)),
    Promise.all((files.oldEfficiency || []).map(fileToBase64)),
    Promise.all((files.financial || []).map(fileToBase64))
  ]);

  // 调用后端 API
  const response = await aiApi.analyze({
    electricityBillImages,
    efficiencyLabelImages,
    oldEfficiencyLabelImages,
    financialImages,
    utility,
    installationType
  });

  return response.data;
};
```

### 第四步：添加环境变量

在 `frontend/.env.local` 中添加：

```
VITE_API_URL=http://localhost:3001/api
```

### 第五步：更新 package.json (后端)

确保后端依赖完整：

```bash
cd backend
npm install
```

### 第六步：配置 Firebase

1. 在 Firebase Console 创建项目
2. 下载服务账号密钥
3. 转换为 base64:
   ```bash
   cat serviceAccountKey.json | base64
   ```
4. 设置环境变量:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_string
   export GEMINI_API_KEY=your_gemini_api_key
   ```

### 第七步：启动服务

```bash
# 启动后端
cd backend
npm run dev

# 启动前端 (新终端)
cd frontend
npm run dev
```

## 关键改动说明

### 1. AI 调用方式

**之前**: 前端直接调用 Gemini API
- 优点：简单直接
- 缺点：API Key 暴露在前端

**之后**: 前端 → 后端 → Gemini API
- 优点：API Key 安全，可缓存，可限流
- 缺点：增加一次网络请求

### 2. 数据持久化

**之前**: 数据仅存于前端状态
- 刷新页面数据丢失

**之后**: 数据保存到 Firestore
- 申报记录持久化
- 跨设备同步

### 3. 用户认证

**之前**: Firebase Auth 仅用于识别用户

**之后**: Firebase Auth + 后端验证
- JWT Token 验证
- 用户数据管理
- 权限控制

## API 端点映射

| 功能 | 原实现 | 新实现 |
|------|--------|--------|
| AI 分析 | `ai.models.generateContent()` | `POST /api/ai/analyze` |
| 节能计算 | `calculateBatchSavings()` (前端) | `POST /api/ai/calculate` |
| 用户数据 | Firebase Auth | `GET/PUT /api/auth/me` |
| 申报记录 | 无 | `CRUD /api/applications` |
| 文件上传 | 无 | `POST /api/upload` |

## 文件对应关系

### 后端路由 ↔ 前端服务

| 后端路由 | 前端 API 函数 |
|----------|--------------|
| `ai.js` | `aiApi.analyze()`, `aiApi.calculate()` |
| `auth.js` | `authApi.getMe()`, `authApi.updateMe()` |
| `applications.js` | `applicationApi.*` |
| `upload.js` | `uploadApi.*` |

## 部署方式

### 开发环境

```bash
# 同时启动前后端
docker-compose up -d
```

### 生产环境

```bash
# 构建镜像
docker-compose build

# 推送镜像
docker push your-registry/greenswitch-backend
docker push your-registry/greenswitch-frontend

# 在服务器部署
docker-compose -f docker-compose.prod.yml up -d
```

## 注意事项

1. **CORS**: 确保后端 `FRONTEND_URL` 配置正确
2. **环境变量**: 生产环境使用安全的密钥管理
3. **文件大小**: 默认限制 10MB，可在 `upload.js` 调整
4. **限流**: AI 接口每小时限制 20 次，可根据需要调整

## 故障排除

### 前端无法连接后端
- 检查 `VITE_API_URL` 是否正确
- 检查后端是否运行在正确端口
- 检查 CORS 配置

### AI 分析失败
- 检查 `GEMINI_API_KEY` 是否有效
- 查看后端日志
- 检查图片格式和大小

### 认证失败
- 检查 Firebase 配置
- 检查服务账号密钥是否正确
- 确认用户已登录

## 后续优化建议

1. **添加加载状态**: 在 API 调用时显示 loading
2. **错误重试**: 网络错误时自动重试
3. **离线支持**: 使用 Service Worker 缓存
4. **数据同步**: 实时同步申报记录状态
