const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ConfidentialClientApplication } = require('@azure/msal-node');
require('dotenv').config();

class SharePointService {
    constructor() {
        this.siteUrl = process.env.SHAREPOINT_SITE_URL;
        this.libraryName = process.env.SHAREPOINT_LIBRARY_NAME || 'ProcurementCases';
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
     * 建立案件資料夾
     */
    async createFolder(folderPath) {
        try {
            const fullPath = `${this.libraryName}/${folderPath}`;
            console.log(`[SharePoint Service] Would create folder at: ${fullPath}`);

            // 在正式環境中，使用 SharePoint REST API 建立資料夾
            if (this.clientId && this.clientSecret) {
                // const accessToken = await this.getAccessToken();
                // POST to /_api/web/folders
                console.log('[SharePoint Service] Folder created successfully (simulated)');
            } else {
                console.log('[SharePoint Service] SharePoint not configured, using local storage');
            }

            return {
                success: true,
                folderPath: fullPath,
                url: `${this.siteUrl}/${fullPath}`
            };
        } catch (error) {
            console.error('Error creating folder in SharePoint:', error);
            throw error;
        }
    }

    /**
     * 設定資料夾中繼資料（案號、部門、金額等）
     */
    async setFolderMetadata(folderPath, metadata) {
        try {
            console.log(`[SharePoint Service] Would set metadata for folder: ${folderPath}`);
            console.log('[SharePoint Service] Metadata:', metadata);

            // 在正式環境中，使用 SharePoint REST API 更新資料夾屬性
            if (this.clientId && this.clientSecret) {
                // const accessToken = await this.getAccessToken();
                // PATCH to /_api/web/folders/getbyurl('{folderPath}')/ListItemAllFields
                console.log('[SharePoint Service] Metadata set successfully (simulated)');
            }

            return {
                success: true,
                message: 'Metadata updated'
            };
        } catch (error) {
            console.error('Error setting folder metadata:', error);
            throw error;
        }
    }

    /**
     * 上傳檔案至 SharePoint 資料夾
     */
    async uploadFile(localFilePath, sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would upload file to: ${sharePointPath}`);

            // 在正式環境中，使用 SharePoint REST API 上傳檔案
            if (this.clientId && this.clientSecret) {
                // const accessToken = await this.getAccessToken();
                // const fileContent = fs.readFileSync(localFilePath);
                // POST to /_api/web/GetFolderByServerRelativeUrl('{folder}')/Files/add(url='{filename}',overwrite=true)
                console.log('[SharePoint Service] File uploaded successfully (simulated)');
            } else {
                console.log('[SharePoint Service] SharePoint not configured, using local storage');
            }

            return {
                success: true,
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

            // 在正式環境中，從 SharePoint 下載檔案
            if (this.clientId && this.clientSecret) {
                // const accessToken = await this.getAccessToken();
                // GET /_api/web/GetFileByServerRelativeUrl('{path}')/$value
                console.log('[SharePoint Service] File downloaded successfully (simulated)');
            }

            return null; // 回傳 null 會讓控制器使用本地檔案
        } catch (error) {
            console.error('Error downloading file from SharePoint:', error);
            throw error;
        }
    }

    /**
     * 從 SharePoint 刪除檔案
     */
    async deleteFile(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would delete file from: ${sharePointPath}`);

            // 在正式環境中，從 SharePoint 刪除檔案
            if (this.clientId && this.clientSecret) {
                // const accessToken = await this.getAccessToken();
                // DELETE /_api/web/GetFileByServerRelativeUrl('{path}')
            }

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
     * 檢查資料夾是否存在於 SharePoint
     */
    async folderExists(folderPath) {
        try {
            console.log(`[SharePoint Service] Would check if folder exists at: ${folderPath}`);

            // 在正式環境中，檢查 SharePoint 資料夾
            return false; // 模擬資料夾不存在
        } catch (error) {
            console.error('Error checking folder existence:', error);
            return false;
        }
    }

    /**
     * 取得資料夾中繼資料
     */
    async getFolderMetadata(folderPath) {
        try {
            console.log(`[SharePoint Service] Would get metadata for: ${folderPath}`);

            // 在正式環境中，從 SharePoint 檢索資料夾中繼資料
            return {
                name: path.basename(folderPath),
                created: new Date(),
                modified: new Date()
            };
        } catch (error) {
            console.error('Error getting folder metadata:', error);
            throw error;
        }
    }
}

module.exports = new SharePointService();
