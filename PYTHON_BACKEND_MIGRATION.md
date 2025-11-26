# Python Backend Migration Guide - Azure Bot to Teams Tabs

This guide explains how to update your Python backend to work with Teams Tabs instead of Azure Bot Framework.

## Overview

The React frontend will now call your Python backend directly via REST API instead of going through Azure Bot Framework. The backend needs to:

1. Accept direct HTTP requests from the React tab
2. Validate Teams SSO tokens for authentication
3. Handle CORS for Teams domains
4. Provide response data in JSON format

## Required Changes

### 1. Install Required Dependencies

Add these to your `requirements.txt`:

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
PyJWT==2.8.0
cryptography==41.0.7
python-jose[cryptography]==3.3.0
msal==1.26.0
requests==2.31.0
```

Then install:

```bash
pip install -r requirements.txt
```

### 2. Update CORS Configuration

In your FastAPI `main.py`, update CORS to allow Teams domains:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS for Teams
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://teams.microsoft.com",
        "https://*.teams.microsoft.com",
        "https://*.teams.office.com",
        "https://outlook.office.com",
        "https://*.outlook.office.com",
        "https://your-react-app-url.com",  # Your deployed frontend URL
        "http://localhost:5173",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Create Token Validation Middleware

Create a new file `src/middleware/teams_auth.py`:

```python
"""Teams SSO Token Validation Middleware"""

import os
import logging
from typing import Optional
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Microsoft identity platform configuration
TENANT_ID = os.getenv("AZURE_TENANT_ID")
CLIENT_ID = os.getenv("AZURE_CLIENT_ID")
JWKS_URI = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"


async def validate_teams_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    Validate JWT token from Teams SSO.

    Args:
        credentials: HTTP Authorization header credentials

    Returns:
        dict: Decoded token payload containing user information

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    try:
        # Get signing keys from Microsoft
        jwks_client = PyJWKClient(JWKS_URI)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode and validate token
        decoded_token = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=CLIENT_ID,  # Your app's client ID
            issuer=f"https://login.microsoftonline.com/{TENANT_ID}/v2.0"
        )

        logger.info(f"✅ Token validated for user: {decoded_token.get('preferred_username')}")

        return decoded_token

    except jwt.ExpiredSignatureError:
        logger.error("❌ Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"❌ Invalid token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Token validation error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def get_user_from_token(token_data: dict) -> dict:
    """
    Extract user information from decoded token.

    Args:
        token_data: Decoded JWT token

    Returns:
        dict: User information
    """
    return {
        "user_id": token_data.get("oid"),  # Azure AD Object ID
        "name": token_data.get("name"),
        "email": token_data.get("preferred_username"),
        "tenant_id": token_data.get("tid"),
    }
```

### 4. Create New API Routes for Teams Tabs

Create a new file `src/application/api/tabs_routes.py`:

```python
"""API routes for Microsoft Teams Tabs"""

import os
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from src.middleware.teams_auth import validate_teams_token, get_user_from_token
# Import your existing services
# from src.application.di import get_container
# from src.services.agent_service import AgentService

logger = logging.getLogger(__name__)
router = APIRouter()


class TabMessageRequest(BaseModel):
    """Request from Teams Tab"""
    prompt: str
    agent_name: Optional[str] = "search_assistant"
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    mode: Optional[str] = "auto"
    source: Optional[str] = "all"


class TabMessageResponse(BaseModel):
    """Response to Teams Tab"""
    response: str
    agent_name: str
    session_id: Optional[str] = None
    metadata: Optional[dict] = None


@router.post("/api/v1/invoke", response_model=TabMessageResponse)
async def process_tab_message(
    request: TabMessageRequest,
    token_data: dict = Depends(validate_teams_token)
):
    """
    Process message from Teams Tab.

    This endpoint receives messages from the React frontend,
    validates authentication, and routes to the appropriate agent.
    """
    try:
        # Extract user information from token
        user_info = get_user_from_token(token_data)
        user_object_id = user_info["user_id"]
        user_name = user_info["name"]
        user_email = user_info["email"]

        logger.info(f"📨 Tab message from {user_name} ({user_email})")
        logger.info(f"   Prompt: {request.prompt[:100]}...")
        logger.info(f"   Agent: {request.agent_name}")
        logger.info(f"   Session: {request.session_id}")

        # TODO: Replace with your actual agent service logic
        # Example integration with existing agent service:

        # container = get_container()
        # agent_service = await container.get_agent_service()

        # result = await agent_service.process_message(
        #     user_message=request.prompt,
        #     user_id=user_object_id,
        #     session_id=request.session_id,
        #     agent_name=request.agent_name,
        # )

        # For now, return a simple response
        response_text = f"Received your message: {request.prompt}\n\nUser: {user_name}\nAgent: {request.agent_name}"

        return TabMessageResponse(
            response=response_text,
            agent_name=request.agent_name,
            session_id=request.session_id,
            metadata={
                "user_id": user_object_id,
                "user_name": user_name,
                "mode": request.mode,
                "source": request.source,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing tab message: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )


@router.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Teams Tab Backend",
        "version": "1.0.0",
        "features": {
            "sso_auth": True,
            "teams_integration": True,
        }
    }


@router.get("/api/v1/user/profile")
async def get_user_profile(token_data: dict = Depends(validate_teams_token)):
    """
    Get authenticated user's profile information.

    This endpoint demonstrates accessing user info from the validated token.
    """
    user_info = get_user_from_token(token_data)
    return user_info
```

### 5. Update main.py to Include Tab Routes

In your `src/main.py`, add the new router:

```python
from fastapi import FastAPI
from src.application.api.tabs_routes import router as tabs_router

app = FastAPI(
    title="AI Assistant API",
    description="Backend API for Teams Tab AI Assistant",
    version="1.0.0"
)

# Include the tabs router
app.include_router(tabs_router, tags=["teams-tabs"])

# Your existing routes...
```

### 6. Environment Variables

Update your environment configuration with these variables:

```bash
# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id-guid
AZURE_CLIENT_ID=your-azure-app-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Optional: For On-Behalf-Of (OBO) flow to call Microsoft Graph
GRAPH_API_SCOPE=https://graph.microsoft.com/.default
```

### 7. Optional: Microsoft Graph Integration (OBO Flow)

If you need to call Microsoft Graph API on behalf of the user:

Create `src/services/graph_service.py`:

```python
"""Microsoft Graph API Service using On-Behalf-Of Flow"""

import os
import logging
import msal
import requests
from typing import Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

TENANT_ID = os.getenv("AZURE_TENANT_ID")
CLIENT_ID = os.getenv("AZURE_CLIENT_ID")
CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET")


async def get_graph_token(user_assertion: str) -> str:
    """
    Exchange Teams SSO token for Microsoft Graph token using OBO flow.

    Args:
        user_assertion: The Teams SSO token

    Returns:
        str: Microsoft Graph access token
    """
    authority = f"https://login.microsoftonline.com/{TENANT_ID}"

    # Create confidential client
    app = msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=authority,
        client_credential=CLIENT_SECRET
    )

    # Acquire token on behalf of user
    result = app.acquire_token_on_behalf_of(
        user_assertion=user_assertion,
        scopes=["https://graph.microsoft.com/.default"]
    )

    if "access_token" in result:
        logger.info("✅ Successfully acquired Graph token via OBO")
        return result["access_token"]
    else:
        error_msg = result.get("error_description", "Unknown error")
        logger.error(f"❌ Failed to acquire Graph token: {error_msg}")
        raise HTTPException(
            status_code=401,
            detail=f"Failed to acquire Graph token: {error_msg}"
        )


async def get_user_profile_from_graph(graph_token: str) -> dict:
    """
    Get user profile from Microsoft Graph.

    Args:
        graph_token: Microsoft Graph access token

    Returns:
        dict: User profile information
    """
    headers = {"Authorization": f"Bearer {graph_token}"}
    response = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers=headers
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Failed to fetch user profile from Graph API"
        )

    return response.json()


# Example usage in your route:
# @router.get("/api/v1/graph/me")
# async def get_graph_user(token_data: dict = Depends(validate_teams_token)):
#     # Get the original token (you'll need to store this)
#     original_token = token_data.get("raw_token")
#
#     # Exchange for Graph token
#     graph_token = await get_graph_token(original_token)
#
#     # Get user profile
#     profile = await get_user_profile_from_graph(graph_token)
#     return profile
```

## Integration with Existing Agent Service

If you already have an agent service (like the TeamsAgentIntegration mentioned in your prompt), integrate it like this:

```python
@router.post("/api/v1/invoke", response_model=TabMessageResponse)
async def process_tab_message(
    request: TabMessageRequest,
    token_data: dict = Depends(validate_teams_token)
):
    user_info = get_user_from_token(token_data)

    # Get your existing services
    container = get_container()
    agent_service = await container.get_agent_service()
    group_mapping_repo = await container.init_group_mapping_repository()

    # Initialize Teams integration (your existing class)
    teams_integration = TeamsAgentIntegration(
        agent_service,
        group_mapping_repo
    )

    # Process message using existing logic
    result = await teams_integration.process_message(
        user_message=request.prompt,
        aad_user_id=user_info["user_id"],
        user_name=user_info["name"],
        session_id=request.session_id,
        from_data={"aadObjectId": user_info["user_id"]}
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Failed to process message")
        )

    return TabMessageResponse(
        response=result["response"],
        agent_name=result.get("agent_name", "Unknown"),
        session_id=result.get("session_id"),
        metadata={
            "agent_area": result.get("agent_area", "general"),
            "user_id": user_info["user_id"],
        }
    )
```

## Testing

### Local Testing

1. Start your FastAPI server:
```bash
uvicorn src.main:app --reload --port 8000
```

2. Test the health endpoint:
```bash
curl http://localhost:8000/api/v1/health
```

3. Test with a sample token (use Postman or similar):
```bash
curl -X POST http://localhost:8000/api/v1/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEAMS_TOKEN" \
  -d '{
    "prompt": "Hello, how are you?",
    "agent_name": "search_assistant"
  }'
```

### Testing Token Validation

To test token validation locally, you can:

1. Deploy your React app with ngrok
2. Upload to Teams as a test app
3. Get a real Teams token from the browser console
4. Use that token to test your backend

## Deployment

### Google Cloud Run (Example)

```bash
# Build and deploy
gcloud run deploy ai-assistant-backend \
  --source . \
  --platform managed \
  --region us-east4 \
  --allow-unauthenticated \
  --set-env-vars AZURE_TENANT_ID=xxx,AZURE_CLIENT_ID=xxx,AZURE_CLIENT_SECRET=xxx
```

### Azure App Service (Example)

```bash
# Deploy to Azure
az webapp up \
  --name ai-assistant-backend \
  --resource-group your-rg \
  --runtime "PYTHON:3.11" \
  --sku B1
```

## Key Differences: Bot Framework vs. Tabs

| Aspect | Bot Framework (Old) | Teams Tabs (New) |
|--------|---------------------|------------------|
| **Communication** | Activity-based messaging | Direct REST API calls |
| **Authentication** | Bot token exchange | Teams SSO with JWT validation |
| **Request Format** | Bot Framework Activity objects | Simple JSON requests |
| **Response Format** | Activity with attachments | JSON response |
| **Endpoints** | `/api/messages` | `/api/v1/invoke` (or custom) |
| **User Context** | From Activity object | From JWT token claims |
| **Session Management** | Conversation ID | Custom session ID |

## Troubleshooting

### CORS Errors

- Ensure all Teams domains are in `allow_origins`
- Verify `allow_credentials=True` is set
- Check that headers include `Authorization`

### Token Validation Fails

- Verify `AZURE_TENANT_ID` and `AZURE_CLIENT_ID` are correct
- Check that token audience matches your client ID
- Ensure token hasn't expired (Teams tokens expire after 1 hour)
- Verify JWKS endpoint is accessible

### 401 Unauthorized Errors

- Check that Authorization header is being sent
- Verify token format is `Bearer <token>`
- Ensure Azure AD app has correct API permissions
- Check that token is being acquired correctly in frontend

### 500 Server Errors

- Check backend logs for detailed error messages
- Verify all environment variables are set
- Ensure dependencies are installed correctly
- Check that your agent service is initialized properly

## Next Steps

1. ✅ Update CORS configuration
2. ✅ Add token validation middleware
3. ✅ Create tabs routes
4. ✅ Update main.py
5. ✅ Set environment variables
6. ✅ Test locally
7. ✅ Deploy to production
8. ✅ Update Teams manifest with backend URL
9. ✅ Test end-to-end in Teams

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/entra/identity-platform/)
- [JWT Token Validation](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens)
- [MSAL Python Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-python)
