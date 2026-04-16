FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY src/ ./src/

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "src/index.js"]
