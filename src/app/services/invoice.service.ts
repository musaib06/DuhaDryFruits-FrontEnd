import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { InvoiceClient } from '../clients/invoice.client';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { InvoiceSM } from '../models/service-models/app/v1/invoice-s-m';
import { InvoiceViewModel } from '../models/view/Admin/invoice.viewmodel';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService extends BaseService {
  constructor(private invoiceClient: InvoiceClient) {
    super();
  }

  /**
   * Get All Invoices (Paginated)
   */
  async getAllInvoices(
    viewModel: InvoiceViewModel
  ): Promise<ApiResponse<InvoiceSM[]>> {
    const queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;

    const extendedFilter = {
      ...queryFilter,
      status: viewModel.filters?.status || undefined,
      customerId: viewModel.filters?.customerId || undefined,
      startDate: viewModel.filters?.startDate || undefined,
      endDate: viewModel.filters?.endDate || undefined,
    };

    return await this.invoiceClient.GetAllInvoices(extendedFilter);
  }

  /**
   * Get Invoice by Order ID
   */
  async getInvoiceByOrderId(
    orderId: number
  ): Promise<ApiResponse<InvoiceSM>> {
    return await this.invoiceClient.GetInvoiceByOrderId(orderId);
  }

  /**
   * Get Invoice by Invoice Number
   */
  async getInvoiceByNumber(
    invoiceNumber: string
  ): Promise<ApiResponse<InvoiceSM>> {
    return await this.invoiceClient.GetInvoiceByNumber(invoiceNumber);
  }
}

