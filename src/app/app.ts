import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  Injector,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { IndexedDBStorageService } from './services/indexdb.service';
import { NgxUiLoaderModule, NgxUiLoaderService } from 'ngx-ui-loader';
import { FastLoaderComponent } from './components/fast-loader/fast-loader.component';
import { InitialLoadService } from './services/initial-load.service';
import { PushNotificationService } from './notification/services/push-notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NgxUiLoaderModule, FastLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('wild-valley-food');
  isBrowser: boolean;
  indexDBStorageService: IndexedDBStorageService | undefined;
  /**
   * Tracks how the in-flight navigation was triggered so we only force
   * scroll-to-top for forward/imperative navigations and let Angular's
   * scrollPositionRestoration handle browser back/forward (popstate).
   */
  private lastNavigationTrigger: 'imperative' | 'popstate' | 'hashchange' =
    'imperative';

  constructor(
    private injector: Injector,
    @Inject(PLATFORM_ID) private platformId: Object,
    ngxLoader: NgxUiLoaderService,
    _initialLoad: InitialLoadService,
    private router: Router,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      ngxLoader.stopAll();
      this.indexDBStorageService = this.injector.get(IndexedDBStorageService);
      this.setupScrollToTop();
      this.setupPushNotifications();
      this.setupServiceWorkerUpdates();
    }
  }

  /**
   * Auto-apply new deployments. The Angular service worker (ngsw) caches the
   * app shell and keeps serving the previously cached bundle until an update
   * is explicitly activated. Without this, users stay on a stale build after
   * every deploy. When a new version is ready we activate it and reload so the
   * latest code takes effect on the next navigation/refresh.
   */
  private setupServiceWorkerUpdates(): void {
    let swUpdate: SwUpdate;
    try {
      swUpdate = this.injector.get(SwUpdate);
    } catch {
      return;
    }
    if (!swUpdate.isEnabled) return;

    swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        swUpdate.activateUpdate().then(() => {
          // A fresh bundle is installed; reload once to run it.
          document.location.reload();
        });
      });

    // Proactively check for updates shortly after load and periodically after,
    // so long-lived tabs also pick up new deployments.
    swUpdate.checkForUpdate().catch(() => {});
    setInterval(() => swUpdate.checkForUpdate().catch(() => {}), 60 * 60 * 1000);
  }

  /**
   * Browser-only FCM bootstrap:
   *  - initialize Firebase messaging + service worker,
   *  - request permission and register the device token,
   *  - route to the deep-link when a notification is clicked (foreground via
   *    onMessage, and background/closed via a service-worker postMessage).
   * Deferred slightly so it never blocks first paint.
   */
  private setupPushNotifications(): void {
    const pushService = this.injector.get(PushNotificationService);

    // Navigate when the FCM service worker reports a notification click.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
        const data = event.data;
        if (data && data.type === 'NOTIFICATION_CLICK' && data.url) {
          this.navigateToDeepLink(data.url);
        }
      });
    }

    // Show foreground messages as a notification so clicking them routes the
    // same way as background notifications (unified via the service worker).
    pushService.foregroundMessage$.subscribe((payload) => {
      this.handleForegroundMessage(pushService, payload);
    });

    // Request notification permission on the first user interaction. Browsers
    // (especially on mobile) suppress permission prompts that aren't triggered
    // by a user gesture, so a bare timer often never shows the prompt. We only
    // do this once and only when permission hasn't been decided yet.
    const askForPermission = () => {
      pushService.requestPermissionAndRegister().catch(() => {
        /* permission denied or unsupported - non-fatal */
      });
    };

    if (pushService.isPermissionGranted()) {
      // Already granted before: just (re)register the token silently.
      askForPermission();
      return;
    }

    if (pushService.isPermissionDenied()) {
      return; // Can't re-prompt once denied; user must reset it in the browser.
    }

    const onFirstInteraction = () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      askForPermission();
    };
    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    window.addEventListener('touchstart', onFirstInteraction, { once: true });
  }

  private handleForegroundMessage(
    pushService: PushNotificationService,
    payload: any,
  ): void {
    try {
      const title = payload?.notification?.title || payload?.data?.title || 'Wild Valley Foods';
      const body = payload?.notification?.body || payload?.data?.body || '';
      const data = payload?.data || {};

      if (this.isBrowser && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: '/assets/icons/icon-192x192.png',
            data,
          } as NotificationOptions);
        });
      }
    } catch {
      /* non-fatal */
    }
  }

  /**
   * Navigate within the SPA to a notification's target. Falls back to a hard
   * navigation for absolute/off-origin URLs.
   */
  private navigateToDeepLink(url: string): void {
    if (!url) return;
    if (/^https?:\/\//i.test(url)) {
      try {
        const parsed = new URL(url);
        if (parsed.origin === window.location.origin) {
          this.router.navigateByUrl(parsed.pathname + parsed.search + parsed.hash);
          return;
        }
      } catch {
        /* fall through to hard navigation */
      }
      window.location.href = url;
      return;
    }
    this.router.navigateByUrl(url);
  }

  /**
   * Centralized, SSR-safe scroll-to-top on route change.
   * Runs only in the browser and only for forward/imperative navigations,
   * which reliably fixes reused-component param-only navigations
   * (e.g. clicking a related product on the product details page) where
   * scrollPositionRestoration alone keeps the previous scroll offset.
   */
  private setupScrollToTop(): void {
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart || event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.lastNavigationTrigger = event.navigationTrigger ?? 'imperative';
          return;
        }
        if (event instanceof NavigationEnd) {
          if (this.lastNavigationTrigger === 'popstate') {
            return;
          }
          this.scrollWindowToTop();
        }
      });
  }

  private scrollWindowToTop(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}
