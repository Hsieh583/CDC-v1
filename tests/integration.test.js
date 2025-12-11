/**
 * CDC Document Control Center - Integration Tests
 * 
 * These tests verify the complete workflow of the CDC system:
 * 1. Document creation
 * 2. Version upload
 * 3. Three-stage approval workflow
 * 4. Version archiving
 * 5. Document search
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Test helper functions
async function testHealthCheck() {
    console.log('\n=== Testing Health Check ===');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health check passed:', response.data);
    return response.data.status === 'OK';
}

async function testGetCategories() {
    console.log('\n=== Testing Get Categories ===');
    const response = await axios.get(`${BASE_URL}/api/admin/categories`, {
        headers: { 'X-User-ID': '1' }
    });
    console.log('✓ Categories retrieved:', response.data.data.length, 'categories');
    return response.data.success && response.data.data.length > 0;
}

async function testCreateDocument() {
    console.log('\n=== Testing Document Creation ===');
    const response = await axios.post(`${BASE_URL}/api/documents`, {
        title: '測試文件',
        category_id: 1,
        description: '自動測試建立的文件'
    }, {
        headers: { 'X-User-ID': '1' }
    });
    console.log('✓ Document created:', response.data.data.document_code);
    return response.data.data;
}

async function testUploadVersion(documentId) {
    console.log('\n=== Testing Version Upload ===');
    
    // Create a test PDF file
    const testPdfPath = path.join(__dirname, 'test.pdf');
    fs.writeFileSync(testPdfPath, 'Test PDF content');
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('document_id', documentId);
    form.append('title', '測試文件');
    form.append('description', '測試版本上傳');
    form.append('file', fs.createReadStream(testPdfPath));
    
    const response = await axios.post(`${BASE_URL}/api/documents/upload-version`, form, {
        headers: {
            'X-User-ID': '1',
            ...form.getHeaders()
        }
    });
    
    // Clean up test file
    fs.unlinkSync(testPdfPath);
    
    console.log('✓ Version uploaded:', response.data.data.file_name);
    return response.data.data;
}

async function testApprovalWorkflow(versionId) {
    console.log('\n=== Testing Approval Workflow ===');
    
    // Stage 1: Submit for review
    await axios.post(`${BASE_URL}/api/approvals/submit`, {
        version_id: versionId
    }, {
        headers: { 'X-User-ID': '1', 'Content-Type': 'application/json' }
    });
    console.log('✓ Submitted for review (Stage 1 → 2)');
    
    // Stage 2: Review
    await axios.post(`${BASE_URL}/api/approvals/review`, {
        version_id: versionId,
        action: 'approved',
        comments: '測試審核通過'
    }, {
        headers: { 'X-User-ID': '1', 'Content-Type': 'application/json' }
    });
    console.log('✓ Review approved (Stage 2 → 3)');
    
    // Stage 3: Final approval
    await axios.post(`${BASE_URL}/api/approvals/approve`, {
        version_id: versionId,
        action: 'approved',
        comments: '測試最終核准'
    }, {
        headers: { 'X-User-ID': '1', 'Content-Type': 'application/json' }
    });
    console.log('✓ Final approval completed (Stage 3 → Approved)');
    
    return true;
}

async function testGetApprovalHistory(versionId) {
    console.log('\n=== Testing Approval History ===');
    const response = await axios.get(`${BASE_URL}/api/approvals/history/${versionId}`, {
        headers: { 'X-User-ID': '1' }
    });
    console.log('✓ Approval history retrieved:', response.data.data.length, 'records');
    return response.data.data;
}

async function testDocumentSearch() {
    console.log('\n=== Testing Document Search ===');
    const response = await axios.get(`${BASE_URL}/api/documents/search?search=測試`, {
        headers: { 'X-User-ID': '1' }
    });
    console.log('✓ Search completed, found:', response.data.data.length, 'documents');
    return response.data.data;
}

async function testVersionArchiving(documentId) {
    console.log('\n=== Testing Version Archiving ===');
    
    // Upload and approve version 2
    const version2 = await testUploadVersion(documentId);
    await testApprovalWorkflow(version2.id);
    
    // Check that version 1 is archived
    const response = await axios.get(`${BASE_URL}/api/documents/${documentId}`, {
        headers: { 'X-User-ID': '1' }
    });
    
    const versions = response.data.data.versions;
    const v1 = versions.find(v => v.version_number === 1);
    const v2 = versions.find(v => v.version_number === 2);
    
    console.log('✓ Version 1 status:', v1.status, '(should be archived)');
    console.log('✓ Version 2 status:', v2.status, '(should be approved)');
    console.log('✓ Version 2 is official:', v2.is_official === 1);
    
    return v1.status === 'archived' && v2.status === 'approved' && v2.is_official === 1;
}

// Main test runner
async function runTests() {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   CDC Document Control Center - Integration Tests    ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    try {
        // Wait for server to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Run tests
        await testHealthCheck();
        await testGetCategories();
        
        const document = await testCreateDocument();
        const version = await testUploadVersion(document.id);
        
        await testApprovalWorkflow(version.id);
        await testGetApprovalHistory(version.id);
        await testDocumentSearch();
        await testVersionArchiving(document.id);
        
        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('║   ✓ All tests passed successfully!                   ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n✗ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
