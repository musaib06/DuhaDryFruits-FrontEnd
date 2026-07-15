import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import { BannerSM } from '../models/service-models/app/v1/website-resource/banner-s-m';
import {
  AdditionalRequestDetails,
  Authentication,
} from '../models/internal/additional-request-details';
import { log } from 'console';
@Injectable({
  providedIn: 'root',
})
export class BannerClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }
  GetAllBanners = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<BannerSM[]>> => {
    let resp = await this.GetResponseAsync<null, BannerSM[]>(
      `${AppConstants.ApiUrls.Banner}/getall/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET',
      null,
      new AdditionalRequestDetails<BannerSM[]>(false, Authentication.false)
    );
    
    return resp;
  };

  GetTotatBannerCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    let resp = await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.Banner}/count`,
      'GET',
      null,
      new AdditionalRequestDetails<IntResponseRoot>(false, Authentication.false)
    );
    return resp;
  };

   /** Add a new category */
    AddBanner = async (formData: FormData): Promise<ApiResponse<BannerSM>> => {
      const details = new AdditionalRequestDetails<BannerSM>(true); // enable auth
      return await this.GetResponseAsync<FormData, BannerSM>(
        `${AppConstants.ApiUrls.Banner}/create`,
        'POST',
        formData,
        details
      );
    };
  /**delete Banner by id */
  DeleteBannerById = async (
    Id: number
  ): Promise<ApiResponse<DeleteResponseRoot>> => {
    let resp = await this.GetResponseAsync<number, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.Banner}/delete/${Id}`,
      'DELETE'
    );
    return resp;
  };

  GetBannerById = async (Id: number): Promise<ApiResponse<BannerSM>> => {
    let resp = await this.GetResponseAsync<number, BannerSM>(
      `${AppConstants.ApiUrls.Banner}/getbyid/${Id}`,
      'GET'
    );
    return resp;
  };

  /**
   * Update existing Banner
   * 
   * @param updateBanner Banner data to update
   * @returns Promise<ApiResponse<BannerSM>>
   * @example
   * const updatedBanner = new BannerSM();
  
   */

 
  
    /** Update existing Category */
    UpdateBanner = async (
      formData: FormData,
      id: number
    ): Promise<ApiResponse<BannerSM>> => {
      const details = new AdditionalRequestDetails<BannerSM>(true); // enable auth
      return await this.GetResponseAsync<FormData, BannerSM>(
        `${AppConstants.ApiUrls.Banner}/update/${id}`,
        'PUT',
        formData,
        details
      );
    };
}
