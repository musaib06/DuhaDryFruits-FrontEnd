import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

/**
 * Passes API payloads from SSR to the browser so hydration does not refetch.
 */
@Injectable({ providedIn: 'root' })
export class SsrTransferService {
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  set<T>(key: string, value: T): void {
    if (!this.isServer()) return;
    this.transferState.set(makeStateKey<T>(key), this.toTransferJson(value));
  }

  /**
   * TransferState is JSON-serialized in HTML — strip axios payloads and circular refs.
   */
  private toTransferJson<T>(value: T): T {
    return JSON.parse(
      JSON.stringify(value, (key, val) => (key === 'axiosResponse' ? undefined : val)),
    ) as T;
  }

  /** Browser-only: whether SSR stashed this key (does not consume). */
  has(key: string): boolean {
    if (!this.isBrowser()) return false;
    return this.transferState.hasKey(makeStateKey(key));
  }

  /** Read once on the browser, then remove from transfer state. */
  consume<T>(key: string): T | null {
    if (!this.isBrowser()) return null;
    const stateKey = makeStateKey<T>(key);
    if (!this.transferState.hasKey(stateKey)) return null;
    const value = this.transferState.get(stateKey, null as T);
    this.transferState.remove(stateKey);
    return value;
  }

  /**
   * Browser: reuse SSR payload (optional onHydrated hook for in-memory caches).
   * Server: fetch, stash in TransferState, return.
   */
  async hydrateOrFetch<T>(
    key: string,
    fetch: () => Promise<T>,
    onHydrated?: (value: T) => void,
  ): Promise<T> {
    const transferred = this.consume<T>(key);
    if (transferred !== null) {
      onHydrated?.(transferred);
      return transferred;
    }
    const value = await fetch();
    if (this.isServer()) {
      this.set(key, value);
    }
    return value;
  }
}
