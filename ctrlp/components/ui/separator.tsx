// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: components/ui/separator.tsx
import { cn } from "@/ctrlp/lib/utils";
import * as React from "react";
function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("h-px w-full bg-border", className)} {...props}/>;
}
export { Separator };
