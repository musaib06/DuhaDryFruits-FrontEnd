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
import { InvoiceSM } from '../models/service-models/app/v1/invoice-s-m';

@Injectable({
  providedIn: 'root',
})
export class InvoiceClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  /**
   * Get All Invoices (Paginated)
   * GET /api/v1/invoice?skip=0&top=20&status=paid&startDate=2024-01-01&endDate=2024-01-31
   */
  GetAllInvoices = async (
    queryFilter: QueryFilter & {
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<InvoiceSM[]>> => {
    let queryParams = `skip=${queryFilter.skip || 0}&top=${queryFilter.top || 20}`;
    if (queryFilter.status) {
      queryParams += `&status=${queryFilter.status}`;
    }
    if (queryFilter.startDate) {
      queryParams += `&startDate=${queryFilter.startDate}`;
    }
    if (queryFilter.endDate) {
      queryParams += `&endDate=${queryFilter.endDate}`;
    }

    const details = new AdditionalRequestDetails<InvoiceSM[]>(true, Authentication.true);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;

    let resp = await this.GetResponseAsync<null, InvoiceSM[]>(
      `${AppConstants.ApiUrls.BASE}/invoice?${queryParams}`,
      'GET',
      null,
      details
    );
    return resp;
  };

  /**
   * Get Invoice by Order ID
   * GET /api/v1/invoice/order/:orderId
   */
  GetInvoiceByOrderId = async (
    orderId: number
  ): Promise<ApiResponse<InvoiceSM>> => {
    const details = new AdditionalRequestDetails<InvoiceSM>(true, Authentication.true);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;

    let resp = await this.GetResponseAsync<null, InvoiceSM>(
      `${AppConstants.ApiUrls.BASE}/invoice/order/${orderId}`,
      'GET',
      null,
      details
    );
    return resp;
  };

  /**
   * Get Invoice by Invoice Number
   * GET /api/v1/invoice/:invoiceNumber
   */
  GetInvoiceByNumber = async (
    invoiceNumber: string
  ): Promise<ApiResponse<InvoiceSM>> => {
    const details = new AdditionalRequestDetails<InvoiceSM>(true, Authentication.true);
    details.useCacheIfPossible = false;
    details.forceGetResponseFromApi = true;

    let resp = await this.GetResponseAsync<null, InvoiceSM>(
      `${AppConstants.ApiUrls.BASE}/invoice/${invoiceNumber}`,
      'GET',
      null,
      details
    );
    return resp;
  };
}

