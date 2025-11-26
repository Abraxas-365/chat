import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
  dotClassName?: string;
}

export function LoadingDots({ className, dotClassName }: LoadingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce",
          dotClassName,
        )}
        style={{ animationDelay: "0ms", animationDuration: "600ms" }}
      />
      <span
        className={cn(
          "h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce",
          dotClassName,
        )}
        style={{ animationDelay: "150ms", animationDuration: "600ms" }}
      />
      <span
        className={cn(
          "h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce",
          dotClassName,
        )}
        style={{ animationDelay: "300ms", animationDuration: "600ms" }}
      />
    </div>
  );
}
