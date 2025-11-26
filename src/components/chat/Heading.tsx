import type * as React from "react";
import { cn } from "@/lib/utils";

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

const headingStyles: Record<number, string> = {
  1: "text-2xl font-bold tracking-tight mt-6 mb-3",
  2: "text-xl font-semibold tracking-tight mt-5 mb-2.5",
  3: "text-lg font-semibold mt-4 mb-2",
  4: "text-base font-semibold mt-3 mb-1.5",
  5: "text-sm font-semibold mt-2 mb-1",
  6: "text-sm font-medium mt-2 mb-1 text-muted-foreground",
};

export function Heading({ level, children, className }: HeadingProps) {
  const classes = cn(
    "text-foreground first:mt-0",
    headingStyles[level],
    className,
  );

  switch (level) {
    case 1:
      return <h1 className={classes}>{children}</h1>;
    case 2:
      return <h2 className={classes}>{children}</h2>;
    case 3:
      return <h3 className={classes}>{children}</h3>;
    case 4:
      return <h4 className={classes}>{children}</h4>;
    case 5:
      return <h5 className={classes}>{children}</h5>;
    case 6:
      return <h6 className={classes}>{children}</h6>;
    default:
      return <p className={classes}>{children}</p>;
  }
}
