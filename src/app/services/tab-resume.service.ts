import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type TabResumeTeardown = () => void;

/**
 * Debounced visibility + offline-aware resume hook for end-user pages.
 * First request after sleep often fails; global GET retry plus a light refetch on focus helps.
 */
@Injectable({ providedIn: 'root' })
export class TabResumeService {
  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly ngZone: NgZone,
  ) {}

  subscribe(callback: () => void | Promise<void>, debounceMs = 1500): TabResumeTeardown {
    if (!isPlatformBrowser(this.platformId)) {
      return () => {};
    }

    let visibilityTimer: ReturnType<typeof setTimeout> | null = null;
    let onlineHandler: (() => void) | null = null;

    const clearVisibilityTimer = () => {
      if (visibilityTimer !== null) {
        clearTimeout(visibilityTimer);
        visibilityTimer = null;
      }
    };

    const run = () => {
      // visibility/setTimeout can leave follow-up work outside the Angular zone on some browsers;
      // ensure change detection runs after async loads complete.
      this.ngZone.run(() => {
        void Promise.resolve(callback()).catch(() => {});
      });
    };

    const tryRunOrWaitOnline = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (!onlineHandler) {
          onlineHandler = () => {
            window.removeEventListener('online', onlineHandler!);
            onlineHandler = null;
            tryRunOrWaitOnline();
          };
          window.addEventListener('online', onlineHandler, { once: true });
        }
        return;
      }
      if (onlineHandler) {
        window.removeEventListener('online', onlineHandler);
        onlineHandler = null;
      }
      run();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      clearVisibilityTimer();
      visibilityTimer = setTimeout(() => {
        visibilityTimer = null;
        tryRunOrWaitOnline();
      }, debounceMs);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearVisibilityTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (onlineHandler) {
        window.removeEventListener('online', onlineHandler);
        onlineHandler = null;
      }
    };
  }
}
