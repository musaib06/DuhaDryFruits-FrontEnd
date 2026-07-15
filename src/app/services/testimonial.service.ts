import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import { TestimonialClient } from '../clients/testimonial.client';
import { TestimonialViewModel } from '../models/view/website-resource/testimonial.viewmodel';
import { TestimonialSM } from '../models/service-models/app/v1/website-resource/testimonial-s-m';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { SsrTransferService } from './ssr-transfer.service';
import { SSR_TRANSFER_KEYS } from './ssr-transfer.keys';


@Injectable({
  providedIn: 'root',
})
export class TestimonialService extends BaseService {
  constructor(
    private TestimonialClient: TestimonialClient,
    private ssrTransfer: SsrTransferService,
  ) {
    super();
  }

  /** Home carousel — SSR transfer avoids duplicate fetch on hydration. */
  async getStorefrontTestimonials(
    viewModel: TestimonialViewModel,
  ): Promise<ApiResponse<TestimonialSM[]>> {
    return this.ssrTransfer.hydrateOrFetch(
      SSR_TRANSFER_KEYS.STOREFRONT_TESTIMONIALS,
      () => this.getAllPaginatedTestimonial(viewModel),
    );
  }

/**
   * Retrieves all Testimonials from the server.
   *
   * @returns A promise that resolves to an ApiResponse containing an array of TestimonialSM objects.
   *
   * @throws Will throw an error if the server request fails.
   */
  async getAllPaginatedTestimonial(
    viewModel: TestimonialViewModel
  ): Promise<ApiResponse<TestimonialSM[]>> {
    let queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    return await this.TestimonialClient.GetAllPaginatedTestimonial(queryFilter);
  }

  async getTotalTestimonialCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.TestimonialClient.GetTotatTestimonialCount();
  }
  async deleteTestimonial(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.TestimonialClient.DeleteTestimonialById(id);
  }

  async getTestimonialById(id: number): Promise<ApiResponse<TestimonialSM>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.TestimonialClient.GetTestimonialById(id);
  }


async addTestimonial(formData: TestimonialSM): Promise<ApiResponse<TestimonialSM>> {
let apiRequest = new ApiRequest<TestimonialSM>();
      apiRequest.reqData = formData;
  return await this.TestimonialClient.AddTestimonial(apiRequest);
}
async updateTestimonial(formData: TestimonialSM): Promise<ApiResponse<TestimonialSM>> {
  const apiRequest = new ApiRequest<TestimonialSM>();
  apiRequest.reqData = formData;   // ✅ properly wrap

  return await this.TestimonialClient.UpdateTestimonial(apiRequest);
}

}
