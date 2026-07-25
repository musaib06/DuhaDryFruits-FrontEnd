import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BulkCartCustomItem, BulkCartItem } from '../models/service-models/app/v1/bulk-order-s-m';

const CART_KEY = 'duha_bulk_cart';
const CUSTOM_KEY = 'duha_bulk_custom';

@Injectable({ providedIn: 'root' })
export class BulkCartService {
  private itemsSubject = new BehaviorSubject<BulkCartItem[]>(this.loadItems());
  private customItemsSubject = new BehaviorSubject<BulkCartCustomItem[]>(this.loadCustom());

  readonly cartItems$ = this.itemsSubject.asObservable();
  readonly customItems$ = this.customItemsSubject.asObservable();

  get items(): BulkCartItem[] {
    return this.itemsSubject.value;
  }

  get customItems(): BulkCartCustomItem[] {
    return this.customItemsSubject.value;
  }

  get totalItems(): number {
    return this.items.length + this.customItems.length;
  }

  addItem(item: BulkCartItem): void {
    const existing = this.items.find((i) => i.productVariantId === item.productVariantId);
    if (existing) {
      existing.requestedQuantity = item.requestedQuantity;
      existing.specialInstructions = item.specialInstructions;
      existing.expectedDeliveryDate = item.expectedDeliveryDate;
      existing.notes = item.notes;
    } else {
      this.itemsSubject.next([...this.items, item]);
    }
    this.persist();
  }

  updateQuantity(variantId: number, qty: number): void {
    const updated = this.items.map((i) =>
      i.productVariantId === variantId ? { ...i, requestedQuantity: qty } : i
    );
    this.itemsSubject.next(updated);
    this.persist();
  }

  removeItem(variantId: number): void {
    this.itemsSubject.next(this.items.filter((i) => i.productVariantId !== variantId));
    this.persist();
  }

  addCustomItem(item: BulkCartCustomItem): void {
    this.customItemsSubject.next([...this.customItems, item]);
    this.persistCustom();
  }

  removeCustomItem(index: number): void {
    const copy = [...this.customItems];
    copy.splice(index, 1);
    this.customItemsSubject.next(copy);
    this.persistCustom();
  }

  clear(): void {
    this.itemsSubject.next([]);
    this.customItemsSubject.next([]);
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(CUSTOM_KEY);
  }

  private loadItems(): BulkCartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private loadCustom(): BulkCartCustomItem[] {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    this.itemsSubject.next(this.loadItems());
  }

  private persistCustom(): void {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(this.customItems));
    this.customItemsSubject.next(this.loadCustom());
  }
}
