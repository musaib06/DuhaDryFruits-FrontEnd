import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { BaseApiClient } from './base-client/base-api.client';
import { CommonResponseCodeHandler } from './helpers/common-response-code-handler.helper';
import { StorageCache } from './helpers/storage-cache.helper';
import { ApiResponse } from '../models/service-models/foundation/api-contracts/base/api-response';
import { DeleteResponseRoot } from '../models/service-models/foundation/common-response/delete-response-root';
import { IntResponseRoot } from '../models/service-models/foundation/common-response/int-response-root';
import { CategorySM } from '../models/service-models/app/v1/categories-s-m';
import { AppConstants } from '../../app-constants';
import { AdditionalRequestDetails, Authentication } from '../models/internal/additional-request-details';
import { QueryFilter } from '../models/service-models/foundation/api-contracts/query-filter';

@Injectable({
  providedIn: 'root',
})
export class CategoryClient extends BaseApiClient {
  constructor(
    storageService: StorageService,
    storageCache: StorageCache,
    commonResponseCodeHandler: CommonResponseCodeHandler
  ) {
    super(storageService, storageCache, commonResponseCodeHandler);
  }

  /** Add a new category */
  AddCategory = async (formData: FormData): Promise<ApiResponse<CategorySM>> => {
    const details = new AdditionalRequestDetails<CategorySM>(true); // enable auth
    return await this.GetResponseAsync<FormData, CategorySM>(
      `${AppConstants.ApiUrls.BASE}/admin/createcategory`,
      'POST',
      formData,
      details
    );
  };

  /** Update existing Category */
  UpdateCategory = async (
    formData: FormData,
    id: number
  ): Promise<ApiResponse<CategorySM>> => {
    const details = new AdditionalRequestDetails<CategorySM>(true); // enable auth
    return await this.GetResponseAsync<FormData, CategorySM>(
      `${AppConstants.ApiUrls.BASE}/admin/updatecategoryById/${id}`,
      'PUT',
      formData,
      details
    );
  };

  /** Retrieves all Categories (paginated) */
  GetAllCategory = async (
    queryFilter: QueryFilter
  ): Promise<ApiResponse<CategorySM[]>> => {
    return await this.GetResponseAsync<null, CategorySM[]>(
      `${AppConstants.ApiUrls.BASE}/categories/paginated?skip=${queryFilter.skip}&top=${queryFilter.top}`,
      'GET',null, new AdditionalRequestDetails<CategorySM[]>(false, Authentication.false  )
    );
  };

  /** Retrieves all Categories without pagination */
  GetAllCategories = async (): Promise<ApiResponse<CategorySM[]>> => {
    return await this.GetResponseAsync<null, CategorySM[]>(
      `${AppConstants.ApiUrls.BASE}/categories`,
      'GET',
      null,
      new AdditionalRequestDetails<CategorySM[]>(false, Authentication.false)
    );
  };

  /** Get total category count */
  GetTotatCategoryCount = async (): Promise<ApiResponse<IntResponseRoot>> => {
    return await this.GetResponseAsync<null, IntResponseRoot>(
      `${AppConstants.ApiUrls.BASE}/categories/count`,
      'GET', null, new AdditionalRequestDetails<IntResponseRoot>(false, Authentication.false  )
    );
  };

  /** Get category by id */
  GetCategoryById = async (Id: number): Promise<ApiResponse<CategorySM>> => {
    return await this.GetResponseAsync<number, CategorySM>(
      `${AppConstants.ApiUrls.BASE}/categoryById/${Id}`,
      'GET'
    );
  };

  /** Delete category by id */
  DeleteCategoryById = async (
    Id: number
  ): Promise<ApiResponse<DeleteResponseRoot>> => {
    return await this.GetResponseAsync<number, DeleteResponseRoot>(
      `${AppConstants.ApiUrls.BASE}/admin/deletecategoryById/${Id}`,
      'DELETE'
    );
  };
}
