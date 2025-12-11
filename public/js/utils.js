// Utility Functions

// Show loading spinner
function showLoading(elementId = 'content') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                </div>
            </div>
        `;
    }
}

// Show error message
function showError(message, elementId = 'content') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill"></i> ${message}
            </div>
        `;
    }
}

// Show success message
function showSuccess(message, elementId = 'alerts') {
    const element = document.getElementById(elementId);
    if (element) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="bi bi-check-circle-fill"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        element.appendChild(alertDiv);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert">
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">${type === 'success' ? '成功' : type === 'error' ? '錯誤' : '通知'}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove toast after hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date only
function formatDateOnly(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Get status badge
function getStatusBadge(status) {
    const statusMap = {
        'draft': { text: '草稿', class: 'bg-secondary' },
        'pending_review': { text: '待審核', class: 'bg-warning' },
        'pending_approval': { text: '待核准', class: 'bg-info' },
        'approved': { text: '已核准', class: 'bg-success' },
        'rejected': { text: '已拒絕', class: 'bg-danger' },
        'archived': { text: '已封存', class: 'bg-dark' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'bg-secondary' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Get action badge
function getActionBadge(action) {
    const actionMap = {
        'submitted': { text: '已提交', class: 'bg-primary' },
        'approved': { text: '已核准', class: 'bg-success' },
        'rejected': { text: '已拒絕', class: 'bg-danger' },
        'returned': { text: '已退回', class: 'bg-warning' }
    };
    
    const actionInfo = actionMap[action] || { text: action, class: 'bg-secondary' };
    return `<span class="badge ${actionInfo.class}">${actionInfo.text}</span>`;
}

// Get role badge
function getRoleBadge(role) {
    const roleMap = {
        'admin': { text: '管理員', class: 'bg-danger' },
        'author': { text: '作者', class: 'bg-primary' },
        'reviewer': { text: '審核人', class: 'bg-info' },
        'approver': { text: '核准人', class: 'bg-success' },
        'viewer': { text: '檢視者', class: 'bg-secondary' }
    };
    
    const roleInfo = roleMap[role] || { text: role, class: 'bg-secondary' };
    return `<span class="badge ${roleInfo.class}">${roleInfo.text}</span>`;
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Check authentication
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Logout
function logout() {
    clearSession();
    window.location.href = '/index.html';
}

// Update navigation with user info
function updateNavigation() {
    const user = getCurrentUser();
    const userInfoElement = document.getElementById('userInfo');
    
    if (userInfoElement && user) {
        userInfoElement.innerHTML = `
            <span class="me-2">${user.full_name || user.username}</span>
            ${getRoleBadge(user.role)}
        `;
    }
}

// Pagination helper
function createPagination(currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return '';
    
    let html = '<nav><ul class="pagination justify-content-center">';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">上一頁</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">下一頁</a>
        </li>
    `;
    
    html += '</ul></nav>';
    
    return html;
}

// Confirm dialog
function confirmAction(message) {
    return confirm(message);
}

// Download file helper
async function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Get file extension
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Validate file type
function validateFileType(filename, allowedTypes = ['pdf', 'doc', 'docx']) {
    const ext = getFileExtension(filename);
    return allowedTypes.includes(ext);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize page
function initializePage() {
    // Check authentication (except for index.html)
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        if (!checkAuth()) {
            return;
        }
    }
    
    // Update navigation
    updateNavigation();
    
    // Add logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializePage);
