# CDC API 使用範例

本文件提供 CDC Document Control Center API 的詳細使用範例。

## 前置準備

所有 API 請求需要在 Header 中包含使用者識別：

```bash
X-User-ID: 1
```

## 完整工作流程範例

### 1. 查看可用類別

```bash
curl -X GET http://localhost:3000/api/admin/categories \
  -H "X-User-ID: 1"
```

回應：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "QMS",
      "name": "品質管理文件",
      "description": "Quality Management System documents"
    },
    {
      "id": 2,
      "code": "SOP",
      "name": "標準作業程序",
      "description": "Standard Operating Procedures"
    }
  ]
}
```

### 2. 建立新文件

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{
    "title": "品質管理手冊",
    "category_id": 1,
    "description": "ISO 9001 品質管理系統手冊第一版"
  }'
```

回應：
```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "id": 1,
    "document_code": "QMS-1702280345123",
    "title": "品質管理手冊",
    "category_id": 1,
    "description": "ISO 9001 品質管理系統手冊第一版",
    "current_version": 0,
    "status": "draft"
  }
}
```

### 3. 上傳文件版本

```bash
curl -X POST http://localhost:3000/api/documents/upload-version \
  -H "X-User-ID: 1" \
  -F "document_id=1" \
  -F "title=品質管理手冊" \
  -F "description=第一版初稿" \
  -F "file=@/path/to/document.pdf"
```

回應：
```json
{
  "success": true,
  "message": "Version uploaded successfully",
  "data": {
    "id": 1,
    "document_id": 1,
    "version_number": 1,
    "title": "品質管理手冊",
    "file_name": "QMS-1702280345123_v1.pdf",
    "sharepoint_path": "DocumentLibrary/QMS-1702280345123/QMS-1702280345123_v1.pdf",
    "status": "draft",
    "approval_stage": 1
  }
}
```

### 4. 提交審核

```bash
curl -X POST http://localhost:3000/api/approvals/submit \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{
    "version_id": 1
  }'
```

回應：
```json
{
  "success": true,
  "message": "Version submitted for review"
}
```

### 5. 審核人審核文件

```bash
curl -X POST http://localhost:3000/api/approvals/review \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 2" \
  -d '{
    "version_id": 1,
    "action": "approved",
    "comments": "內容審核通過，格式符合要求"
  }'
```

回應：
```json
{
  "success": true,
  "message": "Version approved successfully"
}
```

### 6. 核准人核准文件

```bash
curl -X POST http://localhost:3000/api/approvals/approve \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 3" \
  -d '{
    "version_id": 1,
    "action": "approved",
    "comments": "最終核准通過，發布為正式版"
  }'
```

回應：
```json
{
  "success": true,
  "message": "Version approved successfully"
}
```

此時文件版本狀態會更新為 `approved`，`is_official` 設為 `1`，成為正式版本。

### 7. 查看文件詳情與版本歷史

```bash
curl -X GET http://localhost:3000/api/documents/1 \
  -H "X-User-ID: 1"
```

回應：
```json
{
  "success": true,
  "data": {
    "document": {
      "id": 1,
      "document_code": "QMS-1702280345123",
      "title": "品質管理手冊",
      "status": "approved",
      "current_version": 1
    },
    "versions": [
      {
        "id": 1,
        "version_number": 1,
        "status": "approved",
        "is_official": 1,
        "created_at": "2024-12-11T07:45:00.000Z"
      }
    ]
  }
}
```

### 8. 查看簽核歷史

```bash
curl -X GET http://localhost:3000/api/approvals/history/1 \
  -H "X-User-ID: 1"
```

回應：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "version_id": 1,
      "stage_number": 1,
      "approver_name": "System Administrator",
      "action": "submitted",
      "comments": "Initial submission",
      "created_at": "2024-12-11T07:45:00.000Z"
    },
    {
      "id": 2,
      "version_id": 1,
      "stage_number": 2,
      "approver_name": "Reviewer Name",
      "action": "approved",
      "comments": "內容審核通過，格式符合要求",
      "created_at": "2024-12-11T08:00:00.000Z"
    },
    {
      "id": 3,
      "version_id": 1,
      "stage_number": 3,
      "approver_name": "Approver Name",
      "action": "approved",
      "comments": "最終核准通過，發布為正式版",
      "created_at": "2024-12-11T08:15:00.000Z"
    }
  ]
}
```

### 9. 下載正式版本

```bash
curl -X GET http://localhost:3000/api/documents/1/download \
  -H "X-User-ID: 1" \
  -o document.pdf
```

### 10. 上傳新版本

```bash
curl -X POST http://localhost:3000/api/documents/upload-version \
  -H "X-User-ID: 1" \
  -F "document_id=1" \
  -F "title=品質管理手冊" \
  -F "description=第二版修訂，更新第5章內容" \
  -F "file=@/path/to/document_v2.pdf"
```

這會建立版本 2，並且開始新的簽核流程。版本 1 會保留為封存的正式版，直到版本 2 獲得核准。

## 文件查詢範例

### 搜尋文件

```bash
# 關鍵字搜尋
curl -X GET "http://localhost:3000/api/documents/search?search=品質" \
  -H "X-User-ID: 1"

# 依類別篩選
curl -X GET "http://localhost:3000/api/documents/search?category_id=1" \
  -H "X-User-ID: 1"

# 依狀態篩選
curl -X GET "http://localhost:3000/api/documents/search?status=approved" \
  -H "X-User-ID: 1"

# 組合查詢
curl -X GET "http://localhost:3000/api/documents/search?search=SOP&category_id=2&status=approved&limit=10" \
  -H "X-User-ID: 1"
```

### 取得待辦簽核

```bash
# 審核人查看待審核文件
curl -X GET http://localhost:3000/api/approvals/pending \
  -H "X-User-ID: 2"

# 核准人查看待核准文件
curl -X GET http://localhost:3000/api/approvals/pending \
  -H "X-User-ID: 3"
```

## 管理功能範例

### 使用者管理

```bash
# 建立使用者
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{
    "username": "john.doe",
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "role": "reviewer"
  }'

# 更新使用者
curl -X PUT http://localhost:3000/api/admin/users/2 \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{
    "role": "approver",
    "is_active": true
  }'

# 查看所有使用者
curl -X GET http://localhost:3000/api/admin/users \
  -H "X-User-ID: 1"
```

### 類別管理

```bash
# 建立類別
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{
    "code": "TECH",
    "name": "技術文件",
    "description": "Technical documentation"
  }'

# 更新類別
curl -X PUT http://localhost:3000/api/admin/categories/1 \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{
    "name": "品質管理文件（更新）",
    "is_active": true
  }'
```

### 簽核流程設定

```bash
# 查看類別的簽核流程
curl -X GET http://localhost:3000/api/admin/workflow/1 \
  -H "X-User-ID: 1"

# 更新簽核流程階段
curl -X PUT http://localhost:3000/api/admin/workflow/1/2 \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{
    "stage_name": "技術審核",
    "role_required": "reviewer"
  }'
```

### 審計日誌

```bash
# 查看審計日誌
curl -X GET "http://localhost:3000/api/admin/audit-logs?page=1&limit=50" \
  -H "X-User-ID: 1"
```

## 錯誤處理範例

### 認證錯誤

```bash
curl -X GET http://localhost:3000/api/documents
# 缺少 X-User-ID header
```

回應：
```json
{
  "error": "Unauthorized"
}
```

### 權限不足

```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "X-User-ID: 5"
# 非管理員嘗試存取管理功能
```

回應：
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 檔案類型錯誤

```bash
curl -X POST http://localhost:3000/api/documents/upload-version \
  -H "X-User-ID: 1" \
  -F "document_id=1" \
  -F "file=@/path/to/document.txt"
# 上傳不支援的檔案類型
```

回應：
```json
{
  "error": "Invalid file type. Allowed types: .pdf, .doc, .docx"
}
```

### 檔案大小超出限制

```bash
curl -X POST http://localhost:3000/api/documents/upload-version \
  -H "X-User-ID: 1" \
  -F "document_id=1" \
  -F "file=@/path/to/large-document.pdf"
# 檔案超過 50MB
```

回應：
```json
{
  "error": "File size too large"
}
```

## 狀態轉換圖

```
draft (草稿)
    ↓ submit
pending_review (待審核)
    ↓ review: approved
pending_approval (待核准)
    ↓ approve: approved
approved (已核准，正式版)

任何階段都可能：
    → rejected (拒絕)
    → returned (退回修改，回到 draft)
```

## 測試腳本範例

使用 bash 腳本測試完整流程：

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

# 1. 建立文件
echo "Creating document..."
DOC_ID=$(curl -s -X POST $BASE_URL/api/documents \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{"title":"測試文件","category_id":1,"description":"測試"}' \
  | jq -r '.data.id')

echo "Document ID: $DOC_ID"

# 2. 上傳版本
echo "Uploading version..."
VERSION_ID=$(curl -s -X POST $BASE_URL/api/documents/upload-version \
  -H "X-User-ID: 1" \
  -F "document_id=$DOC_ID" \
  -F "title=測試文件" \
  -F "description=測試版本" \
  -F "file=@test.pdf" \
  | jq -r '.data.id')

echo "Version ID: $VERSION_ID"

# 3. 提交審核
echo "Submitting for review..."
curl -s -X POST $BASE_URL/api/approvals/submit \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d "{\"version_id\":$VERSION_ID}"

# 4. 審核
echo "Reviewing..."
curl -s -X POST $BASE_URL/api/approvals/review \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 2" \
  -d "{\"version_id\":$VERSION_ID,\"action\":\"approved\",\"comments\":\"OK\"}"

# 5. 核准
echo "Approving..."
curl -s -X POST $BASE_URL/api/approvals/approve \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 3" \
  -d "{\"version_id\":$VERSION_ID,\"action\":\"approved\",\"comments\":\"Approved\"}"

echo "Done!"
```

## 注意事項

1. **認證**: 生產環境請使用 JWT 或其他安全的認證機制
2. **檔案儲存**: 本範例將檔案暫存於本地，生產環境應直接上傳至 SharePoint
3. **錯誤處理**: 記得處理所有可能的錯誤情況
4. **效能**: 對於大量文件，建議實作分頁和快取機制
5. **安全性**: 確保所有輸入都經過驗證和清理