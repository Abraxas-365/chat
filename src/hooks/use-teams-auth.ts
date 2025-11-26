import { useState, useCallback, useEffect } from "react";
import * as microsoftTeams from "@microsoft/teams-js";

export interface UseTeamsAuthReturn {
  token: string | null;
  error: string | null;
  loading: boolean;
  getAuthToken: () => Promise<string>;
}

export function useTeamsAuth(): UseTeamsAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAuthToken = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      // Get SSO token from Teams
      const authToken = await microsoftTeams.authentication.getAuthToken();
      setToken(authToken);
      return authToken;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get auth token";
      setError(errorMessage);
      console.error("Error getting auth token:", errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatically get token on mount
  useEffect(() => {
    getAuthToken().catch((err) => {
      console.error("Auto auth token retrieval failed:", err);
    });
  }, [getAuthToken]);

  return { token, error, loading, getAuthToken };
}
