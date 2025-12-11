const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ConfidentialClientApplication } = require('@azure/msal-node');
require('dotenv').config();

class SharePointService {
    constructor() {
        this.siteUrl = process.env.SHAREPOINT_SITE_URL;
        this.libraryName = process.env.SHAREPOINT_LIBRARY_NAME || 'DocumentLibrary';
        this.clientId = process.env.SHAREPOINT_CLIENT_ID;
        this.clientSecret = process.env.SHAREPOINT_CLIENT_SECRET;
        this.tenantId = process.env.SHAREPOINT_TENANT_ID;

        // 初始化 MSAL 進行驗證
        if (this.clientId && this.clientSecret && this.tenantId) {
            this.msalConfig = {
                auth: {
                    clientId: this.clientId,
                    authority: `https://login.microsoftonline.com/${this.tenantId}`,
                    clientSecret: this.clientSecret,
                }
            };
            this.cca = new ConfidentialClientApplication(this.msalConfig);
        }
    }

    /**
     * 取得 SharePoint API 的存取權杖
     */
    async getAccessToken() {
        try {
            const tokenRequest = {
                scopes: [`${this.siteUrl}/.default`],
            };

            const response = await this.cca.acquireTokenByClientCredential(tokenRequest);
            return response.accessToken;
        } catch (error) {
            console.error('Error getting access token:', error);
            throw new Error('Failed to authenticate with SharePoint');
        }
    }

    /**
     * 根據文件代碼與版本產生檔名
     * 格式：{DocumentCode}_v{Version}.{extension}
     */
    generateFileName(documentCode, version, originalFileName) {
        const ext = path.extname(originalFileName);
        return `${documentCode}_v${version}${ext}`;
    }

    /**
     * 上傳檔案至 SharePoint 文件庫
     */
    async uploadFile(filePath, documentCode, version, originalFileName) {
        try {
            // 在正式環境中，這將實際已上傳至 SharePoint
            // 目前，模擬上傳並回傳 SharePoint 路徑
            const fileName = this.generateFileName(documentCode, version, originalFileName);
            const sharePointPath = `${this.libraryName}/${documentCode}/${fileName}`;

            console.log(`[SharePoint Service] Would upload file to: ${sharePointPath}`);

            // 模擬上傳（在正式環境中，使用實際的 SharePoint REST API）
            if (this.clientId && this.clientSecret) {
                // const accessToken = await this.getAccessToken();
                // Actual upload logic would go here
                console.log('[SharePoint Service] File uploaded successfully (simulated)');
            } else {
                console.log('[SharePoint Service] SharePoint not configured, using local storage');
            }

            return {
                success: true,
                fileName: fileName,
                sharePointPath: sharePointPath,
                url: `${this.siteUrl}/${sharePointPath}`
            };
        } catch (error) {
            console.error('Error uploading file to SharePoint:', error);
            throw error;
        }
    }

    /**
     * 從 SharePoint 下載檔案
     */
    async downloadFile(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would download file from: ${sharePointPath}`);

            // 在正式環境中，這將從 SharePoint 下載
            // 目前，回傳模擬回應
            if (this.clientId && this.clientSecret) {
                // const accessToken = await this.getAccessToken();
                // Actual download logic would go here
            }

            return {
                success: true,
                message: 'File download would occur here in production'
            };
        } catch (error) {
            console.error('Error downloading file from SharePoint:', error);
            throw error;
        }
    }

    /**
     * 從 SharePoint 刪除檔案（用於版本封存）
     */
    async deleteFile(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would delete file from: ${sharePointPath}`);

            // 在正式環境中，這將從 SharePoint 刪除
            // 目前，回傳模擬回應
            return {
                success: true,
                message: 'File deletion would occur here in production'
            };
        } catch (error) {
            console.error('Error deleting file from SharePoint:', error);
            throw error;
        }
    }

    /**
     * 檢查檔案是否存在於 SharePoint
     */
    async fileExists(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would check if file exists at: ${sharePointPath}`);

            // 在正式環境中，這將檢查 SharePoint
            return false; // 模擬檔案不存在
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * 從 SharePoint 取得檔案中繼資料
     */
    async getFileMetadata(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would get metadata for: ${sharePointPath}`);

            // 在正式環境中，這將從 SharePoint 檢索中繼資料
            return {
                name: path.basename(sharePointPath),
                size: 0,
                created: new Date(),
                modified: new Date()
            };
        } catch (error) {
            console.error('Error getting file metadata:', error);
            throw error;
        }
    }
}

module.exports = new SharePointService();
