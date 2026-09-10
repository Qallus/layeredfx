"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
export const Sheet = Primitive.Root;
export const SheetTrigger = Primitive.Trigger;
export const SheetClose = Primitive.Close;
export const SheetTitle = Primitive.Title;
export const SheetDescription = Primitive.Description;
export function SheetContent({ children }: { children: React.ReactNode }) {
  return <Primitive.Portal><div data-lfx-overlay="" className="lfx">
    <Primitive.Overlay className="lfx-dialog-overlay" />
    <Primitive.Content className="lfx-sheet-content">
      {children}
      <Primitive.Close className="lfx-close" aria-label="Close menu"><X size={24} /></Primitive.Close>
    </Primitive.Content>
  </div></Primitive.Portal>;
}
