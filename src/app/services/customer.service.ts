import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { AppConstants } from '../../app-constants';
import { CustomerClient } from '../clients/customer.client';
import { CustomerViewModel } from '../models/view/Admin/customer.viewmodel';
import { CustomerDetailSM } from '../models/service-models/app/v1/customer-detail-s-m';

@Injectable({
  providedIn: 'root',
})
export class CustomerService extends BaseService {
  constructor(private customerClient: CustomerClient) {
    super();
  }

  /**
   * Retrieves all Customers from the server.
   *
   * @returns A promise that resolves to an ApiResponse containing an array of CustomerDetailSM objects.
   *
   * @throws Will throw an error if the server request fails.
   */
  async getAllPaginatedCustomer(
    viewModel: CustomerViewModel
  ): Promise<ApiResponse<CustomerDetailSM[] | { data: CustomerDetailSM[]; total: number; skip: number; top: number; hasMore: boolean }>> {
    let queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    // Add search parameter if available
    if (viewModel.filters && (viewModel.filters as any).search) {
      (queryFilter as any).search = (viewModel.filters as any).search;
    }
    return await this.customerClient.GetAllPaginatedCustomers(queryFilter as any);
  }

  async getTotalCustomerCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.customerClient.GetTotatCustomersCount();
  }
  async deleteCustomer(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.customerClient.DeleteCustomerById(id);
  }

  async getCustomerById(id: number): Promise<ApiResponse<CustomerDetailSM>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.customerClient.GetCustomerById(id);
  }

  async createCustomer(
    formData: CustomerDetailSM
  ): Promise<ApiResponse<CustomerDetailSM>> {
    let apiRequest = new ApiRequest<CustomerDetailSM>();
    apiRequest.reqData = formData;
    return await this.customerClient.CreateCustomers(apiRequest);
  }
  async updateCustomer(
    formData: CustomerDetailSM
  ): Promise<ApiResponse<CustomerDetailSM>> {
    const apiRequest = new ApiRequest<CustomerDetailSM>();
    apiRequest.reqData = formData; // ✅ properly wrap

    return await this.customerClient.UpdateCustomer(apiRequest);
  }

  proccedToOrder(payload: any): Promise<ApiResponse<any>> {
    const apiRequest = new ApiRequest<any>();
    apiRequest.reqData = payload; //
    return this.customerClient.ProceedToOrder(apiRequest);
  }

  verifyPayment(payload: any): Promise<ApiResponse<any>> {
    const apiRequest = new ApiRequest<any>();
    apiRequest.reqData = payload; //
    return this.customerClient.VerifyPayment(apiRequest);
  }

  markOrderPaymentFailed(payload: { razorpay_order_id: string }): Promise<ApiResponse<any>> {
    const apiRequest = new ApiRequest<any>();
    apiRequest.reqData = payload;
    return this.customerClient.MarkOrderPaymentFailed(apiRequest);
  }

  /**
   * Get Razorpay Public Key (Secure)
   * Fetches the public key from backend - never exposes secret key
   */
  getRazorpayKey(): Promise<ApiResponse<{ keyId: string; environment?: string }>> {
    return this.customerClient.GetRazorpayKey();
  }

  /**
   * Get Customer By Email
   * Checks if customer exists (for multi-device checkout support)
   */
  async getCustomerByEmail(email: string): Promise<ApiResponse<{ exists: boolean; customer: CustomerDetailSM | null }>> {
    if (!email || !email.trim()) {
      throw new Error("Email is required");
    }
    return await this.customerClient.GetCustomerByEmail(email.trim());
  }
}
