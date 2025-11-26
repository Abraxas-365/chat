# Teams App Manifest

This directory contains the Microsoft Teams app manifest and required assets for deploying your app as a Teams Tab.

## Files Required

1. **manifest.json** - The app manifest (already created)
2. **color.png** - Color icon (192x192 pixels)
3. **outline.png** - Outline icon (32x32 pixels, transparent background)

## Setup Instructions

### 1. Update manifest.json

Replace the following placeholders in `manifest.json`:

- `YOUR-APP-ID-GUID` - Generate a new GUID for your app (use https://www.guidgenerator.com/)
- `YOUR-AZURE-AD-APP-ID` - Your Azure AD App Registration client ID
- `your-react-app-url.com` - Your deployed React app URL (e.g., your-app.azurestaticapps.net)
- `your-backend.run.app` - Your Python backend URL
- Company information (name, URLs, etc.)

### 2. Create Icons

Create two icon files:

**color.png**
- Size: 192x192 pixels
- Format: PNG with transparent background
- Content: Your app logo in color

**outline.png**
- Size: 32x32 pixels
- Format: PNG with transparent background
- Content: Simple outline version of your logo (white on transparent)

Place both files in this directory.

### 3. Create App Package

Once you have all files ready, create a ZIP file:

```bash
cd teams-manifest
zip -r app-package.zip manifest.json color.png outline.png
```

### 4. Upload to Teams

1. Go to Microsoft Teams
2. Click on "Apps" in the left sidebar
3. Click "Manage your apps" (bottom left)
4. Click "Upload an app"
5. Select "Upload a custom app"
6. Choose your `app-package.zip` file

### 5. Azure AD App Registration

Before your app can use SSO, you need to configure Azure AD:

1. Go to https://portal.azure.com
2. Navigate to "Azure Active Directory" → "App registrations"
3. Create a new registration or use existing one
4. Under "Authentication":
   - Add platform: Single-page application
   - Add redirect URI: `https://your-react-app-url.com/auth-end`
   - Enable implicit grant: ID tokens
5. Under "Expose an API":
   - Set Application ID URI: `api://your-react-app-url.com/{client-id}`
   - Add scope: `access_as_user` (Admin and users consent)
6. Under "API permissions":
   - Add Microsoft Graph permissions: `User.Read`, `openid`, `profile`
7. Copy the Client ID and use it in the manifest

### 6. Environment Variables

Update your frontend `.env.local`:

```
VITE_API_URL=https://your-backend.run.app/api/v1/invoke
```

Update your backend environment variables:

```
AZURE_CLIENT_ID=your-azure-ad-app-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret
```

## Testing

### Local Testing

For local development, use ngrok to expose your local server:

```bash
# Terminal 1 - Run your React app
npm run dev

# Terminal 2 - Expose with ngrok
ngrok http 5173

# Update manifest.json with the ngrok URL
# Create new app package and upload to Teams
```

### Production Deployment

1. Deploy your React app to a hosting service:
   - Azure Static Web Apps
   - Vercel
   - Netlify
   - GitHub Pages

2. Deploy your Python backend to:
   - Google Cloud Run
   - Azure App Service
   - AWS Lambda

3. Update manifest.json with production URLs
4. Create app package and upload to Teams
5. Test all functionality

## Troubleshooting

### SSO Not Working

- Verify Azure AD app registration is correct
- Check that redirect URIs match
- Ensure Application ID URI is correct: `api://domain.com/{client-id}`
- Verify API permissions are granted

### Tab Not Loading

- Check CORS settings in your backend
- Verify valid domains in manifest
- Check browser console for errors
- Ensure HTTPS is used (required for Teams)

### Theme Not Applying

- Verify Teams SDK is initialized before getting context
- Check that theme change handler is registered
- Test with different Teams themes (Settings → Appearance)

## Additional Resources

- [Teams Manifest Schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Teams Tab Documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/what-are-tabs)
- [Teams SSO Guide](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/tab-sso-overview)
