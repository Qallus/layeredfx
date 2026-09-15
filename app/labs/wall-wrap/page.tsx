import type {Metadata} from 'next';
import {WallWrapTest} from '@/components/labs/wall-wrap-test';

// Internal test page for the photorealistic wall-wrap animation; kept out of search results.
export const metadata: Metadata = {title: 'Wall wrap test | LayeredFX', robots: {index: false, follow: false}};

export default function Page() {
  return <WallWrapTest/>;
}
