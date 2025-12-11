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
        
        // Initialize MSAL for authentication
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
     * Get access token for SharePoint API
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
     * Generate file name based on document code and version
     * Format: {DocumentCode}_v{Version}.{extension}
     */
    generateFileName(documentCode, version, originalFileName) {
        const ext = path.extname(originalFileName);
        return `${documentCode}_v${version}${ext}`;
    }

    /**
     * Upload file to SharePoint document library
     */
    async uploadFile(filePath, documentCode, version, originalFileName) {
        try {
            // In production, this would actually upload to SharePoint
            // For now, simulate the upload and return the SharePoint path
            const fileName = this.generateFileName(documentCode, version, originalFileName);
            const sharePointPath = `${this.libraryName}/${documentCode}/${fileName}`;
            
            console.log(`[SharePoint Service] Would upload file to: ${sharePointPath}`);
            
            // Simulate upload (in production, use actual SharePoint REST API)
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
     * Download file from SharePoint
     */
    async downloadFile(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would download file from: ${sharePointPath}`);
            
            // In production, this would download from SharePoint
            // For now, return a simulated response
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
     * Delete file from SharePoint (for version archiving)
     */
    async deleteFile(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would delete file from: ${sharePointPath}`);
            
            // In production, this would delete from SharePoint
            // For now, return a simulated response
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
     * Check if file exists in SharePoint
     */
    async fileExists(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would check if file exists at: ${sharePointPath}`);
            
            // In production, this would check SharePoint
            return false; // Simulate file doesn't exist
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * Get file metadata from SharePoint
     */
    async getFileMetadata(sharePointPath) {
        try {
            console.log(`[SharePoint Service] Would get metadata for: ${sharePointPath}`);
            
            // In production, this would retrieve metadata from SharePoint
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
