import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { openDB, IDBPDatabase } from 'idb';
import { IndexedDBStorage } from '../models/internal/common-models';
import { AppConstants } from '../../app-constants';
import { environment } from '../../environments/environment';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBStorageService extends BaseService {
  private dbPromise: Promise<IDBPDatabase<IndexedDBStorage>> | null = null;
  private _sessionStorage: Storage | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    super();

    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this._sessionStorage = sessionStorage;
      this.dbPromise = this.openIndexedDB();
    }
  }

  // ──────── PRIVATE: OPEN INDEXEDDB ───────────────────────────────────────────
  private async openIndexedDB(): Promise<IDBPDatabase<IndexedDBStorage>> {
    const db = await openDB<IndexedDBStorage>(
      environment.indexedDBName,
      environment.indexedDBVersion,
      {
        upgrade(db) {
          if (!db.objectStoreNames.contains('majorData')) {
            db.createObjectStore('majorData');
          }
        },
      }
    );
    return db;
  }

  // ──────── INDEXEDDB METHODS ────────────────────────────────────────────────
  async getFromStorage(key: string): Promise<any> {
    if (!this.dbPromise) return null;
    const db = await this.dbPromise;
    const encrypted: string = (await db.get('majorData', key)) || '';
    if (!encrypted) return null;
    const decrypted: string = await this.decrypt(encrypted);
    return this.getValueAsObject(decrypted);
  }

  async saveToStorage(key: string, val: any): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    const rawString =
      typeof val !== 'string' ? JSON.stringify(val) : (val as string);
    const encrypted: string = this.encrypt(rawString);
    await db.put('majorData', encrypted, key);
  }

  async removeFromStorage(key: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete('majorData', key);
  }

  async clearStorage(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.clear('majorData');
  }

  // ──────── SESSION STORAGE METHODS ──────────────────────────────────────────
  async saveToSessionStorage(key: string, val: any): Promise<void> {
    if (!this._sessionStorage) return;
    const rawString =
      typeof val !== 'string' ? JSON.stringify(val) : (val as string);
    const encrypted: string = await this.encrypt(rawString);
    this._sessionStorage.setItem(key, encrypted);
  }

  async getFromSessionStorage(key: string): Promise<any> {
    if (!this._sessionStorage) return null;
    const encrypted: string = this._sessionStorage.getItem(key) || '';
    if (!encrypted) return null;
    const decrypted: string = await this.decrypt(encrypted);
    return this.getValueAsObject(decrypted);
  }

  async removeFromSessionStorage(key: string): Promise<void> {
    if (!this._sessionStorage) return;
    this._sessionStorage.removeItem(key);
  }

  async clearSessionStorage(): Promise<void> {
    if (!this._sessionStorage) return;
    this._sessionStorage.clear();
  }

  // ──────── UTILITY / MIXED STORAGE ──────────────────────────────────────────
  async getDataFromAnyStorage(key: string): Promise<any> {
    if (!this.isBrowser) return null;
    const remMe: boolean = await this.getFromStorage(
      AppConstants.DbKeys.REMEMBER_PWD
    );
    return remMe ? this.getFromStorage(key) : this.getFromSessionStorage(key);
  }

  private async getValueAsObject(val: string): Promise<any> {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
}
