# CDC 文件管制中心 - 前端說明

## 專案概述

本前端使用純 HTML + Bootstrap + 原生 JavaScript 實現，無需任何前端框架。所有檔案都是靜態的，可以直接部署到 IIS 或任何靜態網頁伺服器。

## 技術架構

### 前端技術
- **HTML5**: 語義化標記
- **Bootstrap 5.3**: 來自 CDN 的 UI 框架
- **Bootstrap Icons**: 圖示庫
- **原生 JavaScript**: 無需任何框架或建置工具
- **Fetch API**: 與後端 API 通訊

### 特色
- ✅ 不使用任何前端框架 (React, Vue, Angular)
- ✅ 每個功能獨立的 HTML 頁面
- ✅ 使用 fetch() 呼叫後端 API
- ✅ DOM 操作呈現動態內容
- ✅ 可直接部署到 IIS 或靜態伺服器
- ✅ 響應式設計，支援行動裝置

## 目錄結構

```
public/
├── index.html              # 登入頁面 (首頁)
├── css/
│   └── style.css          # 自訂樣式表
├── js/
│   ├── api.js            # API 呼叫封裝
│   └── utils.js          # 工具函數與共用邏輯
└── pages/
    ├── dashboard.html         # 儀表板
    ├── documents.html         # 文件列表
    ├── document-detail.html   # 文件詳情
    ├── upload.html           # 上傳文件
    ├── approvals.html        # 待辦簽核
    ├── approval-review.html  # 審核文件 (Stage 2)
    ├── approval-approve.html # 核准文件 (Stage 3)
    └── admin.html            # 系統管理
```

## 功能頁面說明

### 1. 登入頁面 (index.html)
- 選擇使用者登入（開發環境用）
- 儲存使用者資訊到 sessionStorage
- 自動導向儀表板

### 2. 儀表板 (dashboard.html)
- 顯示統計資訊（總文件數、已核准、待審核、待辦事項）
- 快速操作連結
- 最近文件列表
- 待辦事項提醒

### 3. 文件管理 (documents.html)
- 文件列表展示
- 關鍵字搜尋
- 類別與狀態篩選
- 文件下載功能

### 4. 文件詳情 (document-detail.html)
- 顯示文件完整資訊
- 版本歷史記錄
- 簽核記錄查詢
- 下載正式版本

### 5. 上傳文件 (upload.html)
- 建立新文件並上傳第一版
- 為現有文件上傳新版本
- 支援 PDF、DOC、DOCX 格式
- 檔案類型與大小驗證

### 6. 簽核管理 (approvals.html)
- 顯示所有待辦簽核
- 依階段分類（審核 / 核准）
- 快速進入處理頁面

### 7. 審核文件 (approval-review.html)
- Stage 2 審核功能
- 可核准、退回或拒絕
- 顯示簽核歷史
- 記錄審核意見

### 8. 核准文件 (approval-approve.html)
- Stage 3 最終核准
- 核准後成為正式版本
- 完整的簽核歷程追蹤

### 9. 系統管理 (admin.html)
- 使用者管理（新增、編輯、停用）
- 文件類別管理
- 審計日誌查詢
- 僅管理員可存取

## API 整合

所有 API 呼叫都封裝在 `js/api.js` 中，提供以下模組：

### DocumentsAPI
- `getAll()` - 取得所有文件
- `search(params)` - 搜尋文件
- `getById(id)` - 取得文件詳情
- `getVersions(documentId)` - 取得版本歷史
- `create(data)` - 建立新文件
- `uploadVersion(formData)` - 上傳版本
- `download(documentId)` - 下載文件

### ApprovalsAPI
- `getPending()` - 取得待辦簽核
- `getHistory(versionId)` - 取得簽核歷史
- `getWorkflow(categoryId)` - 取得工作流程
- `submit(versionId)` - 提交審核
- `review(versionId, action, comments)` - 審核
- `approve(versionId, action, comments)` - 核准

### AdminAPI
- `getCategories()` - 取得類別列表
- `createCategory(data)` - 建立類別
- `updateCategory(id, data)` - 更新類別
- `getUsers()` - 取得使用者列表
- `createUser(data)` - 建立使用者
- `updateUser(id, data)` - 更新使用者
- `getAuditLogs(page, limit)` - 取得審計日誌

## 部署指南

### 方式一：與後端一起部署（推薦）

1. 前端檔案已整合到後端專案的 `public` 目錄
2. 啟動後端伺服器：
   ```bash
   npm start
   ```
3. 前端會自動由後端伺服器提供服務
4. 存取 http://localhost:3000

### 方式二：部署到 IIS

1. 將 `public` 目錄所有檔案複製到 IIS 網站根目錄

2. 確保 IIS 已安裝：
   - 靜態內容
   - 預設文件

3. 設定 `index.html` 為預設文件

4. 設定 URL Rewrite 規則（如需 API 代理）：
   ```xml
   <rewrite>
     <rules>
       <rule name="API Proxy" stopProcessing="true">
         <match url="^api/(.*)" />
         <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
       </rule>
     </rules>
   </rewrite>
   ```

5. 修改 `js/api.js` 中的 API_BASE_URL（如果後端在不同伺服器）：
   ```javascript
   const API_BASE_URL = 'http://your-backend-server:3000';
   ```

### 方式三：部署到其他靜態伺服器

#### Apache
1. 複製檔案到 `htdocs` 或網站目錄
2. 確保 `.htaccess` 允許存取所有檔案
3. 設定 API 代理（使用 mod_proxy）

#### Nginx
1. 複製檔案到網站根目錄
2. 設定 nginx.conf：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/public;
       index index.html;

       location /api {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

#### 純靜態檔案伺服器
如果使用 Netlify、Vercel、GitHub Pages 等：
1. 部署 `public` 目錄所有檔案
2. 必須在 `js/api.js` 中設定完整的後端 API URL
3. 後端必須啟用 CORS

## 設定說明

### API 端點設定
在 `js/api.js` 修改：
```javascript
const API_BASE_URL = window.location.origin; // 使用相同網域
// 或
const API_BASE_URL = 'https://api.your-domain.com'; // 使用不同網域
```

### CORS 設定
如果前後端分離部署，後端需要設定 CORS：
```javascript
// src/server.js
app.use(cors({
    origin: 'https://your-frontend-domain.com',
    credentials: true
}));
```

## 瀏覽器支援

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支援：
- ES6+ (fetch, async/await, arrow functions)
- sessionStorage
- FormData API

## 開發說明

### 無需建置工具
此專案不需要任何建置步驟：
- 不需要 webpack、vite、rollup
- 不需要 npm run build
- 直接編輯 HTML/CSS/JS 即可
- 重新整理瀏覽器即可看到變更

### 除錯
1. 開啟瀏覽器開發者工具 (F12)
2. 查看 Console 標籤查看錯誤訊息
3. 查看 Network 標籤查看 API 請求
4. 使用 Sources 標籤設定中斷點

### 新增頁面
1. 在 `pages` 目錄建立新的 HTML 檔案
2. 複製現有頁面的導航列結構
3. 引入必要的 JS 檔案：
   ```html
   <script src="/js/api.js"></script>
   <script src="/js/utils.js"></script>
   ```
4. 實作頁面特定的 JavaScript 邏輯

## 安全性考量

### 目前實作（開發環境）
- 使用簡單的使用者選擇登入
- X-User-ID header 進行身份識別
- sessionStorage 儲存使用者資訊

### 生產環境建議
1. 實作真實的登入系統（帳號密碼）
2. 使用 JWT token 進行認證
3. 在 HTTPS 上運行
4. 實作 token 更新機制
5. 加強輸入驗證
6. 實作 CSP (Content Security Policy)

## 效能優化

### 已實作
- 使用 CDN 載入 Bootstrap（快速、全球分散）
- 最小化 DOM 操作
- 事件委派（Event Delegation）
- 延遲載入（Lazy Loading）

### 可選優化
1. 啟用瀏覽器快取
2. 壓縮 CSS 和 JS 檔案
3. 使用 Service Worker 實作離線功能
4. 圖片優化與 lazy loading

## 常見問題

### Q: 為什麼不使用 React/Vue/Angular？
A: 根據需求，此專案需要：
- 簡單部署（無需建置）
- 易於維護（不需要前端框架知識）
- 可直接在 IIS 運行
- 減少依賴與複雜度

### Q: 如何新增使用者？
A: 以管理員身份登入後，前往「系統管理」→「使用者管理」→「新增使用者」

### Q: API 無法連接怎麼辦？
A: 檢查：
1. 後端伺服器是否運行
2. API_BASE_URL 設定是否正確
3. CORS 設定是否正確
4. 瀏覽器 Console 錯誤訊息

### Q: Bootstrap 樣式沒有載入？
A: 檢查：
1. 網路連線是否正常
2. CDN 是否可存取
3. 瀏覽器開發者工具 Network 標籤查看載入狀態

## 授權

MIT License

## 支援

如有問題，請聯繫系統管理員或開啟 GitHub Issue。
