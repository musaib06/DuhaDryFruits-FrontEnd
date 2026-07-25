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
import { AppConstants } from '../app-constants';
import { CustomerDetailSM } from './models/service-models/app/v1/customer-detail-s-m';
import { NgxUiLoaderModule, NgxUiLoaderService } from 'ngx-ui-loader';
import { FastLoaderComponent } from './components/fast-loader/fast-loader.component';
import { InitialLoadService } from './services/initial-load.service';
import { PushNotificationService } from './notification/services/push-notification.service';
import { CommonService } from './services/common.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NgxUiLoaderModule, FastLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('duha-dryfruits');
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
    const commonService = this.injector.get(CommonService);
    let permissionInFlight = false;
    let modalShown = false;
    const dismissKey = 'duha_notif_prompt_dismissed';

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
        const data = event.data;
        if (data && data.type === 'NOTIFICATION_CLICK' && data.url) {
          this.navigateToDeepLink(data.url);
        }
      });
    }

    pushService.foregroundMessage$.subscribe((payload) => {
      this.handleForegroundMessage(pushService, payload);
    });

    if (!pushService.isSupported()) {
      return;
    }

    const isDismissedThisSession = (): boolean => {
      try {
        return sessionStorage.getItem(dismissKey) === '1';
      } catch {
        return false;
      }
    };

    const markDismissedThisSession = (): void => {
      try {
        sessionStorage.setItem(dismissKey, '1');
      } catch {
        /* ignore */
      }
    };

    const registerIfGranted = async (): Promise<void> => {
      if (!pushService.isPermissionGranted()) return;
      const customerId = await this.getSavedCustomerId();
      await pushService.requestPermissionAndRegister(customerId ?? undefined).catch(() => {});
    };

    const showEnableModal = async (): Promise<void> => {
      if (permissionInFlight || modalShown || !pushService.needsPermissionPrompt()) return;
      if (isDismissedThisSession()) return;

      modalShown = true;
      const result = await commonService.showSweetAlertConfirmation({
        title: 'Enable notifications?',
        html:
          'Stay updated on <strong>offers</strong>, <strong>new arrivals</strong>, and your <strong>orders</strong>.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Allow notifications',
        cancelButtonText: 'Not now',
        reverseButtons: true,
        allowOutsideClick: false,
      });

      if (!result.isConfirmed) {
        markDismissedThisSession();
        return;
      }

      permissionInFlight = true;
      try {
        const customerId = await this.getSavedCustomerId();
        const token = await pushService.requestPermissionAndRegister(customerId ?? undefined);
        if (token) {
          await commonService.showSweetAlertToast({
            title: 'Notifications enabled',
            text: "You'll receive updates and offers.",
            icon: 'success',
          });
          removeInteractionListeners();
        } else if (pushService.isPermissionDenied()) {
          await commonService.showSweetAlert({
            title: 'Notifications blocked',
            text: 'You can enable them later in your browser or device settings.',
            icon: 'info',
            confirmButtonText: 'OK',
          });
          removeInteractionListeners();
        }
      } finally {
        permissionInFlight = false;
      }
    };

    const promptIfNeeded = async (): Promise<void> => {
      if (pushService.isPermissionGranted()) {
        await registerIfGranted();
        removeInteractionListeners();
        return;
      }
      if (pushService.isPermissionDenied()) {
        removeInteractionListeners();
        return;
      }
      await showEnableModal();
    };

    const onUserInteraction = (): void => {
      void promptIfNeeded();
    };

    const removeInteractionListeners = (): void => {
      window.removeEventListener('pointerdown', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
    };

    void registerIfGranted();

    if (pushService.isPermissionGranted() || pushService.isPermissionDenied()) {
      return;
    }

    // Ask on all devices shortly after the page loads.
    setTimeout(() => {
      void promptIfNeeded();
    }, 2500);

    // Mobile/tablet: browsers require a user gesture — keep listening until decided.
    window.addEventListener('pointerdown', onUserInteraction, { passive: true });
    window.addEventListener('keydown', onUserInteraction);
    window.addEventListener('touchstart', onUserInteraction, { passive: true });
    window.addEventListener('scroll', onUserInteraction, { passive: true });
  }

  private handleForegroundMessage(
    pushService: PushNotificationService,
    payload: any,
  ): void {
    try {
      const title = payload?.notification?.title || payload?.data?.title || 'Duha Dryfruits';
      const body = payload?.notification?.body || payload?.data?.body || '';
      const data = payload?.data || {};

      if (this.isBrowser && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: '/icons/icon-192x192.png',
            data: {
              ...data,
              url: data.url || data.click_action || '/',
            },
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

  private async getSavedCustomerId(): Promise<number | null> {
    if (!this.isBrowser || !this.indexDBStorageService) return null;
    try {
      const saved: CustomerDetailSM[] =
        (await this.indexDBStorageService.getFromStorage(
          AppConstants.DbKeys.SAVED_CUSTOMER_DETAILS
        )) || [];
      const latest = saved[saved.length - 1];
      return latest?.id != null ? Number(latest.id) : null;
    } catch {
      return null;
    }
  }
}
