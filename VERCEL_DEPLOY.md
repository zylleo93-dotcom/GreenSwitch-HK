# Vercel 部署指南

## 项目地址
https://github.com/zylleo93-dotcom/GreenSwitch-HK

## 部署步骤

### 1. 登录 Vercel
访问 https://vercel.com 并用 GitHub 账号登录

### 2. 导入项目
1. 点击 "Add New Project"
2. 选择 "Import Git Repository"
3. 选择 `zylleo93-dotcom/GreenSwitch-HK`
4. 点击 "Import"

### 3. 配置构建设置
在配置页面设置：

**Framework Preset:** Other

**Build Command:**
```bash
cd frontend && npm install && npm run build
```

**Output Directory:**
```
frontend/dist
```

**Install Command:**
```bash
npm install
```

**Root Directory:** `./` (保持默认)

### 4. 环境变量设置
点击 "Environment Variables" 添加以下变量：

#### 必需变量
| 变量名 | 值 | 说明 |
|--------|-----|------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | [你的 Base64 服务账号] | Firebase 服务账号密钥的 Base64 |
| `GEMINI_API_KEY` | [你的 Gemini API Key] | Google Gemini API 密钥 |
| `FRONTEND_URL` | [部署后的 Vercel URL] | 如: https://greenswitch-hk.vercel.app |

#### 可选变量
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | 3001 | 后端端口 |
| `LOG_LEVEL` | info | 日志级别 |

### 5. 部署
点击 "Deploy" 开始部署

部署完成后，Vercel 会提供一个类似 `https://greenswitch-hk-xxx.vercel.app` 的 URL

## 后端部署说明

本项目包含前端和后端两部分：

- **前端**: React + Vite → 部署为静态站点
- **后端**: Express + Firebase → 需要服务器持续运行

### 方案 A: 纯 Vercel 部署（推荐测试用）
使用 `vercel.json` 中的配置，后端作为 Serverless Functions 运行。

**限制**: 
- 免费版有执行时间限制（10秒/请求）
- 冷启动会有延迟
- 不适合长时间运行的任务

### 方案 B: 分离部署（推荐生产用）
- **前端**: Vercel（静态站点）
- **后端**: Render / Railway / Fly.io（Node.js 服务器）

#### 后端部署到 Render:
1. 访问 https://render.com
2. 创建 Web Service
3. 选择 GitHub 仓库
4. 设置:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend`
5. 添加环境变量（同上）
6. 部署完成后，将 Render URL 更新到前端 `.env` 中的 `VITE_API_BASE_URL`

## Firebase 配置

确保 Firebase 项目已正确配置：

1. 在 Firebase Console 创建 Web App
2. 获取 `firebaseConfig` 并更新到 `frontend/.env.local`
3. 下载服务账号密钥并转换为 Base64:
   ```bash
   base64 -i serviceAccountKey.json -o serviceAccountKey.base64
   ```

## 故障排除

### 构建失败
检查 Build Command 是否正确指向 frontend 目录

### API 请求 404
检查 `vercel.json` 中的路由配置是否正确

### Firebase 认证失败
检查 `FIREBASE_SERVICE_ACCOUNT_BASE64` 是否正确设置

### CORS 错误
确保 `FRONTEND_URL` 环境变量设置为正确的 Vercel 域名

## 自定义域名（可选）

1. 在 Vercel 项目设置中添加自定义域名
2. 按照 DNS 配置指引添加记录
3. 更新 `FRONTEND_URL` 环境变量为自定义域名
