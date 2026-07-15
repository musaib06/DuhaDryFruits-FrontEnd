/**
 * Fast Loader Component
 * Shows instant loading progress at top of page
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { LoadingService } from '../../services/loading.service';
import { InitialLoadService } from '../../services/initial-load.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fast-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading) {
      <div class="fast-loader">
        <div class="progress-bar" [style.width.%]="progress"></div>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      pointer-events: none;
    }

    .fast-loader {
      width: 100%;
      height: 3px;
      background: transparent;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FFD700 0%, #FFC107 50%, #FFD700 100%);
      background-size: 200% 100%;
      animation: shimmer 1s ease-in-out infinite, progress 0.3s ease-out;
      transition: width 0.2s ease-out;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @keyframes progress {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 90%; }
    }
  `]
})
export class FastLoaderComponent implements OnInit, OnDestroy {
  isLoading = false;
  progress = 0;
  private subscriptions: Subscription[] = [];
  /** SSR already painted the first route — skip the top bar on initial hydration. */
  private skipInitialNavigation = true;

  constructor(
    private router: Router,
    private loadingService: LoadingService,
    private initialLoad: InitialLoadService,
  ) {}

  ngOnInit(): void {
    // Listen to router navigation events
    const routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.skipInitialNavigation || this.initialLoad.isHydrating()) {
          this.skipInitialNavigation = false;
          return;
        }
        this.startLoading();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.completeLoading();
      }
    });

    // Listen to loading service
    const loadingSub = this.loadingService.isLoading$.subscribe(loading => {
      if (this.initialLoad.isHydrating()) {
        return;
      }
      if (loading && !this.isLoading) {
        this.startLoading();
      } else if (!loading && this.isLoading) {
        this.completeLoading();
      }
    });

    this.subscriptions.push(routerSub, loadingSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private startLoading(): void {
    this.isLoading = true;
    this.progress = 0;
    
    // Simulate fast progress
    setTimeout(() => this.progress = 50, 50);
    setTimeout(() => this.progress = 75, 200);
    setTimeout(() => this.progress = 90, 400);
  }

  private completeLoading(): void {
    this.progress = 100;
    
    // Hide after a brief moment at 100%
    setTimeout(() => {
      this.isLoading = false;
      this.progress = 0;
    }, 200);
  }
}
