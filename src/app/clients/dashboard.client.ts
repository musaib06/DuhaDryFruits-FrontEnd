import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { AppConstants } from '../../app-constants';
import {
  AdditionalRequestDetails,
  Authentication,
} from '../models/internal/additional-request-details';
import { DashboardSM } from '../models/service-models/app/v1/dashboard-s-m';

@Injectable({
  providedIn: 'root',
})
export class DashboardClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  /**
   * Get Admin Dashboard Data
   * GET /api/v1/dashboard?dateFilter={filter}&startDate={start}&endDate={end}
   */
  GetDashboardData = async (
    dateFilter?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<DashboardSM>> => {
    const details = new AdditionalRequestDetails<DashboardSM>(true, Authentication.true);
    details.useCacheIfPossible = false; // Disable cache for dashboard to avoid stale data
    details.forceGetResponseFromApi = true; // Force fresh API call

    // Build query params
    const params = new URLSearchParams();
    if (dateFilter) params.append('dateFilter', dateFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const url = queryString
      ? `${AppConstants.ApiUrls.BASE}/dashboard?${queryString}`
      : `${AppConstants.ApiUrls.BASE}/dashboard`;

    let resp = await this.GetResponseAsync<null, DashboardSM>(
      url,
      'GET',
      null,
      details
    );
    return resp;
  };
}

