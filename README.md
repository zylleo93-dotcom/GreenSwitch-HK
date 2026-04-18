---
title: GreenSwitch HK
emoji: 🌿
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
---

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GreenSwitch HK

中小企節能設備資助 AI 申報助手，自動分析電費單與能效標籤，評估節能效益與補貼資格。

## Architecture

```
Browser (React SPA)  ──POST /api/analyze──▶  Express server (server.js)  ──▶  Gemini API
                                              ↑ GEMINI_API_KEY lives here
```

The API key **never** reaches the browser. The Express backend proxies all Gemini calls.

## Run Locally

**Prerequisites:** Node.js ≥ 20

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` and set your Gemini API key:
   ```
   GEMINI_API_KEY=your_key_here
   ```

3. Start the backend server (port 7860):
   ```bash
   npm start
   ```

4. In a **separate terminal**, start the Vite dev server (port 3000, proxies `/api` → 7860):
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`

## Production / Docker

```bash
docker build -t greenswitch .
docker run -p 7860:7860 -e GEMINI_API_KEY=your_key_here greenswitch
```

The container builds the React app, then serves both the static files and API from a single Node.js process on port 7860.
