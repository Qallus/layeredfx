import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/layeredfx/utils";
const buttonVariants = cva(
  "lfx-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  { variants: {
    variant: { default: "lfx-button-primary", outline: "lfx-button-outline", ghost: "lfx-button-ghost", light: "lfx-button-light" },
    size: { default: "lfx-button-default", sm: "lfx-button-sm", lg: "lfx-button-lg", icon: "lfx-button-icon" },
  }, defaultVariants: { variant: "default", size: "default" } },
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} type={asChild ? undefined : (type || "button")} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  },
);
Button.displayName = "Button";
export { buttonVariants };
