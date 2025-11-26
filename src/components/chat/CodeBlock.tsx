import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

// Simple syntax highlighting patterns
const tokenize = (code: string, language: string): React.ReactNode[] => {
  if (!language || language === "text" || language === "plaintext") {
    return [code];
  }

  const tokens: React.ReactNode[] = [];
  let remaining = code;
  let keyIdx = 0;

  const patterns: { regex: RegExp; className: string }[] = [
    // Comments
    {
      regex: /^(\/\/.*|#.*|--.*)/m,
      className: "text-muted-foreground/70 italic",
    },
    {
      regex: /^(\/\*[\s\S]*?\*\/)/m,
      className: "text-muted-foreground/70 italic",
    },
    // Strings
    { regex: /^("[^"]*"|'[^']*'|`[^`]*`)/m, className: "text-emerald-400" },
    // Keywords
    {
      regex:
        /^(const|let|var|function|return|if|else|for|while|class|interface|type|import|export|from|default|async|await|try|catch|throw|new|this|extends|implements|public|private|protected|static|readonly|enum|namespace|module|declare|abstract|as|is|in|of|typeof|instanceof|void|null|undefined|true|false)\b/,
      className: "text-violet-400 font-medium",
    },
    // Types (for TypeScript)
    {
      regex:
        /^(string|number|boolean|object|any|unknown|never|void|null|undefined|Array|Promise|Record|Partial|Required|Pick|Omit|Exclude|Extract|React|ReactNode)\b/,
      className: "text-cyan-400",
    },
    // Functions/methods
    {
      regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/,
      className: "text-amber-400",
    },
    // Numbers
    { regex: /^(\d+\.?\d*)/m, className: "text-orange-400" },
    // Operators
    { regex: /^([+\-*/%=<>!&|^~?:]+)/m, className: "text-rose-400" },
    // Brackets
    { regex: /^([[\]{}()])/m, className: "text-foreground/80" },
    // Properties (after dot)
    { regex: /^\.([a-zA-Z_$][a-zA-Z0-9_$]*)/, className: "text-blue-400" },
    // Variables/identifiers
    { regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)/m, className: "text-foreground" },
    // Whitespace
    { regex: /^(\s+)/m, className: "" },
    // Punctuation
    { regex: /^([,;.])/m, className: "text-muted-foreground" },
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const { regex, className } of patterns) {
      const match = remaining.match(regex);
      if (match) {
        const text = match[0];
        if (className) {
          tokens.push(
            <span key={keyIdx++} className={className}>
              {text}
            </span>,
          );
        } else {
          tokens.push(text);
        }
        remaining = remaining.slice(text.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return tokens;
};

export function CodeBlock({
  code,
  language = "",
  showLineNumbers = true,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const lines = code.split("\n");

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const displayLanguage = language || "code";

  return (
    <div
      className={cn(
        "group relative my-3 overflow-hidden rounded-lg border border-border bg-[#0d1117]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-[#161b22] px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {displayLanguage}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono">
            {lines.map((line, lineIdx) => (
              <div key={lineIdx} className="flex">
                {showLineNumbers && (
                  <span className="mr-4 inline-block w-8 shrink-0 text-right text-muted-foreground/50 select-none">
                    {lineIdx + 1}
                  </span>
                )}
                <span className="flex-1">{tokenize(line, language)}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
