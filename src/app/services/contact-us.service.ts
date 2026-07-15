import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import { ContactUsClient } from '../clients/contact-us.client';
import { ContactUsViewModel } from '../models/view/Admin/contact-us.viewmodel';
import { ContactUsSM } from '../models/service-models/app/v1/contact-us-s-m';

@Injectable({
  providedIn: 'root',
})
export class ContactUsService extends BaseService {
  constructor(private ContactUsClient: ContactUsClient) {
    super();
  }

  /**
   * Retrieves all ContactUss from the server.
   *
   * @returns A promise that resolves to an ApiResponse containing an array of ContactUsSM objects.
   *
   * @throws Will throw an error if the server request fails.
   */
  async getAllPaginatedContactUs(
    viewModel: ContactUsViewModel
  ): Promise<ApiResponse<ContactUsSM[]>> {
    let queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    return await this.ContactUsClient.GetAllPaginatedContactUs(queryFilter);
  }

  async getTotalContactUsCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.ContactUsClient.GetTotatContactUsCount();
  }
  async deleteContactUs(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.ContactUsClient.DeleteContactUsById(id);
  }

  async getContactUsById(id: number): Promise<ApiResponse<ContactUsSM>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.ContactUsClient.GetContactUsById(id);
  }


async addContactUs(formData: ContactUsSM): Promise<ApiResponse<ContactUsSM>> {
let apiRequest = new ApiRequest<ContactUsSM>();
      apiRequest.reqData = formData;
  return await this.ContactUsClient.AddContactUs(apiRequest);
}
async updateContactUs(formData: ContactUsSM): Promise<ApiResponse<ContactUsSM>> {
  const apiRequest = new ApiRequest<ContactUsSM>();
  apiRequest.reqData = formData;   // ✅ properly wrap

  return await this.ContactUsClient.UpdateContactUs(apiRequest);
}

}
