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
import { TestimonialSM } from '../models/service-models/app/v1/website-resource/testimonial-s-m';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
@Injectable({
  providedIn: 'root',
})
export class TestimonialClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }
  GetAllPaginatedTestimonial = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<TestimonialSM[]>> => {
    let resp = await this.GetResponseAsync<null, TestimonialSM[]>(
      `${AppConstants.ApiUrls.TESTIMONIAL}/getall/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET',
      null,
      new AdditionalRequestDetails<TestimonialSM[]>(false, Authentication.false) // ✅ Add this
    );
    return resp;
  };
 
   GetTotatTestimonialCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
     let resp = await this.GetResponseAsync<null, IntResponseRoot>(
       `${AppConstants.ApiUrls.TESTIMONIAL}/count`,
          'GET',
          null,
          new AdditionalRequestDetails<IntResponseRoot>(false, Authentication.false) // ✅ Add this
        );
     return resp;
   };
 
    /** Add a new category */
     AddTestimonial  = async (TestimonialFormData: ApiRequest<TestimonialSM>): Promise<ApiResponse<TestimonialSM>> => {
         let resp = await this.GetResponseAsync<TestimonialSM, TestimonialSM>(
           `${AppConstants.ApiUrls.TESTIMONIAL}/create`,
           'POST',
           TestimonialFormData, new AdditionalRequestDetails<TestimonialSM>(false, Authentication.true  )
         );
         return resp;
       };
 
     UpdateTestimonial = async (
   apiRequest: ApiRequest<TestimonialSM>
 ): Promise<ApiResponse<TestimonialSM>> => {
   return await this.GetResponseAsync<TestimonialSM, TestimonialSM>(
     `${AppConstants.ApiUrls.TESTIMONIAL}/update/${apiRequest.reqData.id}`,
     'PUT',
     apiRequest,   // ✅ this is now valid JSON
     new AdditionalRequestDetails<TestimonialSM>(true, Authentication.true)
   );
 };
 
 
         /**
    * Update existing Testimonial
    * 
    * @param updateTestimonial Testimonial data to update
    * @returns Promise<ApiResponse<TestimonialSM>>
    * @example
    * const updatedTestimonial = new TestimonialSM();
   
    */
   /**delete Testimonial by id */
   DeleteTestimonialById = async (
     Id: number
   ): Promise<ApiResponse<DeleteResponseRoot>> => {
     let resp = await this.GetResponseAsync<number, DeleteResponseRoot>(
       `${AppConstants.ApiUrls.TESTIMONIAL}/delete/${Id}`,
       'DELETE'
     );
     return resp;
   };
 
   GetTestimonialById = async (Id: number): Promise<ApiResponse<TestimonialSM>> => {
     let resp = await this.GetResponseAsync<number, TestimonialSM>(
       `${AppConstants.ApiUrls.TESTIMONIAL}/getbyid/${Id}`,
       'GET'
     );
     return resp;
   };
}
