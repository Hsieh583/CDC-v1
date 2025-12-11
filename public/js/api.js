// API 基礎設定
const API_BASE_URL = window.location.origin;

// 從工作階段儲存空間取得目前使用者 ID
function getCurrentUserId() {
    return sessionStorage.getItem('userId') || '1';
}

// 設定目前使用者 ID
function setCurrentUserId(userId) {
    sessionStorage.setItem('userId', userId);
}

// 從工作階段取得使用者資訊
function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// 設定使用者資訊
function setCurrentUser(user) {
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user && user.id) {
        setCurrentUserId(user.id.toString());
    }
}

// 清除工作階段
function clearSession() {
    sessionStorage.clear();
}

// 包含錯誤處理的通用 fetch 包裝函式
async function apiRequest(endpoint, options = {}) {
    const userId = getCurrentUserId();

    const defaultOptions = {
        headers: {
            'X-User-ID': userId,
            ...(options.headers || {})
        }
    };

    // 合併選項
    const fetchOptions = {
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    // 為 JSON 請求加入 Content-Type
    if (options.body && typeof options.body === 'string') {
        fetchOptions.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

        // 檢查回應是否為 JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } else {
            // 對於非 JSON 回應（如檔案下載）
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        }
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// API 方法

// 文件 API
const DocumentsAPI = {
    // 取得所有文件
    getAll: (page = 1, limit = 20) => {
        return apiRequest(`/api/documents?page=${page}&limit=${limit}`);
    },

    // 搜尋文件
    search: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/api/documents/search?${queryString}`);
    },

    // 依 ID 取得文件
    getById: (id) => {
        return apiRequest(`/api/documents/${id}`);
    },

    // 取得文件版本
    getVersions: (documentId) => {
        return apiRequest(`/api/documents/${documentId}/versions`);
    },

    // 建立新文件
    create: (data) => {
        return apiRequest('/api/documents', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // 上傳版本
    uploadVersion: (formData) => {
        return apiRequest('/api/documents/upload-version', {
            method: 'POST',
            body: formData
        });
    },

    // 下載正式版本
    download: async (documentId) => {
        const response = await apiRequest(`/api/documents/${documentId}/download`);
        return response.blob();
    }
};

// 簽核 API
const ApprovalsAPI = {
    // 取得待簽核項目
    getPending: () => {
        return apiRequest('/api/approvals/pending');
    },

    // 取得簽核歷史
    getHistory: (versionId) => {
        return apiRequest(`/api/approvals/history/${versionId}`);
    },

    // 取得工作流程
    getWorkflow: (categoryId) => {
        return apiRequest(`/api/approvals/workflow/${categoryId}`);
    },

    // 提交審核
    submit: (versionId) => {
        return apiRequest('/api/approvals/submit', {
            method: 'POST',
            body: JSON.stringify({ version_id: versionId })
        });
    },

    // 審核版本
    review: (versionId, action, comments) => {
        return apiRequest('/api/approvals/review', {
            method: 'POST',
            body: JSON.stringify({
                version_id: versionId,
                action: action,
                comments: comments
            })
        });
    },

    // 核准版本
    approve: (versionId, action, comments) => {
        return apiRequest('/api/approvals/approve', {
            method: 'POST',
            body: JSON.stringify({
                version_id: versionId,
                action: action,
                comments: comments
            })
        });
    }
};

// 管理員 API
const AdminAPI = {
    // 類別
    getCategories: () => {
        return apiRequest('/api/admin/categories');
    },

    createCategory: (data) => {
        return apiRequest('/api/admin/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateCategory: (id, data) => {
        return apiRequest(`/api/admin/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // 使用者
    getUsers: () => {
        return apiRequest('/api/admin/users');
    },

    createUser: (data) => {
        return apiRequest('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateUser: (id, data) => {
        return apiRequest(`/api/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // 工作流程
    getWorkflow: (categoryId) => {
        return apiRequest(`/api/admin/workflow/${categoryId}`);
    },

    updateWorkflow: (categoryId, stageNumber, data) => {
        return apiRequest(`/api/admin/workflow/${categoryId}/${stageNumber}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // 稽核紀錄
    getAuditLogs: (page = 1, limit = 50) => {
        return apiRequest(`/api/admin/audit-logs?page=${page}&limit=${limit}`);
    }
};

// 健康檢查
async function healthCheck() {
    return apiRequest('/health');
}
