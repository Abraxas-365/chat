# Fix Azure AD Authentication Error (AADSTS500011)

## Problem
Error: `AADSTS500011 - The resource principal named api://teams-embed.vercel.app/8f932a37-a7f6-4fe8-be5e-a72ab69758cf was not found in the tenant`

## Solution: Create/Configure Azure AD App Registration

### Step 1: Access Azure Portal

1. Go to https://portal.azure.com
2. Sign in with your **L&S Consulting S.A.C.** tenant credentials
3. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)

### Step 2: Create New App Registration

1. Go to **App registrations**
2. Click **+ New registration**
3. Configure:
   - **Name**: `AI Assistant Teams Tab`
   - **Supported account types**: `Accounts in this organizational directory only (L&S Consulting S.A.C. only - Single tenant)`
   - **Redirect URI**: Leave blank for now
4. Click **Register**

### Step 3: Note the Application (Client) ID

After creation, you'll see:
- **Application (client) ID**: Copy this (e.g., `8f932a37-a7f6-4fe8-be5e-a72ab69758cf`)
- **Directory (tenant) ID**: Copy this as well

### Step 4: Configure Authentication

1. In your app registration, go to **Authentication**
2. Click **+ Add a platform**
3. Select **Single-page application (SPA)**
4. Add **Redirect URIs**:
   ```
   https://teams-embed.vercel.app/auth-end
   https://teams-embed.vercel.app/auth-start
   ```
5. Under **Implicit grant and hybrid flows**, check:
   - ✅ **ID tokens (used for implicit and hybrid flows)**
6. Click **Save**

### Step 5: Expose an API (CRITICAL STEP)

This is where the `api://` URI is configured:

1. Go to **Expose an API** in the left menu
2. Click **+ Add** next to **Application ID URI**
3. Set the Application ID URI to **EXACTLY**:
   ```
   api://teams-embed.vercel.app/8f932a37-a7f6-4fe8-be5e-a72ab69758cf
   ```
   **Important**: Replace `8f932a37-a7f6-4fe8-be5e-a72ab69758cf` with YOUR actual Client ID from Step 3
4. Click **Save**

5. Click **+ Add a scope**:
   - **Scope name**: `access_as_user`
   - **Who can consent**: `Admins and users`
   - **Admin consent display name**: `Access AI Assistant`
   - **Admin consent description**: `Allows Teams to access the AI Assistant on behalf of the user`
   - **User consent display name**: `Access AI Assistant`
   - **User consent description**: `Allow AI Assistant to access your information`
   - **State**: `Enabled`
6. Click **Add scope**

### Step 6: Add API Permissions

1. Go to **API permissions** in the left menu
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
   - ✅ `User.Read`
6. Click **Add permissions**

7. **Grant admin consent** (if you're an admin):
   - Click **Grant admin consent for L&S Consulting S.A.C.**
   - Click **Yes** to confirm

### Step 7: Update Teams Manifest

Update your `teams-manifest/manifest.json`:

```json
{
  "webApplicationInfo": {
    "id": "8f932a37-a7f6-4fe8-be5e-a72ab69758cf",
    "resource": "api://teams-embed.vercel.app/8f932a37-a7f6-4fe8-be5e-a72ab69758cf"
  }
}
```

**Replace with your actual values:**
- `id`: Your Application (Client) ID from Step 3
- `resource`: `api://YOUR-DEPLOYED-URL/YOUR-CLIENT-ID`

### Step 8: Rebuild and Redeploy

```bash
# Update manifest
cd teams-manifest
# Edit manifest.json with correct values

# Create new app package
zip -r app-package.zip manifest.json color.png outline.png

# Upload to Teams
# 1. Open Teams → Apps
# 2. Manage your apps
# 3. Remove old app (if exists)
# 4. Upload new app-package.zip
```

---

## Option 2: Disable SSO (Quick Fix)

If you don't need Single Sign-On authentication, you can disable it:

### Remove webApplicationInfo from manifest

Edit `teams-manifest/manifest.json` and **remove** the entire `webApplicationInfo` section:

```json
{
  // ... other config ...
  "validDomains": [
    "teams-embed.vercel.app",
    "your-backend.run.app"
  ]
  // REMOVE this entire section:
  // "webApplicationInfo": { ... }
}
```

### Update your React app to handle missing auth

The app will need to work without authentication tokens. Update `src/hooks/use-teams-auth.ts`:

```typescript
// Make authentication optional
useEffect(() => {
  getAuthToken().catch((err) => {
    console.warn("Auth not configured, continuing without SSO:", err);
    // Don't throw error, just log warning
  });
}, [getAuthToken]);
```

---

## Verification

After fixing, test the authentication:

```javascript
// Open Teams tab
// Press F12 to open browser console
// Run:
microsoftTeams.authentication.getAuthToken()
  .then(token => {
    console.log('✅ Token received:', token);
    // Decode at https://jwt.ms to verify
  })
  .catch(err => {
    console.error('❌ Auth failed:', err);
  });
```

---

## Common Mistakes to Avoid

1. ❌ **Wrong Application ID URI format**
   - Correct: `api://teams-embed.vercel.app/CLIENT-ID`
   - Wrong: `api://CLIENT-ID` (missing domain)
   - Wrong: `https://teams-embed.vercel.app/CLIENT-ID` (https instead of api)

2. ❌ **Using placeholder values**
   - Make sure to replace ALL placeholder GUIDs

3. ❌ **Wrong tenant**
   - Ensure you're creating the app in the correct Azure AD tenant

4. ❌ **Missing admin consent**
   - Some permissions require admin consent

5. ❌ **Mismatched domains**
   - Domain in `resource` must match your deployment URL
   - Must be in `validDomains` list

---

## Need Help?

If you're still seeing errors:

1. **Check the exact error in browser console** (F12)
2. **Verify Application ID URI** in Azure AD matches manifest
3. **Ensure admin consent** is granted
4. **Check tenant ID** matches where app is registered
5. **Try removing and re-adding** the Teams app

For more details, see: https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/tab-sso-overview
