import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import { AdditionalRequestDetails, Authentication } from '../models/internal/additional-request-details';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { UnitsSM } from '../models/service-models/app/v1/units-s-m';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';

@Injectable({
  providedIn: 'root',
})
export class UnitsClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  /** Add a new Units */
    AddUnits = async (
      ReviewFormData: ApiRequest<UnitsSM>
    ): Promise<ApiResponse<UnitsSM>> => {
      let resp = await this.GetResponseAsync<UnitsSM, UnitsSM>(
        `${AppConstants.ApiUrls.UNITS}/createUnit`,
        'POST',
        ReviewFormData
      );
      return resp;
    };

  /** Update existing Units */
    UpdateUnits = async (
      apiRequest: ApiRequest<UnitsSM>
    ): Promise<ApiResponse<UnitsSM>> => {
      return await this.GetResponseAsync<UnitsSM, UnitsSM>(
        `${AppConstants.ApiUrls.UNITS}/updateUnit/${apiRequest.reqData.id}`,
        'PUT',
        apiRequest
      );
    };

  /** Retrieves all Categories (paginated) */
  GetAllUnits = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<UnitsSM[]>> => {
    return await this.GetResponseAsync<null, UnitsSM[]>(
      `${AppConstants.ApiUrls.UNITS}/getAllUnitsBySkipTop?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET',null, new AdditionalRequestDetails<UnitsSM[]>(false, Authentication.false  )
    );
  };

  /** Get total Units count */
  GetTotatUnitsCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    return await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.UNITS}/count`,
      'GET', null, new AdditionalRequestDetails<IntResponseRoot>(false, Authentication.false  )
    );
  };

  /** Get Units by id */
  GetUnitsById = async (Id: number): Promise<ApiResponse<UnitsSM>> => {
    return await this.GetResponseAsync<number, UnitsSM>(
      `${AppConstants.ApiUrls.UNITS}/getSingleUnit/${Id}`,
      'GET'
    );
  };

  /** Delete Units by id */
  DeleteUnitsById = async (
    Id: number
  ): Promise<ApiResponse<DeleteResponseRoot>> => {
    return await this.GetResponseAsync<number, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.UNITS}/deleteUnit/${Id}`,
      'DELETE'
    );
  };
}
