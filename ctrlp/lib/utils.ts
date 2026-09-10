// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: lib/utils.ts
import { clsx,type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
