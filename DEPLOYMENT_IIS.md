# Static Deployment Guide for IIS

## Quick Start

This guide explains how to deploy the CDC frontend to Internet Information Services (IIS).

## Prerequisites

- Windows Server with IIS installed
- IIS Features required:
  - Static Content
  - Default Document
  - HTTP Redirection (optional, for API proxy)
  - URL Rewrite Module (optional, for API proxy)

## Deployment Steps

### Step 1: Copy Files

1. Navigate to the project directory
2. Copy the entire `public` folder contents to your IIS website directory
   - Default: `C:\inetpub\wwwroot\cdc`
   - Or your custom website path

```powershell
# Example PowerShell command
Copy-Item -Path ".\public\*" -Destination "C:\inetpub\wwwroot\cdc" -Recurse
```

### Step 2: Configure IIS

1. Open **IIS Manager**
2. Create a new website or application:
   - Right-click **Sites** → **Add Website**
   - Site name: `CDC Document Control Center`
   - Physical path: `C:\inetpub\wwwroot\cdc`
   - Port: `80` (or your preferred port)

3. Set Default Document:
   - Select your website
   - Double-click **Default Document**
   - Ensure `index.html` is in the list and at the top
   - If not, click **Add** and enter `index.html`

### Step 3: Configure API Connection

Choose one of the following options:

#### Option A: Backend on Same Server (Recommended)

If your Node.js backend is running on the same server:

1. No changes needed to `js/api.js` - it uses relative URLs
2. Ensure backend is running on port 3000
3. Frontend will be served from IIS, API calls go to Node.js

#### Option B: Backend on Different Server

If backend is on a different server, edit `js/api.js`:

```javascript
// Change this line:
const API_BASE_URL = window.location.origin;

// To this:
const API_BASE_URL = 'http://your-backend-server:3000';
```

#### Option C: IIS as Reverse Proxy (Advanced)

Install URL Rewrite Module for IIS, then create `web.config` in the website root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
                </rule>
                <rule name="SPA Fallback" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

### Step 4: Configure MIME Types (If Needed)

Ensure these MIME types are configured:

1. In IIS Manager, select your site
2. Double-click **MIME Types**
3. Verify these types exist:
   - `.css` → `text/css`
   - `.js` → `application/javascript`
   - `.json` → `application/json`
   - `.html` → `text/html`

### Step 5: Start the Website

1. In IIS Manager, right-click your website
2. Click **Manage Website** → **Start**
3. Open browser and navigate to `http://your-server-ip`

## Backend Server Setup

The frontend needs a running backend API. To run the backend:

### Option 1: Run Backend Manually

```bash
cd C:\path\to\CDC-v1
npm start
```

### Option 2: Run Backend as Windows Service

Install **node-windows** to run backend as a service:

```bash
npm install -g node-windows
```

Create `install-service.js`:

```javascript
var Service = require('node-windows').Service;

var svc = new Service({
  name: 'CDC Backend API',
  description: 'CDC Document Control Center Backend API',
  script: 'C:\\path\\to\\CDC-v1\\src\\server.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

svc.on('install', function(){
  svc.start();
});

svc.install();
```

Run:
```bash
node install-service.js
```

### Option 3: Run Backend with IISNode

Install IISNode to run Node.js apps in IIS:

1. Download and install IISNode
2. Create `web.config` in backend directory
3. Configure IIS to serve the Node.js app

## Firewall Configuration

If accessing from other computers:

1. Open **Windows Firewall**
2. Create inbound rule for port 80 (or your port)
3. Allow TCP connections

```powershell
# PowerShell command
New-NetFirewallRule -DisplayName "CDC Frontend" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

## Security Considerations

### Production Checklist

- [ ] Enable HTTPS with SSL certificate
- [ ] Configure proper CORS on backend
- [ ] Change authentication from user selection to real login
- [ ] Implement JWT tokens
- [ ] Set up Content Security Policy (CSP)
- [ ] Enable IIS request filtering
- [ ] Disable directory browsing
- [ ] Remove unnecessary HTTP headers

### HTTPS Setup

1. Obtain SSL certificate (Let's Encrypt, commercial CA, or self-signed for testing)
2. In IIS Manager:
   - Select your site
   - Click **Bindings** → **Add**
   - Type: `https`
   - Port: `443`
   - SSL Certificate: Select your certificate
3. Force HTTPS redirect (optional)

## Troubleshooting

### Issue: Pages don't load

**Solution:**
- Check if `index.html` is set as default document
- Verify files were copied correctly
- Check IIS application pool is running

### Issue: API calls fail

**Solution:**
- Verify backend server is running
- Check `js/api.js` has correct API_BASE_URL
- Check browser console for CORS errors
- Verify firewall allows connections

### Issue: Bootstrap styles not loading

**Solution:**
- Check internet connection (Bootstrap loaded from CDN)
- Verify MIME types are configured correctly
- Check browser developer tools Network tab

### Issue: 404 errors

**Solution:**
- Ensure all files are in the correct directory structure
- Check IIS application pool identity has read permissions
- Verify virtual directory configuration

## File Permissions

Ensure IIS application pool identity has read access:

```powershell
# Grant read access to IIS_IUSRS group
icacls "C:\inetpub\wwwroot\cdc" /grant "IIS_IUSRS:(OI)(CI)R" /T
```

## Performance Optimization

### Enable Compression

1. In IIS Manager, select your site
2. Double-click **Compression**
3. Enable both static and dynamic compression

### Enable Browser Caching

Add to `web.config`:

```xml
<system.webServer>
    <staticContent>
        <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
    </staticContent>
</system.webServer>
```

### Content Delivery

For better performance, consider:
- CDN for static assets
- Enable HTTP/2 in IIS
- Minify CSS and JavaScript files (optional)

## Monitoring

### IIS Logs

Located at: `C:\inetpub\logs\LogFiles`

View access logs and error logs for troubleshooting.

### Application Logs

Check Windows Event Viewer:
- Windows Logs → Application
- Filter by source: IIS

## Backup

Regular backup of:
- Website files: `C:\inetpub\wwwroot\cdc`
- IIS configuration: Export from IIS Manager
- Backend database: `data/cdc.db`

## Updating the Application

1. Stop the website in IIS Manager
2. Backup current files
3. Copy new files from `public` folder
4. Start the website
5. Clear browser cache and test

## Support

For issues specific to:
- IIS Configuration: Consult IIS documentation
- Application Features: Refer to main README.md
- API Issues: Check backend logs

## Additional Resources

- [IIS Official Documentation](https://docs.microsoft.com/en-us/iis/)
- [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
- [IISNode Documentation](https://github.com/tjanczuk/iisnode)
