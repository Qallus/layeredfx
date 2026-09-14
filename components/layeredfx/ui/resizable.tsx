"use client";

import * as React from 'react';
import {Group, Panel, Separator} from 'react-resizable-panels';
import {GripVertical} from 'lucide-react';

export const ResizablePanelGroup = Group;
export const ResizablePanel = Panel;

export function ResizableHandle({withHandle, className = '', ...props}: React.ComponentProps<typeof Separator> & {withHandle?: boolean}) {
  return <Separator className={`lfx-resizable-handle ${className}`} {...props}>
    {withHandle && <span><GripVertical size={14} aria-hidden="true"/></span>}
  </Separator>;
}
