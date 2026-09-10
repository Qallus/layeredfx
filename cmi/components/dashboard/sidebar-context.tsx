// Adapted from CMI 23320abb158e26f0945c2f1ce2f513f02649aa70: components/dashboard/sidebar-context.tsx
"use client";

import * as React from "react";

// Shares the main sidebar's collapsed state with deeper client components (the
// job sub-nav), so the job menu can flip between horizontal (sidebar expanded)
// and vertical (sidebar collapsed).
export const SidebarContext = React.createContext<{ collapsed: boolean }>({ collapsed: false });

export function useSidebar() {
  return React.useContext(SidebarContext);
}
