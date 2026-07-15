import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import { UnitsSM } from '../models/service-models/app/v1/units-s-m';
import { UnitsClient } from '../clients/unit.client';
import { AdminUnitsViewModel } from '../models/view/Admin/admin.units.viewmodel';

@Injectable({
  providedIn: 'root',
})
export class UnitsService extends BaseService {
  constructor(private UnitsClient: UnitsClient) {
    super();
  }

//   /**
//    * Retrieves all Unitss from the server.
//    *
//    * @returns A promise that resolves to an ApiResponse containing an array of UnitsSM objects.
//    *
//    * @throws Will throw an error if the server request fails.
//    */
  async getAllPaginatedUnits(
    viewModel: AdminUnitsViewModel
  ): Promise<ApiResponse<UnitsSM[]>> {
    let queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    return await this.UnitsClient.GetAllUnits(queryFilter);
  }

  async getTotalUnitsCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.UnitsClient.GetTotatUnitsCount();
  }
  async deleteUnits(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.UnitsClient.DeleteUnitsById(id);
  }

  async getUnitsById(id: number): Promise<ApiResponse<UnitsSM>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.UnitsClient.GetUnitsById(id);
  }


async addUnits(formData: UnitsSM): Promise<ApiResponse<UnitsSM>> {
let apiRequest = new ApiRequest<UnitsSM>();
      apiRequest.reqData = formData;
  return await this.UnitsClient.AddUnits(apiRequest);
}
async updateUnits(formData: UnitsSM): Promise<ApiResponse<UnitsSM>> {
  const apiRequest = new ApiRequest<UnitsSM>();
  apiRequest.reqData = formData;   // ✅ properly wrap
  return await this.UnitsClient.UpdateUnits(apiRequest);
}
// async updateUnitsStatus(
//   formData: { isApproved: boolean }, 
//   productId: number
// ): Promise<ApiResponse<UnitsSM>> {
//   const apiRequest = new ApiRequest<typeof formData>();
//   apiRequest.reqData = formData;

//   return await this.UnitsClient.uni(apiRequest, productId);
// }


}
