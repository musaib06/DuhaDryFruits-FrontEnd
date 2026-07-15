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
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { OrderSM } from '../models/service-models/app/v1/order-s-m';

@Injectable({
  providedIn: 'root',
})
export class OrderClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  /**
   * Get All Orders (Paginated with Filters)
   * GET /api/v1/order?skip=0&top=10&status=paid&customerId=1&startDate=...&endDate=...&search=...&minAmount=...&maxAmount=...
   */
  GetAllOrders = async (
    queryFilter: QueryFilter & {
      status?: string;
      customerId?: number;
      customerName?: string;
      customerEmail?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      minAmount?: number;
      maxAmount?: number;
    }
  ): Promise<ApiResponse<OrderSM[]>> => {
    // Build query string with all filters
    let queryParams = `skip=${queryFilter.skip || 0}&top=${queryFilter.top || 10}`;
    
    if (queryFilter.status) {
      queryParams += `&status=${queryFilter.status}`;
    }
    if (queryFilter.customerId) {
      queryParams += `&customerId=${queryFilter.customerId}`;
    }
    if (queryFilter.customerName) {
      queryParams += `&customerName=${encodeURIComponent(queryFilter.customerName)}`;
    }
    if (queryFilter.customerEmail) {
      queryParams += `&customerEmail=${encodeURIComponent(queryFilter.customerEmail)}`;
    }
    if (queryFilter.startDate) {
      queryParams += `&startDate=${queryFilter.startDate}`;
    }
    if (queryFilter.endDate) {
      queryParams += `&endDate=${queryFilter.endDate}`;
    }
    if (queryFilter.search) {
      queryParams += `&search=${encodeURIComponent(queryFilter.search)}`;
    }
    if (queryFilter.minAmount !== undefined && queryFilter.minAmount !== null) {
      queryParams += `&minAmount=${queryFilter.minAmount}`;
    }
    if (queryFilter.maxAmount !== undefined && queryFilter.maxAmount !== null) {
      queryParams += `&maxAmount=${queryFilter.maxAmount}`;
    }

    const details = new AdditionalRequestDetails<OrderSM[]>(true, Authentication.false);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;

    let resp = await this.GetResponseAsync<null, OrderSM[]>(
      `${AppConstants.ApiUrls.BASE}/order?${queryParams}`,
      'GET',
      null,
      details
    );
    return resp;
  };

  /**
   * Get Order By ID
   * GET /api/v1/order/:id
   */
  GetOrderById = async (
    orderId: number
  ): Promise<ApiResponse<OrderSM>> => {
    const details = new AdditionalRequestDetails<OrderSM>(true, Authentication.false);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;

    let resp = await this.GetResponseAsync<null, OrderSM>(
      `${AppConstants.ApiUrls.BASE}/order/${orderId}`,
      'GET',
      null,
      details
    );
    return resp;
  };

  /**
   * Get Orders By Customer ID
   * GET /api/v1/order/customer/:customerId?skip=0&top=10&status=paid
   */
  GetOrdersByCustomerId = async (
    customerId: number,
    queryFilter: QueryFilter & { status?: string }
  ): Promise<ApiResponse<OrderSM[]>> => {
    let queryParams = `skip=${queryFilter.skip || 0}&top=${queryFilter.top || 10}`;
    if (queryFilter.status) {
      queryParams += `&status=${queryFilter.status}`;
    }

    const details = new AdditionalRequestDetails<OrderSM[]>(true, Authentication.false);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;

    let resp = await this.GetResponseAsync<null, OrderSM[]>(
      `${AppConstants.ApiUrls.BASE}/order/customer/${customerId}?${queryParams}`,
      'GET',
      null,
      details
    );
    return resp;
  };

  /**
   * Update Order Status
   * PUT /api/v1/order/:id/status
   */
  UpdateOrderStatus = async (
    orderId: number,
    status: string
  ): Promise<ApiResponse<OrderSM>> => {
    const apiRequest = new ApiRequest<{ status: string }>();
    apiRequest.reqData = { status };

    const details = new AdditionalRequestDetails<OrderSM>(true, Authentication.true);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;

    let resp = await this.GetResponseAsync<{ status: string }, OrderSM>(
      `${AppConstants.ApiUrls.BASE}/order/${orderId}/status`,
      'PUT',
      apiRequest,
      details
    );
    return resp;
  };
}

