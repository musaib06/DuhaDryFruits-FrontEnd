/**
 * Push Notification Service
 * Firebase Cloud Messaging (FCM) integration for the browser.
 *
 * Responsibilities:
 *  - Lazily load the Firebase compat SDK (browser only, SSR-safe).
 *  - Register the FCM service worker.
 *  - Request notification permission and retrieve/refresh the FCM token.
 *  - Register/update the device token with the backend for both anonymous
 *    and logged-in visitors (multiple devices per user supported).
 *  - Surface foreground messages to subscribers.
 */

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AppConstants } from '../../../app-constants';
import { PushSubscription } from '../models/notification.models';

const FIREBASE_VERSION = '10.7.0';
const FCM_TOKEN_STORAGE_KEY = 'duha_fcm_token';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private apiUrl = `${environment.apiBaseUrl}${AppConstants.ApiUrls.BASE}/notifications`;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private messaging: any = null;
  private firebaseApp: any = null;
  private initialized = false;

  /** Emits the payload of foreground (app-open) push messages. */
  private foregroundMessageSubject = new Subject<any>();
  public foregroundMessage$ = this.foregroundMessageSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Initialize FCM: register the service worker, load Firebase, and wire up
   * the foreground message listener. Safe to call multiple times.
   */
  async initialize(): Promise<boolean> {
    if (!this.isBrowser || this.initialized) {
      return this.initialized;
    }
    if (!this.isSupported()) {
      console.warn('[FCM] Push notifications are not supported in this browser');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      );

      const firebase = await this.loadFirebaseSdk();
      if (!firebase) return false;

      if (!firebase.apps || firebase.apps.length === 0) {
        this.firebaseApp = firebase.initializeApp(environment.firebase);
      } else {
        this.firebaseApp = firebase.app();
      }

      this.messaging = firebase.messaging();

      // Foreground messages arrive here while the app tab is focused.
      this.messaging.onMessage((payload: any) => {
        this.foregroundMessageSubject.next(payload);
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[FCM] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Request notification permission (if not already decided), obtain the FCM
   * token and register/update it with the backend when it is new or changed.
   * @param customerId Optional customer id to associate when logged in.
   * @returns The FCM token or null.
   */
  async requestPermissionAndRegister(customerId?: number | null): Promise<string | null> {
    if (!this.isBrowser) return null;
    if (!this.isSupported()) {
      console.warn('[FCM] Push notifications are not supported in this browser');
      return null;
    }

    try {
      // Ask for permission FIRST — before the heavier service-worker / Firebase
      // SDK init. This guarantees the browser prompt appears even if init would
      // later fail, and keeps the request tied to the user gesture that called
      // this method.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[FCM] Notification permission not granted:', permission);
        return null;
      }

      const ready = await this.initialize();
      if (!ready) return null;

      const token = await this.getToken();
      if (!token) return null;

      const previousToken = this.getStoredToken();
      if (token !== previousToken) {
        await this.registerToken(
          {
            token,
            deviceType: 'web',
            browser: this.getBrowserName(),
            os: this.getOSName()
          },
          previousToken,
          customerId
        ).toPromise();
        this.setStoredToken(token);
      }

      return token;
    } catch (error) {
      console.error('[FCM] requestPermissionAndRegister failed:', error);
      return null;
    }
  }

  /**
   * Link this browser's current FCM device token to a customer id.
   *
   * Unlike requestPermissionAndRegister(), this always re-sends the token so
   * the backend can update the token's customer association (used at
   * login/checkout to move an anonymous device onto a customer account).
   * Best-effort and never throws; no-op when permission isn't granted yet.
   * @param customerId The customer to associate the device with.
   */
  async linkTokenToCustomer(customerId: number): Promise<void> {
    if (!this.isBrowser || customerId == null) return;
    try {
      if (!this.isPermissionGranted()) return;

      const ready = await this.initialize();
      if (!ready) return;

      const token = await this.getToken();
      if (!token) return;

      await this.registerToken(
        {
          token,
          deviceType: 'web',
          browser: this.getBrowserName(),
          os: this.getOSName()
        },
        null,
        customerId
      ).toPromise();
      this.setStoredToken(token);
    } catch (error) {
      console.error('[FCM] linkTokenToCustomer failed:', error);
    }
  }

  /**
   * Backwards-compatible: request permission and return the FCM token.
   * (Registration with the backend is performed separately by callers.)
   */
  async requestPermission(): Promise<string | null> {
    if (!this.isBrowser) return null;
    const ready = await this.initialize();
    if (!ready) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    return this.getToken();
  }

  /**
   * Retrieve the current FCM registration token.
   */
  async getToken(): Promise<string | null> {
    if (!this.isBrowser) return null;
    const ready = await this.initialize();
    if (!ready || !this.messaging) return null;

    const vapidKey = (environment.firebase as any).vapidKey;
    if (!vapidKey) {
      console.warn(
        '[FCM] Missing VAPID key (environment.firebase.vapidKey). ' +
        'Set the Web Push certificate key in Firebase Console to receive a token.'
      );
    }

    try {
      const options: any = { serviceWorkerRegistration: this.swRegistration };
      if (vapidKey) options.vapidKey = vapidKey;
      const token = await this.messaging.getToken(options);
      return token || null;
    } catch (error) {
      console.error('[FCM] getToken failed:', error);
      return null;
    }
  }

  /**
   * Register/update the device token with the backend.
   * Uses the public device-token endpoint so it works for anonymous visitors;
   * the AuthInterceptor attaches the bearer token when logged in.
   */
  registerToken(
    subscription: PushSubscription,
    oldToken?: string | null,
    customerId?: number | null
  ): Observable<{ success: boolean; message: string }> {
    const body: any = { ...subscription };
    if (oldToken && oldToken !== subscription.token) body.oldToken = oldToken;
    if (customerId != null) body.customerId = customerId;

    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/device-token`,
      body
    );
  }

  /**
   * Unregister a device token from the backend.
   */
  unregisterToken(token: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/device-token`,
      { body: { token } }
    );
  }

  isSupported(): boolean {
    return (
      this.isBrowser &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  isPermissionGranted(): boolean {
    return this.isBrowser && 'Notification' in window && Notification.permission === 'granted';
  }

  isPermissionDenied(): boolean {
    return this.isBrowser && 'Notification' in window && Notification.permission === 'denied';
  }

  isPermissionDefault(): boolean {
    return this.isBrowser && 'Notification' in window && Notification.permission === 'default';
  }

  needsPermissionPrompt(): boolean {
    return this.isSupported() && this.isPermissionDefault();
  }

  // ==================== INTERNAL HELPERS ====================

  private getStoredToken(): string | null {
    try {
      return this.isBrowser ? window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY) : null;
    } catch {
      return null;
    }
  }

  private setStoredToken(token: string): void {
    try {
      if (this.isBrowser) window.localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    } catch {
      /* ignore quota/private-mode errors */
    }
  }

  /**
   * Dynamically load the Firebase compat SDK from the CDN (browser only).
   * The compat build is used to match the service worker and avoid bundling
   * the Firebase npm package.
   */
  private loadFirebaseSdk(): Promise<any> {
    const w = window as any;
    if (w.firebase) return Promise.resolve(w.firebase);

    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
    return this.loadScript(`${base}/firebase-app-compat.js`)
      .then(() => this.loadScript(`${base}/firebase-messaging-compat.js`))
      .then(() => (window as any).firebase)
      .catch((err) => {
        console.error('[FCM] Failed to load Firebase SDK:', err);
        return null;
      });
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    return 'Unknown';
  }

  private getOSName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    return 'Unknown';
  }
}
