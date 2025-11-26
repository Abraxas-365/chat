import * as React from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  isLoading?: boolean;
}

export interface UseChatOptions {
  initialMessages?: Message[];
  onSubmit?: (
    message: string,
    options: ChatOptions,
  ) => Promise<string> | string;
  onError?: (error: Error) => void;
}

export interface ChatOptions {
  mode: string;
  source: string;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string, options: ChatOptions) => Promise<void>;
  clearMessages: () => void;
  removeMessage: (id: string) => void;
  editMessage: (id: string, content: string) => void;
  regenerateMessage: (id: string, options: ChatOptions) => Promise<void>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat({
  initialMessages = [],
  onSubmit,
  onError,
}: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const sendMessage = React.useCallback(
    async (content: string, options: ChatOptions) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      };

      const assistantMessageId = generateId();
      const loadingMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setIsLoading(true);
      setError(null);

      try {
        let response: string;

        if (onSubmit) {
          response = await onSubmit(content.trim(), options);
        } else {
          // Default mock response for demo purposes
          await new Promise((resolve) => setTimeout(resolve, 1000));
          response = `This is a sample response to: "${content.trim()}"\n\n**Mode:** ${options.mode}\n**Source:** ${options.source}\n\n---\n\n## Features\n\n- Markdown support\n- Tables\n- Code blocks\n\n\`\`\`typescript\nconst greeting = "Hello, World!";\nconsole.log(greeting);\n\`\`\`\n\n| Feature | Status |\n|---------|--------|\n| Tables | Supported |\n| Lists | Supported |\n| Code | Supported |`;
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: response, isLoading: false }
              : msg,
          ),
        );
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("An error occurred");
        setError(error);
        onError?.(error);
        // Remove the loading message on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, onSubmit, onError],
  );

  const clearMessages = React.useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const removeMessage = React.useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const editMessage = React.useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content } : msg)),
    );
  }, []);

  const regenerateMessage = React.useCallback(
    async (id: string, options: ChatOptions) => {
      const messageIndex = messages.findIndex((msg) => msg.id === id);
      if (messageIndex === -1) return;

      // Find the previous user message
      const previousUserMessage = messages
        .slice(0, messageIndex)
        .reverse()
        .find((msg) => msg.role === "user");

      if (!previousUserMessage) return;

      // Remove messages from the assistant message onwards
      setMessages((prev) => prev.slice(0, messageIndex));

      // Resend the user message
      await sendMessage(previousUserMessage.content, options);
    },
    [messages, sendMessage],
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    removeMessage,
    editMessage,
    regenerateMessage,
  };
}
