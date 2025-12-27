# CDC 請購案件文件上傳入口 - 系統架構

## 系統概述

CDC 請購案件文件上傳入口是一個輕量級的文件組織平台，專注於以案件為單位收集和組織請購相關文件。系統以 SharePoint 作為文件儲存後端，SQLite 作為索引層。

## 設計原則

### 1. 最小改造原則
基於原 CDC-v1 進行最小化改動：
- 保留 SharePoint 整合架構
- 保留資料庫抽象層
- 保留基本的 MVC 結構
- 移除不需要的簽核流程和複雜權限

### 2. 案件導向設計
- **案件 = SharePoint 資料夾**
- 元資料儲存在資料夾層級
- 主文件 + 附件的簡單結構
- 不做文件版本控制

### 3. 低阻力部署
- 本地 SQLite 可直接運作
- SharePoint 可選配置
- 無需複雜的初始設定
- 支援逐步升級

## 架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                   (Web Browser / API Client)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express.js REST API                     │  │
│  │  ┌────────────┐ ┌────────────┐                      │  │
│  │  │   Case     │ │   Admin    │                      │  │
│  │  │ Controller │ │ Controller │                      │  │
│  │  └────────────┘ └────────────┘                      │  │
│  │          │              │                            │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │         Middleware Layer                   │    │  │
│  │  │  - File Upload (Multer)                    │    │  │
│  │  │  - Audit Logging                           │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────┬──────────────────┘
                       │                   │
          ┌────────────┘                   └────────────┐
          ↓                                             ↓
┌───────────────────────┐                  ┌──────────────────────┐
│   Database Layer      │                  │   External Services   │
│   ┌───────────────┐  │                  │  ┌────────────────┐  │
│   │   SQLite DB   │  │                  │  │   SharePoint   │  │
│   │   (索引層)     │  │                  │  │     Online     │  │
│   │               │  │                  │  │                │  │
│   │ - cases       │  │                  │  │ 資料夾結構存放    │  │
│   │ - case_files  │  │                  │  │ 文件內容與元資料  │  │
│   │ - case_types  │  │                  │  │                │  │
│   │ - users       │  │                  │  │ Service Account│  │
│   │ - audit_logs  │  │                  │  │   (MSAL Auth)  │  │
│   └───────────────┘  │                  │  └────────────────┘  │
└───────────────────────┘                  └──────────────────────┘
```

## 資料模型

### 核心實體關係

```
┌──────────────┐
│   Users      │
└──────┬───────┘
       │
       │ applicant_id
       ↓
┌──────────────┐         ┌──────────────┐
│  CaseTypes   │◄────────│    Cases     │
└──────────────┘         └──────┬───────┘
                                │
                                │ case_id
                                ↓
                         ┌──────────────┐
                         │  CaseFiles   │
                         └──────────────┘
```

### 案件（Cases）

請購案件的主實體，對應 SharePoint 中的一個資料夾。

```sql
CREATE TABLE cases (
    id INTEGER PRIMARY KEY,
    case_number TEXT UNIQUE,        -- 案號：{類型}-{時間戳}
    case_type_id INTEGER,           -- 案件類型
    department TEXT,                -- 部門
    amount DECIMAL(15,2),           -- 金額
    applicant_name TEXT,            -- 申請人姓名
    applicant_id INTEGER,           -- 申請人 ID
    description TEXT,               -- 描述
    status TEXT,                    -- 狀態：active, closed, archived
    sharepoint_folder_path TEXT,    -- SharePoint 資料夾路徑
    created_at DATETIME,
    updated_at DATETIME
);
```

### 案件檔案（CaseFiles）

案件的檔案清單，包含主文件和附件。

```sql
CREATE TABLE case_files (
    id INTEGER PRIMARY KEY,
    case_id INTEGER,                -- 所屬案件
    file_name TEXT,                 -- 系統檔名
    original_name TEXT,             -- 原始檔名
    file_path TEXT,                 -- 本地檔案路徑
    sharepoint_path TEXT,           -- SharePoint 路徑
    file_size INTEGER,              -- 檔案大小
    file_type TEXT,                 -- MIME 類型
    is_main_document BOOLEAN,       -- 是否為主文件
    uploaded_by INTEGER,            -- 上傳者
    created_at DATETIME
);
```

### 案件類型（CaseTypes）

請購案件的類別定義。

```sql
CREATE TABLE case_types (
    id INTEGER PRIMARY KEY,
    code TEXT UNIQUE,               -- 類型代碼
    name TEXT,                      -- 類型名稱
    description TEXT,               -- 描述
    is_active BOOLEAN,
    created_at DATETIME
);
```

### 使用者（Users）

系統使用者，簡化為兩種角色。

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    full_name TEXT,
    department TEXT,
    role TEXT,                      -- 角色：admin, user
    is_active BOOLEAN,
    created_at DATETIME
);
```

## 業務流程

### 1. 建立案件流程

```
[使用者] 填寫案件資訊
    ↓
[系統] 生成案號 (類型代碼-時間戳)
    ↓
[系統] 在 SQLite 建立案件記錄
    ↓
[SharePoint] 建立對應資料夾
    ↓
[SharePoint] 設定資料夾元資料
    ↓
[系統] 返回案件資訊
```

### 2. 上傳檔案流程

```
[使用者] 選擇案件並上傳檔案
    ↓
[Multer] 暫存檔案到本地
    ↓
[系統] 驗證檔案與案件
    ↓
[系統] 生成檔案名稱
    ↓
[SharePoint] 上傳到案件資料夾
    ↓
[系統] 建立檔案記錄
    ↓
[系統] 記錄審計日誌
```

### 3. 查詢案件流程

```
[使用者] 搜尋案件（關鍵字/條件）
    ↓
[SQLite] 快速查詢索引
    ↓
[系統] 返回案件列表
    ↓
[使用者] 選擇案件查看詳情
    ↓
[SQLite] 取得案件與檔案清單
    ↓
[系統] 顯示案件詳情
```

## SharePoint 整合

### 資料夾結構

```
ProcurementCases/
├── GENERAL-1701234567890/
│   ├── GENERAL-1701234567890_main.pdf
│   ├── GENERAL-1701234567890_att_1701234567891.xlsx
│   └── GENERAL-1701234567890_att_1701234567892.docx
├── IT-1701234567893/
│   ├── IT-1701234567893_main.docx
│   └── IT-1701234567893_att_1701234567894.pdf
└── ...
```

### 元資料對應

SharePoint 資料夾屬性對應案件元資料：

| 案件欄位 | SharePoint 欄位 | 說明 |
|---------|----------------|------|
| case_number | Title | 案號 |
| department | Department | 部門 |
| amount | Amount | 金額 |
| applicant_name | Applicant | 申請人 |
| case_type | CaseType | 案件類型 |
| description | Description | 描述 |

### API 操作

主要的 SharePoint REST API 操作：

```javascript
// 建立資料夾
POST /_api/web/folders
{
  "ServerRelativeUrl": "/sites/CDC/ProcurementCases/GENERAL-1701234567890"
}

// 設定資料夾元資料
PATCH /_api/web/folders/getbyurl('{folderPath}')/ListItemAllFields
{
  "Department": "採購部",
  "Amount": 50000,
  "Applicant": "王小明"
}

// 上傳檔案
POST /_api/web/GetFolderByServerRelativeUrl('{folder}')/Files/add(url='{filename}',overwrite=true)
[檔案內容]

// 下載檔案
GET /_api/web/GetFileByServerRelativeUrl('{path}')/$value
```

## API 設計

### 案件 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | /api/cases | 建立案件 |
| GET | /api/cases | 取得案件列表 |
| GET | /api/cases/search | 搜尋案件 |
| GET | /api/cases/:id | 取得案件詳情 |
| PUT | /api/cases/:id | 更新案件 |
| POST | /api/cases/upload | 上傳檔案 |
| GET | /api/cases/:case_id/files | 取得案件檔案 |
| GET | /api/cases/files/:file_id/download | 下載檔案 |

### 管理 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | /api/admin/case-types | 取得案件類型 |
| POST | /api/admin/case-types | 建立案件類型 |
| PUT | /api/admin/case-types/:id | 更新案件類型 |
| GET | /api/admin/users | 取得使用者 |
| POST | /api/admin/users | 建立使用者 |
| PUT | /api/admin/users/:id | 更新使用者 |
| GET | /api/admin/audit-logs | 取得審計日誌 |

## 安全性設計

### 1. 認證機制
- 目前使用簡化的 X-User-ID header（開發環境）
- 生產環境建議使用 JWT 或 OAuth 2.0
- SharePoint 使用服務帳號存取

### 2. 授權控制
- 簡化的角色設計：admin、user
- 使用者只能看到自己的案件（未來可擴展）
- 管理員可以看到所有案件

### 3. 審計追蹤
- 所有操作記錄到 audit_logs
- 記錄使用者、操作、時間
- 支援合規性審查

### 4. 檔案安全
- 檔案大小限制
- 不限制檔案類型（由使用者負責）
- 病毒掃描整合點（未來擴展）

## 效能最佳化

### 1. 資料庫索引
- case_number (唯一索引)
- case_type_id, department, status (查詢索引)
- case_id (檔案查詢)

### 2. 檔案處理
- 非同步上傳到 SharePoint
- 本地暫存檔案定期清理
- 大檔案支援（未來可擴展分塊上傳）

### 3. 查詢優化
- SQLite 作為快速索引層
- SharePoint 僅用於檔案儲存
- 分頁查詢避免大量資料載入

## 可擴展性

### 1. 資料庫遷移
- 目前使用 SQLite（開發和小型部署）
- 可輕易遷移到 PostgreSQL / MySQL
- Schema 與具體實作分離

### 2. 水平擴展
- 無狀態 API 服務器
- 檔案儲存在 SharePoint（共享儲存）
- 可透過負載平衡器擴展

### 3. 功能擴展點
- 整合簽核系統（外部）
- 整合 ERP（API）
- 文件 OCR 與自動分類
- 通知系統
- 報表與分析

## 部署架構

### 開發環境
```
Local Machine
├── Node.js Application (localhost:3000)
├── SQLite Database (./data/cdc.db)
└── Local File Storage (./uploads/)
```

### 生產環境建議
```
┌─────────────────┐
│   Load Balancer │
│    (Nginx)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ App 1 │ │ App 2 │  (PM2 / Docker)
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (主資料庫)     │
└─────────────────┘
         │
┌────────▼────────┐
│  SharePoint     │
│    Online       │
└─────────────────┘
```

## 監控與維護

### 1. 應用程式監控
- 健康檢查端點：`/health`
- API 回應時間
- 錯誤率追蹤

### 2. 業務監控
- 案件建立數量
- 檔案上傳數量
- 使用者活動統計

### 3. 日誌管理
- 應用程式日誌（Console/File）
- 審計日誌（Database）
- 錯誤日誌（Error tracking）

## 限制與邊界

### 系統做什麼
- ✅ 提供受控的檔案上傳入口
- ✅ 以案件為單位組織檔案
- ✅ 建立 SharePoint 與 SQLite 索引關聯
- ✅ 記錄審計日誌

### 系統不做什麼
- ❌ 不做簽核流程（可外部整合）
- ❌ 不解析文件內容
- ❌ 不分類附件
- ❌ 不做複雜權限控管
- ❌ 不整合 ERP 系統

## 從原 CDC-v1 的改造

### 保留的部分
- SharePoint 整合架構
- Express.js 後端框架
- SQLite/資料庫抽象層
- 檔案上傳處理（Multer）
- 審計日誌系統

### 移除的部分
- 三階段簽核流程
- 文件版本控制
- 複雜的權限系統
- 文件分類要求
- 正式版/草稿概念

### 新增的部分
- 案件模型（取代文件模型）
- 主文件 + 附件結構
- 資料夾層級元資料
- 簡化的使用者角色
- 案件狀態追蹤

## 結論

CDC 請購案件文件上傳入口採用最小改造原則，在原 CDC-v1 的基礎上：
- 簡化了複雜的簽核流程
- 專注於案件為單位的檔案組織
- 保持低阻力部署
- 為未來擴展保留彈性
