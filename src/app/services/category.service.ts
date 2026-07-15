import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { ApiRequest } from '../models/service-models/foundation/api-contracts/base/api-request';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { CategoryClient } from '../clients/category.client';
import { AppConstants } from '../../app-constants';
import { CategorySM } from '../models/service-models/app/v1/categories-s-m';
import { AdminCategoriesViewModel } from '../models/view/Admin/admin.categories.viewmodel';
import { SsrTransferService } from './ssr-transfer.service';
import { SSR_TRANSFER_KEYS } from './ssr-transfer.keys';

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends BaseService {
  private readonly STOREFRONT_CACHE_TTL_MS = 5 * 60_000;
  private storefrontCategoriesCache: { at: number; data: ApiResponse<CategorySM[]> } | null = null;
  private storefrontCategoriesInflight: Promise<ApiResponse<CategorySM[]>> | null = null;

  constructor(
    private categoryClient: CategoryClient,
    private ssrTransfer: SsrTransferService,
  ) {
    super();
  }

  /**
   * Shared storefront category list — deduplicates header, layout FAB, and shop calls.
   */
  async getStorefrontCategories(pageSize = 200): Promise<ApiResponse<CategorySM[]>> {
    if (
      this.storefrontCategoriesCache &&
      Date.now() - this.storefrontCategoriesCache.at < this.STOREFRONT_CACHE_TTL_MS
    ) {
      return this.storefrontCategoriesCache.data;
    }

    if (this.storefrontCategoriesInflight) {
      return this.storefrontCategoriesInflight;
    }

    const vm = new AdminCategoriesViewModel();
    vm.pagination.PageNo = 1;
    vm.pagination.PageSize = pageSize;

    this.storefrontCategoriesInflight = this.ssrTransfer
      .hydrateOrFetch(
        `${SSR_TRANSFER_KEYS.STOREFRONT_CATEGORIES}:${pageSize}`,
        () => this.getAllCategories(vm),
        (resp) => {
          if (!resp.isError && resp.successData) {
            this.storefrontCategoriesCache = { at: Date.now(), data: resp };
          }
        },
      )
      .finally(() => {
        this.storefrontCategoriesInflight = null;
      });

    return this.storefrontCategoriesInflight;
  }

  invalidateStorefrontCategoriesCache(): void {
    this.storefrontCategoriesCache = null;
  }

  /**
   * Retrieves all Categories from the server.
   *
   * @returns A promise that resolves to an ApiResponse containing an array of CategorySM objects.
   *
   * @throws Will throw an error if the server request fails.
   */
  async getAllCategories(
    viewModel: AdminCategoriesViewModel
  ): Promise<ApiResponse<CategorySM[]>> {
    let queryFilter = new QueryFilter();
    queryFilter.skip =
      (viewModel.pagination.PageNo - 1) * viewModel.pagination.PageSize;
    queryFilter.top = viewModel.pagination.PageSize;
    return await this.categoryClient.GetAllCategory(queryFilter);
  }

  async getTotatCategoryCount(): Promise<ApiResponse<IntResponseRoot>> {
    return await this.categoryClient.GetTotatCategoryCount();
  }
  async deleteCategory(id: number): Promise<ApiResponse<DeleteResponseRoot>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.categoryClient.DeleteCategoryById(id);
  }

  async getCategoryById(id: number): Promise<ApiResponse<CategorySM>> {
    if (id <= 0) {
      throw new Error(AppConstants.ErrorPrompts.Delete_Data_Error);
    }
    return await this.categoryClient.GetCategoryById(id);
  }

async addCategory(formData: FormData): Promise<ApiResponse<CategorySM>> {
  let apiRequest = formData; // direct pass
  
  return await this.categoryClient.AddCategory(apiRequest);
}
async updateCategory(formData: FormData, id: number): Promise<ApiResponse<CategorySM>> {
  let apiRequest = formData; // direct pass
  return await this.categoryClient.UpdateCategory(apiRequest, id);
}
}
