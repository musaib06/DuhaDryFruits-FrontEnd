import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { WareHouseSM } from '../models/service-models/app/v1/warehouse-s-m';
import { WarehouseClient } from '../clients/warehouse.client';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { WarehouseViewModel } from '../models/view/end-user/warehouse.viewmodel';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService extends BaseService {
  constructor(
    private warehouseClient: WarehouseClient
  ) {
    super();
  }

  async getAllWareHouses(viewModel:WarehouseViewModel): Promise<ApiResponse<WareHouseSM[]>> {
    let queryFilter = new QueryFilter();
    queryFilter.skip = (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize
    return await this.warehouseClient.GetAllWarehouses(queryFilter);
}

async getTotatWareHouseCount(): Promise<ApiResponse<IntResponseRoot>> {
  return await this.warehouseClient.GetTotatWareHouseCount()
  }
  async deleteWarehouse(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.warehouseClient.DeleteWarehouseById(id);
  }

  async getWarehouseById(id: number): Promise<ApiResponse<WareHouseSM>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.warehouseClient.GetWarehouseById(id);
  }

  async addWarehouse(
    warehouseData: WareHouseSM
  ): Promise<ApiResponse<WareHouseSM>> {
    if (!warehouseData) {
      throw new Error(AppConstants.ErrorPrompts.Invalid_Input_Data);
    } else {
      let apiRequest = new ApiRequest<WareHouseSM>();
      apiRequest.reqData = warehouseData;
      return await this.warehouseClient.AddWarehouse(apiRequest);
    }
  }
  async updateWarehouse(
    warehouseData: WareHouseSM
  ): Promise<ApiResponse<WareHouseSM>> {
    if (!warehouseData) {
      throw new Error(AppConstants.ErrorPrompts.Invalid_Input_Data);
    } else {
      let apiRequest = new ApiRequest<WareHouseSM>();
      apiRequest.reqData = warehouseData;
      return await this.warehouseClient.UpdateWarehouse(apiRequest);
    }
  }
}
