"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Heading } from "./Heading";
import { MarkdownTable } from "./MarkdownTable";
import { CodeBlock } from "./CodeBlock";

interface MarkdownProps {
  content: string;
  className?: string;
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={keyIdx++}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold + Italic (***text***)
    const boldItalicMatch = remaining.match(/^\*\*\*([^*]+)\*\*\*/);
    if (boldItalicMatch) {
      parts.push(
        <strong key={keyIdx++} className="font-bold">
          <em>{boldItalicMatch[1]}</em>
        </strong>,
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold (**text**)
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(
        <strong key={keyIdx++} className="font-semibold">
          {boldMatch[1]}
        </strong>,
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic (*text*)
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(<em key={keyIdx++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Strikethrough (~~text~~)
    const strikeMatch = remaining.match(/^~~([^~]+)~~/);
    if (strikeMatch) {
      parts.push(
        <del key={keyIdx++} className="text-muted-foreground line-through">
          {strikeMatch[1]}
        </del>,
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]$$([^)]+)$$/);
    if (linkMatch) {
      parts.push(
        <a
          key={keyIdx++}
          href={linkMatch[2]}
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Image ![alt](url)
    const imageMatch = remaining.match(/^!\[([^\]]*)\]$$([^)]+)$$/);
    if (imageMatch) {
      parts.push(
        <img
          key={keyIdx++}
          src={imageMatch[2] || "/placeholder.svg"}
          alt={imageMatch[1]}
          className="my-2 max-w-full rounded-lg"
        />,
      );
      remaining = remaining.slice(imageMatch[0].length);
      continue;
    }

    // Plain text (consume until next special character or end)
    const plainMatch = remaining.match(/^[^`*~[\]!]+/);
    if (plainMatch) {
      parts.push(plainMatch[0]);
      remaining = remaining.slice(plainMatch[0].length);
      continue;
    }

    // Fallback: consume one character
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return parts;
}

export function Markdown({ content, className }: MarkdownProps) {
  const elements = React.useMemo(() => {
    const lines = content.split("\n");
    const result: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code block
      if (line.startsWith("```")) {
        const language = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        result.push(
          <CodeBlock
            key={`code-${i}`}
            language={language}
            code={codeLines.join("\n")}
          />,
        );
        i++;
        continue;
      }

      // Table
      if (line.includes("|") && lines[i + 1]?.match(/^\|?\s*:?-+:?\s*\|/)) {
        const tableLines: string[] = [line];
        i++;
        while (i < lines.length && lines[i].includes("|")) {
          tableLines.push(lines[i]);
          i++;
        }
        result.push(<MarkdownTable key={`table-${i}`} lines={tableLines} />);
        continue;
      }

      // Heading
      if (line.startsWith("#")) {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
          const text = match[2];
          result.push(
            <Heading key={`h-${i}`} level={level}>
              {parseInline(text)}
            </Heading>,
          );
          i++;
          continue;
        }
      }

      // Horizontal rule
      if (line.match(/^[-*_]{3,}$/)) {
        result.push(<hr key={`hr-${i}`} className="my-6 border-border" />);
        i++;
        continue;
      }

      // Unordered list
      if (line.match(/^[-*+]\s/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^[-*+]\s/)) {
          listItems.push(lines[i].replace(/^[-*+]\s/, ""));
          i++;
        }
        result.push(
          <ul key={`ul-${i}`} className="my-3 ml-6 list-disc space-y-1.5">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-foreground leading-relaxed">
                {parseInline(item)}
              </li>
            ))}
          </ul>,
        );
        continue;
      }

      // Ordered list
      if (line.match(/^\d+\.\s/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
          listItems.push(lines[i].replace(/^\d+\.\s/, ""));
          i++;
        }
        result.push(
          <ol key={`ol-${i}`} className="my-3 ml-6 list-decimal space-y-1.5">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-foreground leading-relaxed">
                {parseInline(item)}
              </li>
            ))}
          </ol>,
        );
        continue;
      }

      // Blockquote
      if (line.startsWith(">")) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith(">")) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        result.push(
          <blockquote
            key={`quote-${i}`}
            className="my-3 border-l-4 border-primary/30 pl-4 italic text-muted-foreground"
          >
            {quoteLines.map((l, idx) => (
              <p key={idx} className="leading-relaxed">
                {parseInline(l)}
              </p>
            ))}
          </blockquote>,
        );
        continue;
      }

      // Task list item
      if (line.match(/^[-*+]\s\[[ x]\]\s/)) {
        const taskItems: { checked: boolean; text: string }[] = [];
        while (i < lines.length && lines[i].match(/^[-*+]\s\[[ x]\]\s/)) {
          const match = lines[i].match(/^[-*+]\s\[([ x])\]\s(.+)$/);
          if (match) {
            taskItems.push({
              checked: match[1] === "x",
              text: match[2],
            });
          }
          i++;
        }
        result.push(
          <ul key={`task-${i}`} className="my-3 space-y-2">
            {taskItems.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  readOnly
                  className="h-4 w-4 rounded border-border"
                />
                <span
                  className={cn(
                    "text-foreground",
                    item.checked && "line-through text-muted-foreground",
                  )}
                >
                  {parseInline(item.text)}
                </span>
              </li>
            ))}
          </ul>,
        );
        continue;
      }

      // Empty line
      if (line.trim() === "") {
        i++;
        continue;
      }

      // Paragraph
      result.push(
        <p
          key={`p-${i}`}
          className="my-2 text-sm leading-relaxed text-foreground"
        >
          {parseInline(line)}
        </p>,
      );
      i++;
    }

    return result;
  }, [content]);

  return (
    <div
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
    >
      {elements}
    </div>
  );
}
