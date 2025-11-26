import { useChat, type ChatOptions } from "@/hooks/use-chat";
import { useTeamsContext } from "@/hooks/use-teams-context";
import { useTeamsAuth } from "@/hooks/use-teams-auth";
import { useTeamsTheme } from "@/hooks/use-teams-theme";
import { MessageSquare, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import {
  ChatEmptyState,
  ChatInputContainer,
  ChatMessages,
  ChatWindow,
} from "./components/chat/ChatWindow";
import { MessageCard } from "./components/chat/MessageCard";
import { ChatInput } from "./components/chat/ChatInput";
import { Alert, AlertDescription } from "./components/ui/alert";

export default function App() {
  const teamsContext = useTeamsContext();
  const teamsAuth = useTeamsAuth();
  const theme = useTeamsTheme();

  // Get backend URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;

  // Determine session ID from Teams context
  const sessionId =
    teamsContext.chatId ||
    teamsContext.channelId ||
    teamsContext.teamId ||
    "default-session";

  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    removeMessage,
    regenerateMessage,
  } = useChat({
    apiUrl,
    authToken: teamsAuth.token,
    userId: teamsContext.userObjectId || undefined,
    sessionId,
  });

  const handleSubmit = (message: string, options: ChatOptions) => {
    sendMessage(message, {
      ...options,
      userId: teamsContext.userObjectId || undefined,
      sessionId,
    });
  };

  const handleRegenerate = (id: string) => {
    regenerateMessage(id, {
      mode: "auto",
      source: "all",
      userId: teamsContext.userObjectId || undefined,
      sessionId,
    });
  };

  // Apply Teams theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Show loading while Teams initializes
  if (!teamsContext.initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Teams App...</p>
        </div>
      </div>
    );
  }

  // Show error if Teams initialization failed
  if (teamsContext.error) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to initialize Teams: {teamsContext.error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show auth error if authentication failed
  if (teamsAuth.error) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Authentication failed: {teamsAuth.error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-background p-4">
      <ChatWindow
        maxH="flex-1"
        onClear={clearMessages}
        showClearButton={messages.length > 0}
        header={
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              AI Assistant
            </h1>
            <p className="text-xs text-muted-foreground">
              {teamsContext.userPrincipalName || "Guest User"}
            </p>
          </div>
        }
      >
        <ChatMessages>
          {messages.length === 0 ? (
            <ChatEmptyState
              title="Welcome to AI Assistant"
              description="Ask questions and I'll help you find information. You can search documents, get answers, and more."
              icon={<MessageSquare className="h-8 w-8" />}
            />
          ) : (
            messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onRegenerate={handleRegenerate}
                onDelete={removeMessage}
              />
            ))
          )}
        </ChatMessages>
        <ChatInputContainer>
          <ChatInput
            onSubmit={handleSubmit}
            disabled={isLoading}
            placeholder="Ask a question..."
          />
        </ChatInputContainer>
      </ChatWindow>
    </main>
  );
}
