# CDC 請購案件文件上傳入口 - 快速部署指南

## 前置需求

- Node.js 14.x 或更新版本
- npm 6.x 或更新版本
- （可選）SharePoint Online 存取權限

## 部署步驟

### 1. 複製專案

```bash
git clone https://github.com/Hsieh583/CDC-v1.git
cd CDC-v1
```

### 2. 安裝依賴套件

```bash
npm install
```

### 3. 設定環境變數

複製環境變數範本：
```bash
cp .env.example .env
```

編輯 `.env` 檔案並設定以下參數：

```env
# 伺服器設定
PORT=3000
NODE_ENV=production

# 資料庫設定
DATABASE_PATH=./data/cdc.db

# SharePoint 設定（可選，如果未設定將使用本地儲存）
SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/CDC
SHAREPOINT_LIBRARY_NAME=ProcurementCases
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_TENANT_ID=your-tenant-id

# 檔案上傳設定
MAX_FILE_SIZE=52428800
```

### 4. 初始化資料庫

```bash
npm run init-db
```

這會建立：
- 資料庫結構
- 預設管理員帳號（admin@company.com）
- 預設測試使用者（user1@company.com）
- 預設案件類型（GENERAL, IT, OFFICE, SERVICE, FACILITY）

### 5. 啟動服務

開發環境：
```bash
npm run dev
```

正式環境：
```bash
npm start
```

### 6. 驗證部署

開啟瀏覽器訪問：
- 健康檢查：http://localhost:3000/health
- API 文件：http://localhost:3000/api

或使用 curl：
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api
```

## SharePoint 設定（可選）

如果要整合 SharePoint，需要完成以下步驟：

### 1. 在 Azure AD 註冊應用程式

1. 登入 [Azure Portal](https://portal.azure.com)
2. 導航到「Azure Active Directory」→「應用程式註冊」
3. 點擊「新增註冊」
4. 填入應用程式名稱（例如：CDC Upload Portal）
5. 設定「支援的帳戶類型」
6. 點擊「註冊」

### 2. 設定 API 權限

1. 在應用程式頁面，點擊「API 權限」
2. 點擊「新增權限」→「Microsoft Graph」
3. 選擇「應用程式權限」
4. 新增以下權限：
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
5. 點擊「授與管理員同意」

### 3. 建立用戶端密碼

1. 點擊「憑證與密碼」
2. 點擊「新增用戶端密碼」
3. 填入描述並選擇到期時間
4. 點擊「新增」
5. **立即複製密碼值**（離開頁面後將無法再次查看）

### 4. 取得應用程式資訊

在「概觀」頁面記錄：
- **應用程式（用戶端）識別碼**（SHAREPOINT_CLIENT_ID）
- **目錄（租用戶）識別碼**（SHAREPOINT_TENANT_ID）
- 用戶端密碼（SHAREPOINT_CLIENT_SECRET）

### 5. 更新 .env 檔案

將取得的資訊填入 `.env` 檔案：
```env
SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/CDC
SHAREPOINT_LIBRARY_NAME=ProcurementCases
SHAREPOINT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SHAREPOINT_CLIENT_SECRET=your-secret-value
SHAREPOINT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 6. 在 SharePoint 建立文件庫

1. 開啟 SharePoint 網站
2. 建立新的文件庫，命名為「ProcurementCases」
3. （可選）設定自訂欄位以儲存案件元資料

## 使用 PM2 部署（建議正式環境）

### 1. 安裝 PM2

```bash
npm install -g pm2
```

### 2. 建立 PM2 設定檔

建立 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'cdc-upload-portal',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### 3. 啟動服務

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. 監控服務

```bash
pm2 status
pm2 logs cdc-upload-portal
pm2 monit
```

## 使用 Docker 部署（選擇性）

### 1. 建立 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run init-db

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. 建立 .dockerignore

```
node_modules
npm-debug.log
.env
.git
.gitignore
```

### 3. 建置與執行

```bash
docker build -t cdc-upload-portal .
docker run -d -p 3000:3000 --name cdc-portal cdc-upload-portal
```

## 反向代理設定（Nginx）

### Nginx 設定範例

```nginx
server {
    listen 80;
    server_name upload.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 檔案上傳大小限制
        client_max_body_size 50M;
    }
}
```

重新載入 Nginx：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 資料庫備份

### 備份 SQLite 資料庫

```bash
# 手動備份
cp ./data/cdc.db ./data/cdc.db.backup

# 建立備份腳本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=./backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
cp ./data/cdc.db $BACKUP_DIR/cdc_$DATE.db
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x backup.sh
```

### 設定定期備份（cron）

```bash
# 每天凌晨 2 點備份
crontab -e
# 新增以下行
0 2 * * * /path/to/cdc-v1/backup.sh
```

## 監控與日誌

### 應用程式日誌

預設會輸出到 console，建議重定向到檔案：

```bash
npm start > logs/app.log 2>&1 &
```

### 審計日誌

系統將所有操作記錄在資料庫的 `audit_logs` 表中。

查看最近的審計日誌：
```bash
sqlite3 data/cdc.db "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10"
```

## 故障排除

### 問題：無法連接到資料庫

檢查資料庫檔案是否存在：
```bash
ls -la data/cdc.db
```

如果不存在，重新初始化：
```bash
npm run init-db
```

### 問題：檔案上傳失敗

1. 檢查 uploads 目錄權限：
```bash
chmod 755 uploads/
```

2. 檢查檔案大小限制（.env）：
```bash
cat .env | grep MAX_FILE_SIZE
```

3. 檢查 Nginx 設定（如果使用）

### 問題：SharePoint 連接失敗

1. 驗證環境變數設定
2. 檢查 Azure AD 權限
3. 確認用戶端密碼未過期
4. 查看應用程式日誌

### 問題：連接埠已被使用

更改 .env 中的 PORT 設定：
```env
PORT=3001
```

## 升級與維護

### 升級步驟

1. 備份資料庫
2. 拉取最新程式碼
3. 安裝新的依賴套件
4. 重新啟動服務

```bash
./backup.sh
git pull origin main
npm install
pm2 restart cdc-upload-portal
```

### 清理暫存檔案

定期清理 uploads 目錄：
```bash
# 刪除 7 天前的暫存檔案
find ./uploads -type f -mtime +7 -delete
```

## 效能調校

### 資料庫優化

```bash
# SQLite VACUUM（壓縮資料庫）
sqlite3 data/cdc.db "VACUUM;"

# 分析與優化
sqlite3 data/cdc.db "ANALYZE;"
```

### Node.js 記憶體限制

如果處理大量檔案，可能需要增加記憶體限制：
```bash
node --max-old-space-size=4096 src/server.js
```

## 安全建議

1. **使用 HTTPS**：在正式環境中務必使用 SSL/TLS
2. **強化認證**：替換 X-User-ID header 為 JWT
3. **定期更新**：保持依賴套件為最新版本
4. **限制存取**：使用防火牆限制 API 存取
5. **備份策略**：定期備份資料庫和設定檔

## 支援與聯絡

如有問題或建議，請：
1. 查看文件：README-v2.md, ARCHITECTURE-v2.md
2. 查看 API 範例：API_EXAMPLES-v2.md
3. 提交 Issue 到 GitHub
4. 聯絡系統管理員

## 授權

MIT License
