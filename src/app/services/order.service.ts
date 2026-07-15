import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { OrderClient } from '../clients/order.client';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { OrderSM } from '../models/service-models/app/v1/order-s-m';
import { OrderViewModel } from '../models/view/Admin/order.viewmodel';

@Injectable({
  providedIn: 'root',
})
export class OrderService extends BaseService {
  constructor(private orderClient: OrderClient) {
    super();
  }

  /**
   * Get All Orders (Paginated with Filters)
   */
  async getAllOrders(
    viewModel: OrderViewModel | { pagination: { PageNo: number; PageSize: number }; filters?: { status?: string; customerEmail?: string; customerId?: number; customerName?: string; startDate?: string; endDate?: string; search?: string; minAmount?: number; maxAmount?: number } }
  ): Promise<ApiResponse<OrderSM[]>> {
    const queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;

    const extendedFilter = {
      ...queryFilter,
      status: viewModel.filters?.status || undefined,
      customerId: viewModel.filters?.customerId || undefined,
      customerName: viewModel.filters?.customerName || undefined,
      customerEmail: viewModel.filters?.customerEmail || undefined,
      startDate: viewModel.filters?.startDate || undefined,
      endDate: viewModel.filters?.endDate || undefined,
      search: viewModel.filters?.search || undefined,
      minAmount: viewModel.filters?.minAmount || undefined,
      maxAmount: viewModel.filters?.maxAmount || undefined,
    };

    return await this.orderClient.GetAllOrders(extendedFilter);
  }

  /**
   * Get Order By ID
   */
  async getOrderById(orderId: number): Promise<ApiResponse<OrderSM>> {
    return await this.orderClient.GetOrderById(orderId);
  }

  /**
   * Get Orders By Customer ID
   */
  async getOrdersByCustomerId(
    customerId: number,
    viewModel: OrderViewModel
  ): Promise<ApiResponse<OrderSM[]>> {
    const queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;

    const extendedFilter = {
      ...queryFilter,
      status: viewModel.filters?.status || undefined,
    };

    return await this.orderClient.GetOrdersByCustomerId(
      customerId,
      extendedFilter
    );
  }

  /**
   * Update Order Status
   */
  async updateOrderStatus(
    orderId: number,
    status: string
  ): Promise<ApiResponse<OrderSM>> {
    return await this.orderClient.UpdateOrderStatus(orderId, status);
  }
}

