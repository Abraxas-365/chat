# Quick Start: Deploy to Vercel and Upload to Teams

## Prerequisites
- Vercel account (free): https://vercel.com/signup
- Microsoft Teams account
- Your Python backend deployed

## 🚀 Complete Process (15 minutes)

### 1️⃣ Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# You'll get a URL like: https://chat-xyz123.vercel.app
```

### 2️⃣ Configure Environment

```bash
# Set your backend API URL
vercel env add VITE_API_URL production
# When prompted, enter: https://your-backend.run.app/api/v1/invoke

# Redeploy to apply environment variable
vercel --prod
```

### 3️⃣ Update Teams Manifest

Edit `teams-manifest/manifest.json`:

**Find and replace these 3 things:**

1. **Generate App ID:**
   - Go to: https://www.guidgenerator.com/
   - Copy the generated GUID
   - Replace `YOUR-APP-ID-GUID` in the manifest

2. **Replace your Vercel URL:**
   ```json
   "contentUrl": "https://YOUR-VERCEL-URL.vercel.app?inTeams=true&theme={app.theme}",
   "websiteUrl": "https://YOUR-VERCEL-URL.vercel.app",
   ```

   And in validDomains:
   ```json
   "validDomains": [
     "YOUR-VERCEL-URL.vercel.app",
     "your-backend.run.app"
   ]
   ```

3. **Azure AD Client ID** (get from Azure Portal):
   ```json
   "webApplicationInfo": {
     "id": "YOUR-AZURE-AD-CLIENT-ID",
     "resource": "api://YOUR-VERCEL-URL.vercel.app/YOUR-AZURE-AD-CLIENT-ID"
   }
   ```

### 4️⃣ Create App Icons

You need 2 PNG files in `teams-manifest/`:

**Option A: Quick placeholders (for testing)**
```bash
cd teams-manifest

# Create simple colored square (192x192)
convert -size 192x192 xc:#6264A7 color.png

# Create simple outline (32x32)
convert -size 32x32 xc:white -alpha set -channel A -evaluate set 0 outline.png
convert outline.png -fill white -draw "rectangle 6,6 26,26" outline.png
```

**Option B: Use online tools:**
- Go to https://www.canva.com
- Create design → Custom size → 192x192 pixels
- Add your logo or text
- Download as PNG → Save as `color.png`
- Repeat for 32x32 → Save as `outline.png`

**Option C: Use existing logo:**
If you have a logo file:
```bash
# Resize to 192x192
convert your-logo.png -resize 192x192 teams-manifest/color.png

# Create outline version (32x32)
convert your-logo.png -resize 32x32 teams-manifest/outline.png
```

### 5️⃣ Create Teams App Package

```bash
cd teams-manifest

# Create ZIP file
zip app-package.zip manifest.json color.png outline.png

# Verify contents
unzip -l app-package.zip
```

You should see:
```
Archive:  app-package.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
      xxx  xx-xx-xxxx xx:xx   manifest.json
      xxx  xx-xx-xxxx xx:xx   color.png
      xxx  xx-xx-xxxx xx:xx   outline.png
```

### 6️⃣ Upload to Teams

1. **Open Microsoft Teams** (desktop or web)

2. **Go to Apps:**
   - Click "Apps" in the left sidebar
   - Or click the three dots (...) → Apps

3. **Upload Custom App:**
   - Bottom left → "Manage your apps"
   - Top right → "Upload an app"
   - Click "Upload a custom app"

4. **Select Package:**
   - Choose `teams-manifest/app-package.zip`
   - Click "Open"

5. **Install:**
   - Teams will show your app details
   - Click "Add" (adds as personal tab)
   - Or "Add to a team" (adds to specific team/channel)

6. **Open Your Tab:**
   - Personal: Look in left sidebar for your app icon
   - Team/Channel: Go to the team → Find your tab

### 7️⃣ Test It!

Open your tab and check browser console (F12):

```javascript
// Should see Teams SDK initialized
// Should see your user context
// Should see auth token acquired
```

Try sending a message - it should go to your Python backend!

## 🔐 Azure AD Setup (Required for SSO)

If you haven't set up Azure AD yet:

### 1. Go to Azure Portal
https://portal.azure.com → Azure Active Directory → App registrations

### 2. Create New Registration
- Name: `AI Assistant Tab`
- Account types: "Single tenant"
- Don't set redirect URI yet

### 3. Copy Client ID and Tenant ID
You'll need these!

### 4. Configure Authentication
- Add platform → Single-page application
- Redirect URI: `https://YOUR-VERCEL-URL.vercel.app/auth-end`
- Save

### 5. Expose an API
- Set Application ID URI: `api://YOUR-VERCEL-URL.vercel.app/YOUR-CLIENT-ID`
- Add scope:
  - Name: `access_as_user`
  - Who can consent: Admins and users
  - Display names: "Access AI Assistant"
  - State: Enabled

### 6. API Permissions
- Add permission → Microsoft Graph → Delegated:
  - `User.Read`
  - `openid`
  - `profile`
  - `email`
- Grant admin consent (if you're admin)

### 7. Update Backend
Set these environment variables in your Python backend:
```bash
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret  # From Certificates & secrets
```

## 📝 Minimal manifest.json Example

Here's a complete, ready-to-use manifest:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "12345678-1234-1234-1234-123456789012",
  "packageName": "com.example.aiassistant",
  "developer": {
    "name": "My Company",
    "websiteUrl": "https://example.com",
    "privacyUrl": "https://example.com/privacy",
    "termsOfUseUrl": "https://example.com/terms"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "name": {
    "short": "AI Assistant",
    "full": "AI Assistant"
  },
  "description": {
    "short": "AI-powered assistant",
    "full": "An AI assistant for document search and Q&A"
  },
  "accentColor": "#6264A7",
  "staticTabs": [
    {
      "entityId": "assistant-tab",
      "name": "Assistant",
      "contentUrl": "https://chat-xyz123.vercel.app?inTeams=true&theme={app.theme}",
      "websiteUrl": "https://chat-xyz123.vercel.app",
      "scopes": ["personal"]
    }
  ],
  "permissions": ["identity", "messageTeamMembers"],
  "validDomains": [
    "chat-xyz123.vercel.app",
    "your-backend.run.app",
    "token.botframework.com"
  ],
  "webApplicationInfo": {
    "id": "abcd1234-5678-90ab-cdef-1234567890ab",
    "resource": "api://chat-xyz123.vercel.app/abcd1234-5678-90ab-cdef-1234567890ab"
  }
}
```

**Just replace:**
- `12345678-1234-1234-1234-123456789012` → New GUID from guidgenerator.com
- `chat-xyz123.vercel.app` → Your Vercel URL
- `your-backend.run.app` → Your backend URL
- `abcd1234-5678-90ab-cdef-1234567890ab` → Your Azure AD Client ID

## ✅ Checklist

Before uploading to Teams, make sure:

- [ ] App deployed to Vercel and accessible
- [ ] Environment variable `VITE_API_URL` set in Vercel
- [ ] manifest.json updated with:
  - [ ] New GUID for "id"
  - [ ] Your Vercel URL in contentUrl and websiteUrl
  - [ ] Your Vercel URL in validDomains
  - [ ] Azure AD Client ID in webApplicationInfo
- [ ] color.png created (192x192 px)
- [ ] outline.png created (32x32 px)
- [ ] app-package.zip created with all 3 files
- [ ] Azure AD app registration configured
- [ ] Backend CORS allows your Vercel URL

## 🐛 Common Issues

### "App won't load in Teams"

**Check:**
```bash
# Test if your Vercel deployment is accessible
curl https://your-app.vercel.app

# Should return HTML content
```

**Fix:** Make sure the URL in manifest matches exactly (no trailing slash)

### "Authentication failed"

**Check Azure AD:**
- Application ID URI format: `api://domain.com/{client-id}` (no https://)
- Redirect URI includes `/auth-end`
- API permissions are granted

### "Can't connect to backend"

**Check:**
```bash
# Verify environment variable is set
vercel env ls

# Should show VITE_API_URL
```

**Fix:**
```bash
# Set it again
vercel env add VITE_API_URL production
# Enter your backend URL

# Redeploy
vercel --prod
```

### "Manifest validation error"

**Common issues:**
- Missing required fields (name, description, icons)
- Invalid GUID format for "id"
- Icon files not in ZIP
- JSON syntax error

**Fix:**
```bash
# Validate JSON syntax
cat teams-manifest/manifest.json | jq .

# If error, check for:
# - Missing commas
# - Extra commas
# - Unmatched brackets
```

## 🔄 Updating Your App

When you make changes to your code:

```bash
# 1. Deploy to Vercel
vercel --prod

# 2. If you changed manifest.json, recreate package
cd teams-manifest
zip -r app-package.zip manifest.json color.png outline.png

# 3. Update in Teams
# Teams → Apps → Manage your apps → Find your app → ... → Update
# Or remove and re-upload
```

## 🎉 That's It!

Your React app is now running as a Teams Tab!

**Workflow summary:**
1. Code → Vercel (5 min)
2. Manifest → Updated with Vercel URL (2 min)
3. Icons → Created (5 min)
4. ZIP → Created (1 min)
5. Upload → Teams (2 min)

Total time: **~15 minutes**

## 📚 Need More Details?

See the full documentation:
- `DEPLOYMENT_GUIDE.md` - Detailed deployment options
- `TEAMS_TAB_MIGRATION.md` - Complete migration guide
- `PYTHON_BACKEND_MIGRATION.md` - Backend setup
- `teams-manifest/README.md` - Manifest configuration
