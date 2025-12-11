const DocumentModel = require('../models/document.model');
const VersionModel = require('../models/version.model');
const ApprovalModel = require('../models/approval.model');
const sharePointService = require('../services/sharepoint.service');
const fs = require('fs').promises;
const path = require('path');

class DocumentController {
    /**
     * 建立新文件
     */
    async createDocument(req, res) {
        try {
            const { title, category_id, description } = req.body;
            const author_id = req.user?.id || 1; // Default to admin for demo

            // 產生文件代碼
            const category = await req.db.get('SELECT code FROM categories WHERE id = ?', [category_id]);
            if (!category) {
                return res.status(400).json({ error: 'Invalid category' });
            }

            const timestamp = Date.now();
            const document_code = `${category.code}-${timestamp}`;

            // 建立文件
            const documentId = await DocumentModel.create({
                document_code,
                title,
                category_id,
                description,
                author_id
            });

            const document = await DocumentModel.findById(documentId);

            res.status(201).json({
                success: true,
                message: 'Document created successfully',
                data: document
            });
        } catch (error) {
            console.error('Error creating document:', error);
            res.status(500).json({ error: 'Failed to create document' });
        }
    }

    /**
     * 上傳文件的新版本
     */
    async uploadVersion(req, res) {
        try {
            const { document_id, title, description } = req.body;
            const author_id = req.user?.id || 1;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // 取得文件
            const document = await DocumentModel.findById(document_id);
            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            // 取得下一個版本號
            const version_number = await VersionModel.getNextVersionNumber(document_id);

            // 上傳至 SharePoint
            const uploadResult = await sharePointService.uploadFile(
                file.path,
                document.document_code,
                version_number,
                file.originalname
            );

            // 建立版本紀錄
            const versionId = await VersionModel.create({
                document_id,
                version_number,
                title: title || document.title,
                description,
                file_name: uploadResult.fileName,
                file_path: file.path,
                sharepoint_path: uploadResult.sharePointPath,
                file_size: file.size,
                file_type: file.mimetype,
                author_id
            });

            // 建立初始簽核紀錄（提交）
            await ApprovalModel.create({
                version_id: versionId,
                stage_number: 1,
                approver_id: author_id,
                action: 'submitted',
                comments: 'Initial submission'
            });

            // 更新文件狀態與版本
            await DocumentModel.update(document_id, {
                current_version: version_number,
                status: 'in_review'
            });

            const version = await VersionModel.findById(versionId);

            res.status(201).json({
                success: true,
                message: 'Version uploaded successfully',
                data: version
            });
        } catch (error) {
            console.error('Error uploading version:', error);
            res.status(500).json({ error: 'Failed to upload version' });
        }
    }

    /**
     * 取得文件詳情
     */
    async getDocument(req, res) {
        try {
            const { id } = req.params;
            const document = await DocumentModel.findById(id);

            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            // 取得版本列表
            const versions = await VersionModel.findByDocumentId(id);

            res.json({
                success: true,
                data: {
                    document,
                    versions
                }
            });
        } catch (error) {
            console.error('Error getting document:', error);
            res.status(500).json({ error: 'Failed to get document' });
        }
    }

    /**
     * 搜尋文件
     */
    async searchDocuments(req, res) {
        try {
            const filters = {
                category_id: req.query.category_id,
                status: req.query.status,
                author_id: req.query.author_id,
                search: req.query.search,
                limit: parseInt(req.query.limit) || 50
            };

            const documents = await DocumentModel.search(filters);

            res.json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Error searching documents:', error);
            res.status(500).json({ error: 'Failed to search documents' });
        }
    }

    /**
     * 取得版本歷史紀錄
     */
    async getVersionHistory(req, res) {
        try {
            const { document_id } = req.params;
            const versions = await VersionModel.findByDocumentId(document_id);

            // 取得每個版本的簽核紀錄
            const versionsWithApprovals = await Promise.all(
                versions.map(async (version) => {
                    const approvals = await ApprovalModel.findByVersionId(version.id);
                    return { ...version, approvals };
                })
            );

            res.json({
                success: true,
                data: versionsWithApprovals
            });
        } catch (error) {
            console.error('Error getting version history:', error);
            res.status(500).json({ error: 'Failed to get version history' });
        }
    }

    /**
     * 下載正式版本
     */
    async downloadOfficialVersion(req, res) {
        try {
            const { document_id } = req.params;
            const version = await VersionModel.getOfficialVersion(document_id);

            if (!version) {
                return res.status(404).json({ error: 'No official version found' });
            }

            // 檢查檔案是否存在於本機
            const filePath = version.file_path;
            try {
                await fs.access(filePath);
                res.download(filePath, version.file_name);
            } catch (err) {
                // 若本機找不到，則從 SharePoint 下載
                res.status(404).json({
                    error: 'File not found locally',
                    sharepoint_path: version.sharepoint_path
                });
            }
        } catch (error) {
            console.error('Error downloading version:', error);
            res.status(500).json({ error: 'Failed to download version' });
        }
    }

    /**
     * 取得所有文件（含分頁）
     */
    async getAllDocuments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const documents = await DocumentModel.getAll(page, limit);

            res.json({
                success: true,
                data: documents,
                pagination: {
                    page,
                    limit
                }
            });
        } catch (error) {
            console.error('Error getting documents:', error);
            res.status(500).json({ error: 'Failed to get documents' });
        }
    }
}

module.exports = new DocumentController();
