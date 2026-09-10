"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-slider";
export const Slider = React.forwardRef<React.ElementRef<typeof Primitive.Root>, React.ComponentPropsWithoutRef<typeof Primitive.Root> & { label: string }>(({ label, ...props }, ref) => <Primitive.Root ref={ref} className="lfx-slider" {...props}><Primitive.Track className="lfx-slider-track"><Primitive.Range className="lfx-slider-range" /></Primitive.Track><Primitive.Thumb className="lfx-slider-thumb" aria-label={label} /></Primitive.Root>);
Slider.displayName = "Slider";
