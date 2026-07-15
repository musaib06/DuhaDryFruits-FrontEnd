/**
 * Product Cache Service
 * Frontend caching for product data to reduce API calls
 */

import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  
  // Default TTL values in milliseconds
  private readonly DEFAULT_TTL = {
    PRODUCTS_LIST: 5 * 60 * 1000,    // 5 minutes
    PRODUCT_DETAIL: 10 * 60 * 1000,   // 10 minutes
    CATEGORIES: 30 * 60 * 1000,       // 30 minutes
    NEW_ARRIVALS: 5 * 60 * 1000,      // 5 minutes
    BEST_SELLING: 5 * 60 * 1000,      // 5 minutes
    SEARCH: 2 * 60 * 1000             // 2 minutes
  };

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`📦 Cache HIT: ${key}`);
    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL.PRODUCTS_LIST
    };
    
    this.cache.set(key, entry);
    console.log(`✅ Cache SET: ${key} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Cache with specific type
   */
  setProducts(data: any, query: string = ''): void {
    const key = query ? `products:list:${query}` : 'products:list';
    this.set(key, data, this.DEFAULT_TTL.PRODUCTS_LIST);
  }

  getProducts(query: string = ''): any | null {
    const key = query ? `products:list:${query}` : 'products:list';
    return this.get(key);
  }

  setProductDetail(productId: string | number, data: any): void {
    this.set(`product:detail:${productId}`, data, this.DEFAULT_TTL.PRODUCT_DETAIL);
  }

  getProductDetail(productId: string | number): any | null {
    return this.get(`product:detail:${productId}`);
  }

  setCategories(data: any): void {
    this.set('categories:all', data, this.DEFAULT_TTL.CATEGORIES);
  }

  getCategories(): any | null {
    return this.get('categories:all');
  }

  setNewArrivals(data: any): void {
    this.set('products:new-arrivals', data, this.DEFAULT_TTL.NEW_ARRIVALS);
  }

  getNewArrivals(): any | null {
    return this.get('products:new-arrivals');
  }

  setBestSelling(data: any): void {
    this.set('products:best-selling', data, this.DEFAULT_TTL.BEST_SELLING);
  }

  getBestSelling(): any | null {
    return this.get('products:best-selling');
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  /**
   * Invalidate all product caches
   */
  invalidateProducts(): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith('products:') || key.startsWith('product:')) {
        this.cache.delete(key);
      }
    }
    console.log('🗑️ All product caches invalidated');
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ All cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
}
