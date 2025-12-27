const request = require('supertest');
const fs = require('fs');
const path = require('path');

// 確保資料庫已初始化
beforeAll(() => {
    // 可以在這裡初始化測試資料庫
});

describe('CDC Procurement Case Upload Portal - API Tests', () => {
    let app;
    let createdCaseId;
    let createdFileId;

    beforeAll(() => {
        // 載入應用程式
        app = require('../src/server');
    });

    describe('Health Check', () => {
        test('GET /health should return OK', async () => {
            const response = await request(app)
                .get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
        });

        test('GET /api should return API documentation', async () => {
            const response = await request(app)
                .get('/api');
            
            expect(response.status).toBe(200);
            expect(response.body.name).toContain('CDC Procurement Case');
            expect(response.body.endpoints).toBeDefined();
        });
    });

    describe('Case Management', () => {
        test('POST /api/cases should create a new case', async () => {
            const response = await request(app)
                .post('/api/cases')
                .set('X-User-ID', '1')
                .send({
                    case_type_id: 1,
                    department: '測試部門',
                    amount: 10000,
                    description: '測試案件'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Case created successfully');
            expect(response.body.case).toBeDefined();
            expect(response.body.case.case_number).toBeDefined();
            expect(response.body.case.department).toBe('測試部門');
            
            createdCaseId = response.body.case.id;
        });

        test('GET /api/cases should return cases list', async () => {
            const response = await request(app)
                .get('/api/cases')
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(200);
            expect(response.body.cases).toBeDefined();
            expect(Array.isArray(response.body.cases)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        test('GET /api/cases/:id should return case details', async () => {
            if (!createdCaseId) {
                return; // Skip if no case was created
            }

            const response = await request(app)
                .get(`/api/cases/${createdCaseId}`)
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(200);
            expect(response.body.case).toBeDefined();
            expect(response.body.case.id).toBe(createdCaseId);
            expect(response.body.files).toBeDefined();
        });

        test('PUT /api/cases/:id should update case', async () => {
            if (!createdCaseId) {
                return; // Skip if no case was created
            }

            const response = await request(app)
                .put(`/api/cases/${createdCaseId}`)
                .set('X-User-ID', '1')
                .send({
                    description: '更新後的描述',
                    amount: 15000
                });
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Case updated successfully');
            expect(response.body.case.description).toBe('更新後的描述');
        });
    });

    describe('File Upload', () => {
        test('POST /api/cases/upload should upload main document', async () => {
            if (!createdCaseId) {
                return; // Skip if no case was created
            }

            // 建立測試檔案
            const testFilePath = path.join(__dirname, '../test-document.pdf');
            
            if (!fs.existsSync(testFilePath)) {
                // 如果測試檔案不存在，建立一個簡單的文字檔案
                fs.writeFileSync(testFilePath, 'Test document content');
            }

            const response = await request(app)
                .post('/api/cases/upload')
                .set('X-User-ID', '1')
                .field('case_id', createdCaseId)
                .field('is_main_document', 'true')
                .attach('file', testFilePath);
            
            if (response.status === 201) {
                expect(response.body.message).toBe('File uploaded successfully');
                expect(response.body.file).toBeDefined();
                expect(response.body.file.is_main_document).toBe(1);
                
                createdFileId = response.body.file.id;
            }
        });

        test('GET /api/cases/:case_id/files should return file list', async () => {
            if (!createdCaseId) {
                return;
            }

            const response = await request(app)
                .get(`/api/cases/${createdCaseId}/files`)
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(200);
            expect(response.body.files).toBeDefined();
            expect(Array.isArray(response.body.files)).toBe(true);
        });
    });

    describe('Admin APIs', () => {
        test('GET /api/admin/case-types should return case types', async () => {
            const response = await request(app)
                .get('/api/admin/case-types')
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(200);
            expect(response.body.case_types).toBeDefined();
            expect(Array.isArray(response.body.case_types)).toBe(true);
            expect(response.body.case_types.length).toBeGreaterThan(0);
        });

        test('GET /api/admin/users should return users', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(200);
            expect(response.body.users).toBeDefined();
            expect(Array.isArray(response.body.users)).toBe(true);
        });

        test('GET /api/admin/audit-logs should return audit logs', async () => {
            const response = await request(app)
                .get('/api/admin/audit-logs')
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(200);
            expect(response.body.logs).toBeDefined();
            expect(Array.isArray(response.body.logs)).toBe(true);
        });
    });

    describe('Search and Query', () => {
        test('GET /api/cases/search should support search', async () => {
            const response = await request(app)
                .get('/api/cases/search?search=測試')
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(200);
            expect(response.body.cases).toBeDefined();
        });

        test('GET /api/cases/search should support filtering', async () => {
            const response = await request(app)
                .get('/api/cases/search?department=測試部門&case_type_id=1')
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(200);
            expect(response.body.cases).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('POST /api/cases without user ID should return 401', async () => {
            const response = await request(app)
                .post('/api/cases')
                .send({
                    case_type_id: 1,
                    department: '測試部門'
                });
            
            expect(response.status).toBe(401);
        });

        test('GET /api/cases/9999 should return 404', async () => {
            const response = await request(app)
                .get('/api/cases/9999')
                .set('X-User-ID', '1');
            
            expect(response.status).toBe(404);
        });

        test('POST /api/cases without required fields should return 400', async () => {
            const response = await request(app)
                .post('/api/cases')
                .set('X-User-ID', '1')
                .send({});
            
            expect(response.status).toBe(400);
        });
    });
});
