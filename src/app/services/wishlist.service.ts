import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConstants } from '../../app-constants';
import { IndexedDBStorageService } from './indexdb.service';
import { ProductSM } from '../models/service-models/app/v1/product-s-m';
import { BaseService } from './base.service';
import { CommonService } from './common.service';
import { ProductUtils } from '../utils/product.utils';

@Injectable({ providedIn: 'root' })
export class WishlistService extends BaseService {
  private readonly STORAGE_KEY = AppConstants.DbKeys.WISHLIST;

  private wishlistSubject = new BehaviorSubject<ProductSM[]>([]);
  public wishlist$: Observable<ProductSM[]> = this.wishlistSubject.asObservable();
  
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(
    private commonService: CommonService,
    private indexDB: IndexedDBStorageService
  ) {
    super();
    console.log('[WishlistService] Constructor called, STORAGE_KEY:', this.STORAGE_KEY);
    this.initPromise = this.loadInitialWishlist();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private async loadInitialWishlist(): Promise<void> {
    try {
      console.log('[WishlistService] Loading from IndexedDB with key:', this.STORAGE_KEY);
      const persisted = await this.indexDB.getFromStorage(this.STORAGE_KEY);
      console.log('[WishlistService] Raw data from IndexedDB:', persisted);
      
      const normalized: ProductSM[] = Array.isArray(persisted)
        ? persisted.map((p) => this.normalizeProduct(p))
        : [];
      
      console.log('[WishlistService] Normalized wishlist:', normalized.length, 'items');
      this.wishlistSubject.next(normalized);
    } catch (err) {
      console.error('[WishlistService] Failed to load wishlist:', err);
      this.wishlistSubject.next([]);
    } finally {
      this.initialized = true;
    }
  }

  private normalizeProduct(p: any): ProductSM {
    const normalized = {
      ...p,
      cartQuantity: typeof p?.cartQuantity === 'number' && p.cartQuantity > 0
        ? p.cartQuantity
        : 1,
      isWishlisted: true,
      // Wishlist items should keep the variant the user last picked.
      __preserveSelectedVariant: true,
    } as ProductSM;

    ProductUtils.initializeSelectedVariant(normalized);
    return normalized;
  }

  private async persistAndEmit(list: ProductSM[]): Promise<void> {
    console.log('[WishlistService] Persisting', list.length, 'items to IndexedDB');
    
    try {
      // Create a serializable copy (remove circular refs, functions, etc.)
      const toStore = list.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        images: p.images,
        currency: p.currency,
        categoryId: p.categoryId,
        category: p.category,
        variants: p.variants,
        selectedVariantId: p.selectedVariantId,
        isWishlisted: true,
        cartQuantity: p.cartQuantity || 1,
        itemId: p.itemId,
        hsnCode: p.hsnCode,
        taxRate: p.taxRate,
        isBestSelling: p.isBestSelling,
        richDescription: p.richDescription,
      }));
      
      console.log('[WishlistService] Data to store:', JSON.stringify(toStore).substring(0, 500));
      await this.indexDB.saveToStorage(this.STORAGE_KEY, toStore);
      console.log('[WishlistService] Saved to IndexedDB successfully');
      
      // Verify the save
      const verification = await this.indexDB.getFromStorage(this.STORAGE_KEY);
      console.log('[WishlistService] Verification - loaded back:', verification?.length, 'items');
    } catch (err) {
      console.error('[WishlistService] Failed to save to IndexedDB:', err);
    }
    
    // Always emit to update subscribers
    console.log('[WishlistService] Emitting to subscribers');
    this.wishlistSubject.next([...list]);
  }

  /**
   * Toggle wishlist membership for a product.
   * Returns true if added, false if removed
   */
  async toggleWishlist(product: ProductSM): Promise<boolean> {
    await this.ensureInitialized();
    
    console.log('[WishlistService] Toggle wishlist for product:', product.id, product.name);
    
    ProductUtils.initializeSelectedVariant(product);

    const current = [...(this.wishlistSubject.value || [])];
    console.log('[WishlistService] Current wishlist has', current.length, 'items');
    console.log('[WishlistService] Current wishlist IDs:', current.map(p => p.id));
    
    const idx = current.findIndex((p) => p.id === product.id);
    let added = false;

    if (idx >= 0) {
      // Remove from wishlist
      current.splice(idx, 1);
      console.log('[WishlistService] Removing product (found at index', idx, ')');
      this.commonService.ShowToastAtTopEnd('Product removed from wishlist.', 'success');
      added = false;
    } else {
      // Add to wishlist - create a clean copy
      const toAdd: ProductSM = {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        currency: product.currency,
        categoryId: product.categoryId,
        category: product.category,
        variants: product.variants ? [...product.variants] : [],
        selectedVariantId: product.selectedVariantId,
        isWishlisted: true,
        cartQuantity: product.cartQuantity || 1,
        itemId: product.itemId,
        hsnCode: product.hsnCode,
        taxRate: product.taxRate,
        isBestSelling: product.isBestSelling,
        richDescription: product.richDescription,
      } as ProductSM;
      
      current.push(toAdd);
      console.log('[WishlistService] Adding product to wishlist');
      this.commonService.ShowToastAtTopEnd('Product added to wishlist.', 'success');
      added = true;
    }

    console.log('[WishlistService] New wishlist will have', current.length, 'items');
    await this.persistAndEmit(current);
    
    return added;
  }

  /**
   * Returns true if the product is currently in wishlist
   */
  async isWishlisted(product: ProductSM): Promise<boolean> {
    await this.ensureInitialized();
    const result = this.isWishlistedSync(product.id);
    console.log('[WishlistService] isWishlisted check for', product.id, ':', result);
    return result;
  }

  /**
   * Synchronous check for wishlist status
   */
  isWishlistedSync(productId: number): boolean {
    const current = this.wishlistSubject.value || [];
    return current.some((p) => p.id === productId);
  }

  /**
   * Return all wishlisted products.
   */
  async getAll(): Promise<ProductSM[]> {
    await this.ensureInitialized();
    const items = [...(this.wishlistSubject.value || [])];
    console.log('[WishlistService] getAll returning', items.length, 'items');
    return items;
  }

  /**
   * Remove an item by id.
   */
  async removeById(id: number): Promise<boolean> {
    await this.ensureInitialized();
    
    const current = [...(this.wishlistSubject.value || [])];
    const filtered = current.filter((p) => p.id !== id);
    
    if (filtered.length === current.length) return false;
    
    await this.persistAndEmit(filtered);
    this.commonService.ShowToastAtTopEnd('Product removed from wishlist.', 'success');
    return true;
  }

  /**
   * Clear wishlist completely.
   */
  async clearWishlist(): Promise<void> {
    await this.persistAndEmit([]);
    this.commonService.ShowToastAtTopEnd('Wishlist cleared.', 'success');
  }

  /**
   * Get wishlist count
   */
  getCount(): number {
    return this.wishlistSubject.value?.length || 0;
  }
  
  /**
   * Force refresh from storage
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.loadInitialWishlist();
  }
}
