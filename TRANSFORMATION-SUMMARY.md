# CDC-v1 轉型摘要：從文件管制中心到請購案件上傳入口

## 轉型概述

本次改造將原本的「CDC 文件管制中心」轉型為「CDC 請購案件文件受控上傳入口」，遵循「可部署、低阻力、最小改造」原則。

## 核心變更

### 1. 定位轉變

| 面向 | 原 CDC-v1 | 新版本 |
|------|----------|--------|
| 系統定位 | 文件管制中心 | 請購案件上傳入口 |
| 組織單位 | 文件 + 版本 | 案件 + 檔案 |
| 主要功能 | 文件版本控制與簽核 | 檔案收集與組織 |
| 使用場景 | 正式文件審核發布 | 請購文件集中上傳 |

### 2. 資料模型變更

#### 移除的表
- `approval_workflows` - 簽核流程設定
- `approval_records` - 簽核記錄
- `permissions` - 權限設定

#### 轉換的表
- `categories` → `case_types`（文件類別 → 案件類型）
- `documents` → `cases`（文件 → 案件）
- `document_versions` → `case_files`（文件版本 → 案件檔案）

#### 保留的表
- `users` - 使用者（簡化角色）
- `audit_logs` - 審計日誌

### 3. 核心概念變更

#### 原 CDC-v1
```
文件（Document）
├── 文件代碼
├── 類別（QMS, SOP, SPEC...）
├── 當前版本
└── 版本歷史
    └── 版本 1, 2, 3...
        ├── 狀態：draft → pending_review → pending_approval → approved
        ├── 簽核記錄
        └── 正式版標記
```

#### 新版本
```
案件（Case）
├── 案號（自動生成）
├── 類型（GENERAL, IT, OFFICE...）
├── 元資料（部門、金額、申請人）
└── 檔案
    ├── 主文件 × 1（必填）
    └── 附件 × N（不分類）
```

## 保留的模組

### 1. SharePoint 整合架構
- MSAL 認證機制
- 檔案上傳/下載邏輯
- 基本的 REST API 整合框架

**改動**：
- 從文件版本命名改為案件檔案命名
- 從文件資料夾改為案件資料夾
- 新增資料夾元資料設定

### 2. Express.js 後端架構
- 路由系統
- 控制器模式
- 中介軟體設計

**改動**：
- 新增 case.routes.js 取代 document.routes.js
- 移除 approval.routes.js
- 簡化 admin.routes.js

### 3. 資料庫抽象層
- db.js 連接管理
- 模型層設計
- 初始化腳本

**改動**：
- 更新 schema.sql
- 新建案件相關模型
- 移除簽核相關模型

### 4. 檔案上傳處理
- Multer 中介軟體
- 本地暫存機制
- 檔案類型驗證

**改動**：
- 移除檔案類型限制（支援所有格式）
- 簡化檔案命名邏輯

## 需調整的模組

### 1. 移除簽核流程
**原功能**：
- 三階段簽核（作者 → 審核人 → 核准人）
- 簽核記錄追蹤
- 狀態流轉管理

**替代方案**：
- 簡單的案件狀態（active, closed, archived）
- 如需簽核，整合外部系統

### 2. 移除權限系統
**原功能**：
- 角色基礎存取控制（admin, author, reviewer, approver, viewer）
- 文件層級權限
- 類別權限

**替代方案**：
- 簡化為兩種角色（admin, user）
- 未來可依需求擴展

### 3. 移除版本控制
**原功能**：
- 文件版本號管理
- 正式版/草稿概念
- 版本封存機制

**替代方案**：
- 一個案件一組檔案
- 主文件 + 附件的扁平結構
- 如需版本控制，在檔名中標註

## 最小資料模型

### Cases（請購案件）
```sql
- id: 主鍵
- case_number: 案號（自動生成：類型-時間戳）
- case_type_id: 案件類型 FK
- department: 部門
- amount: 金額
- applicant_name: 申請人姓名
- applicant_id: 申請人 FK
- description: 描述
- status: 狀態（active/closed/archived）
- sharepoint_folder_path: SharePoint 路徑
- created_at, updated_at: 時間戳
```

### CaseFiles（案件檔案）
```sql
- id: 主鍵
- case_id: 案件 FK
- file_name: 系統檔名
- original_name: 原始檔名
- file_path: 本地路徑
- sharepoint_path: SharePoint 路徑
- file_size: 檔案大小
- file_type: MIME 類型
- is_main_document: 是否為主文件
- uploaded_by: 上傳者 FK
- created_at: 上傳時間
```

### CaseTypes（案件類型）
```sql
- id: 主鍵
- code: 類型代碼（GENERAL, IT, OFFICE...）
- name: 類型名稱
- description: 描述
- is_active: 是否啟用
- created_at, updated_at: 時間戳
```

## 必要 API

### 案件管理
1. **POST /api/cases** - 建立案件
2. **POST /api/cases/upload** - 上傳檔案
3. **GET /api/cases** - 查詢案件列表
4. **GET /api/cases/:id** - 取得案件詳情
5. **GET /api/cases/:case_id/files** - 取得案件檔案
6. **GET /api/cases/files/:file_id/download** - 下載檔案
7. **PUT /api/cases/:id** - 更新案件

### 管理功能
1. **GET/POST/PUT /api/admin/case-types** - 案件類型管理
2. **GET/POST/PUT /api/admin/users** - 使用者管理
3. **GET /api/admin/audit-logs** - 審計日誌

## SharePoint 對應方式

### 資料夾結構
```
ProcurementCases/
└── {CaseNumber}/
    ├── {CaseNumber}_main.{ext}
    └── {CaseNumber}_att_{timestamp}.{ext}
```

### Metadata 對應
資料夾層級的自訂欄位：
- **CaseNumber**: 案號
- **Department**: 部門
- **Amount**: 金額
- **Applicant**: 申請人
- **CaseType**: 案件類型
- **Description**: 描述

### 索引關聯
- SQLite 儲存案件基本資料與檔案清單
- SharePoint 儲存實際檔案內容
- 透過 `sharepoint_path` 關聯

## 避免的設計

### ❌ 不做 ERP 整合
- 不與會計系統連接
- 不做自動分錄
- 不做預算控管

### ❌ 不做簽核流程
- 不實作審核機制
- 不做流程引擎
- 不做電子簽名

### ❌ 不要求檔案分類
- 使用者自由上傳任意格式
- 不強制分類附件
- 主文件 + 附件的簡單結構

### ❌ 不做過度理想化的文件治理
- 不做文件內容解析
- 不做自動命名規則
- 不做複雜的元資料要求

## 部署步驟

### 1. 安裝與設定
```bash
npm install
cp .env.example .env
# 編輯 .env 設定
npm run init-db
```

### 2. 啟動服務
```bash
npm start  # 正式環境
npm run dev  # 開發環境
```

### 3. 驗證
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api
```

## 遷移建議

### 從原 CDC-v1 遷移
1. **資料庫**：建立新資料庫，不保留舊資料
2. **SharePoint**：使用新的文件庫或新資料夾
3. **使用者**：重新建立使用者帳號
4. **並行運作**：新舊系統可同時運作

### 升級路徑
1. **第一階段**：基本上傳功能（目前版本）
2. **第二階段**：整合外部簽核系統
3. **第三階段**：整合 ERP 查詢介面
4. **第四階段**：加入 AI 輔助分類

## 優勢與限制

### ✅ 優勢
- 簡單易用，學習曲線低
- 快速部署，無複雜設定
- 彈性高，支援任意檔案格式
- 可擴展，保留未來整合空間
- 低維護，減少系統複雜度

### ⚠️ 限制
- 無簽核流程，需外部系統
- 無複雜權限控管
- 無文件內容解析
- 無自動化工作流程
- 無 ERP 整合

## 結論

本次改造成功將 CDC-v1 從「文件管制中心」轉型為「請購案件上傳入口」，遵循以下原則：

1. **最小改造**：保留可用的架構，只改動必要部分
2. **低阻力**：簡化流程，降低使用門檻
3. **案件導向**：以案件為單位組織檔案
4. **可擴展**：為未來功能保留整合點

系統現在專注於提供一個簡單、可控的文件上傳入口，而不是試圖成為 ERP 或完整的文管系統。
