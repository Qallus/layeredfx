// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: components/ui/textarea.tsx
import { cn } from "@/ctrlp/lib/utils";
import * as React from "react";
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (<textarea className={cn("flex min-h-[88px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props}/>));
Textarea.displayName = "Textarea";
export { Textarea };
