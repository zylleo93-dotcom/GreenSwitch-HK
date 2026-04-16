# GreenSwitch HK 自动配置脚本
# 此脚本会创建基础配置文件

Write-Host "🚀 GreenSwitch HK 配置向导" -ForegroundColor Green
Write-Host ""

# 项目路径
$projectPath = "$env:USERPROFILE\Desktop\GreenSwitch-HK-Enhanced"
$backendPath = "$projectPath\backend"
$frontendPath = "$projectPath\frontend"

# 检查项目是否存在
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ 错误: 项目不存在于 $projectPath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 项目路径: $projectPath" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 创建前端环境文件
# ============================================
Write-Host "📝 创建前端配置文件..." -ForegroundColor Yellow

$frontendEnv = @"
# API URL
VITE_API_URL=http://localhost:3001/api

# Firebase Config
VITE_FIREBASE_API_KEY=AIzaSyD0Q_YQd6uel4S7yUFtKTp5E6oVw6HpPpg
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0195794484.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0195794484
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0195794484.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=866018287884
VITE_FIREBASE_APP_ID=1:866018287884:web:532ba04f71e0256afe6929
"@

$frontendEnv | Out-File -FilePath "$frontendPath\.env.local" -Encoding UTF8
Write-Host "✅ 前端配置已创建: .env.local" -ForegroundColor Green

# ============================================
# 创建后端环境文件模板
# ============================================
Write-Host ""
Write-Host "📝 创建后端配置文件..." -ForegroundColor Yellow

# 检查是否已有 .env 文件
$backendEnvPath = "$backendPath\.env"
if (Test-Path $backendEnvPath) {
    Write-Host "⚠️ 后端 .env 文件已存在，跳过创建" -ForegroundColor Yellow
} else {
    $backendEnv = @"
# Server
PORT=3001
LOG_LEVEL=info

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Firebase Admin Service Account (Base64 encoded JSON)
# ⚠️ 需要替换为实际的 Base64 编码的服务账号密钥
# 获取方式:
# 1. Firebase Console > 项目设置 > 服务账号
# 2. 点击 "生成新的私钥"
# 3. 下载 JSON 文件
# 4. PowerShell 命令: [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\key.json"))
FIREBASE_SERVICE_ACCOUNT_BASE64=REPLACE_WITH_YOUR_BASE64_KEY

# Google Gemini API
# ⚠️ 需要替换为你的 Gemini API Key
# 获取方式: https://aistudio.google.com/ > Get API key
GEMINI_API_KEY=REPLACE_WITH_YOUR_GEMINI_KEY
GEMINI_MODEL=gemini-2.0-flash
"@

    $backendEnv | Out-File -FilePath $backendEnvPath -Encoding UTF8
    Write-Host "✅ 后端配置模板已创建: .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "配置完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 获取 Firebase 服务账号密钥:" -ForegroundColor White
Write-Host "   - 访问: https://console.firebase.google.com/" -ForegroundColor Gray
Write-Host "   - 项目: gen-lang-client-0195794484" -ForegroundColor Gray
Write-Host "   - 项目设置 > 服务账号 > 生成新的私钥" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 将密钥转换为 Base64:" -ForegroundColor White
Write-Host "   [Convert]::ToBase64String([IO.File]::ReadAllBytes(`"C:\path\to\key.json`"))" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 获取 Gemini API Key:" -ForegroundColor White
Write-Host "   - 访问: https://aistudio.google.com/" -ForegroundColor Gray
Write-Host "   - 点击 Get API key > Create API key" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 编辑 backend\.env 文件，替换以下值:" -ForegroundColor White
Write-Host "   - FIREBASE_SERVICE_ACCOUNT_BASE64" -ForegroundColor Gray
Write-Host "   - GEMINI_API_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "5. 启动服务:" -ForegroundColor White
Write-Host "   cd $projectPath" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""
