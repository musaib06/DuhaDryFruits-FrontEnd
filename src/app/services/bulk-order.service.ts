import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { BulkOrderClient } from '../clients/bulk-order.client';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import {
  BulkOrderSM,
  BulkOrderListResponse,
  BulkOrderDashboardData,
} from '../models/service-models/app/v1/bulk-order-s-m';

@Injectable({ providedIn: 'root' })
export class BulkOrderService extends BaseService {
  constructor(private client: BulkOrderClient) {
    super();
  }

  createBulkOrder(payload: Record<string, unknown>): Promise<ApiResponse<BulkOrderSM>> {
    return this.client.CreateBulkOrder(payload);
  }

  getAllBulkOrders(filters: {
    pageNo: number;
    pageSize: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<BulkOrderListResponse>> {
    const q = new QueryFilter();
    q.skip = (filters.pageNo - 1) * filters.pageSize;
    q.top = filters.pageSize;
    return this.client.GetAllBulkOrders({ ...q, ...filters });
  }

  getBulkOrderById(id: number): Promise<ApiResponse<BulkOrderSM>> {
    return this.client.GetBulkOrderById(id);
  }

  getBulkOrdersByEmail(email: string, pageNo = 1, pageSize = 10): Promise<ApiResponse<BulkOrderListResponse>> {
    return this.client.GetBulkOrdersByEmail(email, (pageNo - 1) * pageSize, pageSize);
  }

  getDashboard(): Promise<ApiResponse<BulkOrderDashboardData>> {
    return this.client.GetDashboard();
  }

  approve(id: number, data: Record<string, unknown>) {
    return this.client.ApproveBulkOrder(id, data);
  }

  reject(id: number, data: Record<string, unknown>) {
    return this.client.RejectBulkOrder(id, data);
  }

  requestChanges(id: number, data: Record<string, unknown>) {
    return this.client.RequestChanges(id, data);
  }

  update(id: number, data: Record<string, unknown>) {
    return this.client.UpdateBulkOrder(id, data);
  }

  generatePaymentLink(id: number) {
    return this.client.GeneratePaymentLink(id);
  }

  ship(id: number, data: Record<string, unknown>) {
    return this.client.ShipBulkOrder(id, data);
  }

  updateTracking(id: number, data: Record<string, unknown>) {
    return this.client.UpdateTracking(id, data);
  }

  cancel(id: number, reason?: string) {
    return this.client.CancelBulkOrder(id, reason);
  }

  uploadAttachments(files: File[]) {
    return this.client.UploadAttachments(files);
  }
}
