import * as React from "react";
import { cn } from "@/lib/utils";

function ScrollArea({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      {...props}
    />
  );
}

export { ScrollArea };
