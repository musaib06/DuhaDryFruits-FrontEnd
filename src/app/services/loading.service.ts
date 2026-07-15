/**
 * Optimized Loading Service
 * Fast loading state management with instant feedback
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingTextSubject = new BehaviorSubject<string>('');

  // Public observables
  public readonly isLoading$: Observable<boolean> = this.loadingSubject
    .asObservable()
    .pipe(distinctUntilChanged());
  
  public readonly loadingText$: Observable<string> = this.loadingTextSubject
    .asObservable();

  /**
   * Show loading immediately
   */
  show(text: string = ''): void {
    this.loadingCount++;
    this.loadingTextSubject.next(text);
    this.loadingSubject.next(true);
  }

  /**
   * Hide loading (only when all loading operations complete)
   */
  hide(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this.loadingSubject.next(false);
      this.loadingTextSubject.next('');
    }
  }

  /**
   * Force hide all loading states (use for error handling)
   */
  forceHide(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
    this.loadingTextSubject.next('');
  }

  /**
   * Check if currently loading
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Execute function with automatic loading state
   */
  async withLoading<T>(
    operation: () => Promise<T>,
    loadingText: string = ''
  ): Promise<T> {
    this.show(loadingText);
    try {
      const result = await operation();
      return result;
    } finally {
      this.hide();
    }
  }
}
