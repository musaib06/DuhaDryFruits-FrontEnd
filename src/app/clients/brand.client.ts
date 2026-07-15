import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { BrandSM } from '../models/service-models/app/v1/brand-s-m';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
@Injectable({
  providedIn: 'root',
})
export class LicenseClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }
  GetAllLicenses = async (queryFilter:QueryFilter): Promise<ApiResponse<BrandSM[]>> => {
    let resp = await this.GetResponseAsync<null, BrandSM[]>(`${AppConstants.ApiUrls.LICENSE}?skip=${queryFilter.skip}&top=${queryFilter.top}`, 'GET');
    return resp;
  };

  GetTotatLicenseCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    let resp = await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.LOG_URL}/count`,
      'GET'
    );
    return resp;
    }

      AddLicense= async (
    addBrand: ApiRequest<BrandSM>
  ): Promise<ApiResponse<BrandSM>> => {
    let resp = await this.GetResponseAsync<BrandSM, BrandSM>(
      `${AppConstants.ApiUrls.LOG_URL}`,
      'POST',
      addBrand
    );
    return resp;
  };

  /**delete brand by id */
  DeleteBrandById = async (
    Id: number
  ): Promise<ApiResponse<DeleteResponseRoot>> => {
    let resp = await this.GetResponseAsync<number, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.LOG_URL}/${Id}`,
      'DELETE'
    );
    return resp;
  };

  GetBrandById = async (Id: number): Promise<ApiResponse<BrandSM>> => {
    let resp = await this.GetResponseAsync<number, BrandSM>(
      `${AppConstants.ApiUrls.LOG_URL}/${Id}`,
      'GET'
    );
    return resp;
  };



  /**
   * Update existing brand
   * 
   * @param updateBrand Brand data to update
   * @returns Promise<ApiResponse<BrandSM>>
   * @example
   * const updatedBrand = new BrandSM();
  
   */
  UpdateBrand = async (
    updateBrand: ApiRequest<BrandSM>
  ): Promise<ApiResponse<BrandSM>> => {
    let resp = await this.GetResponseAsync<BrandSM, BrandSM>(
      `${AppConstants.ApiUrls.LOG_URL}/${updateBrand.reqData.id}`,
      'PUT',
      updateBrand
    );
    return resp;
  };
}
