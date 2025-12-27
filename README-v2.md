# CDC 請購案件文件受控上傳入口

CDC（Controlled Document Center）是一個專為請購案件設計的文件上傳管理平台，以 SharePoint 作為唯一文件儲存庫，提供受控的文件上傳入口。

## 系統定位

**CDC 不是：**
- ❌ ERP 系統
- ❌ 文件管理中心（Document Management System）
- ❌ 簽核流程引擎
- ❌ 文件內容解析工具

**CDC 是：**
- ✅ 請購案件文件的受控上傳入口
- ✅ 以案件為單位的檔案組織工具
- ✅ SharePoint 整合的索引層
- ✅ 簡單的檔案追蹤系統

## 核心概念

### 案件模型

```
請購案件（Case）
├── 案號：自動生成（類型代碼-時間戳）
├── 元資料（儲存在 SharePoint 資料夾屬性）
│   ├── 案件類型
│   ├── 部門
│   ├── 金額
│   ├── 申請人
│   └── 描述
└── 檔案
    ├── 主文件 × 1（必填，任意格式）
    └── 附件 × N（不分類，任意格式）
```

### SharePoint 結構

```
ProcurementCases/
├── GENERAL-1234567890/
│   ├── GENERAL-1234567890_main.pdf
│   ├── GENERAL-1234567890_att_1234567891.xlsx
│   └── GENERAL-1234567890_att_1234567892.docx
├── IT-1234567893/
│   ├── IT-1234567893_main.docx
│   └── IT-1234567893_att_1234567894.pdf
└── ...
```

### SQLite 索引

SQLite 資料庫**僅用於索引與關聯**，不儲存檔案內容：
- 案件基本資料
- 檔案清單與路徑
- 使用者資訊
- 審計日誌

## 快速開始

### 1. 安裝相依套件

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env` 並填入相關設定：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
# Server Configuration
PORT=3000

# Database Configuration
DATABASE_PATH=./data/cdc.db

# SharePoint Configuration
SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/CDC
SHAREPOINT_LIBRARY_NAME=ProcurementCases
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_TENANT_ID=your-tenant-id

# File Upload Configuration
MAX_FILE_SIZE=52428800
```

### 3. 初始化資料庫

```bash
npm run init-db
```

這會建立資料庫結構並插入預設資料：
- 管理員帳號 (admin@company.com)
- 測試使用者 (user1@company.com)
- 預設案件類型（GENERAL, IT, OFFICE, SERVICE, FACILITY）

### 4. 啟動服務

```bash
npm start
```

開發模式（自動重啟）：

```bash
npm run dev
```

服務將在 http://localhost:3000 啟動

## API 文件

### 基本資訊
- API 根路徑: `/api`
- API 文件: `GET /api`
- 健康檢查: `GET /health`

### 認證機制
所有 API 請求需在 Header 中包含使用者 ID：
```
X-User-ID: 1
```

> 註：生產環境中應使用 JWT 或其他安全的認證機制

### 案件管理 API

#### 建立案件
```http
POST /api/cases
Content-Type: application/json
X-User-ID: 1

{
  "case_type_id": 1,
  "department": "採購部",
  "amount": 50000,
  "description": "辦公設備採購"
}
```

#### 上傳檔案
```http
POST /api/cases/upload
Content-Type: multipart/form-data
X-User-ID: 1

case_id: 1
is_main_document: true
file: [檔案]
```

#### 查詢案件
```http
GET /api/cases?page=1&limit=20
GET /api/cases/search?department=採購部&case_type_id=1
GET /api/cases/1
GET /api/cases/1/files
```

#### 下載檔案
```http
GET /api/cases/files/1/download
```

#### 更新案件
```http
PUT /api/cases/1
Content-Type: application/json
X-User-ID: 1

{
  "department": "財務部",
  "amount": 60000,
  "status": "closed"
}
```

### 管理功能 API

#### 案件類型管理
```http
GET /api/admin/case-types
POST /api/admin/case-types
PUT /api/admin/case-types/1
```

#### 使用者管理
```http
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/1
```

#### 審計日誌
```http
GET /api/admin/audit-logs?page=1&limit=50
```

## 資料模型

### 核心資料表

**cases** - 請購案件
- `case_number`: 案號（自動生成）
- `case_type_id`: 案件類型
- `department`: 部門
- `amount`: 金額
- `applicant_name`: 申請人姓名
- `status`: 案件狀態（active, closed, archived）

**case_files** - 案件檔案
- `case_id`: 所屬案件
- `file_name`: 檔案名稱
- `original_name`: 原始檔名
- `sharepoint_path`: SharePoint 路徑
- `is_main_document`: 是否為主文件

**case_types** - 案件類型
- `code`: 類型代碼
- `name`: 類型名稱
- `description`: 描述

**users** - 使用者
- `username`: 使用者名稱
- `email`: 電子郵件
- `full_name`: 全名
- `department`: 部門
- `role`: 角色（admin, user）

## 設計原則

### 1. 最小改造
- 保留原有的 SharePoint 整合架構
- 保留資料庫層抽象與服務層設計
- 移除不需要的簽核流程和權限系統

### 2. 低阻力部署
- 使用 SQLite（可升級至 PostgreSQL/MySQL）
- 本地檔案暫存，非同步上傳 SharePoint
- SharePoint 未設定時可純本地運作

### 3. 案件導向
- 以案件為組織單位，不是文件版本
- 一個案件 = 一個 SharePoint 資料夾
- 元資料儲存在資料夾層級

### 4. 不做什麼
- ❌ 不做簽核流程
- ❌ 不做文件內容解析
- ❌ 不要求使用者分類附件
- ❌ 不做複雜的權限控管
- ❌ 不整合 ERP 或會計系統

## SharePoint 整合

### 設定步驟

1. 在 Azure AD 註冊應用程式
2. 設定 SharePoint API 權限：
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
3. 取得應用程式認證資訊：
   - Client ID
   - Client Secret
   - Tenant ID
4. 在 `.env` 中設定相關參數

### 資料夾命名規則

格式：`{CaseTypeCode}-{Timestamp}`

範例：
- `GENERAL-1234567890`
- `IT-1234567891`
- `OFFICE-1234567892`

### 檔案命名規則

- 主文件：`{CaseNumber}_main.{ext}`
- 附件：`{CaseNumber}_att_{timestamp}.{ext}`

範例：
- `GENERAL-1234567890_main.pdf`
- `GENERAL-1234567890_att_1234567891.xlsx`

## 使用場景

### 場景 1：建立新請購案件
1. 使用者建立案件（指定類型、部門、金額）
2. 系統生成案號並建立 SharePoint 資料夾
3. 使用者上傳主文件（PDF、Word、Excel 等任意格式）
4. 使用者可選擇上傳附件（報價單、規格書等）

### 場景 2：查詢案件
1. 使用者搜尋案件（依案號、部門、類型等）
2. 查看案件詳情與所有檔案
3. 下載需要的檔案

### 場景 3：追蹤與審計
1. 管理員查看所有案件與檔案
2. 查看審計日誌（誰上傳了什麼檔案）
3. 統計分析（各部門案件數、金額分布等）

## 檔案類型支援

CDC **不限制**檔案類型，支援所有格式：
- 文件：PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- 圖片：JPG, PNG, GIF, BMP
- 壓縮檔：ZIP, RAR, 7Z
- 其他：任意格式

檔案大小限制：
- 預設 50MB
- 可在 `.env` 中設定 `MAX_FILE_SIZE`（單位：bytes）

## 測試

```bash
npm test
```

## 專案結構

```
CDC-v1/
├── src/
│   ├── controllers/       # 控制器（業務邏輯）
│   │   ├── case.controller.js
│   │   └── admin-v2.controller.js
│   ├── models/           # 資料模型
│   │   ├── case.model.js
│   │   ├── case-file.model.js
│   │   ├── case-type.model.js
│   │   └── user.model.js
│   ├── routes/           # 路由定義
│   │   ├── case.routes.js
│   │   └── admin-v2.routes.js
│   ├── services/         # 外部服務整合
│   │   └── sharepoint.service.js
│   ├── database/         # 資料庫相關
│   │   ├── db.js
│   │   ├── init.js
│   │   └── schema.sql
│   └── server.js         # 主程式
├── data/                 # 資料庫檔案
├── uploads/              # 暫存上傳檔案
├── .env                  # 環境變數
└── package.json          # 專案設定
```

## 與原 CDC-v1 的差異

| 項目 | 原 CDC-v1 | 新版本（請購上傳入口） |
|------|----------|-------------------|
| 定位 | 文件管制中心 | 請購案件上傳入口 |
| 組織單位 | 文件 + 版本 | 案件 + 檔案 |
| 簽核流程 | 三階段審核 | 無（僅上傳） |
| 檔案分類 | 需分類（QMS, SOP 等） | 不需分類 |
| 權限系統 | 複雜的權限控管 | 簡單的使用者角色 |
| 元資料 | 文件層級 | 資料夾層級 |
| 主要用途 | 正式文件版本控制 | 請購文件收集整理 |

## 升級路徑

如需更進階的功能，可考慮：
1. 整合線上簽核系統（獨立系統）
2. 整合 ERP（透過 API）
3. 加入文件 OCR 與自動分類
4. 實作完整的權限控管
5. 加入通知與提醒功能

## 授權

MIT License

## 聯絡資訊

如有問題或建議，請聯繫系統管理員。
