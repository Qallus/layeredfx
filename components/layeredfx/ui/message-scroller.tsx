"use client";

import type {ComponentProps} from 'react';
import {MessageScroller as Primitive} from '@shadcn/react/message-scroller';
import './message-scroller.css';

export const MessageScrollerProvider = Primitive.Provider;
export const MessageScrollerItem = Primitive.Item;
export function MessageScroller({className='', ...props}: ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root className={`lfx-message-scroller ${className}`} {...props}/>;
}
export function MessageScrollerViewport({className='', ...props}: ComponentProps<typeof Primitive.Viewport>) {
  return <Primitive.Viewport className={`lfx-message-viewport ${className}`} {...props}/>;
}
export function MessageScrollerContent({className='', ...props}: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Content className={`lfx-message-content ${className}`} {...props}/>;
}
export function MessageScrollerButton({children='Jump to latest',className='',...props}: ComponentProps<typeof Primitive.Button>) {
  return <Primitive.Button className={`lfx-message-jump ${className}`} {...props}>{children}</Primitive.Button>;
}
