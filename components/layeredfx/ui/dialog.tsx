"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/layeredfx/utils";
export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export const DialogContent = React.forwardRef<React.ElementRef<typeof Primitive.Content>, React.ComponentPropsWithoutRef<typeof Primitive.Content>>(
  ({ className, children, ...props }, ref) => <Primitive.Portal>
    <div data-lfx-overlay="" className="lfx">
      <Primitive.Overlay className="lfx-dialog-overlay" />
      <Primitive.Content ref={ref} className={cn("lfx-dialog-content", className)} {...props}>
        {children}
        <Primitive.Close className="lfx-close" aria-label="Close dialog"><X size={21} /><span className="sr-only">Close</span></Primitive.Close>
      </Primitive.Content>
    </div>
  </Primitive.Portal>,
);
DialogContent.displayName = "DialogContent";
export const DialogTitle = React.forwardRef<React.ElementRef<typeof Primitive.Title>, React.ComponentPropsWithoutRef<typeof Primitive.Title>>(({ className, ...props }, ref) => <Primitive.Title ref={ref} className={cn("lfx-dialog-title", className)} {...props} />);
DialogTitle.displayName = "DialogTitle";
export const DialogDescription = React.forwardRef<React.ElementRef<typeof Primitive.Description>, React.ComponentPropsWithoutRef<typeof Primitive.Description>>(({ className, ...props }, ref) => <Primitive.Description ref={ref} className={cn("lfx-dialog-description", className)} {...props} />);
DialogDescription.displayName = "DialogDescription";
