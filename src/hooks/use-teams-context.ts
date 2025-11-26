import { useEffect, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";

export interface TeamsContext {
  initialized: boolean;
  context: microsoftTeams.app.Context | null;
  theme: string;
  userObjectId: string | null;
  userPrincipalName: string | null;
  teamId: string | null;
  channelId: string | null;
  chatId: string | null;
  locale: string | null;
  error: string | null;
}

export function useTeamsContext() {
  const [teamsContext, setTeamsContext] = useState<TeamsContext>({
    initialized: false,
    context: null,
    theme: "default",
    userObjectId: null,
    userPrincipalName: null,
    teamId: null,
    channelId: null,
    chatId: null,
    locale: null,
    error: null,
  });

  useEffect(() => {
    async function initTeams() {
      try {
        // Initialize Teams SDK
        await microsoftTeams.app.initialize();

        // Get context
        const context = await microsoftTeams.app.getContext();

        // Register theme change handler
        microsoftTeams.app.registerOnThemeChangeHandler((theme) => {
          setTeamsContext((prev) => ({
            ...prev,
            theme: theme,
          }));
        });

        setTeamsContext({
          initialized: true,
          context,
          theme: context.app.theme || "default",
          userObjectId: context.user?.id || null,
          userPrincipalName: context.user?.userPrincipalName || null,
          teamId: context.team?.internalId || null,
          channelId: context.channel?.id || null,
          chatId: context.chat?.id || null,
          locale: context.app.locale || null,
          error: null,
        });

        // Notify Teams that app is ready
        microsoftTeams.app.notifySuccess();
      } catch (error) {
        console.error("Teams initialization error:", error);
        setTeamsContext((prev) => ({
          ...prev,
          initialized: true,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    }

    initTeams();
  }, []);

  return teamsContext;
}
