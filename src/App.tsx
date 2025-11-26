import { useChat, type ChatOptions } from "@/hooks/use-chat";
import { MessageSquare } from "lucide-react";
import {
  ChatEmptyState,
  ChatInputContainer,
  ChatMessages,
  ChatWindow,
} from "./components/chat/ChatWindow";
import { MessageCard } from "./components/chat/MessageCard";
import { ChatInput } from "./components/chat/ChatInput";

export default function App() {
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    removeMessage,
    regenerateMessage,
  } = useChat();

  const handleSubmit = (message: string, options: ChatOptions) => {
    sendMessage(message, options);
  };

  const handleRegenerate = (id: string) => {
    regenerateMessage(id, { mode: "auto", source: "all" });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <ChatWindow
        maxH="h-[600px]"
        onClear={clearMessages}
        showClearButton={messages.length > 0}
        header={
          <h1 className="text-lg font-semibold text-foreground">Chat Demo</h1>
        }
      >
        <ChatMessages>
          {messages.length === 0 ? (
            <ChatEmptyState
              title="Welcome to Chat"
              description="Send a message to start the conversation. The AI will respond with markdown-formatted content."
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
            placeholder="Ask, search, or make anything..."
          />
        </ChatInputContainer>
      </ChatWindow>
    </main>
  );
}
