"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Service } from "@/lib/layeredfx/content";
import { Button, type ButtonProps } from "./ui/button";
import { EstimateDialog } from "./estimate-dialog";
type Context = { openEstimate: (service?: Service, finish?: string) => void };
const EstimateContext = createContext<Context | null>(null);
export function useEstimate() {
  const value = useContext(EstimateContext);
  if (!value) throw new Error("Estimate components must be inside EstimateProvider.");
  return value;
}
export function EstimateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<{ service?: Service; finish?: string; key: number }>({ key: 0 });
  function openEstimate(service?: Service, finish?: string) {
    setSeed(current => ({ service, finish, key: current.key + 1 }));
    setOpen(true);
  }
  return <EstimateContext.Provider value={{ openEstimate }}>{children}
    <EstimateDialog key={seed.key} open={open} onOpenChange={setOpen} service={seed.service} finish={seed.finish} />
  </EstimateContext.Provider>;
}
export function EstimateTrigger({ service, children, ...props }: ButtonProps & { service?: Service }) {
  const { openEstimate } = useEstimate();
  return <Button onClick={() => openEstimate(service)} {...props}>{children}</Button>;
}
