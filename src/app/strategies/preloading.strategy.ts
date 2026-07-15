/**
 * Custom Preloading Strategy
 * Preloads critical routes immediately and lazy routes after app loads
 */

import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  
  // Routes to preload immediately
  private criticalRoutes = ['shop', 'product', 'cart'];
  
  // Routes to preload after delay (lower priority)
  private delayedRoutes = ['blog', 'about', 'contact'];

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Always preload critical routes immediately
    if (route.data?.['preload'] === true || this.isCriticalRoute(route.path)) {
      console.log(`🚀 Preloading critical route: ${route.path}`);
      return load();
    }
    
    // Preload delayed routes after 3 seconds
    if (this.isDelayedRoute(route.path)) {
      return timer(3000).pipe(
        mergeMap(() => {
          console.log(`⏱️ Preloading delayed route: ${route.path}`);
          return load();
        })
      );
    }
    
    // Don't preload other routes
    return of(null);
  }

  private isCriticalRoute(path: string | undefined): boolean {
    if (!path) return false;
    return this.criticalRoutes.some(critical => path.includes(critical));
  }

  private isDelayedRoute(path: string | undefined): boolean {
    if (!path) return false;
    return this.delayedRoutes.some(delayed => path.includes(delayed));
  }
}
