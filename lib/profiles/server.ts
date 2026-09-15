import 'server-only';
import {configured, mode, readState} from '@/lib/operations/server';
import {publicProfiles, type PublicProfileGroup} from './public';

/**
 * Public About page directory, read on the server so dashboard-only profiles never reach the browser.
 * The local demo keeps its data in the browser, so it has nothing to publish. If the live store cannot be
 * read, the page renders without the directory and the failure is logged server-side.
 */
export async function aboutProfiles(): Promise<PublicProfileGroup[]> {
  if (mode() === 'demo' || !configured()) return [];
  try {
    return publicProfiles(await readState());
  } catch (error) {
    console.error('About page profiles could not be loaded:', error instanceof Error ? error.message : 'unknown error');
    return [];
  }
}
