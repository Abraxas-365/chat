import { useState, useEffect } from "react";
import * as microsoftTeams from "@microsoft/teams-js";

export type TeamsTheme = "default" | "dark" | "contrast";

export function useTeamsTheme() {
  const [theme, setTheme] = useState<TeamsTheme>("default");

  useEffect(() => {
    // Get initial theme from context
    microsoftTeams.app
      .getContext()
      .then((context) => {
        const initialTheme = (context.app.theme || "default") as TeamsTheme;
        setTheme(initialTheme);
      })
      .catch((error) => {
        console.error("Error getting initial theme:", error);
      });

    // Register handler for theme changes
    const themeChangeHandler = (newTheme: string) => {
      setTheme(newTheme as TeamsTheme);
    };

    microsoftTeams.app.registerOnThemeChangeHandler(themeChangeHandler);

    // Cleanup: TeamsJS 2.x automatically replaces handlers
    return () => {
      // No explicit cleanup needed
    };
  }, []);

  return theme;
}
