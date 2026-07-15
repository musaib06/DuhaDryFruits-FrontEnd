/**
 * Product Utility Functions
 * 
 * These utilities work with plain objects from API/IndexedDB
 * since class getters don't work on plain JSON objects.
 */

import { ProductSM } from '../models/service-models/app/v1/product-s-m';
import { ProductVariantSM } from '../models/service-models/app/v1/variants-s-m';

/**
 * Low stock threshold
 */
const LOW_STOCK_THRESHOLD = 5;

/**
 * Product Utility Class
 * Static methods that work with plain objects
 */
export class ProductUtils {
  private static toNumberOrInfinity(raw: unknown): number {
    const n = Number(raw);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  }

  /**
   * Sort variants low→high price (active first).
   * This is in-place to keep template iteration order consistent everywhere.
   */
  static sortVariantsByPriceAsc(product: any): void {
    if (!product?.variants || !Array.isArray(product.variants) || product.variants.length <= 1) return;

    product.variants.sort((a: any, b: any) => {
      const aActive = a?.isActive !== false ? 0 : 1;
      const bActive = b?.isActive !== false ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;

      const ap = ProductUtils.toNumberOrInfinity(a?.price);
      const bp = ProductUtils.toNumberOrInfinity(b?.price);
      if (ap !== bp) return ap - bp;

      // Tie-breaker: smaller quantity first (optional but stable)
      const aq = ProductUtils.toNumberOrInfinity(a?.quantity);
      const bq = ProductUtils.toNumberOrInfinity(b?.quantity);
      if (aq !== bq) return aq - bq;

      return (a?.id ?? 0) - (b?.id ?? 0);
    });
  }

  /**
   * Format a numeric value without unnecessary trailing zeros.
   * Examples: 500 -> "500", 500.0 -> "500", 0.5 -> "0.5", 1.23456 -> "1.235"
   */
  static formatNumber(raw: unknown, maxDecimals: number = 3): string {
    if (raw == null) return '';
    if (typeof raw === 'string' && raw.trim() === '') return '';

    const n = Number(raw);
    if (Number.isNaN(n)) return '';

    if (Number.isInteger(n)) return n.toString();

    const clampedDecimals = Math.max(0, Math.min(8, Math.floor(maxDecimals)));
    return n
      .toFixed(clampedDecimals)
      .replace(/\.?0+$/, '');
  }

  /**
   * Format a variant weight (stored in grams) into a readable string.
   * @deprecated Use getDisplayUnit for pack-size labels; this converts g↔kg.
   */
  static formatWeightFromGrams(rawWeight: unknown): string {
    if (rawWeight == null) return '';
    if (typeof rawWeight === 'string' && rawWeight.trim() === '') return '';

    const grams = Number(rawWeight);
    if (Number.isNaN(grams) || grams <= 0) return '';

    if (grams >= 1000) {
      return `${ProductUtils.formatNumber(grams / 1000, 2)} kg`;
    }
    return `${ProductUtils.formatNumber(grams, 0)} g`;
  }

  /**
   * Storefront pack label: weight value + selected unit symbol (any unit).
   * Falls back to quantity + unit only when weight is not set (legacy data).
   */
  static getDisplayUnit(variant: any): string {
    if (!variant) return '';
    const unit = (
      variant.unitSymbol ||
      variant.unitName ||
      variant.unitValue?.symbol ||
      variant.unitValue?.name ||
      ''
    )
      .toString()
      .trim();

    const weight = Number(variant.weight);
    if (Number.isFinite(weight) && weight > 0) {
      const sizeStr = ProductUtils.formatNumber(weight, 3);
      return unit ? `${sizeStr} ${unit}` : sizeStr;
    }

    const qty = variant.quantity;
    if (qty === null || qty === undefined || qty === '') {
      return unit;
    }
    const qtyStr = ProductUtils.formatNumber(qty, 3);
    if (!qtyStr) return unit;
    return unit ? `${qtyStr} ${unit}` : qtyStr;
  }

  static getVariantWeightLabel(variant: any): string {
    return ProductUtils.getDisplayUnit(variant);
  }

  /** Admin sell quantity — number only (no unit). */
  static getVariantQuantityLabel(variant: any): string {
    if (!variant) return '';
    const qty = Number(variant.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return '';
    }
    return ProductUtils.formatNumber(variant.quantity, 3);
  }

  /** Quantity + sell unit — exact stored values. */
  static getVariantQuantityWithUnit(variant: any): string {
    return ProductUtils.getDisplayUnit(variant);
  }

  /**
   * Pack size label for storefront (quantity + unit symbol as stored).
   */
  static getVariantUnitSize(variant: any): string {
    return ProductUtils.getDisplayUnit(variant);
  }

  /** Variant tab / chip headline. */
  static getVariantPrimarySizeLabel(variant: any): string {
    return ProductUtils.getDisplayUnit(variant);
  }

  /**
   * Cart / checkout / card line: unit-aware size label (e.g. "100 ml", "500 g").
   */
  static getVariantSizeAndWeightLabel(product: any): string {
    const variant = ProductUtils.getSelectedVariant(product);
    if (!variant) return '';
    return ProductUtils.getVariantUnitSize(variant);
  }
  
  /**
   * Get the default variant for a product.
   * Prefers admin-marked default; otherwise lowest-price active variant.
   */
  static getDefaultVariant(product: any): any | undefined {
    if (!product?.variants?.length) return undefined;
    ProductUtils.sortVariantsByPriceAsc(product);

    const active = product.variants.filter((v: any) => v?.isActive !== false);
    const flagged = active.find((v: any) => v?.isDefaultVariant === true);
    if (flagged) return flagged;
    return active[0] || product.variants[0];
  }

  /**
   * Get the currently selected variant
   */
  static getSelectedVariant(product: any): any | undefined {
    if (!product?.variants?.length) return undefined;
    
    if (product.selectedVariantId) {
      const found = product.variants.find((v: any) => v.id === product.selectedVariantId);
      if (found) return found;
    }
    return ProductUtils.getDefaultVariant(product);
  }

  /**
   * Get price from selected variant
   */
  static getPrice(product: any): number {
    const variant = ProductUtils.getSelectedVariant(product);
    const n = Number(variant?.price);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Get optional per-product shipping charge
   */
  static getShippingCharge(product: any): number {
    const raw = product?.shippingCharge;
    const num = Number(raw);
    if (raw == null || Number.isNaN(num) || num <= 0) {
      return 0;
    }
    return num;
  }

  /**
   * Get compare price from selected variant
   */
  static getComparePrice(product: any): number | undefined {
    const variant = ProductUtils.getSelectedVariant(product);
    const n = Number(variant?.comparePrice);
    return Number.isFinite(n) ? n : undefined;
  }

  /**
   * Get stock from selected variant
   */
  static getStock(product: any): number {
    const variant = ProductUtils.getSelectedVariant(product);
    const n = Number(variant?.stock);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Get weight from selected variant
   */
  static getWeight(product: any): number {
    const variant = ProductUtils.getSelectedVariant(product);
    const n = Number(variant?.weight);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Get SKU from selected variant
   */
  static getSku(product: any): string {
    const variant = ProductUtils.getSelectedVariant(product);
    return variant?.sku ?? '';
  }

  /**
   * Get unit symbol from selected variant
   */
  static getUnitSymbol(product: any): string {
    const variant = ProductUtils.getSelectedVariant(product);
    return variant?.unitSymbol || variant?.unitName || '';
  }

  /**
   * Check if product is out of stock
   */
  static isOutOfStock(product: any): boolean {
    return ProductUtils.getStock(product) <= 0;
  }

  /**
   * Check if product is low stock
   */
  static isLowStock(product: any): boolean {
    const stock = ProductUtils.getStock(product);
    return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  }

  /**
   * Check if product has discount
   */
  static hasDiscount(product: any): boolean {
    const price = ProductUtils.getPrice(product);
    const comparePrice = ProductUtils.getComparePrice(product);
    return comparePrice !== undefined && comparePrice > price;
  }

  /**
   * Get discount percentage
   */
  static getDiscountPercentage(product: any): number {
    if (!ProductUtils.hasDiscount(product)) return 0;
    const price = ProductUtils.getPrice(product);
    const comparePrice = ProductUtils.getComparePrice(product)!;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }

  /**
   * Get formatted weight string
   */
  // static getFormattedWeight(product: any): string {
  //   const weight = ProductUtils.getWeight(product);
  //   if (!weight) return '';
  //   if (weight >= 1000) return `${(weight / 1000).toFixed(1)} kg`;
  //   return `${weight} g`;
  // }
  static getFormattedWeight(product: any): string {
    const variant = ProductUtils.getSelectedVariant(product);
    return variant ? ProductUtils.getDisplayUnit(variant) : '';
  }

  /** Quantity + sell unit for selected variant (admin quantity field). */
  static getFormattedQuantity(product: any): string {
    const variant = ProductUtils.getSelectedVariant(product);
    if (!variant) {
      return '';
    }
    return ProductUtils.getVariantQuantityLabel(variant);
  }




  /**
   * Check if product has multiple variants
   */
  static hasMultipleVariants(product: any): boolean {
    return (product?.variants?.length ?? 0) > 1;
  }

  /**
   * Get available variants (active variants)
   */
  static getAvailableVariants(product: any): any[] {
    return product?.variants?.filter((v: any) => v.isActive !== false) || [];
  }

  /**
   * Get active variants (in stock)
   */
  static getActiveVariants(product: any): any[] {
    return (
      product?.variants?.filter((v: any) => {
        if (v.isActive === false) return false;
        const s = Number(v.stock);
        return Number.isFinite(s) && s > 0;
      }) || []
    );
  }

  /**
   * Check if product can be added to cart
   */
  static canAddToCart(product: any): boolean {
    const variant = ProductUtils.getSelectedVariant(product);
    if (variant === undefined || variant.isActive === false) {
      return false;
    }
    const s = Number(variant.stock);
    return Number.isFinite(s) && s > 0;
  }

  /**
   * Initialize selected variant if not set
   */
  static initializeSelectedVariant(product: any): void {
    if (!product?.variants?.length) return;

    // Keep variants list low→high price for dropdown ordering.
    ProductUtils.sortVariantsByPriceAsc(product);
    
    const preserve = product?.__preserveSelectedVariant === true;
    const userChosen = product?.__userSelectedVariant === true;

    if ((preserve || userChosen) && product.selectedVariantId) {
      const exists = product.variants.some((v: any) => v.id === product.selectedVariantId);
      if (exists) return;
    }

    const defaultVariant = ProductUtils.getDefaultVariant(product);
    if (defaultVariant) {
      product.selectedVariantId = defaultVariant.id;
    }
  }

  /**
   * Get stock status text
   */
  static getStockStatus(product: any): string {
    if (ProductUtils.isOutOfStock(product)) return 'Out of Stock';
    if (ProductUtils.isLowStock(product)) return 'Low Stock';
    return 'In Stock';
  }

  /**
   * Get stock status class for styling
   */
  static getStockStatusClass(product: any): string {
    if (ProductUtils.isOutOfStock(product)) return 'bg-danger';
    if (ProductUtils.isLowStock(product)) return 'bg-warning text-dark';
    return 'bg-success';
  }

  /**
   * Deterministic pseudo-random number in [0,1) derived from a product's
   * stable identity (id/slug/name). Ensures the same product always shows the
   * same generated rating/review count across reloads and devices.
   */
  private static seededUnit(product: any, salt: number): number {
    const key = `${product?.id ?? ''}|${product?.slug ?? ''}|${product?.name ?? ''}|${salt}`;
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // Convert to unsigned and normalise to [0,1)
    return ((h >>> 0) % 100000) / 100000;
  }

  /**
   * Generated rating in [4.0, 5.0] with one decimal, used when a product has
   * no real reviews yet. Never below 4 stars.
   */
  private static getGeneratedRating(product: any): number {
    const r = 4 + ProductUtils.seededUnit(product, 1); // 4.0 .. 5.0
    return Math.round(Math.min(5, r) * 10) / 10;
  }

  /**
   * Generated review count as a double-digit number (10..99) when a product
   * has no real reviews yet.
   */
  private static getGeneratedReviewCount(product: any): number {
    return 10 + Math.floor(ProductUtils.seededUnit(product, 2) * 90); // 10..99
  }

  /**
   * Get average rating. Falls back to a generated rating (>= 4 stars) when the
   * product has no real reviews so every product shows a rating.
   */
  static getAverageRating(product: any): number {
    const real = Number(product?.averageRating);
    if (Number.isFinite(real) && real > 0) {
      return real;
    }
    return ProductUtils.getGeneratedRating(product);
  }

  /**
   * Get review count. Falls back to a generated double-digit count when the
   * product has no real reviews.
   */
  static getReviewCount(product: any): number {
    const real = Number(product?.reviewCount);
    if (Number.isFinite(real) && real > 0) {
      return real;
    }
    return ProductUtils.getGeneratedReviewCount(product);
  }

  /**
   * Always true now: every product shows a rating (real or generated).
   */
  static hasReviews(product: any): boolean {
    return true;
  }

  /**
   * Get full stars count for rating display
   */
  static getFullStars(product: any): number {
    return Math.floor(ProductUtils.getAverageRating(product));
  }

  /**
   * Check if rating has half star
   */
  static hasHalfStar(product: any): boolean {
    const rating = ProductUtils.getAverageRating(product);
    return (rating % 1) >= 0.5;
  }

  /**
   * Get formatted rating string
   */
  static getFormattedRating(product: any): string {
    const rating = ProductUtils.getAverageRating(product);
    return rating > 0 ? rating.toFixed(1) : '0.0';
  }
}

/**
 * Variant Utility Class
 */
export class VariantUtils {
  
  /**
   * Get effective min order quantity
   */
  static getEffectiveMinOrderQuantity(variant: any): number {
    return variant?.minOrderQuantity ?? 1;
  }

  /**
   * Get effective max order quantity
   */
  static getEffectiveMaxOrderQuantity(variant: any): number {
    const max = variant?.maxOrderQuantity ?? Infinity;
    const stock = Number(variant?.stock);
    const s = Number.isFinite(stock) ? stock : 0;
    return Math.min(max, s);
  }

  /**
   * Check if variant is available
   */
  static isAvailable(variant: any): boolean {
    if (variant?.isActive === false) {
      return false;
    }
    const s = Number(variant?.stock);
    return Number.isFinite(s) && s > 0;
  }

  /**
   * Validate order quantity
   */
  static isValidQuantity(variant: any, qty: number): boolean {
    const min = VariantUtils.getEffectiveMinOrderQuantity(variant);
    const max = VariantUtils.getEffectiveMaxOrderQuantity(variant);
    return qty >= min && qty <= max;
  }
}

