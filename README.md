# CDC Document Control Center (文件管制中心)

CDC（文件管制中心）是一個以 SharePoint 作為唯一文件庫的 Web 平台，負責公司列管文件的上傳、版本管理與簽核。

## 系統特色

### 核心功能
- **文件上傳與版本管理**: 使用者可建立新文件或新版本，所有文件皆不得由使用者直接寫入 SharePoint，必須透過 CDC Portal 上傳
- **自動檔案命名**: 系統依文件代碼與版本自動命名檔案並寫入 SharePoint
- **三階段簽核流程**: 固定為作者 → 審核人 → 核准人的三階段審核流程
- **版本控制**: 核准後的新版本設為最新正式版，舊版自動封存
- **權限控管**: 完整的權限管理機制，確保文件安全
- **審計追蹤**: 所有決定與意見需記錄在簽核紀錄中，可完整追溯

### Portal 功能
- 文件查詢與搜尋
- 版本歷史查看
- 正式版下載
- 權限控管
- 管理員可維護類別與簽核流程設定

## 技術架構

### 後端技術
- **Node.js + Express**: RESTful API 服務
- **SQLite**: 本地資料庫（可升級至 PostgreSQL/MySQL）
- **SharePoint REST API**: 文件儲存整合
- **MSAL (Microsoft Authentication Library)**: SharePoint 身份驗證

### 資料庫設計
- `users`: 使用者帳號與角色
- `categories`: 文件類別
- `documents`: 文件主檔
- `document_versions`: 文件版本記錄
- `approval_workflows`: 簽核流程設定
- `approval_records`: 簽核紀錄
- `permissions`: 權限設定
- `audit_logs`: 審計日誌

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
SHAREPOINT_LIBRARY_NAME=DocumentLibrary
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_TENANT_ID=your-tenant-id
```

### 3. 初始化資料庫

```bash
npm run init-db
```

這會建立資料庫結構並插入預設資料：
- 管理員帳號 (admin@company.com)
- 預設文件類別 (QMS, SOP, SPEC, FORM, PROC)
- 預設簽核流程設定

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

### 主要 API 端點

#### 文件管理 (`/api/documents`)

**建立文件**
```http
POST /api/documents
Content-Type: application/json

{
  "title": "品質管理手冊",
  "category_id": 1,
  "description": "ISO 9001 品質管理系統手冊"
}
```

**上傳文件版本**
```http
POST /api/documents/upload-version
Content-Type: multipart/form-data

document_id: 1
title: 品質管理手冊
description: 第二版修訂
file: [檔案]
```

**查詢文件**
```http
GET /api/documents?page=1&limit=20
GET /api/documents/search?search=品質&category_id=1
GET /api/documents/1
GET /api/documents/1/versions
```

**下載正式版**
```http
GET /api/documents/1/download
```

#### 簽核管理 (`/api/approvals`)

**提交審核（Stage 1 → 2）**
```http
POST /api/approvals/submit
Content-Type: application/json

{
  "version_id": 1
}
```

**審核文件（Stage 2）**
```http
POST /api/approvals/review
Content-Type: application/json

{
  "version_id": 1,
  "action": "approved",  // approved | rejected | returned
  "comments": "審核通過"
}
```

**核准文件（Stage 3）**
```http
POST /api/approvals/approve
Content-Type: application/json

{
  "version_id": 1,
  "action": "approved",
  "comments": "核准通過"
}
```

**查詢待辦簽核**
```http
GET /api/approvals/pending
```

**查詢簽核歷史**
```http
GET /api/approvals/history/1
```

#### 管理功能 (`/api/admin`)

需要管理員權限 (role: admin)

**類別管理**
```http
GET /api/admin/categories
POST /api/admin/categories
PUT /api/admin/categories/1
```

**使用者管理**
```http
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/1
```

**簽核流程設定**
```http
GET /api/admin/workflow/1
PUT /api/admin/workflow/1/2
```

**審計日誌**
```http
GET /api/admin/audit-logs?page=1&limit=50
```

## 簽核流程

### 三階段審核流程

```
Stage 1: 作者 (Author)
    ↓ 提交
Stage 2: 審核人 (Reviewer)
    ↓ 審核通過
Stage 3: 核准人 (Approver)
    ↓ 核准通過
正式版 (Official Version)
```

### 流程狀態

- `draft`: 草稿
- `pending_review`: 待審核（Stage 2）
- `pending_approval`: 待核准（Stage 3）
- `approved`: 已核准（正式版）
- `rejected`: 已拒絕
- `archived`: 已封存

### 簽核動作

- `submitted`: 提交
- `approved`: 核准
- `rejected`: 拒絕
- `returned`: 退回修改

## 使用者角色

- `admin`: 系統管理員（所有權限）
- `author`: 作者（可建立文件與版本）
- `reviewer`: 審核人（Stage 2 審核）
- `approver`: 核准人（Stage 3 核准）
- `viewer`: 檢視者（僅可查看）

## 檔案類型限制

預設支援的檔案類型：
- PDF (.pdf)
- Microsoft Word (.doc, .docx)

可在 `.env` 中設定 `ALLOWED_FILE_TYPES`

檔案大小限制：
- 預設 50MB
- 可在 `.env` 中設定 `MAX_FILE_SIZE`（單位：bytes）

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

### 檔案命名規則

格式：`{DocumentCode}_v{Version}.{extension}`

範例：
- `QMS-1234567890_v1.pdf`
- `SOP-1234567891_v2.docx`

### SharePoint 路徑結構

```
DocumentLibrary/
├── QMS-1234567890/
│   ├── QMS-1234567890_v1.pdf
│   └── QMS-1234567890_v2.pdf
├── SOP-1234567891/
│   └── SOP-1234567891_v1.docx
└── ...
```

## 資料庫架構

### 核心資料表

**documents** - 文件主檔
- `document_code`: 文件代碼（唯一）
- `title`: 文件標題
- `category_id`: 文件類別
- `current_version`: 目前版本號
- `status`: 文件狀態

**document_versions** - 文件版本
- `document_id`: 所屬文件
- `version_number`: 版本號
- `file_name`: 檔案名稱
- `sharepoint_path`: SharePoint 路徑
- `status`: 版本狀態
- `is_official`: 是否為正式版

**approval_records** - 簽核記錄
- `version_id`: 版本 ID
- `stage_number`: 簽核階段（1-3）
- `approver_id`: 簽核人
- `action`: 簽核動作
- `comments`: 簽核意見

## 開發指南

### 專案結構

```
CDC-v1/
├── src/
│   ├── controllers/       # 控制器（業務邏輯）
│   ├── models/           # 資料模型
│   ├── routes/           # 路由定義
│   ├── services/         # 外部服務整合
│   ├── middleware/       # 中介軟體
│   ├── database/         # 資料庫相關
│   └── server.js         # 主程式
├── data/                 # 資料庫檔案
├── uploads/              # 暫存上傳檔案
├── .env                  # 環境變數
└── package.json          # 專案設定
```

### 擴展功能

此平台奠定後續功能的基礎：
- AI 文件分類
- 修訂摘要
- 自動標籤
- 文件相似度比對
- 智能搜尋

## 測試

```bash
npm test
```

## 授權

MIT License

## 聯絡資訊

如有問題或建議，請聯繫系統管理員。
