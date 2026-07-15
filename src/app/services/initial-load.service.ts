import { ApplicationRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { first } from 'rxjs/operators';

/**
 * True while the browser is hydrating SSR HTML — suppress global loaders and duplicate fetches.
 */
@Injectable({ providedIn: 'root' })
export class InitialLoadService {
  private readonly platformId = inject(PLATFORM_ID);
  private hydrating = isPlatformBrowser(this.platformId);

  constructor() {
    if (!this.hydrating) {
      return;
    }
    const appRef = inject(ApplicationRef);
    appRef.isStable.pipe(first((stable) => stable)).subscribe(() => {
      // Brief grace after stability so child components finish applying transfer state.
      setTimeout(() => {
        this.hydrating = false;
      }, 800);
    });
  }

  isHydrating(): boolean {
    return this.hydrating;
  }
}
