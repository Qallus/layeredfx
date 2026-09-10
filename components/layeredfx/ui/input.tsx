import * as React from "react";
import { cn } from "@/lib/layeredfx/utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn("lfx-input", className)} {...props} />);
Input.displayName = "Input";
