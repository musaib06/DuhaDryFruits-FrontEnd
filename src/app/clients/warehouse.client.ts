import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { WareHouseSM } from '../models/service-models/app/v1/warehouse-s-m';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
@Injectable({
  providedIn: 'root',
})
export class WarehouseClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  /**Get all Warehouses */

  GetAllWarehouses = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<WareHouseSM[]>> => {
    let resp = await this.GetResponseAsync<null, WareHouseSM[]>(
      `${AppConstants.ApiUrls.LOG_URL}/my?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET'
    );
    return resp;
  };

  GetTotatWareHouseCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    let resp = await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.LOG_URL}/count`,
      'GET'
    );
    return resp;
  };

  /**delete wareshouse by id */
  DeleteWarehouseById = async (
    Id: number
  ): Promise<ApiResponse<DeleteResponseRoot>> => {
    let resp = await this.GetResponseAsync<number, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.LOG_URL}/${Id}`,
      'DELETE'
    );
    return resp;
  };

  GetWarehouseById = async (Id: number): Promise<ApiResponse<WareHouseSM>> => {
    let resp = await this.GetResponseAsync<number, WareHouseSM>(
      `${AppConstants.ApiUrls.LOG_URL}/${Id}`,
      'GET'
    );
    return resp;
  };

  AddWarehouse = async (
    addWarehouse: ApiRequest<WareHouseSM>
  ): Promise<ApiResponse<WareHouseSM>> => {
    let resp = await this.GetResponseAsync<WareHouseSM, WareHouseSM>(
      `${AppConstants.ApiUrls.LOG_URL}/my`,
      'POST',
      addWarehouse
    );
    return resp;
  };
  UpdateWarehouse = async (
    updateWarehouse: ApiRequest<WareHouseSM>
  ): Promise<ApiResponse<WareHouseSM>> => {
    let resp = await this.GetResponseAsync<WareHouseSM, WareHouseSM>(
      `${AppConstants.ApiUrls.LOG_URL}/my?warehouseId=${updateWarehouse.reqData.id}`,
      'PUT',
      updateWarehouse
    );
    return resp;
  };
}
