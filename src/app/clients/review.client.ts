import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import {
  AdditionalRequestDetails,
  Authentication,
} from '../models/internal/additional-request-details';
import { ReviewSM } from '../models/service-models/app/v1/review-s-m';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
@Injectable({
  providedIn: 'root',
})
export class ReviewClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }
  GetAllPaginatedReviews = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<ReviewSM[]>> => {
    let resp = await this.GetResponseAsync<null, ReviewSM[]>(
      `${AppConstants.ApiUrls.REVIEW}/getall/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET',
      null,
      new AdditionalRequestDetails<ReviewSM[]>(false, Authentication.false)
    );

    return resp;
  };

  GetTotatReviewCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    let resp = await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.REVIEW}/count`,
      'GET',
      null,
      new AdditionalRequestDetails<IntResponseRoot>(false, Authentication.false)
    );
    return resp;
  };

  /** Add a new category */
  AddReview = async (
    ReviewFormData: ApiRequest<ReviewSM>
  ): Promise<ApiResponse<ReviewSM>> => {
    let resp = await this.GetResponseAsync<ReviewSM, ReviewSM>(
      `${AppConstants.ApiUrls.REVIEW}/CreateProductReviewByProductId/${ReviewFormData.reqData.productId}`,
      'POST',
      ReviewFormData,
      new AdditionalRequestDetails<ReviewSM>(false, Authentication.false)
    );
    return resp;
  };



  /**
    * Update existing Review
    * 
    * @param updateReview Review data to update
    * @returns Promise<ApiResponse<ReviewSM>>
    * @example
    * const updatedReview = new ReviewSM();
   
    */

    UpdateReview = async (
    apiRequest: ApiRequest<ReviewSM>
  ): Promise<ApiResponse<ReviewSM>> => {
    return await this.GetResponseAsync<ReviewSM, ReviewSM>(
      `${AppConstants.ApiUrls.ADMIN_REVIEW}/update/${apiRequest.reqData.id}`,
      'PUT',
      apiRequest, // ✅ this is now valid JSON
      new AdditionalRequestDetails<ReviewSM>(true, Authentication.true)
    );
  };

UpdateReviewStatus = async (
  apiRequest: ApiRequest<{ isApproved: boolean }>,
  productId: number
): Promise<ApiResponse<ReviewSM>> => {
  return await this.GetResponseAsync(
    `${AppConstants.ApiUrls.ADMIN_REVIEW}/approve/${productId}`,
    'PUT',
    apiRequest,
    new AdditionalRequestDetails(true, Authentication.true)
  );
};

  /**delete Review by id */
  DeleteReviewById = async (
    Id: number
  ): Promise<ApiResponse<DeleteResponseRoot>> => {
    let resp = await this.GetResponseAsync<number, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.ADMIN_REVIEW}/delete/${Id}`,
      'DELETE'
    );
    return resp;
  };

  GetReviewById = async (Id: number): Promise<ApiResponse<ReviewSM>> => {
    let resp = await this.GetResponseAsync<number, ReviewSM>(
      `${AppConstants.ApiUrls.REVIEW}/getbyid/${Id}`,
      'GET'
    );
    return resp;
  };
}
