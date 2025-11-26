import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface ChatWindowProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  onClear?: () => void;
  showClearButton?: boolean;
  className?: string;
  messagesContainerClassName?: string;
  inputContainerClassName?: string;
  maxH: string;
}

export function ChatWindow({
  children,
  header,
  onClear,
  showClearButton = true,
  className,
  messagesContainerClassName,
  inputContainerClassName,
  maxH,
}: ChatWindowProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [messagesContent, inputContent] = React.Children.toArray(children);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messagesContent, scrollToBottom]);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-background",
        className,
      )}
    >
      {/* Header */}
      {(header || showClearButton) && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex-1">{header}</div>
          {showClearButton && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear chat</span>
            </Button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className={cn(maxH)}>
        <div
          className={cn(
            "flex flex-col px-4 py-4 md:px-6",
            messagesContainerClassName,
          )}
        >
          {messagesContent}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div
        className={cn(
          "border-t border-border bg-background p-4",
          inputContainerClassName,
        )}
      >
        {inputContent}
      </div>
    </div>
  );
}

// Compound components for flexibility
export interface ChatMessagesProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatMessages({ children, className }: ChatMessagesProps) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}

export interface ChatInputContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatInputContainer({
  children,
  className,
}: ChatInputContainerProps) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

// Empty state component
export interface ChatEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ChatEmptyState({
  title = "Start a conversation",
  description = "Send a message to begin",
  icon,
  className,
}: ChatEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
