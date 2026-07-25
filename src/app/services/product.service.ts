import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ProductClient } from '../clients/product.client';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { AdminProductsViewModel } from '../models/view/Admin/admin-product.viewmodel';
import { ProductSM } from '../models/service-models/app/v1/product-s-m';
import { ProductNameIdSM } from '../models/service-models/app/v1/product-name-id-s-m';
import { ProductFaqSM } from '../models/service-models/app/v1/product-faq-s-m';
import { UserProductViewModel } from '../models/view/end-user/product/user-product.viewmodel';
import { ReviewSM } from '../models/service-models/app/v1/review-s-m';
import { AppConstants } from '../../app-constants';
import { BoolResponseRoot } from '../models/service-models/foundation/common-response/bool-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import {
  normalizeProductListImageUrl,
  productShareImageUrl,
  resolveImageUrl,
} from '../utils/image-url.util';
import { ProductUtils } from '../utils/product.utils';
import { ProductCacheService } from './product-cache.service';
import { SsrTransferService } from './ssr-transfer.service';
import { SSR_TRANSFER_KEYS, ssrProductDetailKey, ssrProductReviewsKey, ssrProductFaqsKey, ssrCategoryProductsKey } from './ssr-transfer.keys';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends BaseService {
  private readonly LIST_CACHE_TTL_MS = 20_000;
  private readonly memoryCache = new Map<string, { at: number; data: any }>();

  constructor(
    private productClient: ProductClient,
    private ssrTransfer: SsrTransferService,
    private productCache: ProductCacheService,
  ) {
    super();
  }

  private getCached<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.at > this.LIST_CACHE_TTL_MS) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCached<T>(key: string, data: T): void {
    this.memoryCache.set(key, { at: Date.now(), data });
  }

  private clearListCache(): void {
    this.memoryCache.clear();
    this.productCache.invalidateProducts();
  }

  /**
   * Clears short-lived in-memory product list caches (home/shop/best-sellers).
   * Call on tab visibility resume so we refetch from the network instead of reusing stale snapshots.
   */
  invalidateProductListMemoryCache(): void {
    this.clearListCache();
  }

  /**
   * Storefront / home / shop — public `GET /product/paginated` (active products only, no auth).
   * Do not use the admin catalog here: unauthenticated calls get non-JSON or error pages and break JSON parsing.
   */
  async getAllProducts(
    viewModel: AdminProductsViewModel
  ): Promise<ApiResponse<ProductSM[]>> {
    const queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    const cacheKey = `public:${queryFilter.skip}:${queryFilter.top}`;
    const cached = this.getCached<ApiResponse<ProductSM[]>>(cacheKey);
    if (cached) return cached;

    const transferKey =
      queryFilter.skip === 0 && queryFilter.top === 8
        ? SSR_TRANSFER_KEYS.HOME_PRODUCTS
        : `public-products:${queryFilter.skip}:${queryFilter.top}`;

    return this.ssrTransfer.hydrateOrFetch(
      transferKey,
      async () => {
        const response = await this.productClient.GetAllProduct(queryFilter);
        if (!response.isError && response.successData) {
          response.successData = response.successData.map((p) => this.normalizeProductData(p));
          const shouldCache =
            response.successData?.some(
              (p) => Array.isArray((p as any).images) && (p as any).images.length > 0,
            ) ?? false;
          if (shouldCache) this.setCached(cacheKey, response);
        }
        return response;
      },
      (response) => {
        if (!response.isError) {
          this.setCached(cacheKey, response);
        }
      },
    );
  }

  /** Admin product list — authenticated catalog including inactive/archived rows. */
  async getAdminCatalogProducts(
    viewModel: AdminProductsViewModel
  ): Promise<ApiResponse<ProductSM[]>> {
    const queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    const cacheKey = `admin-catalog:${queryFilter.skip}:${queryFilter.top}`;
    const cached = this.getCached<ApiResponse<ProductSM[]>>(cacheKey);
    if (cached) return cached;

    const response = await this.productClient.GetAdminCatalogPaginated(queryFilter);
    if (!response.isError && response.successData) {
      response.successData = response.successData.map(p => this.normalizeProductData(p));
      const shouldCache =
        response.successData?.some(p => Array.isArray((p as any).images) && (p as any).images.length > 0) ?? false;
      if (shouldCache) this.setCached(cacheKey, response);
    }
    return response;
  }

  async getAllProductsBySearchString(
    searchString: string,
    queryFilter?: QueryFilter
  ): Promise<ApiResponse<ProductSM[]> & { searchTotalCount?: number }> {
    const response = await this.productClient.GetAllProductsBySearhString(searchString, queryFilter);
    if (!response.isError && response.successData) {
      const raw = response.successData as any;
      let items: any[] = [];
      if (Array.isArray(raw)) {
        items = raw;
      } else if (raw && Array.isArray(raw.items)) {
        items = raw.items;
        (response as any).searchTotalCount =
          typeof raw.totalCount === 'number' ? raw.totalCount : items.length;
      }
      response.successData = items.map((p) => this.normalizeProductData(p));
    }
    return response;
  }

  /** Admin product list / search — includes archived (inactive) products. */
  async getAdminProductsBySearchString(
    searchString: string,
    queryFilter?: QueryFilter
  ): Promise<ApiResponse<ProductSM[]>> {
    const response = await this.productClient.GetAdminCatalogSearch(searchString, queryFilter);
    if (!response.isError && response.successData) {
      response.successData = response.successData.map(p => this.normalizeProductData(p));
    }
    return response;
  }
  async getTotatProductCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.productClient.GetTotatProductCount();
  }

  /** Admin product list total (includes inactive products). */
  async getAdminTotalProductCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.productClient.GetAdminProductCount();
  }

  async getAllProductsByCategoryId(
    viewModel: UserProductViewModel
  ): Promise<ApiResponse<ProductSM[]>> {
    const queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    let categoryId = viewModel.categoryId;
    const cacheKey = `cat:${categoryId}:${queryFilter.skip}:${queryFilter.top}`;
    const cached = this.getCached<ApiResponse<ProductSM[]>>(cacheKey);
    if (cached) return cached;

    const transferKey = ssrCategoryProductsKey(categoryId, queryFilter.skip, queryFilter.top);

    return this.ssrTransfer.hydrateOrFetch(
      transferKey,
      async () => {
        const response = await this.productClient.GetAllProductsByCategoryId(
          queryFilter,
          categoryId
        );
        if (!response.isError && response.successData) {
          response.successData = response.successData.map((p) => this.normalizeProductData(p));
          const shouldCache =
            response.successData?.some(
              (p) => Array.isArray((p as any).images) && (p as any).images.length > 0,
            ) ?? false;
          if (shouldCache) this.setCached(cacheKey, response);
        }
        return response;
      },
      (response) => {
        if (!response.isError) {
          this.setCached(cacheKey, response);
        }
      },
    );
  }
  async getTotatProductCountByCategoryId(
    categoryId: number
  ): Promise<ApiResponse<IntResponseRoot>> {
    // Backend sometimes returns `{ total: number }` instead of `{ intResponse: number }`.
    // Normalize here so all callers can rely on `intResponse`.
    const resp = await this.productClient.GetTotatProductCountByCategoryId(categoryId);
    if (!resp.isError && resp.successData) {
      const anyData = resp.successData as any;
      if ((anyData.intResponse === undefined || anyData.intResponse === null) && typeof anyData.total === 'number') {
        anyData.intResponse = anyData.total;
      }
      resp.successData = anyData as IntResponseRoot;
    }
    return resp;
  }
  async deleteProduct(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error('Invalid id for delete');
    }
    const resp = await this.productClient.DeleteProductById(id);
    if (!resp.isError) {
      this.clearListCache();
    }
    return resp;
  }

  /**
   * Normalize variant data from API response
   * REFACTOR: Ensure unitId, unitName, unitSymbol are populated from unitValue relation
   */
  private normalizeVariantData(variant: any): any {
    if (!variant) return variant;

    // If unitValue relation exists but unitId/unitName/unitSymbol are missing, populate them
    if (variant.unitValue && !variant.unitId) {
      variant.unitId = variant.unitValueId;
      variant.unitName = variant.unitValue.name || '';
      variant.unitSymbol = variant.unitValue.symbol || variant.unitValue.name || '';
    }

    const nStock = Number(variant.stock);
    variant.stock = Number.isFinite(nStock) ? nStock : 0;

    const nPrice = Number(variant.price);
    if (variant.price != null && variant.price !== '') {
      variant.price = Number.isFinite(nPrice) ? nPrice : 0;
    }

    if (variant.comparePrice != null && variant.comparePrice !== '') {
      const c = Number(variant.comparePrice);
      variant.comparePrice = Number.isFinite(c) ? c : undefined;
    }

    const nQty = Number(variant.quantity);
    if (variant.quantity != null && variant.quantity !== '') {
      variant.quantity = Number.isFinite(nQty) ? nQty : variant.quantity;
    }

    if (variant.weight != null && variant.weight !== '') {
      const w = Number(variant.weight);
      variant.weight = Number.isFinite(w) ? w : null;
    }

    variant.displayUnit = ProductUtils.getDisplayUnit(variant);
    const hasVariantUploads =
      Array.isArray(variant.variantImages) && variant.variantImages.length > 0;
    if (!hasVariantUploads) {
      variant.variantImages = [];
      variant.variantImage = undefined;
      const path = String(variant.variantImagePath || '').trim();
      if (!path || /^https?:\/\//i.test(path)) {
        variant.variantImagePath = undefined;
      }
    }

    return variant;
  }

  /**
   * Normalize product data from API response
   * REFACTOR: Ensure all variants have unitId, unitName, unitSymbol
   * Also normalize images to handle both old format (string[]) and new format (object[])
   */
  private normalizeProductData(product: any): ProductSM {
    if (!product) return product;
    
    // Normalize all variants
    if (product.variants && Array.isArray(product.variants)) {
      product.variants = product.variants.map((v: any) => this.normalizeVariantData(v));
    }
    
    // Normalize images — keep API URLs including ?image= row id for cache-busting.
    if (product.images && Array.isArray(product.images)) {
      product.images = [...new Set(
        product.images.map((img: any) => {
          if (typeof img === 'string') {
            return normalizeProductListImageUrl(img, product.id) ?? img;
          }
          const apiUrl = img?.src || img?.imageUrl;
          if (apiUrl) {
            return normalizeProductListImageUrl(apiUrl, product.id) ?? apiUrl;
          }
          if (product.id && img?.id) {
            return productShareImageUrl(product.id, { imageId: img.id });
          }
          if (product.id) return productShareImageUrl(product.id);
          return null;
        }).filter(Boolean),
      )];
    }
    
    // NOTE: Do not auto-pick API "default" variant here.
    // End-user UI picks the lowest-price variant via ProductUtils.initializeSelectedVariant().

    return product as ProductSM;
  }

  async getProductById(id: number): Promise<ApiResponse<ProductSM>> {
    if (id <= 0) {
      throw new Error('Invalid id for getProductById');
    }
    return this.ssrTransfer.hydrateOrFetch(ssrProductDetailKey(id), async () => {
      const response = await this.productClient.GetProductById(id);
      if (!response.isError && response.successData) {
        response.successData = this.normalizeProductData(response.successData);
      }
      return response;
    });
  }

  async addProduct(formData: FormData): Promise<ApiResponse<ProductSM>> {
    const resp = await this.productClient.AddProduct(formData);
    if (!resp.isError) this.clearListCache();
    return resp;
  }

  /** Server-side convert (HEIC → WebP/JPEG) for admin preview and reliable upload */
  async prepareProductImage(formData: FormData): Promise<Blob> {
    return this.productClient.PrepareProductImage(formData);
  }

  async updateProduct(
    formData: FormData,
    id: number
  ): Promise<ApiResponse<ProductSM>> {
    const resp = await this.productClient.UpdateProduct(formData, id);
    if (!resp.isError) this.clearListCache();
    return resp;
  }

   async setIsBestSellingProductState(id: number,state:BoolResponseRoot): Promise<ApiResponse<BoolResponseRoot>> {
    let apiRequest = new ApiRequest<BoolResponseRoot>();
    apiRequest.reqData = state
    return await this.productClient.SetIsBestSellingProduct(id,apiRequest);
  }
  async getAllIsBestSelling(): Promise<ApiResponse<ProductSM[]>> {
    const cacheKey = `bestselling`;
    const cached = this.getCached<ApiResponse<ProductSM[]>>(cacheKey);
    if (cached) return cached;

    return this.ssrTransfer.hydrateOrFetch(
      SSR_TRANSFER_KEYS.BEST_SELLERS,
      async () => {
        const response = await this.productClient.GetAllIsBestSelling();
        if (!response.isError && response.successData) {
          response.successData = response.successData.map((p) => this.normalizeProductData(p));
          const shouldCache =
            response.successData?.some(
              (p) => Array.isArray((p as any).images) && (p as any).images.length > 0,
            ) ?? false;
          if (shouldCache) this.setCached(cacheKey, response);
        }
        return response;
      },
      (response) => {
        if (!response.isError) {
          this.setCached(cacheKey, response);
        }
      },
    );
  }

  /** Newest active products for home “Fresh Arrivals”. */
  async getNewArrivals(): Promise<ApiResponse<ProductSM[]>> {
    const cacheKey = `new-arrivals`;
    const cached = this.getCached<ApiResponse<ProductSM[]>>(cacheKey);
    if (cached) return cached;

    return this.ssrTransfer.hydrateOrFetch(
      SSR_TRANSFER_KEYS.NEW_ARRIVALS,
      async () => {
        const response = await this.productClient.GetNewArrivals();
        if (!response.isError && response.successData) {
          response.successData = response.successData.map((p) => this.normalizeProductData(p));
          const shouldCache =
            response.successData?.some(
              (p) => Array.isArray((p as any).images) && (p as any).images.length > 0,
            ) ?? false;
          if (shouldCache) this.setCached(cacheKey, response);
        }
        return response;
      },
      (response) => {
        if (!response.isError) {
          this.setCached(cacheKey, response);
        }
      },
    );
  }

  /** Full id+name list for nav (not paginated). */
  async getAllProductNamesOnly(): Promise<ApiResponse<ProductNameIdSM[]>> {
    const cacheKey = `product-names-only`;
    const cached = this.getCached<ApiResponse<ProductNameIdSM[]>>(cacheKey);
    if (cached) return cached;

    return this.ssrTransfer.hydrateOrFetch(
      SSR_TRANSFER_KEYS.PRODUCT_NAMES,
      async () => {
        const response = await this.productClient.GetAllProductNamesOnly();
        if (!response.isError && response.successData) {
          this.setCached(cacheKey, response);
        }
        return response;
      },
      (response) => {
        if (!response.isError) {
          this.setCached(cacheKey, response);
        }
      },
    );
  }

  async getProductReviews(id: number): Promise<ApiResponse<ReviewSM[]>> {
    return this.ssrTransfer.hydrateOrFetch(ssrProductReviewsKey(id), async () => {
      return await this.productClient.GetProductReviews(id);
    });
  }

  // ==================== PRODUCT FAQ ====================

  /** Public storefront: active FAQs for a product, SSR-hydrated. */
  async getActiveFaqs(id: number): Promise<ApiResponse<ProductFaqSM[]>> {
    if (id <= 0) {
      throw new Error('Invalid id for getActiveFaqs');
    }
    return this.ssrTransfer.hydrateOrFetch(ssrProductFaqsKey(id), async () => {
      return await this.productClient.GetActiveFaqsByProduct(id);
    });
  }

  /** Admin: all FAQs (active + inactive) for a product. */
  async getAdminFaqs(productId: number): Promise<ApiResponse<ProductFaqSM[]>> {
    return await this.productClient.GetAdminFaqsByProduct(productId);
  }

  async addFaq(
    productId: number,
    faq: Partial<ProductFaqSM>
  ): Promise<ApiResponse<ProductFaqSM>> {
    return await this.productClient.AddFaq(productId, faq);
  }

  async updateFaq(
    id: number,
    faq: Partial<ProductFaqSM>
  ): Promise<ApiResponse<ProductFaqSM>> {
    return await this.productClient.UpdateFaq(id, faq);
  }

  async setFaqStatus(
    id: number,
    isActive: boolean
  ): Promise<ApiResponse<ProductFaqSM>> {
    return await this.productClient.SetFaqStatus(id, isActive);
  }

  async deleteFaq(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    return await this.productClient.DeleteFaq(id);
  }

  async reorderFaqs(
    productId: number,
    orderedIds: number[]
  ): Promise<ApiResponse<ProductFaqSM[]>> {
    return await this.productClient.ReorderFaqs(productId, orderedIds);
  }
  // async addReview(data: ReviewSM): Promise<ApiResponse<ReviewSM>> {
  //   if (data == null) {
  //     throw new Error(AppConstants.ErrorPrompts.Invalid_Input_Data);
  //   } else {
  //     let apiRequest = new ApiRequest<ReviewSM>();
  //     apiRequest.reqData = data;
  //     let resp = await this.productClient.AddReview(apiRequest);
  //     if (resp.isError) {
  //       throw resp.errorData;
  //     }
  //     return resp;
  //   }
  // }
}
