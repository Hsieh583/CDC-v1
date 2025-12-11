# CDC 系統架構文件

## 系統概述

CDC (文件管制中心) 是一個基於 SharePoint 的文件管理平台，提供完整的文件生命週期管理，包括上傳、版本控制和三階段審核流程。

## 架構設計原則

### 1. 單一文件庫原則
- 所有文件必須透過 CDC Portal 上傳
- 使用服務帳號寫入 SharePoint
- 禁止使用者直接存取 SharePoint
- 確保文件可追溯性和不可篡改性

### 2. 三階段審核流程
```
草稿 (Draft)
    ↓ 作者提交
待審核 (Pending Review) - Stage 2
    ↓ 審核人審核
待核准 (Pending Approval) - Stage 3
    ↓ 核准人核准
已核准 (Approved) - 正式版
```

### 3. 版本管理策略
- 每個文件可有多個版本
- 核准後的版本自動設為正式版
- 舊版本自動封存（archived）
- 每個版本獨立經歷審核流程

## 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                   (Web Browser / API Client)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway / Load Balancer             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express.js REST API                     │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐      │  │
│  │  │ Document   │ │ Approval   │ │   Admin    │      │  │
│  │  │ Controller │ │ Controller │ │ Controller │      │  │
│  │  └────────────┘ └────────────┘ └────────────┘      │  │
│  │          │              │              │             │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │         Middleware Layer                   │    │  │
│  │  │  - Authentication                          │    │  │
│  │  │  - Authorization                           │    │  │
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
│   │               │  │                  │  │     Online     │  │
│   │ - documents   │  │                  │  │                │  │
│   │ - versions    │  │                  │  │ Service Account│  │
│   │ - approvals   │  │                  │  │   (MSAL Auth)  │  │
│   │ - categories  │  │                  │  └────────────────┘  │
│   │ - users       │  │                  └──────────────────────┘
│   │ - audit_logs  │  │
│   └───────────────┘  │
└───────────────────────┘
```

## 資料模型

### 核心實體關係

```
┌──────────────┐
│   Users      │
└──────┬───────┘
       │
       │ author_id
       ↓
┌──────────────┐         ┌──────────────┐
│  Categories  │◄────────│  Documents   │
└──────────────┘         └──────┬───────┘
                                │
                                │ document_id
                                ↓
                         ┌──────────────────┐
                         │ Document Versions│
                         └──────┬───────────┘
                                │
                                │ version_id
                                ↓
                         ┌──────────────────┐
                         │ Approval Records │
                         └──────────────────┘
```

### 資料表詳細說明

#### users
- 儲存使用者資訊和角色
- 角色類型：admin, author, reviewer, approver, viewer
- 支援啟用/停用狀態

#### categories
- 文件類別定義
- 每個類別有獨立的審核流程配置
- 預設類別：QMS, SOP, SPEC, FORM, PROC

#### documents
- 文件主檔，記錄文件基本資訊
- document_code 格式：{CategoryCode}-{Timestamp}
- 追蹤目前版本號和文件狀態

#### document_versions
- 文件版本記錄
- 每個版本有獨立的審核狀態
- 儲存 SharePoint 路徑和本地路徑
- is_official 標記正式版本

#### approval_records
- 審核歷史記錄
- 記錄每個階段的審核決定和意見
- 支援追溯和審計

#### approval_workflows
- 審核流程設定
- 定義每個類別的三階段流程
- 可客製化各階段要求的角色

## 業務流程

### 1. 文件建立流程

```
[使用者] 建立文件請求
    ↓
[系統] 驗證使用者權限
    ↓
[系統] 生成文件代碼 (CategoryCode-Timestamp)
    ↓
[資料庫] 建立文件主檔記錄
    ↓
[系統] 返回文件資訊
```

### 2. 版本上傳流程

```
[使用者] 上傳文件檔案
    ↓
[Multer] 驗證檔案類型和大小
    ↓
[系統] 暫存檔案到本地
    ↓
[SharePoint Service] 生成檔名 (DocumentCode_vN.ext)
    ↓
[SharePoint Service] 上傳到 SharePoint
    ↓
[資料庫] 建立版本記錄
    ↓
[資料庫] 建立初始審核記錄 (submitted)
    ↓
[系統] 更新文件狀態為 in_review
```

### 3. 三階段審核流程

```
Stage 1: 作者提交
    [作者] 提交審核請求
    [系統] 更新狀態為 pending_review
    [系統] approval_stage = 2
    
Stage 2: 審核人審核
    [審核人] 審核文件內容
    [審核人] 決定：approved / rejected / returned
    
    if approved:
        [系統] 更新狀態為 pending_approval
        [系統] approval_stage = 3
    
    if rejected:
        [系統] 更新狀態為 rejected
        [流程] 結束
    
    if returned:
        [系統] 更新狀態為 draft
        [系統] approval_stage = 1
        [流程] 返回修改

Stage 3: 核准人核准
    [核准人] 最終核准
    [核准人] 決定：approved / rejected / returned
    
    if approved:
        [系統] 更新狀態為 approved
        [系統] 設定 is_official = 1
        [系統] 封存舊版本 (status = archived, is_official = 0)
        [系統] 記錄核准時間
        [流程] 完成
    
    if rejected:
        [系統] 更新狀態為 rejected
        [流程] 結束
    
    if returned:
        [系統] 返回 Stage 2
```

### 4. 版本封存機制

```
當新版本獲得核准時：
    [系統] 查詢目前正式版本
    [系統] 更新舊版本：
        - is_official = 0
        - status = archived
    [系統] 設定新版本：
        - is_official = 1
        - status = approved
        - approved_at = CURRENT_TIMESTAMP
```

## 安全性設計

### 1. 認證機制
- 目前使用簡化的 X-User-ID header（開發環境）
- 生產環境建議使用 JWT 或 OAuth 2.0
- 支援多因素認證整合

### 2. 授權控制
- 角色基礎存取控制 (RBAC)
- 各 API 端點有明確的角色要求
- 文件層級權限控制

### 3. 審計追蹤
- 所有操作記錄到 audit_logs
- 記錄使用者、操作、時間、IP
- 支援合規性審查

### 4. 檔案安全
- 檔案類型白名單
- 檔案大小限制
- 病毒掃描整合點（未來擴展）

## SharePoint 整合

### 認證方式
- 使用 Azure AD 應用程式註冊
- MSAL (Microsoft Authentication Library)
- 服務帳號以 Client Credentials 流程取得 Access Token

### 檔案儲存結構
```
DocumentLibrary/
├── QMS-1234567890/
│   ├── QMS-1234567890_v1.pdf
│   ├── QMS-1234567890_v2.pdf
│   └── QMS-1234567890_v3.pdf
├── SOP-1234567891/
│   └── SOP-1234567891_v1.docx
└── ...
```

### API 操作
- **上傳**: POST /sites/{site}/drive/items/{parent}/children
- **下載**: GET /sites/{site}/drive/items/{itemId}/content
- **元資料**: GET /sites/{site}/drive/items/{itemId}
- **刪除**: DELETE /sites/{site}/drive/items/{itemId}

## 效能最佳化

### 1. 資料庫索引
- document_code (唯一索引)
- category_id, author_id, status (查詢索引)
- version_id, stage_number (審核查詢)

### 2. 快取策略
- 類別列表快取（變動頻率低）
- 使用者資訊快取
- 審核流程設定快取

### 3. 檔案處理
- 非同步上傳到 SharePoint
- 暫存檔案定期清理
- 大檔案分塊上傳（未來擴展）

## 可擴展性設計

### 1. 微服務化準備
- 清晰的業務邊界
- RESTful API 設計
- 無狀態服務設計

### 2. 資料庫遷移
- 目前使用 SQLite（開發和小型部署）
- 可輕易遷移到 PostgreSQL / MySQL
- Schema 與具體實作分離

### 3. 水平擴展
- 無狀態 API 服務器
- 檔案儲存在 SharePoint（共享儲存）
- 資料庫連接池管理

## 未來擴展功能

### 1. AI 功能
- 文件自動分類
- 內容智能摘要
- 版本差異分析
- 自動標籤生成

### 2. 協作功能
- 即時協作編輯
- 評論和註解
- 通知系統

### 3. 進階搜尋
- 全文搜尋
- OCR 圖片文字識別
- 語意搜尋

### 4. 報表和分析
- 文件使用統計
- 審核效率分析
- 合規性報告

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
│   (Primary)     │
└─────────────────┘
         │
┌────────▼────────┐
│  SharePoint     │
│    Online       │
└─────────────────┘
```

## 監控和日誌

### 1. 應用程式監控
- CPU、記憶體使用率
- API 回應時間
- 錯誤率追蹤

### 2. 業務監控
- 文件上傳數量
- 審核處理時間
- 使用者活動統計

### 3. 日誌管理
- 結構化日誌（JSON）
- 集中式日誌收集
- 日誌輪替和歸檔

## 災難恢復

### 1. 備份策略
- 資料庫定期備份（每日）
- SharePoint 內建版本控制
- 審計日誌長期保存

### 2. 恢復程序
- 資料庫恢復腳本
- 應用程式狀態檢查
- 服務健康監控

## 合規性考量

### 1. 資料保護
- 符合 GDPR 要求
- 資料加密（傳輸和靜態）
- 存取日誌記錄

### 2. 文件管理標準
- ISO 9001 品質管理
- 21 CFR Part 11（製藥業）
- 文件保存期限管理

## 結論

CDC 系統採用模組化、可擴展的架構設計，確保：
- 文件管理的完整性和可追溯性
- 清晰的審核流程和權限控制
- 良好的效能和可維護性
- 未來功能擴展的靈活性