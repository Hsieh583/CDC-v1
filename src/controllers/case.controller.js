const CaseModel = require('../models/case.model');
const CaseFileModel = require('../models/case-file.model');
const CaseTypeModel = require('../models/case-type.model');
const UserModel = require('../models/user.model');
const SharePointService = require('../services/sharepoint.service');
const db = require('../database/db');

class CaseController {
    /**
     * 建立新案件
     */
    static async createCase(req, res) {
        try {
            const { case_type_id, department, amount, description } = req.body;
            const userId = req.headers['x-user-id'];

            if (!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }

            if (!case_type_id || !department) {
                return res.status(400).json({ error: 'case_type_id and department are required' });
            }

            // 取得使用者資訊
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // 取得案件類型
            const caseType = await CaseTypeModel.findById(case_type_id);
            if (!caseType) {
                return res.status(404).json({ error: 'Case type not found' });
            }

            // 生成案號：{類型代碼}-{時間戳}
            const timestamp = Date.now();
            const caseNumber = `${caseType.code}-${timestamp}`;

            // 在 SharePoint 建立資料夾
            const folderPath = `${caseNumber}`;
            try {
                await SharePointService.createFolder(folderPath);
            } catch (error) {
                console.error('SharePoint folder creation error:', error);
                // 繼續執行，資料夾可以稍後建立
            }

            // 建立案件記錄
            const caseId = await CaseModel.create({
                case_number: caseNumber,
                case_type_id,
                department,
                amount: amount || null,
                applicant_name: user.full_name,
                applicant_id: userId,
                description: description || '',
                sharepoint_folder_path: folderPath
            });

            // 記錄審計日誌
            await db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'CREATE_CASE', 'case', caseId, `Created case ${caseNumber}`]
            );

            const newCase = await CaseModel.findById(caseId);
            res.status(201).json({
                message: 'Case created successfully',
                case: newCase
            });
        } catch (error) {
            console.error('Create case error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 上傳檔案到案件
     */
    static async uploadFile(req, res) {
        try {
            const { case_id, is_main_document } = req.body;
            const userId = req.headers['x-user-id'];
            const file = req.file;

            if (!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }

            if (!case_id || !file) {
                return res.status(400).json({ error: 'case_id and file are required' });
            }

            // 檢查案件是否存在
            const caseData = await CaseModel.findById(case_id);
            if (!caseData) {
                return res.status(404).json({ error: 'Case not found' });
            }

            // 如果是主文件，檢查是否已存在主文件
            const isMainDoc = is_main_document === 'true' || is_main_document === true;
            if (isMainDoc) {
                const hasMain = await CaseFileModel.hasMainDocument(case_id);
                if (hasMain) {
                    return res.status(400).json({ error: 'Main document already exists for this case' });
                }
            }

            // 生成檔案名稱
            const timestamp = Date.now();
            const fileExt = file.originalname.split('.').pop();
            const fileName = isMainDoc 
                ? `${caseData.case_number}_main.${fileExt}`
                : `${caseData.case_number}_att_${timestamp}.${fileExt}`;

            // 上傳到 SharePoint
            const sharePointPath = `${caseData.sharepoint_folder_path}/${fileName}`;
            try {
                await SharePointService.uploadFile(file.path, sharePointPath);
            } catch (error) {
                console.error('SharePoint upload error:', error);
                // 繼續執行，檔案可以稍後上傳
            }

            // 建立檔案記錄
            const fileId = await CaseFileModel.create({
                case_id,
                file_name: fileName,
                original_name: file.originalname,
                file_path: file.path,
                sharepoint_path: sharePointPath,
                file_size: file.size,
                file_type: file.mimetype,
                is_main_document: isMainDoc,
                uploaded_by: userId
            });

            // 記錄審計日誌
            await db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'UPLOAD_FILE', 'case_file', fileId, 
                 `Uploaded ${isMainDoc ? 'main document' : 'attachment'} to case ${caseData.case_number}`]
            );

            const newFile = await CaseFileModel.findById(fileId);
            res.status(201).json({
                message: 'File uploaded successfully',
                file: newFile
            });
        } catch (error) {
            console.error('Upload file error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 取得案件詳情
     */
    static async getCase(req, res) {
        try {
            const { id } = req.params;

            const caseData = await CaseModel.findById(id);
            if (!caseData) {
                return res.status(404).json({ error: 'Case not found' });
            }

            // 取得案件的所有檔案
            const files = await CaseFileModel.findByCaseId(id);

            res.json({
                case: caseData,
                files: files
            });
        } catch (error) {
            console.error('Get case error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 搜尋/列表案件
     */
    static async searchCases(req, res) {
        try {
            const { 
                case_type_id, 
                department, 
                status, 
                search,
                page = 1, 
                limit = 20 
            } = req.query;

            const offset = (page - 1) * limit;
            const filters = {
                case_type_id,
                department,
                status,
                search,
                limit: parseInt(limit),
                offset: parseInt(offset)
            };

            const cases = await CaseModel.search(filters);
            const total = await CaseModel.count(filters);

            res.json({
                cases,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Search cases error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 取得案件列表
     */
    static async getCases(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;

            const cases = await CaseModel.getAll(parseInt(page), parseInt(limit));
            const total = await CaseModel.count();

            res.json({
                cases,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get cases error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 取得案件檔案
     */
    static async getCaseFiles(req, res) {
        try {
            const { case_id } = req.params;

            const files = await CaseFileModel.findByCaseId(case_id);
            
            res.json({ files });
        } catch (error) {
            console.error('Get case files error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 下載檔案
     */
    static async downloadFile(req, res) {
        try {
            const { file_id } = req.params;

            const file = await CaseFileModel.findById(file_id);
            if (!file) {
                return res.status(404).json({ error: 'File not found' });
            }

            // 從 SharePoint 下載檔案
            try {
                const fileContent = await SharePointService.downloadFile(file.sharepoint_path);
                res.setHeader('Content-Type', file.file_type);
                res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
                res.send(fileContent);
            } catch (error) {
                console.error('SharePoint download error:', error);
                // 如果 SharePoint 失敗，嘗試從本地檔案系統讀取
                const fs = require('fs');
                const path = require('path');
                const filePath = path.resolve(file.file_path);
                
                if (fs.existsSync(filePath)) {
                    res.download(filePath, file.original_name);
                } else {
                    return res.status(404).json({ error: 'File not found in storage' });
                }
            }
        } catch (error) {
            console.error('Download file error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 更新案件
     */
    static async updateCase(req, res) {
        try {
            const { id } = req.params;
            const { department, amount, description, status } = req.body;
            const userId = req.headers['x-user-id'];

            if (!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }

            const caseData = await CaseModel.findById(id);
            if (!caseData) {
                return res.status(404).json({ error: 'Case not found' });
            }

            await CaseModel.update(id, { department, amount, description, status });

            // 記錄審計日誌
            await db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'UPDATE_CASE', 'case', id, `Updated case ${caseData.case_number}`]
            );

            const updatedCase = await CaseModel.findById(id);
            res.json({
                message: 'Case updated successfully',
                case: updatedCase
            });
        } catch (error) {
            console.error('Update case error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = CaseController;
