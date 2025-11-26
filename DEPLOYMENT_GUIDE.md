# Deployment Guide: React Frontend to Microsoft Teams Tabs

## Prerequisites

- Azure account (for Azure Static Web Apps or App Service)
- Microsoft Teams account
- Azure AD App Registration (for SSO)
- Your Python backend deployed and accessible

## Option 1: Deploy to Azure Static Web Apps (Recommended)

### Why Azure Static Web Apps?
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Easy CI/CD with GitHub
- ✅ Perfect for React/Vite apps

### Step 1: Configure Production Environment

Create `.env.production`:

```bash
# Production environment variables
VITE_API_URL=https://your-backend.run.app/api/v1/invoke
```

### Step 2: Test Production Build Locally

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

### Step 3: Deploy to Azure Static Web Apps

#### Option A: Using Azure Portal (Manual)

1. **Go to Azure Portal**: https://portal.azure.com

2. **Create Static Web App**:
   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

3. **Configure Basic Settings**:
   - Subscription: Choose your subscription
   - Resource Group: Create new or select existing
   - Name: `ai-assistant-tab` (or your preferred name)
   - Region: Choose closest to your users
   - SKU: Free (or Standard for production)

4. **Deployment**:
   - Source: GitHub
   - Organization: Your GitHub org
   - Repository: Your repo (`chat`)
   - Branch: `claude/migrate-azure-bot-teams-018348T1VvhcXYTsFW9BSo7D`

5. **Build Details**:
   - Build Presets: Vite
   - App location: `/` (root)
   - Output location: `dist`

6. **Review + Create**:
   - Click "Review + create"
   - Click "Create"

7. **Wait for Deployment**:
   - GitHub Actions workflow will run automatically
   - Check progress in your repo's Actions tab
   - Wait 5-10 minutes for first deployment

8. **Get Your URL**:
   - Go to your Static Web App resource
   - Find the URL (e.g., `https://nice-ocean-xyz.azurestaticapps.net`)

#### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name ai-assistant-rg \
  --location eastus

# Install Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Build your app
npm run build

# Deploy (first time - creates resource)
az staticwebapp create \
  --name ai-assistant-tab \
  --resource-group ai-assistant-rg \
  --source . \
  --location eastus \
  --branch claude/migrate-azure-bot-teams-018348T1VvhcXYTsFW9BSo7D \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github

# Get the URL
az staticwebapp show \
  --name ai-assistant-tab \
  --resource-group ai-assistant-rg \
  --query "defaultHostname" \
  --output tsv
```

#### Option C: Using GitHub Actions (Automated)

The Azure Static Web Apps creation process automatically sets up GitHub Actions. The workflow file is created at `.github/workflows/azure-static-web-apps-*.yml`.

**Manual setup**:

Create `.github/workflows/deploy-azure-static-web-apps.yml`:

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches:
      - claude/migrate-azure-bot-teams-018348T1VvhcXYTsFW9BSo7D
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - claude/migrate-azure-bot-teams-018348T1VvhcXYTsFW9BSo7D

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          output_location: "dist"
```

**Configure GitHub Secrets**:
1. Go to your repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: Get from Azure Static Web Apps resource
   - `VITE_API_URL`: Your backend URL

### Step 4: Configure Custom Domain (Optional)

```bash
# Add custom domain
az staticwebapp hostname set \
  --name ai-assistant-tab \
  --resource-group ai-assistant-rg \
  --hostname assistant.yourdomain.com
```

---

## Option 2: Deploy to Azure App Service

### Step 1: Create App Service

```bash
# Create App Service plan
az appservice plan create \
  --name ai-assistant-plan \
  --resource-group ai-assistant-rg \
  --sku F1 \
  --is-linux

# Create Web App
az webapp create \
  --name ai-assistant-tab \
  --resource-group ai-assistant-rg \
  --plan ai-assistant-plan \
  --runtime "NODE:18-lts"
```

### Step 2: Configure Deployment

```bash
# Build the app
npm run build

# Create a simple server for serving static files
# Create server.js:
cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
EOF

# Update package.json to add start script
# Add: "start": "node server.js"

# Install express
npm install express

# Deploy using ZIP
az webapp deploy \
  --resource-group ai-assistant-rg \
  --name ai-assistant-tab \
  --src-path dist.zip \
  --type zip
```

---

## Option 3: Deploy to Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_API_URL production
# Enter: https://your-backend.run.app/api/v1/invoke
```

---

## Option 4: Deploy to Netlify (Alternative)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_API_URL "https://your-backend.run.app/api/v1/invoke"
```

---

## 🔧 Step 2: Configure Teams Manifest

Once deployed, update your Teams manifest with the deployment URL.

### Update teams-manifest/manifest.json

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "GENERATE-NEW-GUID-HERE",
  "packageName": "com.yourcompany.aiassistant",
  "developer": {
    "name": "Your Company Name",
    "websiteUrl": "https://yourcompany.com",
    "privacyUrl": "https://yourcompany.com/privacy",
    "termsOfUseUrl": "https://yourcompany.com/terms"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "name": {
    "short": "AI Assistant",
    "full": "AI Assistant - Document Search"
  },
  "description": {
    "short": "AI-powered assistant for document search",
    "full": "An intelligent assistant that helps you search documents and answer questions using advanced AI."
  },
  "accentColor": "#6264A7",

  "staticTabs": [
    {
      "entityId": "ai-assistant-personal-tab",
      "name": "Assistant",
      "contentUrl": "https://YOUR-DEPLOYMENT-URL.azurestaticapps.net?inTeams=true&theme={app.theme}&locale={app.locale}",
      "websiteUrl": "https://YOUR-DEPLOYMENT-URL.azurestaticapps.net",
      "scopes": ["personal"]
    }
  ],

  "configurableTabs": [
    {
      "configurationUrl": "https://YOUR-DEPLOYMENT-URL.azurestaticapps.net/config?theme={app.theme}",
      "canUpdateConfiguration": true,
      "scopes": ["team", "groupchat"]
    }
  ],

  "permissions": [
    "identity",
    "messageTeamMembers"
  ],

  "validDomains": [
    "YOUR-DEPLOYMENT-URL.azurestaticapps.net",
    "your-backend.run.app",
    "token.botframework.com"
  ],

  "webApplicationInfo": {
    "id": "YOUR-AZURE-AD-APP-CLIENT-ID",
    "resource": "api://YOUR-DEPLOYMENT-URL.azurestaticapps.net/YOUR-AZURE-AD-APP-CLIENT-ID"
  }
}
```

### Replace These Values:

1. **GENERATE-NEW-GUID-HERE**: Generate at https://www.guidgenerator.com/
2. **YOUR-DEPLOYMENT-URL.azurestaticapps.net**: Your actual deployment URL
3. **YOUR-AZURE-AD-APP-CLIENT-ID**: From Azure AD App Registration
4. **your-backend.run.app**: Your Python backend URL
5. Company information

---

## 🎨 Step 3: Create App Icons

### Create color.png (192x192 px)

```bash
# Use an online tool or design software to create:
# - Size: 192x192 pixels
# - Format: PNG with transparent background
# - Content: Your app logo in color
```

### Create outline.png (32x32 px)

```bash
# Create a simple outline version:
# - Size: 32x32 pixels
# - Format: PNG with transparent background
# - Content: White outline of your logo
```

**Quick method using ImageMagick** (if you have a logo):

```bash
# Install ImageMagick
# Ubuntu/Debian: sudo apt-get install imagemagick
# Mac: brew install imagemagick

# Create color icon (resize your logo)
convert your-logo.png -resize 192x192 teams-manifest/color.png

# Create outline icon (convert to outline)
convert your-logo.png -resize 32x32 -alpha extract teams-manifest/outline.png
```

**Or use online tools**:
- https://www.canva.com (free design tool)
- https://www.figma.com (professional design)
- https://www.photopea.com (online Photoshop alternative)

---

## 📦 Step 4: Create Teams App Package

```bash
cd teams-manifest

# Ensure you have manifest.json, color.png, outline.png
ls -la

# Create ZIP package
zip -r app-package.zip manifest.json color.png outline.png

# Verify the package
unzip -l app-package.zip
```

Expected output:
```
Archive:  app-package.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
     xxxx  xx-xx-xxxx xx:xx   manifest.json
     xxxx  xx-xx-xxxx xx:xx   color.png
     xxxx  xx-xx-xxxx xx:xx   outline.png
---------                     -------
     xxxx                     3 files
```

---

## 🚀 Step 5: Upload to Microsoft Teams

### Method 1: Upload via Teams Client (Development/Testing)

1. **Open Microsoft Teams**

2. **Navigate to Apps**:
   - Click "Apps" in the left sidebar
   - Or click "..." (more options) → "Apps"

3. **Manage Your Apps**:
   - Click "Manage your apps" (bottom left)
   - Or go to: https://teams.microsoft.com/apps

4. **Upload Custom App**:
   - Click "Upload an app" (top right)
   - Select "Upload a custom app"
   - Choose your `app-package.zip` file

5. **Add the App**:
   - Click "Add" (for personal use)
   - Or "Add to a team" (for team/channel)

6. **Open Your Tab**:
   - Find your app in the left sidebar (personal tab)
   - Or go to the team/channel where you added it

### Method 2: Upload via Teams Admin Center (Organization-wide)

**For IT Admins only**:

1. **Go to Teams Admin Center**:
   - https://admin.teams.microsoft.com

2. **Navigate to Apps**:
   - Teams apps → Manage apps

3. **Upload**:
   - Click "Upload new app"
   - Upload `app-package.zip`
   - Set permissions and policies

4. **Approve**:
   - Review app details
   - Approve for organization

5. **Users Can Install**:
   - App appears in org app catalog
   - Users can install from Apps → Built for your org

---

## 🔐 Step 6: Configure Azure AD for SSO

### Create/Update Azure AD App Registration

1. **Go to Azure Portal**: https://portal.azure.com

2. **Azure Active Directory** → **App registrations**

3. **Create New Registration** (or select existing):
   - Name: `AI Assistant Tab`
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Don't set yet, we'll add it next

4. **Configure Authentication**:
   - Platform configurations → Add a platform
   - Select "Single-page application"
   - Add Redirect URIs:
     ```
     https://YOUR-DEPLOYMENT-URL.azurestaticapps.net/auth-end
     https://YOUR-DEPLOYMENT-URL.azurestaticapps.net/auth-start
     ```
   - Implicit grant: Check "ID tokens"
   - Save

5. **Expose an API**:
   - Click "Expose an API"
   - Set Application ID URI:
     ```
     api://YOUR-DEPLOYMENT-URL.azurestaticapps.net/YOUR-CLIENT-ID
     ```
   - Add a scope:
     - Scope name: `access_as_user`
     - Who can consent: Admins and users
     - Admin consent display name: `Access AI Assistant`
     - Admin consent description: `Allows Teams to access the AI Assistant on behalf of the user`
     - User consent display name: `Access AI Assistant`
     - User consent description: `Allows AI Assistant to access your information`
     - State: Enabled
   - Save

6. **API Permissions**:
   - Add permission → Microsoft Graph
   - Delegated permissions:
     - `User.Read`
     - `openid`
     - `profile`
     - `email`
   - Grant admin consent (if you're admin)

7. **Copy Values**:
   - Application (client) ID
   - Directory (tenant) ID

### Update Backend with Azure AD Config

Update your Python backend environment variables:

```bash
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret  # From Certificates & secrets
```

---

## ✅ Step 7: Test Your Integration

### Test Checklist:

1. **App Loads**:
   - [ ] Tab opens without errors
   - [ ] Loading spinner shows during initialization
   - [ ] No console errors in browser DevTools

2. **Teams SDK**:
   - [ ] Teams context is retrieved
   - [ ] User information displays correctly
   - [ ] Theme detection works (try changing Teams theme)

3. **Authentication**:
   - [ ] SSO token is acquired automatically
   - [ ] No authentication errors
   - [ ] User profile shows correct information

4. **Backend Communication**:
   - [ ] Messages send successfully
   - [ ] Responses display correctly
   - [ ] Loading states work
   - [ ] Error handling works (try with backend offline)

5. **Theme Switching**:
   - [ ] Go to Teams Settings → Appearance
   - [ ] Try Default, Dark, and High Contrast
   - [ ] Verify app theme updates

### Debug in Browser:

Open your tab in Teams, press F12, and run:

```javascript
// Check initialization
console.log('Teams initialized:', microsoftTeams.app.isInitialized());

// Get context
microsoftTeams.app.getContext().then(ctx => {
  console.log('Context:', ctx);
  console.log('User:', ctx.user);
  console.log('Theme:', ctx.app.theme);
});

// Get token
microsoftTeams.authentication.getAuthToken().then(token => {
  console.log('Token:', token);
  // Decode at https://jwt.ms
});

// Check API calls
// Look in Network tab for /api/v1/invoke requests
```

---

## 🔄 Updating Your App

### After Making Changes:

1. **Update Version**:
   ```json
   // teams-manifest/manifest.json
   {
     "version": "1.0.1"  // Increment version
   }
   ```

2. **Rebuild Frontend**:
   ```bash
   npm run build
   # Deploy updates (automatic with GitHub Actions)
   ```

3. **Recreate App Package**:
   ```bash
   cd teams-manifest
   zip -r app-package.zip manifest.json color.png outline.png
   ```

4. **Update in Teams**:
   - Teams → Apps → Manage your apps
   - Find your app → Click "..." → Update
   - Or remove and re-upload

---

## 🐛 Troubleshooting

### App Won't Load

**Check:**
- HTTPS is used (required for Teams)
- URL in manifest matches deployment
- Valid domains include your URL
- No CORS errors in console

**Fix:**
```bash
# Verify URL is accessible
curl https://your-deployment-url.azurestaticapps.net

# Check HTTPS certificate
openssl s_client -connect your-deployment-url.azurestaticapps.net:443
```

### SSO Fails

**Check:**
- Azure AD app configuration
- Application ID URI format: `api://domain/{client-id}`
- Redirect URIs include `/auth-end`
- API permissions granted

**Debug:**
```javascript
// In browser console
microsoftTeams.authentication.getAuthToken()
  .then(token => console.log('Success:', token))
  .catch(err => console.error('Error:', err));
```

### Backend Not Receiving Requests

**Check:**
- CORS configuration allows your frontend URL
- Backend is deployed and running
- API URL in `.env.production` is correct
- Authorization header is being sent

**Test:**
```bash
# Test backend directly
curl -X POST https://your-backend.run.app/api/v1/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"prompt": "test"}'
```

---

## 📊 Complete Deployment Checklist

- [ ] Build React app (`npm run build`)
- [ ] Deploy to Azure Static Web Apps (or alternative)
- [ ] Get deployment URL
- [ ] Update `.env.production` with backend URL
- [ ] Configure Azure AD App Registration
- [ ] Update Teams manifest with deployment URL
- [ ] Create app icons (color.png, outline.png)
- [ ] Create app package ZIP
- [ ] Upload to Teams
- [ ] Test all functionality
- [ ] Configure backend CORS for deployment URL
- [ ] Test end-to-end integration

---

## 🎉 Success!

Your React app should now be running as a Microsoft Teams Tab!

**Next Steps:**
- Monitor usage and errors
- Gather user feedback
- Iterate and improve
- Consider publishing to Teams App Store

**Resources:**
- [Teams Developer Portal](https://dev.teams.microsoft.com/)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Teams App Validation](https://dev.teams.microsoft.com/validation)
