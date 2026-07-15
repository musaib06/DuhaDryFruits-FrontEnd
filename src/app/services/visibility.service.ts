/**
 * Visibility Service
 * Handles tab visibility changes and data refresh when user returns
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ProductCacheService } from './product-cache.service';

@Injectable({
  providedIn: 'root'
})
export class VisibilityService implements OnDestroy {
  private visibilitySubject = new Subject<boolean>();
  private lastVisibleTime: number = Date.now();
  
  // Observable for visibility changes
  public readonly visibilityChange$: Observable<boolean> = this.visibilitySubject.asObservable();

  constructor(private productCache: ProductCacheService) {
    // Listen for visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Connection restored');
        this.visibilitySubject.next(true);
      });
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }

  private handleVisibilityChange(): void {
    const isVisible = document.visibilityState === 'visible';
    
    if (isVisible) {
      const timeAway = Date.now() - this.lastVisibleTime;
      console.log(`👁️ Tab became visible after ${Math.round(timeAway / 1000)}s`);
      
      // If user was away for more than 5 minutes, clear cache to get fresh data
      if (timeAway > 5 * 60 * 1000) {
        console.log('⏰ User away for >5min, clearing cache for fresh data');
        this.productCache.invalidateProducts();
      }
      
      this.visibilitySubject.next(true);
    } else {
      this.lastVisibleTime = Date.now();
      this.visibilitySubject.next(false);
    }
  }

  /**
   * Check if tab is currently visible
   */
  isVisible(): boolean {
    return typeof document !== 'undefined' && document.visibilityState === 'visible';
  }

  /**
   * Refresh data when user returns
   */
  shouldRefreshData(): boolean {
    const timeAway = Date.now() - this.lastVisibleTime;
    return timeAway > 5 * 60 * 1000; // Refresh if away > 5 minutes
  }
}
