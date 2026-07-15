import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConstants } from '../../app-constants';
import { IndexedDBStorageService } from './indexdb.service';
import { ProductSM } from '../models/service-models/app/v1/product-s-m';
import { ProductVariantSM } from '../models/service-models/app/v1/variants-s-m';
import { BaseService } from './base.service';
import { CommonService } from './common.service';
import { ProductUtils, VariantUtils } from '../utils/product.utils';

/**
 * Cart Item Interface
 * Cart uniqueness = productId + variantId
 */
export interface CartItem {
  productId: number;
  variantId: number;
  variantPrice: number;
  unitId?: number;
  unitSymbol: string;
  unitName?: string;
  weight?: number;
  sku?: string;
  quantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  stockAtAddTime: number;
  product?: ProductSM;
}

/**
 * Cart Service
 * Manages the shopping cart with variant-aware storage.
 */
@Injectable({ providedIn: 'root' })
export class CartService extends BaseService {
  private readonly STORAGE_KEY = AppConstants.DbKeys.CART;

  private cartSubject = new BehaviorSubject<ProductSM[]>([]);
  public cart$: Observable<ProductSM[]> = this.cartSubject.asObservable();

  constructor(
    private commonService: CommonService,
    private indexDB: IndexedDBStorageService
  ) {
    super();
    this.loadInitialCart();
  }

  private async loadInitialCart(): Promise<void> {
    try {
      const persisted = (await this.indexDB.getFromStorage(this.STORAGE_KEY)) || [];
      const normalized: ProductSM[] = Array.isArray(persisted)
        ? persisted.map((p) => this.normalizeProduct(p))
        : [];
      this.cartSubject.next(normalized);
    } catch (err) {
      console.error('CartService: failed to load initial cart', err);
      this.cartSubject.next([]);
    }
  }

  /**
   * Normalize product for cart storage
   */
  private normalizeProduct(p: any): ProductSM {
    const normalized = {
      ...p,
      cartQuantity: typeof p?.cartQuantity === 'number' && p.cartQuantity > 0
        ? p.cartQuantity
        : 1,
      // Cart items must preserve the user-selected variant.
      __preserveSelectedVariant: true,
    } as ProductSM;

    // Initialize selectedVariantId if needed
    ProductUtils.initializeSelectedVariant(normalized);

    return normalized;
  }

  private async persistAndEmit(cart: ProductSM[]): Promise<void> {
    try {
      await this.indexDB.saveToStorage(this.STORAGE_KEY, cart);
    } catch (err) {
      console.error('CartService: failed to persist cart', err);
    } finally {
      this.cartSubject.next([...cart]);
    }
  }

  /**
   * Validate quantity against variant constraints
   */
  validateQuantity(product: any, quantity: number): { valid: boolean; message?: string; adjustedQty?: number } {
    const variant = ProductUtils.getSelectedVariant(product);
    if (!variant) {
      return { valid: false, message: 'No variant selected' };
    }

    const min = VariantUtils.getEffectiveMinOrderQuantity(variant);
    const max = VariantUtils.getEffectiveMaxOrderQuantity(variant);
    const stock = variant.stock ?? 0;

    if (quantity < min) {
      return { valid: false, message: `Minimum order quantity is ${min}`, adjustedQty: min };
    }
    if (quantity > stock) {
      return { valid: false, message: `Only ${stock} items in stock`, adjustedQty: stock };
    }
    if (quantity > max) {
      return { valid: false, message: `Maximum order quantity is ${max}`, adjustedQty: max };
    }

    return { valid: true };
  }

  /**
   * Add product to cart or update quantity
   */
  async toggleCart(product: ProductSM): Promise<void> {
    const variant = ProductUtils.getSelectedVariant(product);
    
    if (!variant) {
      this.commonService.ShowToastAtTopEnd(
        'Please select a variant before adding to cart.',
        'error'
      );
      return;
    }

    const qtyToAdd = product.cartQuantity || 1;
    const validation = this.validateQuantity(product, qtyToAdd);
    
    if (!validation.valid) {
      this.commonService.ShowToastAtTopEnd(validation.message || 'Invalid quantity', 'error');
      return;
    }

    const current = [...(this.cartSubject.value || [])];
    
    // Find by productId + variantId
    const idx = current.findIndex(
      (p) => p.id === product.id && p.selectedVariantId === variant.id
    );

    if (idx >= 0) {
      const newQty = current[idx].cartQuantity + qtyToAdd;
      const updateValidation = this.validateQuantity(product, newQty);
      
      if (!updateValidation.valid) {
        this.commonService.ShowToastAtTopEnd(
          updateValidation.message || 'Cannot add more items',
          'warning'
        );
        return;
      }
      
      current[idx].cartQuantity = newQty;
      this.commonService.ShowToastAtTopEnd('Cart quantity updated.', 'success');
    } else {
      const toAdd = this.normalizeProduct(product);
      toAdd.selectedVariantId = variant.id;
      toAdd.cartQuantity = qtyToAdd;
      current.push(toAdd);
      this.commonService.ShowToastAtTopEnd('Product added to cart.', 'success');
    }

    await this.persistAndEmit(current);
  }

  /**
   * Check if product (with specific variant) is in cart
   */
  async isCarted(product: ProductSM): Promise<boolean> {
    const current = this.cartSubject.value || [];
    if (!product.selectedVariantId) {
      return current.some((p) => p.id === product.id);
    }
    return current.some(
      (p) => p.id === product.id && p.selectedVariantId === product.selectedVariantId
    );
  }

  /**
   * Get all cart items
   */
  async getAll(): Promise<ProductSM[]> {
    const current = this.cartSubject.value;
    if (current?.length > 0) {
      return current;
    }
    const persisted = (await this.indexDB.getFromStorage(this.STORAGE_KEY)) || [];
    return Array.isArray(persisted)
      ? persisted.map((p) => this.normalizeProduct(p))
      : [];
  }

  /**
   * Get cart item count
   */
  getCartItemCount(): number {
    return this.cartSubject.value?.length || 0;
  }

  /**
   * Get total quantity of all items
   */
  getTotalQuantity(): number {
    return this.cartSubject.value?.reduce((sum, p) => sum + (p.cartQuantity || 1), 0) || 0;
  }

  /**
   * Update cart item quantity with validation
   */
  async updateCartItem(id: number, quantity: number, variantId?: number): Promise<boolean> {
    const current = [...(this.cartSubject.value || [])];
    
    const idx = variantId
      ? current.findIndex((p) => p.id === id && p.selectedVariantId === variantId)
      : current.findIndex((p) => p.id === id);

    if (idx === -1) return false;

    if (quantity <= 0) {
      current.splice(idx, 1);
      this.commonService.ShowToastAtTopEnd('Product removed from cart.', 'success');
    } else {
      const product = current[idx];
      const variant = ProductUtils.getSelectedVariant(product);
      
      if (variant) {
        const validation = this.validateQuantity(product, quantity);
        if (!validation.valid) {
          this.commonService.ShowToastAtTopEnd(validation.message || 'Invalid quantity', 'error');
          return false;
        }
      }
      
      current[idx].cartQuantity = quantity;
      this.commonService.ShowToastAtTopEnd('Cart updated.', 'success');
    }

    await this.persistAndEmit(current);
    return true;
  }

  /**
   * Remove item from cart
   */
  async removeById(id: number, variantId?: number): Promise<boolean> {
    const current = [...(this.cartSubject.value || [])];
    
    const filtered = variantId
      ? current.filter((p) => !(p.id === id && p.selectedVariantId === variantId))
      : current.filter((p) => p.id !== id);

    const removed = filtered.length < current.length;
    if (!removed) return false;

    await this.persistAndEmit(filtered);
    this.commonService.ShowToastAtTopEnd('Product removed from cart.', 'success');
    return true;
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    await this.persistAndEmit([]);
    this.commonService.ShowToastAtTopEnd('Cart cleared.', 'info');
  }

  /**
   * Calculate cart total using variant prices
   */
  async cartTotal(): Promise<number> {
    const current = this.cartSubject.value || [];
    let total = 0;
    
    for (const p of current) {
      const qty = typeof p.cartQuantity === 'number' ? p.cartQuantity : 1;
      const price = ProductUtils.getPrice(p);
      total += qty * price;
    }
    
    return total;
  }

  /**
   * Create CartItem payload for order creation
   */
  async getCartItemsForOrder(): Promise<CartItem[]> {
    const products = this.cartSubject.value || [];
    const cartItems: CartItem[] = [];

    for (const product of products) {
      const variant = ProductUtils.getSelectedVariant(product);
      if (!variant) {
        console.warn('CartService: Skipping product without variant', product.id);
        continue;
      }

      cartItems.push({
        productId: product.id,
        variantId: variant.id,
        variantPrice: variant.price,
        unitId: variant.unitId ?? variant.unitValueId,
        unitSymbol: variant.unitSymbol || variant.unitName || '',
        unitName: variant.unitName,
        weight: variant.weight,
        sku: variant.sku,
        quantity: product.cartQuantity || 1,
        minOrderQuantity: VariantUtils.getEffectiveMinOrderQuantity(variant),
        maxOrderQuantity: VariantUtils.getEffectiveMaxOrderQuantity(variant),
        stockAtAddTime: variant.stock,
        product: product,
      });
    }

    return cartItems;
  }
}
