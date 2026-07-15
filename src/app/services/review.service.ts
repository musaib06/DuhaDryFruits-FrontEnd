import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import { ReviewClient } from '../clients/review.client';
import { ReviewViewModel } from '../models/view/Admin/review.viewmodel';
import { ReviewSM } from '../models/service-models/app/v1/review-s-m';

@Injectable({
  providedIn: 'root',
})
export class ReviewService extends BaseService {
  constructor(private reviewClient: ReviewClient) {
    super();
  }

//   /**
//    * Retrieves all Reviews from the server.
//    *
//    * @returns A promise that resolves to an ApiResponse containing an array of ReviewSM objects.
//    *
//    * @throws Will throw an error if the server request fails.
//    */
  async getAllPaginatedReview(
    viewModel: ReviewViewModel
  ): Promise<ApiResponse<ReviewSM[]>> {
    let queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    return await this.reviewClient.GetAllPaginatedReviews(queryFilter);
  }

  async getTotalReviewCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.reviewClient.GetTotatReviewCount();
  }
  async deleteReview(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.reviewClient.DeleteReviewById(id);
  }

  async getReviewById(id: number): Promise<ApiResponse<ReviewSM>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.reviewClient.GetReviewById(id);
  }


async addReview(formData: ReviewSM): Promise<ApiResponse<ReviewSM>> {
let apiRequest = new ApiRequest<ReviewSM>();
      apiRequest.reqData = formData;
  return await this.reviewClient.AddReview(apiRequest);
}
async updateReview(formData: ReviewSM): Promise<ApiResponse<ReviewSM>> {
  const apiRequest = new ApiRequest<ReviewSM>();
  apiRequest.reqData = formData;   // ✅ properly wrap

  return await this.reviewClient.UpdateReview(apiRequest);
}
async updateReviewStatus(
  formData: { isApproved: boolean }, 
  productId: number
): Promise<ApiResponse<ReviewSM>> {
  const apiRequest = new ApiRequest<typeof formData>();
  apiRequest.reqData = formData;

  return await this.reviewClient.UpdateReviewStatus(apiRequest, productId);
}


}
