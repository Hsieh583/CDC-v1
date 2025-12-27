# CDC 請購案件文件上傳入口 - API 使用範例

## 基本設定

### 認證 Header
所有 API 請求需包含使用者 ID：
```
X-User-ID: 1
```

### Base URL
```
http://localhost:3000/api
```

## 案件管理 API

### 1. 建立新案件

**請求**
```http
POST /api/cases
Content-Type: application/json
X-User-ID: 1

{
  "case_type_id": 1,
  "department": "採購部",
  "amount": 50000,
  "description": "辦公室電腦設備採購"
}
```

**回應**
```json
{
  "message": "Case created successfully",
  "case": {
    "id": 1,
    "case_number": "GENERAL-1701234567890",
    "case_type_id": 1,
    "case_type_name": "一般請購",
    "department": "採購部",
    "amount": 50000,
    "applicant_name": "Test User",
    "applicant_id": 1,
    "description": "辦公室電腦設備採購",
    "status": "active",
    "sharepoint_folder_path": "GENERAL-1701234567890",
    "created_at": "2024-12-27T10:30:00.000Z"
  }
}
```

### 2. 上傳主文件

**請求**
```http
POST /api/cases/upload
Content-Type: multipart/form-data
X-User-ID: 1

case_id=1
is_main_document=true
file=[檔案內容]
```

**使用 cURL**
```bash
curl -X POST http://localhost:3000/api/cases/upload \
  -H "X-User-ID: 1" \
  -F "case_id=1" \
  -F "is_main_document=true" \
  -F "file=@procurement-request.pdf"
```

**回應**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "case_id": 1,
    "case_number": "GENERAL-1701234567890",
    "file_name": "GENERAL-1701234567890_main.pdf",
    "original_name": "procurement-request.pdf",
    "file_size": 1048576,
    "file_type": "application/pdf",
    "is_main_document": 1,
    "uploaded_by": 1,
    "uploader_name": "Test User",
    "sharepoint_path": "GENERAL-1701234567890/GENERAL-1701234567890_main.pdf",
    "created_at": "2024-12-27T10:35:00.000Z"
  }
}
```

### 3. 上傳附件

**請求**
```http
POST /api/cases/upload
Content-Type: multipart/form-data
X-User-ID: 1

case_id=1
is_main_document=false
file=[檔案內容]
```

**使用 cURL**
```bash
curl -X POST http://localhost:3000/api/cases/upload \
  -H "X-User-ID: 1" \
  -F "case_id=1" \
  -F "is_main_document=false" \
  -F "file=@quotation.xlsx"
```

**回應**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 2,
    "case_id": 1,
    "file_name": "GENERAL-1701234567890_att_1701234567891.xlsx",
    "original_name": "quotation.xlsx",
    "file_size": 524288,
    "file_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "is_main_document": 0,
    "sharepoint_path": "GENERAL-1701234567890/GENERAL-1701234567890_att_1701234567891.xlsx",
    "created_at": "2024-12-27T10:40:00.000Z"
  }
}
```

### 4. 取得所有案件（分頁）

**請求**
```http
GET /api/cases?page=1&limit=20
X-User-ID: 1
```

**回應**
```json
{
  "cases": [
    {
      "id": 1,
      "case_number": "GENERAL-1701234567890",
      "case_type_name": "一般請購",
      "department": "採購部",
      "amount": 50000,
      "applicant_full_name": "Test User",
      "status": "active",
      "created_at": "2024-12-27T10:30:00.000Z"
    },
    {
      "id": 2,
      "case_number": "IT-1701234567895",
      "case_type_name": "資訊設備",
      "department": "IT部",
      "amount": 100000,
      "applicant_full_name": "Test User",
      "status": "active",
      "created_at": "2024-12-27T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### 5. 搜尋案件

**請求**
```http
GET /api/cases/search?department=採購部&case_type_id=1&search=電腦
X-User-ID: 1
```

**回應**
```json
{
  "cases": [
    {
      "id": 1,
      "case_number": "GENERAL-1701234567890",
      "case_type_name": "一般請購",
      "department": "採購部",
      "amount": 50000,
      "applicant_full_name": "Test User",
      "description": "辦公室電腦設備採購",
      "status": "active",
      "created_at": "2024-12-27T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### 6. 取得案件詳情

**請求**
```http
GET /api/cases/1
X-User-ID: 1
```

**回應**
```json
{
  "case": {
    "id": 1,
    "case_number": "GENERAL-1701234567890",
    "case_type_id": 1,
    "case_type_name": "一般請購",
    "department": "採購部",
    "amount": 50000,
    "applicant_name": "Test User",
    "applicant_id": 1,
    "applicant_full_name": "Test User",
    "applicant_email": "user1@company.com",
    "description": "辦公室電腦設備採購",
    "status": "active",
    "sharepoint_folder_path": "GENERAL-1701234567890",
    "created_at": "2024-12-27T10:30:00.000Z",
    "updated_at": "2024-12-27T10:30:00.000Z"
  },
  "files": [
    {
      "id": 1,
      "case_id": 1,
      "file_name": "GENERAL-1701234567890_main.pdf",
      "original_name": "procurement-request.pdf",
      "file_size": 1048576,
      "file_type": "application/pdf",
      "is_main_document": 1,
      "uploader_name": "Test User",
      "created_at": "2024-12-27T10:35:00.000Z"
    },
    {
      "id": 2,
      "case_id": 1,
      "file_name": "GENERAL-1701234567890_att_1701234567891.xlsx",
      "original_name": "quotation.xlsx",
      "file_size": 524288,
      "file_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "is_main_document": 0,
      "uploader_name": "Test User",
      "created_at": "2024-12-27T10:40:00.000Z"
    }
  ]
}
```

### 7. 取得案件檔案列表

**請求**
```http
GET /api/cases/1/files
X-User-ID: 1
```

**回應**
```json
{
  "files": [
    {
      "id": 1,
      "file_name": "GENERAL-1701234567890_main.pdf",
      "original_name": "procurement-request.pdf",
      "file_size": 1048576,
      "is_main_document": 1,
      "uploader_name": "Test User",
      "created_at": "2024-12-27T10:35:00.000Z"
    },
    {
      "id": 2,
      "file_name": "GENERAL-1701234567890_att_1701234567891.xlsx",
      "original_name": "quotation.xlsx",
      "file_size": 524288,
      "is_main_document": 0,
      "uploader_name": "Test User",
      "created_at": "2024-12-27T10:40:00.000Z"
    }
  ]
}
```

### 8. 下載檔案

**請求**
```http
GET /api/cases/files/1/download
X-User-ID: 1
```

**回應**
```
[檔案內容]
Content-Type: application/pdf
Content-Disposition: attachment; filename="procurement-request.pdf"
```

**使用 cURL**
```bash
curl -X GET http://localhost:3000/api/cases/files/1/download \
  -H "X-User-ID: 1" \
  -o downloaded-file.pdf
```

### 9. 更新案件

**請求**
```http
PUT /api/cases/1
Content-Type: application/json
X-User-ID: 1

{
  "department": "財務部",
  "amount": 60000,
  "description": "更新後的描述",
  "status": "closed"
}
```

**回應**
```json
{
  "message": "Case updated successfully",
  "case": {
    "id": 1,
    "case_number": "GENERAL-1701234567890",
    "department": "財務部",
    "amount": 60000,
    "description": "更新後的描述",
    "status": "closed",
    "updated_at": "2024-12-27T11:00:00.000Z"
  }
}
```

## 管理 API

### 10. 取得所有案件類型

**請求**
```http
GET /api/admin/case-types
X-User-ID: 1
```

**回應**
```json
{
  "case_types": [
    {
      "id": 1,
      "code": "GENERAL",
      "name": "一般請購",
      "description": "General procurement requests",
      "is_active": 1,
      "created_at": "2024-12-27T10:00:00.000Z"
    },
    {
      "id": 2,
      "code": "IT",
      "name": "資訊設備",
      "description": "IT equipment procurement",
      "is_active": 1,
      "created_at": "2024-12-27T10:00:00.000Z"
    }
  ]
}
```

### 11. 建立案件類型

**請求**
```http
POST /api/admin/case-types
Content-Type: application/json
X-User-ID: 1

{
  "code": "MARKETING",
  "name": "行銷活動",
  "description": "Marketing campaign procurement"
}
```

**回應**
```json
{
  "message": "Case type created successfully",
  "case_type": {
    "id": 6,
    "code": "MARKETING",
    "name": "行銷活動",
    "description": "Marketing campaign procurement",
    "is_active": 1,
    "created_at": "2024-12-27T11:30:00.000Z"
  }
}
```

### 12. 更新案件類型

**請求**
```http
PUT /api/admin/case-types/1
Content-Type: application/json
X-User-ID: 1

{
  "name": "一般請購（更新）",
  "description": "Updated description"
}
```

**回應**
```json
{
  "message": "Case type updated successfully",
  "case_type": {
    "id": 1,
    "code": "GENERAL",
    "name": "一般請購（更新）",
    "description": "Updated description",
    "is_active": 1
  }
}
```

### 13. 取得所有使用者

**請求**
```http
GET /api/admin/users
X-User-ID: 1
```

**回應**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@company.com",
      "full_name": "System Administrator",
      "department": "IT",
      "role": "admin",
      "is_active": 1,
      "created_at": "2024-12-27T10:00:00.000Z"
    },
    {
      "id": 2,
      "username": "user1",
      "email": "user1@company.com",
      "full_name": "Test User",
      "department": "Procurement",
      "role": "user",
      "is_active": 1,
      "created_at": "2024-12-27T10:00:00.000Z"
    }
  ]
}
```

### 14. 建立使用者

**請求**
```http
POST /api/admin/users
Content-Type: application/json
X-User-ID: 1

{
  "username": "john.doe",
  "email": "john.doe@company.com",
  "full_name": "John Doe",
  "department": "Finance",
  "role": "user"
}
```

**回應**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 3,
    "username": "john.doe",
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "department": "Finance",
    "role": "user",
    "is_active": 1,
    "created_at": "2024-12-27T12:00:00.000Z"
  }
}
```

### 15. 更新使用者

**請求**
```http
PUT /api/admin/users/2
Content-Type: application/json
X-User-ID: 1

{
  "full_name": "Test User Updated",
  "department": "IT",
  "role": "admin"
}
```

**回應**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 2,
    "username": "user1",
    "email": "user1@company.com",
    "full_name": "Test User Updated",
    "department": "IT",
    "role": "admin",
    "is_active": 1
  }
}
```

### 16. 取得審計日誌

**請求**
```http
GET /api/admin/audit-logs?page=1&limit=50
X-User-ID: 1
```

**回應**
```json
{
  "logs": [
    {
      "id": 1,
      "user_id": 1,
      "user_name": "Test User",
      "user_email": "user1@company.com",
      "action": "CREATE_CASE",
      "entity_type": "case",
      "entity_id": 1,
      "details": "Created case GENERAL-1701234567890",
      "created_at": "2024-12-27T10:30:00.000Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "user_name": "Test User",
      "user_email": "user1@company.com",
      "action": "UPLOAD_FILE",
      "entity_type": "case_file",
      "entity_id": 1,
      "details": "Uploaded main document to case GENERAL-1701234567890",
      "created_at": "2024-12-27T10:35:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

## 健康檢查 API

### 17. 健康檢查

**請求**
```http
GET /health
```

**回應**
```json
{
  "status": "OK",
  "message": "CDC Procurement Case Document Upload Portal is running"
}
```

## 錯誤回應範例

### 400 Bad Request
```json
{
  "error": "case_id and file are required"
}
```

### 401 Unauthorized
```json
{
  "error": "User ID is required"
}
```

### 404 Not Found
```json
{
  "error": "Case not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

## 完整使用流程範例

### 場景：建立一個新的請購案件並上傳文件

```bash
# 1. 建立案件
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{
    "case_type_id": 1,
    "department": "採購部",
    "amount": 50000,
    "description": "辦公室電腦設備採購"
  }'
# 記錄返回的 case_id，例如：1

# 2. 上傳主文件
curl -X POST http://localhost:3000/api/cases/upload \
  -H "X-User-ID: 1" \
  -F "case_id=1" \
  -F "is_main_document=true" \
  -F "file=@procurement-request.pdf"

# 3. 上傳附件（報價單）
curl -X POST http://localhost:3000/api/cases/upload \
  -H "X-User-ID: 1" \
  -F "case_id=1" \
  -F "is_main_document=false" \
  -F "file=@quotation.xlsx"

# 4. 上傳附件（規格書）
curl -X POST http://localhost:3000/api/cases/upload \
  -H "X-User-ID: 1" \
  -F "case_id=1" \
  -F "is_main_document=false" \
  -F "file=@specifications.docx"

# 5. 查看案件詳情
curl -X GET http://localhost:3000/api/cases/1 \
  -H "X-User-ID: 1"

# 6. 下載主文件
curl -X GET http://localhost:3000/api/cases/files/1/download \
  -H "X-User-ID: 1" \
  -o downloaded-main.pdf
```

## 注意事項

1. **認證**：所有 API 都需要 `X-User-ID` header
2. **檔案大小**：預設限制 50MB，可在 `.env` 中調整
3. **檔案類型**：支援所有格式
4. **主文件**：每個案件只能有一個主文件
5. **附件數量**：沒有限制
6. **案號格式**：自動生成，格式為 `{類型代碼}-{時間戳}`
