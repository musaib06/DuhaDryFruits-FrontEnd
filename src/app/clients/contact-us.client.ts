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
import { ContactUsSM } from '../models/service-models/app/v1/contact-us-s-m';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';

@Injectable({
  providedIn: 'root',
})
export class ContactUsClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }
  GetAllPaginatedContactUs = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<ContactUsSM[]>> => {
    let resp = await this.GetResponseAsync<null, ContactUsSM[]>(
      `${AppConstants.ApiUrls.CONTACT_US}/getall/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET'
    );
    
    return resp;
  };

  GetTotatContactUsCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    let resp = await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.CONTACT_US}/count`,
      'GET'
    );
    return resp;
  };

   /** Add a new category */
    AddContactUs  = async (contactUsFormData: ApiRequest<ContactUsSM>): Promise<ApiResponse<ContactUsSM>> => {
        let resp = await this.GetResponseAsync<ContactUsSM, ContactUsSM>(
          `${AppConstants.ApiUrls.CONTACT_US}/create`,
          'POST',
          contactUsFormData, new AdditionalRequestDetails<ContactUsSM>(false, Authentication.false  ));
        return resp;
      };

    UpdateContactUs = async (
  apiRequest: ApiRequest<ContactUsSM>
): Promise<ApiResponse<ContactUsSM>> => {
  return await this.GetResponseAsync<ContactUsSM, ContactUsSM>(
    `${AppConstants.ApiUrls.CONTACT_US}/update/${apiRequest.reqData.id}`,
    'PUT',
    apiRequest,   // ✅ this is now valid JSON
    new AdditionalRequestDetails<ContactUsSM>(true, Authentication.true)
  );
};


        /**
   * Update existing ContactUs
   * 
   * @param updateContactUs ContactUs data to update
   * @returns Promise<ApiResponse<ContactUsSM>>
   * @example
   * const updatedContactUs = new ContactUsSM();
  
   */
  /**delete ContactUs by id */
  DeleteContactUsById = async (
    Id: number
  ): Promise<ApiResponse<DeleteResponseRoot>> => {
    let resp = await this.GetResponseAsync<number, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.CONTACT_US}/delete/${Id}`,
      'DELETE'
    );
    return resp;
  };

  GetContactUsById = async (Id: number): Promise<ApiResponse<ContactUsSM>> => {
    let resp = await this.GetResponseAsync<number, ContactUsSM>(
      `${AppConstants.ApiUrls.CONTACT_US}/getbyid/${Id}`,
      'GET'
    );
    return resp;
  };


}
