# Migration Guide: Azure Bot Framework → Microsoft Teams Tabs

This document explains the migration from Azure Bot Framework to Microsoft Teams Tabs for your AI Assistant application.

## 📋 Table of Contents

- [Overview](#overview)
- [What Changed](#what-changed)
- [Frontend Changes](#frontend-changes)
- [Backend Changes](#backend-changes)
- [Setup Instructions](#setup-instructions)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

### Why Migrate?

**From Azure Bot Framework** → **To Teams Tabs**

Benefits:
- ✅ Better user experience with rich UI components
- ✅ Direct REST API communication (simpler architecture)
- ✅ No Bot Framework dependencies or costs
- ✅ Easier to maintain and debug
- ✅ Better integration with Teams features
- ✅ SSO authentication built-in

### Architecture Comparison

**Old Architecture (Bot Framework):**
```
User → Teams Client → Bot Framework → Azure Bot Service → Your Backend
```

**New Architecture (Teams Tabs):**
```
User → Teams Tab (React App) → Your Backend API (Python)
```

## 🔄 What Changed

### Frontend (React)

| Component | Status | Description |
|-----------|--------|-------------|
| `@microsoft/teams-js` | ✅ Added | Teams SDK for tab integration |
| `useTeamsContext` hook | ✅ Created | Gets Teams user and context info |
| `useTeamsAuth` hook | ✅ Created | Handles Teams SSO authentication |
| `useTeamsTheme` hook | ✅ Created | Manages Teams theme (dark/light) |
| `useChat` hook | ✅ Updated | Calls Python backend API directly |
| `App.tsx` | ✅ Updated | Integrates Teams hooks and authentication |
| Environment config | ✅ Added | `.env.local` for API URL configuration |
| Teams manifest | ✅ Created | `teams-manifest/manifest.json` |

### Backend (Python)

| Component | Status | Description |
|-----------|--------|-------------|
| Token validation | 📝 TODO | Validate Teams SSO JWT tokens |
| CORS configuration | 📝 TODO | Allow Teams domains |
| New API routes | 📝 TODO | `/api/v1/invoke` endpoint for tabs |
| Bot routes | 📝 TODO | Remove or deprecate Azure Bot routes |
| Dependencies | 📝 TODO | Add PyJWT, msal, python-jose |

## 🎨 Frontend Changes

### New Files Created

1. **`src/hooks/use-teams-context.ts`**
   - Initializes Teams SDK
   - Gets user information (ID, email, name)
   - Provides team/channel/chat context
   - Handles initialization errors

2. **`src/hooks/use-teams-auth.ts`**
   - Acquires Teams SSO token automatically
   - Provides token to API calls
   - Handles authentication errors

3. **`src/hooks/use-teams-theme.ts`**
   - Detects Teams theme (default/dark/contrast)
   - Updates on theme changes
   - Applies theme to app

4. **`.env.example` & `.env.local`**
   - Configuration for backend API URL
   - Template for environment setup

5. **`teams-manifest/manifest.json`**
   - Teams app configuration
   - Tab configuration (personal + configurable)
   - SSO settings

### Updated Files

1. **`src/hooks/use-chat.ts`**
   - Added `apiUrl` parameter for backend endpoint
   - Added `authToken` parameter for authentication
   - Added `userId` and `sessionId` support
   - Sends requests to Python backend via fetch

2. **`src/App.tsx`**
   - Integrated Teams hooks
   - Shows loading state during Teams initialization
   - Displays errors for init/auth failures
   - Passes Teams context to chat
   - Applies Teams theme dynamically

### Usage Example

```typescript
// The app now automatically:
// 1. Initializes Teams SDK
// 2. Gets user authentication token
// 3. Detects and applies theme
// 4. Sends messages to Python backend with auth
// 5. Uses Teams user ID for session management
```

## 🐍 Backend Changes

See [PYTHON_BACKEND_MIGRATION.md](./PYTHON_BACKEND_MIGRATION.md) for detailed backend migration guide.

### Quick Summary

**Required Changes:**

1. **Install Dependencies:**
   ```bash
   pip install PyJWT cryptography python-jose msal requests
   ```

2. **Add Token Validation:**
   - Create `src/middleware/teams_auth.py`
   - Validate JWT tokens from Teams SSO
   - Extract user information from tokens

3. **Update CORS:**
   - Allow `https://teams.microsoft.com`
   - Allow your React app domain
   - Enable credentials

4. **Create New Routes:**
   - `/api/v1/invoke` - Main endpoint for tab messages
   - `/api/v1/health` - Health check
   - `/api/v1/user/profile` - Get user info

5. **Set Environment Variables:**
   ```bash
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-app-client-id
   AZURE_CLIENT_SECRET=your-client-secret
   ```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm/bun
- Python 3.11+
- Azure AD App Registration
- Microsoft Teams account

### Step 1: Frontend Setup

```bash
# Install dependencies (already done)
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local and set VITE_API_URL to your backend URL

# Run development server
npm run dev
```

### Step 2: Backend Setup

Follow the [PYTHON_BACKEND_MIGRATION.md](./PYTHON_BACKEND_MIGRATION.md) guide to:

1. Update your Python backend code
2. Install required dependencies
3. Configure authentication
4. Deploy or run locally

### Step 3: Azure AD Configuration

1. Go to https://portal.azure.com
2. Navigate to Azure Active Directory → App registrations
3. Create or select your app registration
4. Configure authentication:
   - Add SPA redirect: `https://your-app.com/auth-end`
   - Enable ID tokens
5. Expose an API:
   - Set URI: `api://your-app.com/{client-id}`
   - Add scope: `access_as_user`
6. Add API permissions:
   - Microsoft Graph: `User.Read`, `openid`, `profile`
7. Copy Client ID and Tenant ID

### Step 4: Teams Manifest Configuration

```bash
cd teams-manifest

# Edit manifest.json and replace:
# - YOUR-APP-ID-GUID (generate at https://www.guidgenerator.com/)
# - YOUR-AZURE-AD-APP-ID (from Azure portal)
# - your-react-app-url.com (your deployed frontend URL)
# - your-backend.run.app (your backend URL)
# - Company information

# Create icons (required):
# - color.png (192x192 px)
# - outline.png (32x32 px)

# Create app package
zip -r app-package.zip manifest.json color.png outline.png
```

### Step 5: Upload to Teams

1. Open Microsoft Teams
2. Go to Apps → Manage your apps
3. Click "Upload an app" → "Upload a custom app"
4. Select `app-package.zip`
5. Add the app to test

## 📦 Deployment

### Frontend Deployment Options

#### Option A: Azure Static Web Apps

```bash
npm run build

az staticwebapp create \
  --name ai-assistant-tab \
  --resource-group your-rg \
  --source ./dist \
  --location eastus2 \
  --branch main
```

#### Option B: Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Option C: Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Backend Deployment

See [PYTHON_BACKEND_MIGRATION.md](./PYTHON_BACKEND_MIGRATION.md#deployment) for backend deployment instructions.

### Post-Deployment Steps

1. Update `.env.local` with production API URL
2. Rebuild frontend: `npm run build`
3. Redeploy frontend
4. Update `teams-manifest/manifest.json` with production URLs
5. Create new app package
6. Upload to Teams

## 🧪 Testing

### Local Testing

1. **Start Backend:**
   ```bash
   # In your Python project
   uvicorn src.main:app --reload --port 8000
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Use ngrok for Teams Testing:**
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   ngrok http 5173

   # Update manifest.json with ngrok URL
   # Create app package and upload to Teams
   ```

### Testing Checklist

- [ ] Teams SDK initializes successfully
- [ ] User authentication works (check browser console for token)
- [ ] Theme changes work (Settings → Appearance)
- [ ] Messages send to backend
- [ ] Responses display correctly
- [ ] Session persistence works
- [ ] Error handling works (try disconnecting backend)

### Browser Console Testing

Open browser DevTools in Teams and run:

```javascript
// Check if Teams is initialized
console.log(microsoftTeams.app.isInitialized());

// Get context
microsoftTeams.app.getContext().then(ctx => console.log(ctx));

// Get auth token
microsoftTeams.authentication.getAuthToken().then(token => {
  console.log('Token:', token);
  // Decode JWT at https://jwt.ms to verify
});
```

## 🔧 Troubleshooting

### Frontend Issues

**Teams SDK won't initialize**
- ✅ Ensure app is running inside Teams (not browser)
- ✅ Check manifest.json is correctly configured
- ✅ Verify app is uploaded to Teams
- ✅ Try refreshing the Teams tab

**Authentication fails**
- ✅ Check Azure AD app registration
- ✅ Verify redirect URIs are correct
- ✅ Ensure API permissions are granted
- ✅ Check Application ID URI format: `api://domain/{client-id}`

**Theme not applying**
- ✅ Verify Teams SDK is initialized first
- ✅ Check theme handler is registered
- ✅ Test in different Teams themes

**API calls fail**
- ✅ Check VITE_API_URL in .env.local
- ✅ Verify backend is running and accessible
- ✅ Check CORS configuration in backend
- ✅ Verify auth token is being sent
- ✅ Check browser DevTools Network tab

### Backend Issues

**CORS errors**
- ✅ Add all Teams domains to allow_origins
- ✅ Enable allow_credentials
- ✅ Check preflight requests (OPTIONS)

**Token validation fails**
- ✅ Verify AZURE_TENANT_ID and AZURE_CLIENT_ID
- ✅ Check JWKS endpoint is accessible
- ✅ Ensure token audience matches client ID
- ✅ Verify token hasn't expired

**500 errors**
- ✅ Check backend logs
- ✅ Verify environment variables are set
- ✅ Ensure dependencies are installed
- ✅ Test token validation separately

### Teams App Issues

**Tab doesn't load**
- ✅ Check manifest.json URLs are correct
- ✅ Verify HTTPS is used (required for Teams)
- ✅ Check valid domains include your URLs
- ✅ Try re-uploading the app package

**SSO not working**
- ✅ Verify webApplicationInfo in manifest
- ✅ Check Azure AD app registration
- ✅ Ensure API is exposed correctly
- ✅ Grant admin consent for API permissions

## 📚 Additional Resources

### Documentation
- [Teams JavaScript SDK](https://learn.microsoft.com/en-us/javascript/api/overview/msteams-client)
- [Teams Tabs Guide](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/what-are-tabs)
- [Teams SSO Guide](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/tab-sso-overview)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/entra/identity-platform/)

### Tools
- [JWT Decoder](https://jwt.ms) - Decode and inspect JWT tokens
- [GUID Generator](https://www.guidgenerator.com/) - Generate app IDs
- [ngrok](https://ngrok.com/) - Expose local server for testing

## 📝 Summary

### What You Have Now

✅ **Frontend:**
- React app with Teams SDK integration
- SSO authentication
- Theme support
- Direct API calls to backend

✅ **Backend (To Do):**
- Token validation middleware
- New API endpoints for tabs
- CORS configuration
- User authentication

✅ **Teams App:**
- Manifest template
- Setup instructions
- Deployment guide

### Next Steps

1. **Complete Backend Migration:**
   - Follow [PYTHON_BACKEND_MIGRATION.md](./PYTHON_BACKEND_MIGRATION.md)
   - Implement token validation
   - Create new API routes
   - Test authentication

2. **Deploy to Production:**
   - Deploy React frontend
   - Deploy Python backend
   - Update manifest with production URLs
   - Upload to Teams

3. **Test End-to-End:**
   - Verify authentication
   - Test message flow
   - Check theme changes
   - Validate session persistence

4. **Go Live:**
   - Publish to Teams App Store (optional)
   - Or distribute via your organization

## 🎉 Conclusion

Your application is now ready to work as a Microsoft Teams Tab! The migration removes the dependency on Azure Bot Framework and provides a more direct, efficient communication path between your React frontend and Python backend.

If you encounter any issues, refer to the troubleshooting section or consult the Microsoft Teams documentation.

Good luck! 🚀
