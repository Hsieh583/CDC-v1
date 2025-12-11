# Node.js/Express 快速指南 (給 C#/MVC 開發者)

> 本指南以 CDC Document Control Center 專案為實例，幫助熟悉 C#/MVC 的開發者快速上手 Node.js/Express 專案。

---

## 📋 目錄

1. [專案架構對照](#1-專案架構對照)
2. [啟動與執行](#2-啟動與執行)
3. [路由系統 (Routing)](#3-路由系統-routing)
4. [控制器 (Controllers)](#4-控制器-controllers)
5. [資料存取 (Data Access)](#5-資料存取-data-access)
6. [中介軟體 (Middleware)](#6-中介軟體-middleware)
7. [前端頁面](#7-前端頁面)
8. [常見操作對照表](#8-常見操作對照表)
9. [除錯技巧](#9-除錯技巧)

---

## 1. 專案架構對照

### C# MVC vs Node.js Express 對照

| C# MVC 概念 | Node.js Express 對應 | 本專案位置 |
|------------|-------------------|----------|
| `Program.cs` / `Startup.cs` | `server.js` | `src/server.js` |
| Controllers | Controllers | `src/controllers/*.controller.js` |
| Models | Models | `src/models/*.model.js` |
| Views (Razor) | HTML + Client JS | `public/pages/*.html` + `public/js/*.js` |
| Middleware | Middleware | `src/middleware/*.js` |
| Routes (Attribute Routing) | Route Files | `src/routes/*.routes.js` |
| Entity Framework / Dapper | Database Layer | `src/database/db.js` |
| Services | Services | `src/services/*.service.js` |
| `appsettings.json` | `.env` | `.env` (需自行建立) |
| `wwwroot/` | `public/` | `public/` |

### 專案目錄結構

```
CDC-v1/
├── src/                          # 後端程式碼 (類似 C# 的專案根目錄)
│   ├── server.js                 # 應用程式進入點 (Program.cs)
│   ├── controllers/              # 控制器
│   │   ├── admin.controller.js
│   │   ├── document.controller.js
│   │   └── approval.controller.js
│   ├── routes/                   # 路由定義 (類似 RouteConfig)
│   │   ├── admin.routes.js
│   │   ├── document.routes.js
│   │   └── approval.routes.js
│   ├── models/                   # 資料模型
│   ├── services/                 # 業務邏輯服務
│   ├── middleware/               # 中介軟體 (類似 ActionFilter)
│   └── database/                 # 資料庫層
│       ├── db.js                 # DB 連線 (類似 DbContext)
│       ├── init.js               # DB 初始化
│       └── schema.sql            # DB 結構定義
│
├── public/                       # 靜態檔案 (類似 wwwroot)
│   ├── pages/                    # HTML 頁面 (類似 Views)
│   ├── js/                       # 前端 JavaScript
│   └── css/                      # 樣式表
│
├── package.json                  # 專案設定檔 (類似 .csproj)
├── .env                          # 環境變數 (類似 appsettings.json)
└── node_modules/                 # 套件目錄 (類似 packages)
```

---

## 2. 啟動與執行

### 安裝與初始化

```powershell
# 1. 安裝 Node.js 套件 (類似 NuGet 還原)
npm install

# 2. 初始化資料庫 (類似執行 Migrations)
npm run init-db

# 3. 建立環境設定檔
# 複製 .env.example 為 .env 並填入設定值
```

### 執行應用程式

| 模式 | 指令 | C# 對照 |
|-----|------|--------|
| 開發模式 (熱重載) | `npm run dev` | F5 偵錯模式 |
| 正式模式 | `npm start` | Ctrl+F5 或發行版本 |
| 執行測試 | `npm test` | Test Explorer |

### 應用程式啟動後

- **後端 API**: `http://localhost:3000/api`
- **前端頁面**: `http://localhost:3000/pages/dashboard.html`
- **健康檢查**: `http://localhost:3000/health`

---

## 3. 路由系統 (Routing)

### C# MVC 路由方式

```csharp
// C# - Attribute Routing
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    [HttpGet("categories")]
    public IActionResult GetCategories() { }
    
    [HttpPost("categories")]
    public IActionResult CreateCategory([FromBody] CategoryDto dto) { }
}
```

### Node.js Express 路由方式

**步驟 1: 定義路由檔 (`src/routes/admin.routes.js`)**

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

// 套用中介軟體 (類似 [Authorize] Attribute)
router.use(authenticate);
router.use(authorize('admin'));

// 定義路由 (類似 [HttpGet], [HttpPost])
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);

module.exports = router;
```

**步驟 2: 註冊路由到主程式 (`src/server.js`)**

```javascript
const express = require('express');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// 註冊路由 (類似 MapControllerRoute)
app.use('/api/admin', adminRoutes);
```

### 實例對照

| C# MVC | Node.js Express | 實際 URL |
|--------|-----------------|---------|
| `[HttpGet("categories")]` | `router.get('/categories', ...)` | `GET /api/admin/categories` |
| `[HttpPost("categories")]` | `router.post('/categories', ...)` | `POST /api/admin/categories` |
| `[HttpPut("categories/{id}")]` | `router.put('/categories/:id', ...)` | `PUT /api/admin/categories/123` |
| `[HttpDelete("users/{id}")]` | `router.delete('/users/:id', ...)` | `DELETE /api/admin/users/456` |

---

## 4. 控制器 (Controllers)

### C# Controller 範例

```csharp
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    
    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }
    
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            var categories = await _adminService.GetCategoriesAsync();
            return Ok(new { success = true, data = categories });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
```

### Node.js Controller 範例 (`src/controllers/admin.controller.js`)

```javascript
const db = require('../database/db');

class AdminController {
    /**
     * 取得所有類別
     * 對應 C# 的 GetCategories() 方法
     */
    async getCategories(req, res) {
        try {
            // 執行資料庫查詢 (類似 EF Core 的 ToListAsync())
            const categories = await db.all(
                'SELECT * FROM categories WHERE is_active = 1 ORDER BY code'
            );

            // 回傳 JSON 結果 (類似 Ok() 方法)
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error getting categories:', error);
            // 類似 StatusCode(500, ...)
            res.status(500).json({ error: 'Failed to get categories' });
        }
    }

    /**
     * 建立新類別
     * 對應 C# 的 CreateCategory([FromBody] dto) 方法
     */
    async createCategory(req, res) {
        try {
            // 從 request body 取得參數 (類似 [FromBody])
            const { code, name, description } = req.body;

            // 驗證輸入 (類似 ModelState.IsValid)
            if (!code || !name) {
                return res.status(400).json({ 
                    error: 'Code and name are required' 
                });
            }

            // 執行插入 (類似 context.Categories.Add())
            const result = await db.run(
                'INSERT INTO categories (code, name, description) VALUES (?, ?, ?)',
                [code, name, description]
            );

            // 取得剛建立的資料
            const category = await db.get(
                'SELECT * FROM categories WHERE id = ?', 
                [result.id]
            );

            // 回傳 201 Created (類似 CreatedAtAction)
            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category
            });
        } catch (error) {
            console.error('Error creating category:', error);
            if (error.message.includes('UNIQUE')) {
                res.status(400).json({ 
                    error: 'Category code already exists' 
                });
            } else {
                res.status(500).json({ 
                    error: 'Failed to create category' 
                });
            }
        }
    }
}

// 匯出控制器實例 (類似 Startup 的服務註冊)
module.exports = new AdminController();
```

### 關鍵差異對照

| C# MVC | Node.js Express | 說明 |
|--------|-----------------|------|
| `return Ok(data)` | `res.json(data)` | 回傳 200 JSON |
| `return Created(..., data)` | `res.status(201).json(data)` | 回傳 201 Created |
| `return BadRequest(msg)` | `res.status(400).json({error: msg})` | 回傳 400 錯誤 |
| `return NotFound()` | `res.status(404).json({error: 'Not found'})` | 回傳 404 |
| `return StatusCode(500, ...)` | `res.status(500).json(...)` | 回傳 500 錯誤 |
| `[FromBody] dto` | `req.body` | 接收 POST 資料 |
| `[FromRoute] id` | `req.params.id` | 接收路由參數 |
| `[FromQuery] page` | `req.query.page` | 接收查詢字串 |

---

## 5. 資料存取 (Data Access)

### C# Entity Framework 方式

```csharp
public class AdminService
{
    private readonly AppDbContext _context;
    
    public async Task<List<Category>> GetCategoriesAsync()
    {
        return await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Code)
            .ToListAsync();
    }
}
```

### Node.js 資料庫存取 (`src/database/db.js`)

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/cdc.db');

class Database {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH);
    }

    // 類似 EF Core 的 ToListAsync()
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // 類似 EF Core 的 FirstOrDefaultAsync()
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // 類似 EF Core 的 Add() + SaveChangesAsync()
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
}

module.exports = new Database();
```

### 資料查詢範例對照

| C# LINQ | SQL (Node.js) |
|---------|--------------|
| `.Where(x => x.IsActive)` | `WHERE is_active = 1` |
| `.OrderBy(x => x.Code)` | `ORDER BY code` |
| `.FirstOrDefault()` | `db.get('SELECT ... LIMIT 1')` |
| `.ToListAsync()` | `db.all('SELECT ...')` |
| `.Add(entity)` | `db.run('INSERT INTO ...')` |

---

## 6. 中介軟體 (Middleware)

### C# Action Filter 範例

```csharp
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    // ...
}
```

### Node.js Middleware 範例 (`src/middleware/auth.js`)

```javascript
const db = require('../database/db');

/**
 * 驗證中介軟體 (類似 [Authorize] Attribute)
 */
async function authenticate(req, res, next) {
    try {
        // 從 Header 取得使用者 ID
        const userId = req.headers['x-user-id'] || 1;

        // 查詢使用者資料
        const user = await db.get(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = 1',
            [userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 將使用者資訊附加到 request (類似 HttpContext.User)
        req.user = user;
        
        // 繼續下一個中介軟體或控制器
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

/**
 * 角色授權中介軟體 (類似 [Authorize(Roles = ...)])
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Forbidden: Insufficient permissions' 
            });
        }

        next();
    };
}

module.exports = { authenticate, authorize };
```

### 套用中介軟體的方式

```javascript
// 在路由檔中套用 (類似 Controller 層級的 Attribute)
router.use(authenticate);
router.use(authorize('admin'));

// 在特定路由套用 (類似 Action 層級的 Attribute)
router.post('/sensitive', authenticate, authorize('admin'), controller.action);

// 全域套用 (類似 Global Filter)
app.use(authenticate);
```

### 其他常見中介軟體

| 功能 | C# | Node.js Express |
|-----|-----|----------------|
| 解析 JSON Body | 內建 | `app.use(express.json())` |
| 解析 URL Encoded | 內建 | `app.use(express.urlencoded())` |
| CORS | CORS Policy | `app.use(cors())` |
| 靜態檔案 | `UseStaticFiles()` | `app.use(express.static('public'))` |
| 日誌記錄 | Serilog/NLog | `app.use(morgan('dev'))` |

---

## 7. 前端頁面

### C# MVC Razor View 方式

```csharp
// Controller
public IActionResult Admin()
{
    return View();
}

// View (Admin.cshtml)
@model AdminViewModel
<h1>管理頁面</h1>
<script src="~/js/admin.js"></script>
```

### Node.js 靜態 HTML 方式

**後端 (`src/server.js`)**

```javascript
// 設定靜態檔案目錄
app.use(express.static(path.join(__dirname, '../public')));

// 不需要特別定義路由,直接訪問 HTML
// 瀏覽器訪問: /pages/admin.html
```

**前端 (`public/pages/admin.html`)**

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>系統管理 - CDC</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <h1>系統管理</h1>
    
    <!-- 動態載入資料的容器 -->
    <div id="categoriesContainer"></div>
    
    <!-- 引入前端 JavaScript -->
    <script src="/js/utils.js"></script>
    <script src="/js/api.js"></script>
    <script>
        // 頁面載入時執行
        document.addEventListener('DOMContentLoaded', async () => {
            await loadCategories();
        });
    </script>
</body>
</html>
```

**前端 API 呼叫 (`public/js/api.js`)**

```javascript
const API_BASE_URL = window.location.origin;

// API 請求封裝 (類似 C# 的 HttpClient)
async function apiRequest(endpoint, options = {}) {
    const userId = getCurrentUserId();
    
    const fetchOptions = {
        ...options,
        headers: {
            'X-User-ID': userId,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    
    return data;
}

// 類別管理 API (類似 C# 的 Service Layer)
const AdminAPI = {
    // GET /api/admin/categories
    getCategories: () => {
        return apiRequest('/api/admin/categories');
    },
    
    // POST /api/admin/categories
    createCategory: (categoryData) => {
        return apiRequest('/api/admin/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    },
    
    // PUT /api/admin/categories/:id
    updateCategory: (id, categoryData) => {
        return apiRequest(`/api/admin/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }
};
```

**前端業務邏輯範例**

```javascript
// 載入類別清單
async function loadCategories() {
    try {
        const response = await AdminAPI.getCategories();
        
        if (response.success) {
            const container = document.getElementById('categoriesContainer');
            container.innerHTML = response.data.map(cat => `
                <div class="category-item">
                    <h3>${cat.name} (${cat.code})</h3>
                    <p>${cat.description}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('載入類別失敗: ' + error.message);
    }
}

// 建立新類別
async function createCategory() {
    const categoryData = {
        code: document.getElementById('categoryCode').value,
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDesc').value
    };
    
    try {
        const response = await AdminAPI.createCategory(categoryData);
        
        if (response.success) {
            alert('類別建立成功!');
            await loadCategories(); // 重新載入清單
        }
    } catch (error) {
        alert('建立失敗: ' + error.message);
    }
}
```

---

## 8. 常見操作對照表

### 檔案與模組

| C# | Node.js | 說明 |
|----|---------|------|
| `using System;` | `const fs = require('fs');` | 引入模組 |
| `namespace MyApp` | `module.exports = { ... }` | 匯出功能 |
| `public class User` | `class User { ... }` | 定義類別 |
| DI Container 注入 | `require('./path/to/module')` | 引入其他模組 |

### 非同步操作

| C# | Node.js | 說明 |
|----|---------|------|
| `async Task<T>` | `async function` | 非同步方法 |
| `await DoSomethingAsync()` | `await doSomething()` | 等待非同步 |
| `Task.WhenAll(...)` | `Promise.all([...])` | 並行執行 |
| `try-catch` | `try-catch` | 例外處理 (相同) |

### 集合操作

| C# LINQ | JavaScript | 說明 |
|---------|-----------|------|
| `.Select(x => x.Name)` | `.map(x => x.name)` | 投影/轉換 |
| `.Where(x => x.Age > 18)` | `.filter(x => x.age > 18)` | 篩選 |
| `.FirstOrDefault()` | `.find(x => ...)` | 尋找第一個 |
| `.Any()` | `.some(x => ...)` | 是否存在 |
| `.All()` | `.every(x => ...)` | 是否全部符合 |
| `.OrderBy(x => x.Name)` | `.sort((a,b) => ...)` | 排序 |

### 字串操作

| C# | JavaScript |
|----|-----------|
| `$"Hello {name}"` | `` `Hello ${name}` `` |
| `string.IsNullOrEmpty(s)` | `!s` 或 `s == null || s === ''` |
| `str.Contains("abc")` | `str.includes('abc')` |
| `str.ToLower()` | `str.toLowerCase()` |

---

## 9. 除錯技巧

### 在 VS Code 中除錯 Node.js

**設定 `.vscode/launch.json`**

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "啟動伺服器",
            "program": "${workspaceFolder}/src/server.js",
            "restart": true,
            "console": "integratedTerminal",
            "skipFiles": ["<node_internals>/**"]
        }
    ]
}
```

### 常用除錯方式

| C# | Node.js |
|----|---------|
| `Console.WriteLine()` | `console.log()` |
| `Debug.WriteLine()` | `console.debug()` |
| Breakpoint | 中斷點 (相同) |
| Watch Window | Watch 視窗 (相同) |
| Call Stack | 呼叫堆疊 (相同) |

### 查看請求/回應資料

```javascript
// 在控制器中加入
console.log('Request Body:', req.body);
console.log('Request Params:', req.params);
console.log('Request Query:', req.query);
console.log('Current User:', req.user);
```

### 查看 SQL 查詢

```javascript
// 在資料庫操作前加入
console.log('Executing SQL:', sql);
console.log('With params:', params);
```

---

## 10. 實戰練習:建立新功能

### 目標:新增「部門管理」功能

#### 步驟 1: 建立資料表

```sql
-- 在 src/database/schema.sql 中新增
CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    manager_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 步驟 2: 建立 Model (`src/models/department.model.js`)

```javascript
class Department {
    constructor(data) {
        this.id = data.id;
        this.code = data.code;
        this.name = data.name;
        this.manager_id = data.manager_id;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
    }
}

module.exports = Department;
```

#### 步驟 3: 建立 Controller (`src/controllers/department.controller.js`)

```javascript
const db = require('../database/db');

class DepartmentController {
    async getAll(req, res) {
        try {
            const departments = await db.all(
                'SELECT * FROM departments WHERE is_active = 1'
            );
            res.json({ success: true, data: departments });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            const { code, name, manager_id } = req.body;
            
            const result = await db.run(
                'INSERT INTO departments (code, name, manager_id) VALUES (?, ?, ?)',
                [code, name, manager_id]
            );
            
            res.status(201).json({ 
                success: true, 
                id: result.id 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new DepartmentController();
```

#### 步驟 4: 建立 Routes (`src/routes/department.routes.js`)

```javascript
const express = require('express');
const router = express.Router();
const deptController = require('../controllers/department.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', deptController.getAll);
router.post('/', deptController.create);

module.exports = router;
```

#### 步驟 5: 註冊路由 (`src/server.js`)

```javascript
const departmentRoutes = require('./routes/department.routes');

// 在其他路由註冊後面加入
app.use('/api/departments', departmentRoutes);
```

#### 步驟 6: 前端頁面 (`public/pages/departments.html`)

```html
<!DOCTYPE html>
<html>
<head>
    <title>部門管理</title>
    <script src="/js/api.js"></script>
</head>
<body>
    <h1>部門管理</h1>
    <div id="departmentList"></div>
    
    <script>
        async function loadDepartments() {
            const response = await fetch('/api/departments', {
                headers: { 'X-User-ID': '1' }
            });
            const data = await response.json();
            
            const list = document.getElementById('departmentList');
            list.innerHTML = data.data.map(dept => `
                <div>${dept.name} (${dept.code})</div>
            `).join('');
        }
        
        loadDepartments();
    </script>
</body>
</html>
```

---

## 11. 常見問題 FAQ

### Q1: 為什麼要用 `async/await`?

**A:** Node.js 是非同步執行的,`async/await` 讓非同步程式碼看起來像同步,更容易理解。

```javascript
// ❌ 舊的 Callback 方式
db.get('SELECT ...', (err, row) => {
    if (err) { /* 處理錯誤 */ }
    // 使用 row
});

// ✅ 現代的 async/await 方式
try {
    const row = await db.get('SELECT ...');
    // 使用 row
} catch (error) {
    // 處理錯誤
}
```

### Q2: `require` vs `import` 有什麼差別?

**A:** 
- `require` 是 CommonJS (Node.js 傳統方式)
- `import` 是 ES6 Modules (較新,需要設定)
- 本專案使用 `require` (較普遍)

### Q3: 如何處理檔案上傳?

**A:** 使用 `multer` 中介軟體 (本專案已使用)

```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file; // 上傳的檔案資訊
    res.json({ success: true, filename: file.filename });
});
```

### Q4: 如何連接 SQL Server 而不是 SQLite?

**A:** 安裝 `mssql` 套件並修改 `db.js`

```javascript
const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'CDC',
    user: 'sa',
    password: 'yourpassword',
    options: { encrypt: true }
};

const pool = new sql.ConnectionPool(config);
await pool.connect();
```

### Q5: 如何設定環境變數?

**A:** 在專案根目錄建立 `.env` 檔案

```
PORT=3000
DB_PATH=./data/cdc.db
SHAREPOINT_URL=https://your-sharepoint.com
```

在程式中使用:
```javascript
require('dotenv').config();
const port = process.env.PORT || 3000;
```

---

## 12. 快速查詢備忘錄

### 啟動與管理

```powershell
npm install              # 安裝套件
npm run dev             # 開發模式 (熱重載)
npm start               # 正式執行
npm run init-db         # 初始化資料庫
npm test                # 執行測試
```

### 常用程式碼片段

```javascript
// 1. 基本 GET 端點
router.get('/items', async (req, res) => {
    try {
        const items = await db.all('SELECT * FROM items');
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. 帶參數的 POST 端點
router.post('/items', async (req, res) => {
    const { name, value } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    
    try {
        const result = await db.run(
            'INSERT INTO items (name, value) VALUES (?, ?)',
            [name, value]
        );
        res.status(201).json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. 取得單一項目 (帶路由參數)
router.get('/items/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const item = await db.get('SELECT * FROM items WHERE id = ?', [id]);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. 前端 API 呼叫
async function getItems() {
    const response = await fetch('/api/items', {
        headers: { 'X-User-ID': getCurrentUserId() }
    });
    const data = await response.json();
    return data.data;
}

async function createItem(name, value) {
    const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-ID': getCurrentUserId()
        },
        body: JSON.stringify({ name, value })
    });
    return await response.json();
}
```

---

## 13. 學習資源

### 官方文件
- **Node.js**: https://nodejs.org/docs
- **Express**: https://expressjs.com/
- **MDN JavaScript**: https://developer.mozilla.org/zh-TW/docs/Web/JavaScript

### 推薦閱讀
1. Express 路由指南
2. JavaScript Promise 和 async/await
3. RESTful API 設計最佳實踐
4. Node.js 錯誤處理模式

### 本專案特定文件
- `README.md` - 專案概述
- `ARCHITECTURE.md` - 架構說明
- `API_EXAMPLES.md` - API 使用範例
- `DEPLOYMENT.md` - 部署指南

---

## 總結

### 關鍵概念對照

| 概念 | C# MVC | Node.js Express |
|-----|--------|-----------------|
| 應用程式進入點 | Program.cs | server.js |
| 相依性注入 | DI Container | require() |
| 路由定義 | Attribute Routing | Router Files |
| 回應型別 | IActionResult | res.json() / res.send() |
| 中介軟體 | ActionFilter | Middleware |
| 非同步 | async/await | async/await (相同) |
| ORM | Entity Framework | 原生 SQL / Sequelize |

### 下一步建議

1. ✅ 閱讀專案的 `README.md` 和 `ARCHITECTURE.md`
2. ✅ 執行 `npm run dev` 啟動專案並瀏覽各頁面
3. ✅ 打開開發者工具 (F12) 觀察 Network 標籤的 API 呼叫
4. ✅ 修改一個簡單的 Controller 方法,觀察結果
5. ✅ 嘗試新增一個簡單的 API 端點
6. ✅ 閱讀 `public/js/api.js` 了解前端如何呼叫 API

---

**祝您學習順利! 如有任何問題,歡迎隨時詢問。** 🚀
