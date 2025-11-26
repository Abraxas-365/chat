"use client";
import { cn } from "@/lib/utils";

interface MarkdownTableProps {
  lines: string[];
  className?: string;
}

function parseTableRow(row: string): string[] {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function isAlignmentRow(row: string): boolean {
  const cells = parseTableRow(row);
  return cells.every((cell) => /^:?-+:?$/.test(cell));
}

function getAlignment(cell: string): "left" | "center" | "right" {
  if (cell.startsWith(":") && cell.endsWith(":")) return "center";
  if (cell.endsWith(":")) return "right";
  return "left";
}

export function MarkdownTable({ lines, className }: MarkdownTableProps) {
  if (lines.length < 2) return null;

  const headerRow = parseTableRow(lines[0]);
  const alignmentRow = lines[1];
  const alignments = isAlignmentRow(alignmentRow)
    ? parseTableRow(alignmentRow).map(getAlignment)
    : headerRow.map(() => "left" as const);

  const bodyRows = lines.slice(2).map(parseTableRow);

  return (
    <div
      className={cn(
        "my-4 overflow-x-auto rounded-lg border border-border",
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headerRow.map((cell, idx) => (
              <th
                key={idx}
                className={cn(
                  "px-4 py-3 text-left font-semibold text-foreground",
                  alignments[idx] === "center" && "text-center",
                  alignments[idx] === "right" && "text-right",
                )}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={cn(
                "border-b border-border last:border-0 transition-colors",
                "hover:bg-muted/30",
              )}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={cn(
                    "px-4 py-3 text-foreground",
                    alignments[cellIdx] === "center" && "text-center",
                    alignments[cellIdx] === "right" && "text-right",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
