import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { AppConstants } from '../../app-constants';
import {
  AdditionalRequestDetails,
  Authentication,
} from '../models/internal/additional-request-details';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import {
  BulkOrderSM,
  BulkOrderListResponse,
  BulkOrderDashboardData,
} from '../models/service-models/app/v1/bulk-order-s-m';

@Injectable({ providedIn: 'root' })
export class BulkOrderClient extends BaseApiClient {
  private readonly base = `${AppConstants.ApiUrls.BASE}/bulk-orders`;

  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  CreateBulkOrder = async (payload: Record<string, unknown>): Promise<ApiResponse<BulkOrderSM>> => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = payload;
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.false);
    return this.GetResponseAsync(`${this.base}`, 'POST', apiRequest, details);
  };

  GetAllBulkOrders = async (
    queryFilter: QueryFilter & { status?: string; search?: string; startDate?: string; endDate?: string; email?: string }
  ): Promise<ApiResponse<BulkOrderListResponse>> => {
    let q = `skip=${queryFilter.skip || 0}&top=${queryFilter.top || 10}`;
    if (queryFilter.status) q += `&status=${queryFilter.status}`;
    if (queryFilter.search) q += `&search=${encodeURIComponent(queryFilter.search)}`;
    if (queryFilter.startDate) q += `&startDate=${queryFilter.startDate}`;
    if (queryFilter.endDate) q += `&endDate=${queryFilter.endDate}`;
    if (queryFilter.email) q += `&email=${encodeURIComponent(queryFilter.email)}`;
    const details = new AdditionalRequestDetails<BulkOrderListResponse>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}?${q}`, 'GET', null, details);
  };

  GetBulkOrderById = async (id: number): Promise<ApiResponse<BulkOrderSM>> => {
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.false);
    return this.GetResponseAsync(`${this.base}/${id}`, 'GET', null, details);
  };

  GetBulkOrdersByEmail = async (email: string, skip = 0, top = 10): Promise<ApiResponse<BulkOrderListResponse>> => {
    const details = new AdditionalRequestDetails<BulkOrderListResponse>(true, Authentication.false);
    return this.GetResponseAsync(
      `${this.base}/track/${encodeURIComponent(email)}?skip=${skip}&top=${top}`,
      'GET',
      null,
      details
    );
  };

  GetDashboard = async (): Promise<ApiResponse<BulkOrderDashboardData>> => {
    const details = new AdditionalRequestDetails<BulkOrderDashboardData>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}/admin/dashboard`, 'GET', null, details);
  };

  ApproveBulkOrder = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<BulkOrderSM>> => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = data;
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}/${id}/approve`, 'POST', apiRequest, details);
  };

  RejectBulkOrder = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<BulkOrderSM>> => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = data;
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}/${id}/reject`, 'POST', apiRequest, details);
  };

  RequestChanges = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<BulkOrderSM>> => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = data;
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}/${id}/request-changes`, 'POST', apiRequest, details);
  };

  UpdateBulkOrder = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<BulkOrderSM>> => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = data;
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}/${id}`, 'PUT', apiRequest, details);
  };

  GeneratePaymentLink = async (id: number): Promise<ApiResponse<unknown>> => {
    const details = new AdditionalRequestDetails<unknown>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}/${id}/payment-link`, 'POST', null, details);
  };

  ShipBulkOrder = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<BulkOrderSM>> => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = data;
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}/${id}/ship`, 'POST', apiRequest, details);
  };

  UpdateTracking = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<BulkOrderSM>> => {
    const apiRequest = new ApiRequest<Record<string, unknown>>();
    apiRequest.reqData = data;
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.true);
    return this.GetResponseAsync(`${this.base}/${id}/tracking`, 'POST', apiRequest, details);
  };

  CancelBulkOrder = async (id: number, reason?: string): Promise<ApiResponse<BulkOrderSM>> => {
    const apiRequest = new ApiRequest<{ reason?: string }>();
    apiRequest.reqData = { reason };
    const details = new AdditionalRequestDetails<BulkOrderSM>(true, Authentication.false);
    return this.GetResponseAsync(`${this.base}/${id}/cancel`, 'POST', apiRequest, details);
  };

  UploadAttachments = async (files: File[]): Promise<ApiResponse<{ fileName: string; filePath: string; fileType: string; fileSize: number }[]>> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const details = new AdditionalRequestDetails<{ fileName: string; filePath: string; fileType: string; fileSize: number }[]>(true, Authentication.false);
    return this.GetResponseAsync(`${this.base}/upload`, 'POST', formData, details);
  };
}
