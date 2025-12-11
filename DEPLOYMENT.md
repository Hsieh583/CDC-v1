# CDC Document Control Center - 部署指南

本文件提供 CDC 系統的完整部署指南，涵蓋開發、測試和生產環境的部署步驟。

## 目錄

1. [系統需求](#系統需求)
2. [開發環境部署](#開發環境部署)
3. [生產環境部署](#生產環境部署)
4. [SharePoint 設定](#sharepoint-設定)
5. [資料庫設定](#資料庫設定)
6. [監控與維護](#監控與維護)
7. [故障排除](#故障排除)

## 系統需求

### 最低需求
- **Node.js**: 16.x 或更高版本
- **記憶體**: 2GB RAM
- **儲存空間**: 10GB（不含文件儲存）
- **作業系統**: Linux, macOS, Windows Server

### 建議需求（生產環境）
- **Node.js**: 18.x LTS
- **記憶體**: 4GB RAM
- **儲存空間**: 50GB SSD
- **CPU**: 2 核心以上
- **資料庫**: PostgreSQL 13+ 或 MySQL 8+

## 開發環境部署

### 1. 複製儲存庫

```bash
git clone https://github.com/Hsieh583/CDC-v1.git
cd CDC-v1
```

### 2. 安裝相依套件

```bash
npm install
```

### 3. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_PATH=./data/cdc.db

# SharePoint Configuration (可選，開發時使用模擬模式)
SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/CDC
SHAREPOINT_LIBRARY_NAME=DocumentLibrary
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_TENANT_ID=your-tenant-id

# File Upload Configuration
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=.pdf,.doc,.docx

# Security
JWT_SECRET=development-secret-key
SESSION_SECRET=development-session-secret
```

### 4. 初始化資料庫

```bash
npm run init-db
```

這會建立資料庫並插入預設資料：
- 管理員帳號 (admin@company.com)
- 5 個預設文件類別
- 預設審核流程設定

### 5. 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 http://localhost:3000 啟動。

### 6. 驗證安裝

```bash
# 健康檢查
curl http://localhost:3000/health

# API 文件
curl http://localhost:3000/api

# 取得類別列表
curl -H "X-User-ID: 1" http://localhost:3000/api/admin/categories
```

## 生產環境部署

### 選項 1: 使用 PM2 部署

#### 1. 安裝 PM2

```bash
npm install -g pm2
```

#### 2. 建立 PM2 設定檔

建立 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'cdc-api',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

#### 3. 啟動應用程式

```bash
# 啟動
pm2 start ecosystem.config.js

# 查看狀態
pm2 status

# 查看日誌
pm2 logs cdc-api

# 設定開機自動啟動
pm2 startup
pm2 save
```

### 選項 2: 使用 Docker 部署

#### 1. 建立 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/data /app/uploads /app/logs

EXPOSE 3000

CMD ["node", "src/server.js"]
```

#### 2. 建立 docker-compose.yml

```yaml
version: '3.8'

services:
  cdc-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/cdc.db
      - PORT=3000
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - cdc-api
    restart: unless-stopped
```

#### 3. 建立 Nginx 設定

建立 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream cdc_backend {
        server cdc-api:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        client_max_body_size 100M;

        location / {
            proxy_pass http://cdc_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/documents/upload-version {
            proxy_pass http://cdc_backend;
            proxy_http_version 1.1;
            proxy_request_buffering off;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            client_max_body_size 100M;
        }
    }
}
```

#### 4. 啟動 Docker 容器

```bash
# 建置和啟動
docker-compose up -d

# 查看日誌
docker-compose logs -f cdc-api

# 停止
docker-compose down
```

### 選項 3: 使用 Kubernetes 部署

#### 1. 建立 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cdc-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cdc-api
  template:
    metadata:
      labels:
        app: cdc-api
    spec:
      containers:
      - name: cdc-api
        image: your-registry/cdc-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_PATH
          value: "/app/data/cdc.db"
        volumeMounts:
        - name: data
          mountPath: /app/data
        - name: uploads
          mountPath: /app/uploads
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: cdc-data-pvc
      - name: uploads
        persistentVolumeClaim:
          claimName: cdc-uploads-pvc
```

## SharePoint 設定

### 1. 在 Azure AD 註冊應用程式

1. 登入 Azure Portal (https://portal.azure.com)
2. 前往 "Azure Active Directory" > "App registrations"
3. 點擊 "New registration"
4. 填寫應用程式資訊：
   - Name: CDC Document Control Center
   - Supported account types: Single tenant
   - Redirect URI: 不需要（使用 Client Credentials）

### 2. 設定 API 權限

1. 在應用程式頁面，選擇 "API permissions"
2. 點擊 "Add a permission"
3. 選擇 "Microsoft Graph"
4. 選擇 "Application permissions"
5. 新增以下權限：
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
6. 點擊 "Grant admin consent"

### 3. 建立 Client Secret

1. 選擇 "Certificates & secrets"
2. 點擊 "New client secret"
3. 設定描述和有效期限
4. 複製 secret 值（只會顯示一次）

### 4. 取得設定資訊

- **Client ID**: 在 "Overview" 頁面的 "Application (client) ID"
- **Tenant ID**: 在 "Overview" 頁面的 "Directory (tenant) ID"
- **Client Secret**: 剛才建立的 secret 值

### 5. 設定 SharePoint 網站

1. 建立 SharePoint 網站（如果還沒有）
2. 建立文件庫名稱（例如：DocumentLibrary）
3. 記下網站 URL

### 6. 更新環境變數

將取得的資訊更新到 `.env` 檔案：

```env
SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/CDC
SHAREPOINT_LIBRARY_NAME=DocumentLibrary
SHAREPOINT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SHAREPOINT_CLIENT_SECRET=your-secret-value
SHAREPOINT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 資料庫設定

### SQLite（開發和小型部署）

SQLite 是預設的資料庫，適合：
- 開發環境
- 小型部署（< 100 使用者）
- 單一伺服器部署

設定在 `.env`：
```env
DATABASE_PATH=./data/cdc.db
```

### PostgreSQL（生產環境建議）

適合大型部署和高並發環境。

#### 1. 安裝 PostgreSQL 驅動

```bash
npm install pg
```

#### 2. 建立資料庫

```sql
CREATE DATABASE cdc_production;
CREATE USER cdc_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE cdc_production TO cdc_user;
```

#### 3. 更新資料庫連線（需修改程式碼）

建立 `src/database/pg.js`：

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'cdc_production',
    user: process.env.DB_USER || 'cdc_user',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

## 監控與維護

### 1. 日誌管理

#### 使用 PM2

```bash
# 查看即時日誌
pm2 logs cdc-api

# 清除日誌
pm2 flush

# 日誌輪替設定
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

#### 使用 Docker

```bash
# 查看日誌
docker-compose logs -f cdc-api

# 限制日誌大小
# 在 docker-compose.yml 中設定
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 2. 效能監控

#### 使用 PM2 Monitoring

```bash
pm2 install pm2-server-monit
pm2 monit
```

#### 整合 Prometheus

建立 `src/metrics.js`：

```javascript
const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

module.exports = { register, httpRequestDuration };
```

### 3. 健康檢查

API 提供健康檢查端點：

```bash
curl http://localhost:3000/health
```

回應：
```json
{
  "status": "OK",
  "message": "CDC Document Control Center is running"
}
```

### 4. 備份策略

#### 資料庫備份

```bash
# SQLite
cp data/cdc.db data/backups/cdc-$(date +%Y%m%d).db

# PostgreSQL
pg_dump -U cdc_user -d cdc_production > backup-$(date +%Y%m%d).sql
```

#### 自動備份腳本

建立 `scripts/backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 備份資料庫
cp data/cdc.db "$BACKUP_DIR/cdc-$DATE.db"

# 清理 30 天前的備份
find "$BACKUP_DIR" -name "cdc-*.db" -mtime +30 -delete

echo "Backup completed: cdc-$DATE.db"
```

設定 crontab：
```bash
# 每天凌晨 2 點執行備份
0 2 * * * /path/to/scripts/backup.sh
```

## 故障排除

### 常見問題

#### 1. 伺服器無法啟動

**檢查項目：**
```bash
# 檢查 Node.js 版本
node --version

# 檢查埠號是否被占用
lsof -i :3000

# 檢查環境變數
cat .env

# 檢查資料庫檔案
ls -la data/cdc.db
```

#### 2. 檔案上傳失敗

**檢查項目：**
```bash
# 檢查上傳目錄權限
ls -la uploads/

# 建立上傳目錄
mkdir -p uploads
chmod 755 uploads

# 檢查檔案大小限制
grep MAX_FILE_SIZE .env
```

#### 3. SharePoint 連線失敗

**檢查項目：**
```bash
# 檢查環境變數
grep SHAREPOINT .env

# 測試網路連線
curl https://yourcompany.sharepoint.com

# 檢查應用程式日誌
pm2 logs cdc-api | grep SharePoint
```

#### 4. 資料庫錯誤

**解決方案：**
```bash
# 重新初始化資料庫（警告：會清除所有資料）
rm data/cdc.db
npm run init-db

# 檢查資料庫完整性
sqlite3 data/cdc.db "PRAGMA integrity_check;"
```

### 除錯模式

啟用詳細日誌：

```bash
# .env 中設定
NODE_ENV=development
DEBUG=*

# 或啟動時設定
DEBUG=* npm start
```

### 效能問題

#### 資料庫查詢慢

```bash
# SQLite 分析
sqlite3 data/cdc.db
.timer on
EXPLAIN QUERY PLAN SELECT ...
```

#### 記憶體洩漏

```bash
# 使用 Node.js 記憶體分析
node --inspect src/server.js

# 使用 Chrome DevTools 連接並分析
```

## 安全性檢查清單

### 部署前檢查

- [ ] 更改所有預設密碼和金鑰
- [ ] 啟用 HTTPS/SSL
- [ ] 設定防火牆規則
- [ ] 限制資料庫存取
- [ ] 啟用日誌記錄
- [ ] 設定備份機制
- [ ] 更新所有相依套件
- [ ] 設定速率限制
- [ ] 啟用 CORS 白名單
- [ ] 檢查檔案上傳限制

### 定期維護

- [ ] 每週檢查安全更新
- [ ] 每月審查存取日誌
- [ ] 每季更新 SSL 憑證
- [ ] 每季測試備份恢復
- [ ] 每半年進行安全審計

## 升級程序

### 1. 備份

```bash
# 備份資料庫
cp data/cdc.db data/cdc.db.backup

# 備份設定
cp .env .env.backup
```

### 2. 更新程式碼

```bash
git pull origin main
npm install
```

### 3. 執行遷移（如有需要）

```bash
npm run migrate
```

### 4. 重新啟動

```bash
# PM2
pm2 restart cdc-api

# Docker
docker-compose down
docker-compose up -d

# 手動
npm start
```

### 5. 驗證

```bash
curl http://localhost:3000/health
```

## 聯絡支援

如遇到問題，請提供以下資訊：

- Node.js 版本
- 作業系統和版本
- 錯誤訊息和日誌
- 重現步驟
- 環境設定（移除敏感資訊）

## 附錄

### A. 環境變數完整列表

請參考 `.env.example` 檔案。

### B. API 端點列表

請參考 `API_EXAMPLES.md` 檔案。

### C. 架構說明

請參考 `ARCHITECTURE.md` 檔案。