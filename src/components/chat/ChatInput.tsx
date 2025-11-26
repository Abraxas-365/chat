import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AtSign,
  Paperclip,
  ChevronDown,
  Globe,
  ArrowUp,
  Sparkles,
  Zap,
  Brain,
} from "lucide-react";
import type { ChatOptions } from "@/hooks/use-chat";

// Types
export interface ChatInputProps {
  onSubmit?: (message: string, options: ChatOptions) => void;
  onAttachmentClick?: () => void;
  onContextClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
}

export type { ChatOptions };

interface ModeOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface SourceOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

// Default options
const defaultModes: ModeOption[] = [
  { value: "auto", label: "Auto", icon: <Sparkles className="h-4 w-4" /> },
  { value: "fast", label: "Fast", icon: <Zap className="h-4 w-4" /> },
  { value: "quality", label: "Quality", icon: <Brain className="h-4 w-4" /> },
];

const defaultSources: SourceOption[] = [
  { value: "all", label: "All Sources", icon: <Globe className="h-4 w-4" /> },
  { value: "web", label: "Web Only", icon: <Globe className="h-4 w-4" /> },
  { value: "docs", label: "Documents", icon: <Globe className="h-4 w-4" /> },
];

export function ChatInput({
  onSubmit,
  onAttachmentClick,
  onContextClick,
  placeholder = "Ask, search, or make anything...",
  disabled = false,
  className,
  maxLength = 4000,
}: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const [mode, setMode] = React.useState(defaultModes[0]);
  const [source, setSource] = React.useState(defaultSources[0]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSubmit = React.useCallback(() => {
    if (!value.trim() || disabled) return;
    onSubmit?.(value.trim(), { mode: mode.value, source: source.value });
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSubmit, mode.value, source.value]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const canSubmit = value.trim().length > 0 && !disabled;

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors",
        "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        className,
      )}
    >
      {/* Context Button */}
      <div className="mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onContextClick}
          disabled={disabled}
          className="h-8 gap-1.5 rounded-full border-muted-foreground/30 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground bg-transparent"
        >
          <AtSign className="h-4 w-4" />
          <span className="text-sm">Add context</span>
        </Button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={1}
        className={cn(
          "w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground",
          "focus:outline-none",
          "min-h-6 max-h-[200px] text-base leading-relaxed",
          "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
        )}
        aria-label="Chat message input"
      />

      {/* Bottom Toolbar */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAttachmentClick}
            disabled={disabled}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Add attachment"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-9 gap-1 px-2 text-muted-foreground hover:text-foreground"
              >
                {mode.icon}
                <span className="text-sm">{mode.label}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {defaultModes.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setMode(option)}
                  className="gap-2"
                >
                  {option.icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-9 gap-1 px-2 text-muted-foreground hover:text-foreground"
              >
                {source.icon}
                <span className="text-sm">{source.label}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {defaultSources.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSource(option)}
                  className="gap-2"
                >
                  {option.icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Submit Button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "h-10 w-10 rounded-full transition-all",
            canSubmit
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "bg-muted text-muted-foreground",
          )}
          aria-label="Send message"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
