// API Base Configuration
const API_BASE_URL = window.location.origin;

// Get current user ID from session storage
function getCurrentUserId() {
    return sessionStorage.getItem('userId') || '1';
}

// Set current user ID
function setCurrentUserId(userId) {
    sessionStorage.setItem('userId', userId);
}

// Get user info from session
function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Set user info
function setCurrentUser(user) {
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user && user.id) {
        setCurrentUserId(user.id.toString());
    }
}

// Clear session
function clearSession() {
    sessionStorage.clear();
}

// Common fetch wrapper with error handling
async function apiRequest(endpoint, options = {}) {
    const userId = getCurrentUserId();
    
    const defaultOptions = {
        headers: {
            'X-User-ID': userId,
            ...(options.headers || {})
        }
    };

    // Merge options
    const fetchOptions = {
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    // Add Content-Type for JSON requests
    if (options.body && typeof options.body === 'string') {
        fetchOptions.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } else {
            // For non-JSON responses (like file downloads)
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

// API Methods

// Documents API
const DocumentsAPI = {
    // Get all documents
    getAll: (page = 1, limit = 20) => {
        return apiRequest(`/api/documents?page=${page}&limit=${limit}`);
    },

    // Search documents
    search: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/api/documents/search?${queryString}`);
    },

    // Get document by ID
    getById: (id) => {
        return apiRequest(`/api/documents/${id}`);
    },

    // Get document versions
    getVersions: (documentId) => {
        return apiRequest(`/api/documents/${documentId}/versions`);
    },

    // Create new document
    create: (data) => {
        return apiRequest('/api/documents', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Upload version
    uploadVersion: (formData) => {
        return apiRequest('/api/documents/upload-version', {
            method: 'POST',
            body: formData
        });
    },

    // Download official version
    download: async (documentId) => {
        const response = await apiRequest(`/api/documents/${documentId}/download`);
        return response.blob();
    }
};

// Approvals API
const ApprovalsAPI = {
    // Get pending approvals
    getPending: () => {
        return apiRequest('/api/approvals/pending');
    },

    // Get approval history
    getHistory: (versionId) => {
        return apiRequest(`/api/approvals/history/${versionId}`);
    },

    // Get workflow
    getWorkflow: (categoryId) => {
        return apiRequest(`/api/approvals/workflow/${categoryId}`);
    },

    // Submit for review
    submit: (versionId) => {
        return apiRequest('/api/approvals/submit', {
            method: 'POST',
            body: JSON.stringify({ version_id: versionId })
        });
    },

    // Review version
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

    // Approve version
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

// Admin API
const AdminAPI = {
    // Categories
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

    // Users
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

    // Workflow
    getWorkflow: (categoryId) => {
        return apiRequest(`/api/admin/workflow/${categoryId}`);
    },

    updateWorkflow: (categoryId, stageNumber, data) => {
        return apiRequest(`/api/admin/workflow/${categoryId}/${stageNumber}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Audit Logs
    getAuditLogs: (page = 1, limit = 50) => {
        return apiRequest(`/api/admin/audit-logs?page=${page}&limit=${limit}`);
    }
};

// Health Check
async function healthCheck() {
    return apiRequest('/health');
}
