import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import {
  AdditionalRequestDetails,
  Authentication,
} from '../models/internal/additional-request-details';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { ProductSM } from '../models/service-models/app/v1/product-s-m';
import { ProductNameIdSM } from '../models/service-models/app/v1/product-name-id-s-m';
import { ProductFaqSM } from '../models/service-models/app/v1/product-faq-s-m';
import { ReviewSM } from '../models/service-models/app/v1/review-s-m';
import { BoolResponseRoot } from '../models/service-models/foundation/common-response/bool-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { CommonUtils } from './helpers/common-utils.helper';

@Injectable({
  providedIn: 'root',
})
export class ProductClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  /** Add a new product */
  AddProduct = async (formData: FormData): Promise<ApiResponse<ProductSM>> => {
    const details = new AdditionalRequestDetails<ProductSM>(true);
    return await this.GetResponseAsync<FormData, ProductSM>(
      `${AppConstants.ApiUrls.BASE}/admin/product/createproduct`,
      'POST',
      formData,
      details
    );
  };

  /** Update existing Product */
  UpdateProduct = async (
    formData: FormData,
    id: number
  ): Promise<ApiResponse<ProductSM>> => {
    const details = new AdditionalRequestDetails<ProductSM>(true);
    return await this.GetResponseAsync<FormData, ProductSM>(
      `${AppConstants.ApiUrls.BASE}/admin/product/updateproductById/${id}`,
      'PUT',
      formData,
      details
    );
  };
/** Update existing Product */
SetIsBestSellingProduct = async (
  id: number,
  req: ApiRequest<BoolResponseRoot>
): Promise<ApiResponse<BoolResponseRoot>> => {
  return await this.GetResponseAsync<BoolResponseRoot, BoolResponseRoot>(
    `${AppConstants.ApiUrls.BASE}/admin/product/bestselling/state/${id}`,
    'PUT',
    req
  );
};
  /** Convert HEIC / any image to web-displayable WebP/JPEG before product save */
  PrepareProductImage = async (formData: FormData): Promise<Blob> => {
    const token: string = await this.storageservice.getDataFromAnyStorage(AppConstants.DbKeys.ACCESS_TOKEN);
    if (!token) throw new Error('Not authenticated');
    const url = CommonUtils.CombineUrl(
      environment.apiBaseUrl,
      `${AppConstants.ApiUrls.BASE}/admin/product/prepare-image`,
    );
    const response = await axios.post(url, formData, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
      validateStatus: () => true,
    });
    if (response.status < 200 || response.status >= 300) {
      let msg = 'Could not process image';
      try {
        const text = await (response.data as Blob).text();
        const parsed = JSON.parse(text);
        msg = parsed?.errorData?.displayMessage || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    return response.data as Blob;
  };

  /** Public storefront — active products only */
  GetAllProduct = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<ProductSM[]>> => {
    const details = new AdditionalRequestDetails<ProductSM[]>(false, Authentication.false);
    details.useCacheIfPossible = false; // Disable cache to get fresh stock data
    details.forceGetResponseFromApi = true; // Force fresh API call
    return await this.GetResponseAsync<null, ProductSM[]>(
      `${AppConstants.ApiUrls.BASE}/product/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET',
      null,
      details
    );
  };

  /** Admin catalog — includes inactive / archived products */
  GetAdminCatalogPaginated = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<ProductSM[]>> => {
    const details = new AdditionalRequestDetails<ProductSM[]>(true);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;
    return await this.GetResponseAsync<null, ProductSM[]>(
      `${AppConstants.ApiUrls.BASE}/admin/product/catalog/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET',
      null,
      details
    );
  };

  GetAdminProductCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    const details = new AdditionalRequestDetails<IntResponseRoot>(false);
    details.forceGetResponseFromApi = true;
    return await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.BASE}/admin/product/catalog/count`,
      'GET',
      null,
      details
    );
  };

  GetAdminProductById = async (id: number): Promise<ApiResponse<ProductSM>> => {
    // Never use HTTP cache for this call — large payloads + IndexedDB cache can corrupt responses.
    const details = new AdditionalRequestDetails<ProductSM>(false);
    details.forceGetResponseFromApi = true;
    return await this.GetResponseAsync<null, ProductSM>(
      `${AppConstants.ApiUrls.BASE}/admin/product/detail/${id}`,
      'GET',
      null,
      details
    );
  };

  /** Admin catalog search — includes inactive products (auth). */
  GetAdminCatalogSearch = async (
    searchString: string,
    queryFilter?: QueryFilter
  ): Promise<ApiResponse<ProductSM[]>> => {
    const details = new AdditionalRequestDetails<ProductSM[]>(true);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;
    const skip = queryFilter?.skip ?? 0;
    const top = queryFilter?.top ?? 20;
    const encodedQ = encodeURIComponent(searchString || '');
    return await this.GetResponseAsync<null, ProductSM[]>(
      `${AppConstants.ApiUrls.BASE}/admin/product/catalog/search?q=${encodedQ}&skip=${skip}&top=${top}`,
      'GET',
      null,
      details
    );
  };
  /** Retrieves all Products by search string */
  GetAllProductsBySearhString = async (
    searchString: string,
    queryFilter?: QueryFilter
  ): Promise<ApiResponse<ProductSM[]>> => {
    const details = new AdditionalRequestDetails<ProductSM[]>(false, Authentication.false);
    details.useCacheIfPossible = false; // Disable cache to get fresh stock data
    details.forceGetResponseFromApi = true; // Force fresh API call
    const skip = queryFilter?.skip ?? 0;
    const top = queryFilter?.top ?? 20;
    const encodedQ = encodeURIComponent(searchString || '');
    return await this.GetResponseAsync<null, ProductSM[]>(
      `${AppConstants.ApiUrls.BASE}/product/search/?q=${encodedQ}&skip=${skip}&top=${top}`,
      'GET',
      null,
      details
    );
  };

  /** Retrieves all Products (paginated) By category Id */
  GetAllProductsByCategoryId = async (
    queryFilter: QueryFilter,
    categoryId: number
  ): Promise<ApiResponse<ProductSM[]>> => {
    const details = new AdditionalRequestDetails<ProductSM[]>(false, Authentication.false);
    details.useCacheIfPossible = false; // Disable cache to get fresh stock data
    details.forceGetResponseFromApi = true; // Force fresh API call
    return await this.GetResponseAsync<null, ProductSM[]>(
      `${AppConstants.ApiUrls.BASE}/product/ByCategoryId/${categoryId}/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET',
      null,
      details
    );
  };
  /** Get total product count  By CategoryId*/
  GetTotatProductCountByCategoryId = async (
    categoryId: number
  ): Promise<ApiResponse<IntResponseRoot>> => {
    return await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.BASE}/product/count/ByCategoryId/${categoryId}`,
      'GET',
      null,
      new AdditionalRequestDetails<IntResponseRoot>(false, Authentication.false)
    );
  };

  /** Get total product count */
  GetTotatProductCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    return await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.BASE}/product/count`,
      'GET',
      null,
      new AdditionalRequestDetails<IntResponseRoot>(false, Authentication.false)
    );
  };

  /** Get product by id */
  GetProductById = async (Id: number): Promise<ApiResponse<ProductSM>> => {
    const details = new AdditionalRequestDetails<ProductSM>(false, Authentication.false);
    details.useCacheIfPossible = false; // Disable cache to get fresh stock data
    details.forceGetResponseFromApi = true; // Force fresh API call
    return await this.GetResponseAsync<number, ProductSM>(
      `${AppConstants.ApiUrls.BASE}/product/${Id}`,
      'GET',
      null,
      details
    );
  };

  /** Delete product by id */
  DeleteProductById = async (
    Id: number
  ): Promise<ApiResponse<DeleteResponseRoot>> => {
    const details = new AdditionalRequestDetails<DeleteResponseRoot>(true);
    return await this.GetResponseAsync<number, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.BASE}/admin/product/deleteproductById/${Id}`,
      'DELETE',
      null,
      details
    );
  };

  GetAllIsBestSelling = async (): Promise<ApiResponse<ProductSM[]>> => {
    const details = new AdditionalRequestDetails<ProductSM[]>(false, Authentication.false);
    details.useCacheIfPossible = false; // Disable cache to get fresh stock data
    details.forceGetResponseFromApi = true; // Force fresh API call
    return await this.GetResponseAsync<null, ProductSM[]>(
      `${AppConstants.ApiUrls.BASE}/product/isBestSelling`,
      'GET',
      null,
      details
    );
  };

  /** All product id + name (no pagination; shop dropdown / navigation) */
  GetAllProductNamesOnly = async (): Promise<ApiResponse<ProductNameIdSM[]>> => {
    return await this.GetResponseAsync<null, ProductNameIdSM[]>(
      `${AppConstants.ApiUrls.BASE}/product/names`,
      'GET',
      null,
      new AdditionalRequestDetails<ProductNameIdSM[]>(false, Authentication.false)
    );
  };
  GetProductReviews = async (id: number): Promise<ApiResponse<ReviewSM[]>> => {
    return await this.GetResponseAsync<null, ReviewSM[]>(
      `${AppConstants.ApiUrls.BASE}/review/GetAllPaginatedProductReviewsByProductId/${id}`,
      'GET',
      null,
      new AdditionalRequestDetails<ReviewSM[]>(false, Authentication.false)
    );
  };

  // ==================== PRODUCT FAQ ====================

  /** Public: get active FAQs for a product (storefront). */
  GetActiveFaqsByProduct = async (
    productId: number
  ): Promise<ApiResponse<ProductFaqSM[]>> => {
    const details = new AdditionalRequestDetails<ProductFaqSM[]>(false, Authentication.false);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;
    return await this.GetResponseAsync<null, ProductFaqSM[]>(
      `${AppConstants.ApiUrls.BASE}/product/${productId}/faqs`,
      'GET',
      null,
      details
    );
  };

  /** Admin: get all FAQs (active + inactive) for a product. */
  GetAdminFaqsByProduct = async (
    productId: number
  ): Promise<ApiResponse<ProductFaqSM[]>> => {
    const details = new AdditionalRequestDetails<ProductFaqSM[]>(true);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;
    return await this.GetResponseAsync<null, ProductFaqSM[]>(
      `${AppConstants.ApiUrls.BASE}/admin/product/${productId}/faqs`,
      'GET',
      null,
      details
    );
  };

  /** Admin: create a FAQ for a product. */
  AddFaq = async (
    productId: number,
    faq: Partial<ProductFaqSM>
  ): Promise<ApiResponse<ProductFaqSM>> => {
    return await this.GetResponseAsync<{ reqData: string }, ProductFaqSM>(
      `${AppConstants.ApiUrls.BASE}/admin/product/${productId}/faqs`,
      'POST',
      { reqData: JSON.stringify(faq) },
      new AdditionalRequestDetails<ProductFaqSM>(true)
    );
  };

  /** Admin: update a FAQ. */
  UpdateFaq = async (
    id: number,
    faq: Partial<ProductFaqSM>
  ): Promise<ApiResponse<ProductFaqSM>> => {
    return await this.GetResponseAsync<{ reqData: string }, ProductFaqSM>(
      `${AppConstants.ApiUrls.BASE}/admin/product/faqs/${id}`,
      'PUT',
      { reqData: JSON.stringify(faq) },
      new AdditionalRequestDetails<ProductFaqSM>(true)
    );
  };

  /** Admin: enable/disable a FAQ. */
  SetFaqStatus = async (
    id: number,
    isActive: boolean
  ): Promise<ApiResponse<ProductFaqSM>> => {
    return await this.GetResponseAsync<{ reqData: string }, ProductFaqSM>(
      `${AppConstants.ApiUrls.BASE}/admin/product/faqs/${id}/status`,
      'PATCH',
      { reqData: JSON.stringify({ isActive }) },
      new AdditionalRequestDetails<ProductFaqSM>(true)
    );
  };

  /** Admin: delete a FAQ. */
  DeleteFaq = async (id: number): Promise<ApiResponse<DeleteResponseRoot>> => {
    return await this.GetResponseAsync<null, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.BASE}/admin/product/faqs/${id}`,
      'DELETE',
      null,
      new AdditionalRequestDetails<DeleteResponseRoot>(true)
    );
  };

  /** Admin: reorder FAQs for a product using an ordered list of FAQ ids. */
  ReorderFaqs = async (
    productId: number,
    orderedIds: number[]
  ): Promise<ApiResponse<ProductFaqSM[]>> => {
    return await this.GetResponseAsync<{ reqData: string }, ProductFaqSM[]>(
      `${AppConstants.ApiUrls.BASE}/admin/product/${productId}/faqs/reorder`,
      'PUT',
      { reqData: JSON.stringify({ orderedIds }) },
      new AdditionalRequestDetails<ProductFaqSM[]>(true)
    );
  };

  // AddReview = async (
  //   ReviewFormData: ReviewSM
  // ): Promise<ApiRequest<ReviewSM>> => {
  //   return await this.GetResponseAsync<ReviewSM, ReviewSM>(
  //     `${AppConstants.ApiUrls.BASE}/review/AddReview`,
  //     'POST',
  //     ReviewFormData,
  //     new AdditionalRequestDetails<ReviewSM>(false, Authentication.false)
  //   );
  // };
  // AddReview = async (add: ReviewSM): Promise<ApiResponse<ReviewSM>> => {
  //   console.log(add);

  //   let resp = await this.GetResponseAsync<ReviewSM, ReviewSM>(
  //     AppConstants.ApiUrls.BASE +
  //       '/review/CreateProductReviewByProductId/' +
  //       add.productId,
  //     'POST',
  //     add,
  //     null,
  //     new AdditionalRequestDetails<ReviewSM>(false, Authentication.false)
  //   );
  //   return resp;
  // };

  // AddReview = async (
  //   reviewFormData: ApiRequest<ReviewSM>
  // ): Promise<ApiResponse<ReviewSM>> => {
  //   let resp = await this.GetResponseAsync<ReviewSM, ReviewSM>(
  //     `${AppConstants.ApiUrls.CONTACT_US}/create`,
  //     'POST',
  //     reviewFormData,

  //     new AdditionalRequestDetails<ReviewSM>(false, Authentication.false)
  //   );
  //   return resp;
  // };
}
